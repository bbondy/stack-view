let fs = require('fs');
let es = require('event-stream');
let path = require('path');
let PriorityQueue = require('priorityqueuejs');
import {addUser, addQuestion, getAnswersStream, getQuestions, getQuestionsStream, getQuestionsCount, addAnswer, getTag,
  addTag, getUser, getAnswer, getAnswers, setStats, uninitDB} from './datastore.js';
let strict = true;

const siteSlug = process.argv[2];
const siteSlugTemp = siteSlug  + '-temp';
const baseLang = 'en';
const usersXml = path.join('./data', siteSlug, 'Users.xml');
const postsXml = path.join('./data', siteSlug, 'Posts.xml');
const tagsXml = path.join('./data', siteSlug, 'Tags.xml');

const maxQuestions = 20;
const usersPerPage = 5;
const questionsPerPage = 5;

let tagMap = new Map();
let bestAnswerIdSet = new Set();
let userIdSet = new Set();
let questionIdSet = new Set();

class Stats {
  constructor() {
    this.userCount = 0;
    this.tagCount = 0;
    this.questionCount = 0;
    this.answerCount = 0;
    this.questionWordCount = 0;
    this.answerWordCount = 0;
    this.userWordCount = 0;
    this.totalWeight = 0;
    this.questionViews = 0;
  }
}
let dbStats = new Stats();
let dbStatsTemp = new Stats();

let pq = new PriorityQueue((a, b) => b.weight - a.weight);

let parseFile = (filePath, onOpenTag) => {
  return new Promise((resolve, reject) => {
    var saxStream = require('sax').createStream(strict, {});
    let promises = [];
    saxStream.on('error', e => {
      // unhandled errors will throw, since this is a proper node
      // event emitter.
      console.error('error!', e);
      // clear the error
      //this._parser.error = null
      //this._parser.resume()
      reject(e);
    });

    saxStream.on('opentag', (node) => {
      if (node.name !== 'row') {
        return;
      }
      let p = onOpenTag(node);
      if (p) {
        promises.push(p);
      }
    });

    saxStream.on('end', () => {
      // parser stream is done, and ready to have more stuff written to it.
      console.log('waiting for all promises for file:', filePath);
      Promise.all(promises).then(resolve).catch(reject);
    });

    console.log('parsing file: ', filePath);
    fs.createReadStream(filePath)
      .pipe(es.through(function (data) {
         this.pause();
         (function(promisesInternal, dataInternal, stream) {
           Promise.all(promises).then(function() {
             promisesInternal.length = 0;
             stream.emit('data', dataInternal);
             stream.resume();
             console.log('update', dbStatsTemp.questionCount, dbStatsTemp.answerCount, dbStatsTemp.userCount, dbStatsTemp.tagCount);
           });
         })(promises, data, this);

      }))
      .pipe(saxStream);
  });
};

export let parseUsers = parseFile.bind(null, usersXml, (node) => {
  let user = {
    id: Number(node.attributes.Id),
    //reputation: Number(node.attributes.Reputation),
    //creationdate: new Date(node.attributes.CreationDate),
    displayName: node.attributes.DisplayName,
    //lastAccessDate: new Date(node.attributes.LastAccessDate),
    websiteUrl: node.attributes.websiteUrl,
    location: node.attributes.Location,
    aboutMe: node.attributes.AboutMe,
    //views: Number(node.attributes.Views),
    //upVotes: Number(node.attributes.UpVotes),
    //downVotes: Number(node.attributes.DownVotes),
    //emailHash: node.attributes.EmailHash,
    //accountId: node.attributes.AccountId,
    profileImageUrl: node.attributes.ProfileImageUrl,
    age: node.attributes.age,
  };
  dbStatsTemp.userCount++;
  return addUser(siteSlugTemp, user).catch((err) => {
    console.error(`Could not add user id: ${user.id}, err: ${err}`);
  });
});

export let parseQuestions = parseFile.bind(null, postsXml, (node) => {
  let data = {
    id: Number(node.attributes.Id),
    postTypeId: Number(node.attributes.PostTypeId),
    //creationDate: new Date(node.attributes.CreationDate),
    score: Number(node.attributes.Score),
    viewCount: Number(node.attributes.ViewCount),
    body: node.attributes.Body,
    ownerUserId: Number(node.attributes.OwnerUserId),
    // Data dump doesn't always include this field!
    // ownerDisplayName: node.attributes.OwnerDisplayName,
    //lastEditorUserId: node.attributes.LastEditorUserId,
    lastEditDate: new Date(node.attributes.LastEditDate),
    //lastActivityDate: new Date(node.attributes.LastActivityDate),
    title: node.attributes.Title,
    tags: node.attributes.Tags,
    //answerCount: Number(node.attributes.AnswerCount),
    //commentCount: Number(node.attributes.CommentCount),
    //favoriteCount: Number(node.attributes.favoriteCount),
    //communityOwnedDate: new Date(node.attributes.CommunityOwnedDate),
  };

  if (node.attributes.ClosedDate) {
    data.closedDate = new Date(node.attributes.ClosedDate);
  }

  if (data.postTypeId === 1) {
    data.acceptedAnswerId = Number(node.attributes.AcceptedAnswerId);
    dbStatsTemp.questionCount++;
    data.page = dbStatsTemp.questionCount; // 1 question per page for temp db
    return addQuestion(siteSlugTemp, data);
  } else if (data.postTypeId === 2) {
    data.parentId = Number(node.attributes.ParentId);
    dbStatsTemp.answerCount++;
    data.page = dbStatsTemp.answerCount;
    return addAnswer(siteSlugTemp, data);
  }
});

export let parseTags = parseFile.bind(null, tagsXml, (node) => {
  let tag = {
    id: Number(node.attributes.Id),
    tagName: node.attributes.TagName,
    count: Number(node.attributes.Count),
    excerptPostId: node.attributes.ExcerptPostId,
    wikiPostId: node.attributes.WikiPostId,
  };

  if (!tag.tagName) {
    console.warn('tagName is blank for tag: ', tag);
    return;
  }

  // For whatever reason the other dumps reference tags by their tagName, so index that way
  dbStatsTemp.tagCount++;
  return addTag(siteSlugTemp, tag).catch((err) => {
    console.error(`Could not add tagName: ${tag.tagName}: ${err}`);
  });
});

function queueQuestion(question) {
  pq.enq(question);
  if (pq.size() > maxQuestions) {
    pq.deq();
  }
}

export let selectBestAnswersAndWeigh = () => {
  return new Promise((resolve, reject) => {
    console.log('Selecting best answers and calculating weight');
    let getQuestionsPromises = [];
    let getAnswersPromises = [];
    let handleQuestionAndAnswer = (question, bestAnswer) => {
      if (!bestAnswer) {
        return;
      }
      let wordCount = question.title.split(' ').length + question.body.split(' ').length + bestAnswer.body.split(' ').length;
      question.bestAnswerId = bestAnswer.id;
      // Includes the weight of both the best answer and question together
      question.weight = question.viewCount * 0.01 * 0.25 - wordCount * 0.12;
      queueQuestion(question);
    };

    let handleGetQuestion = ([question]) => {
      let addBestAnswer = () => getAnswersPromises.push(getAnswers(siteSlugTemp, baseLang, question.id).then(answers => {
          // Create a PQ for weighing all the answers to find the best one
          let answersPQ = new PriorityQueue((a, b) => {
            if (question.acceptedAnswerId === a.id) {
              return 1;
            }
            if (question.acceptedAnswerId === b.id) {
              return -1;
            }
            return a.score - b.score;
          });

          // Now add all answers to a PQ to get the best one
          answers.forEach(answer => answersPQ.enq(answer));

          // Don't even consider things without answers
          if (answers.length > 0) {
            let bestAnswer = answersPQ.deq();
            handleQuestionAndAnswer(question, bestAnswer);
          }
      }));
      if (!question.acceptedAnswerId) {
        addBestAnswer();
      } else {
        getAnswersPromises.push(getAnswer(siteSlugTemp, baseLang, question.acceptedAnswerId).then(bestAnswer => {
          if (bestAnswer) {
            handleQuestionAndAnswer(question, bestAnswer);
          } else {
            console.warn('Best answer for question not found. Question:', question, '. Retrying to add best answer instead.');
            addBestAnswer();
          }
        }));
      }
    };

    // dbStatsTemp.questionCount is filled by getQuestionsCount
    let tempPages = dbStatsTemp.questionCount; // Because 1 question per page for temp db
    for (let i = 1; i <= tempPages; i++) {
      getQuestionsPromises.push(getQuestions(siteSlugTemp, baseLang, i).then(handleGetQuestion));
    }
    console.log('Waiting for best answers and weight promises');
    Promise.all(getQuestionsPromises).then(() => {
      return Promise.all(getAnswersPromises);
    }).then(resolve).catch(reject);
  });
};

export let insertBestQuestions = () => {
  return new Promise((resolve, reject) => {
    console.log('Inserting best questions');
    let promises = [];
    let addTagFn = tagName => {
      let tagCount = 0;
      if (tagMap.has(tagName)) {
        tagCount = tagMap.get(tagName);
      }
      tagMap.set(tagName, tagCount + 1);
    };

    console.log('PQ size is: ', pq.size());
    while (!pq.isEmpty()) {
      let question = pq.deq();
      questionIdSet.add(question.id);
      // ownerUserId won't be set for community wiki
      if (question.ownerUserId) {
        userIdSet.add(question.ownerUserId);
      }
      if (question.bestAnswerId) {
        bestAnswerIdSet.add(question.bestAnswerId);
      }
      if (question.tags) {
        // Split up tags like <tag1><tag2><tag3> into an array of strings iwth the tag names
        // Do this by replacing the starting < and the ending > with nothing, then split on the middle ><
        question.tags = question.tags.replace(/^</, '').replace(/>$/, '').split('><');
        question.tags.forEach(addTagFn);
      }

      dbStats.questionWordCount += question.title.split(' ').length + question.body.split(' ').length;
      if (question.viewCount) {
        dbStats.questionViews += question.viewCount;
      }
      dbStats.totalWeight += question.weight;

      // Add in the page for per page querying
      question.page = Math.ceil(questionIdSet.size / questionsPerPage);

      promises.push(addQuestion(siteSlug, question));
    }
    console.log('waiting for all questions to insert: ', promises.length);
    Promise.all(promises).then(resolve).catch(reject);
  });
};

export let insertBestAnswers = () => {
  return new Promise((resolve, reject) => {
    console.log('Inserting answers');
    let getAnswerPromises = [];
    let addAnswerPromises = [];
    bestAnswerIdSet.forEach(answerId => {
      getAnswerPromises.push(getAnswer(siteSlugTemp, baseLang, answerId).then(answer => {
        dbStats.answerWordCount += answer.body.split(' ').length;
        if (answer.ownerUserId) {
          userIdSet.add(answer.ownerUserId);
        }
        addAnswerPromises.push(addAnswer(siteSlug, answer));
      }));
    });
    Promise.all(getAnswerPromises).then(() => {
      return Promise.all(addAnswerPromises);
    }).then(resolve).catch(reject);
  });
};

export let insertUsers = () => {
  return new Promise((resolve, reject) => {
    console.log('Inserting users');
    let getUsersPromises = [];
    let addUsersPromises = [];
    let addPostPromises = [];
    let getPostPromises = [];
    let i = 0;
    userIdSet.forEach(userId => {
      getUsersPromises.push(getUser(siteSlugTemp, baseLang, userId).then(user => {
        if (user.aboutMe) {
          dbStats.userWordCount += user.aboutMe.split(' ').length;
        }

        // Add in the page for per page querying
        user.page = Math.ceil(++i / usersPerPage);

        // Update all of the questions with the user info
        getPostPromises.push(getQuestionsStream(siteSlug, baseLang, { ownerUserId: user.id }, question => {
          question.ownerDisplayName = user.displayName;
          addPostPromises.push(addQuestion(siteSlug, question));
        }));

        // Update all of the answers with the user info
        getPostPromises.push(getAnswersStream(siteSlug, baseLang, { ownerUserId: user.id }, answer => {
          answer.ownerDisplayName = user.displayName;
          addPostPromises.push(addAnswer(siteSlug, answer));
        }));


        addUsersPromises.push(addUser(siteSlug, user));
      }));
    });
    console.log('Waiting for users to insert');
    Promise.all(getUsersPromises).then(() => {
      console.log('Waiting for add users promises');
      return Promise.all(addUsersPromises);
    }).then(() => {
      console.log('Waiting for questions promises');
      return Promise.all(getPostPromises);
    }).then(() => {
      console.log('Waiting for update questions promises');
      return Promise.all(addPostPromises);
    }).then(resolve).catch(reject);
  });
};

export let insertTags = () => {
  return new Promise((resolve, reject) => {
    console.log('Inserting tags');
    let getTagPromises = [];
    let addTagPromises = [];
    tagMap.forEach((tagCount, tagName) => {
      getTagPromises.push(getTag(siteSlugTemp, baseLang, tagName).then(tag => {
        tag.count = tagCount;
        addTagPromises.push(addTag(siteSlug, tag));
      }));
    });
    console.log('Waiting for tags to insert');
    Promise.all(getTagPromises).then(() => {
      return Promise.all(addTagPromises);
    }).then(resolve).catch(reject);
  });
};

export let insertStats = () => {
  dbStats.userCount = userIdSet.size;
  dbStats.tagCount = tagMap.size;
  dbStats.questionCount = questionIdSet.size;
  dbStats.answerCount = bestAnswerIdSet.size;
  console.log('Stats:', dbStats);
  return setStats(siteSlug, dbStats);
};

/*
parseTags()
  .then(uninitDB)
  .catch(err => {
    console.error('top err: ', err);
    if (err.stack) {
      console.error('err.stack: ', err.stack);
    }
  });
*/

getQuestionsCount(siteSlugTemp).then(result => {
    dbStatsTemp.questionCount = result;
  })
  .then(parseUsers)
  .then(parseQuestions)
  .then(parseTags)
  .then(selectBestAnswersAndWeigh)
  .then(insertBestQuestions)
  .then(insertBestAnswers)
  .then(insertUsers) // TODO insert proper name in the questions as well
  .then(insertTags)
  .then(insertStats)
  .then(uninitDB)
  .then(() => {
  console.log('pq size is: ', pq.size());
}).catch(err => {
  console.error('top err: ', err);
  if (err.stack) {
    console.error('err.stack: ', err.stack);
  }
});
