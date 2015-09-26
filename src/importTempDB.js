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
  console.log('select best answer and weigh');
  let processedCount = 0;
  let sequence = Promise.resolve();
  let addQAToPQ = (question, bestAnswer) => {
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
    return new Promise((resolve) => {
      // Log some basic progress every 100
      if (processedCount % 1000 === 0) {
        console.log('Processed:', processedCount);
      }
      processedCount++;
      let addBestAnswer = (question) => {
        getAnswers(siteSlugTemp, baseLang, question.id).then(answers => {
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
            addQAToPQ(question, bestAnswer);
          }
          resolve();
        });
      };

      // If there's no accepted ID, call addBestAnswer which gets all the answers and gets the best scored one.
      if (!question.acceptedAnswerId) {
        addBestAnswer(question);
      } else {
        getAnswer(siteSlugTemp, baseLang, question.acceptedAnswerId).then(bestAnswer => {
          // Sometimes the best answer can't be found (deleted or not present in the dump), so fall back to add the best answer in that case.
          if (bestAnswer) {
            addQAToPQ(question, bestAnswer);
            resolve();
          } else {
            console.warn('Best answer for question not found. Question:', question, '. Retrying to add best answer instead.');
            addBestAnswer(question);
          }
        });
      }
    });
  };

  // dbStatsTemp.questionCount is filled by getQuestionsCount
  let tempPages = dbStatsTemp.questionCount; // Because 1 question per page for temp db
  console.log('temp pages:', tempPages);
  for (let i = 1; i <= tempPages; i++) {
    sequence = sequence.then(getQuestions.bind(null, siteSlugTemp, baseLang, i));
    sequence = sequence.then(handleGetQuestion);
  }
  return sequence;
};

export let insertBestQuestions = () => {
  let sequence = Promise.resolve();
  let addTagFn = tagName => {
    let tagCount = 0;
    if (tagMap.has(tagName)) {
      tagCount = tagMap.get(tagName);
    }
    tagMap.set(tagName, tagCount + 1);
  };

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

    sequence = sequence.then(addQuestion.bind(null, siteSlug, question));
  }
  console.log('waiting for all questions to insert');
  return sequence;
};

export let insertBestAnswers = () => {
  console.log('Inserting answers');
  let sequence = Promise.resolve();
  bestAnswerIdSet.forEach(answerId => {
    sequence = sequence.then(getAnswer.bind(null, siteSlugTemp, baseLang, answerId));
    sequence = sequence.then(answer => {
      dbStats.answerWordCount += answer.body.split(' ').length;
      if (answer.ownerUserId) {
        userIdSet.add(answer.ownerUserId);
      }
      return answer;
    });
    sequence = sequence.then((answer) => addAnswer.bind(null, siteSlug, answer));
  });
  return sequence;
};

export let insertUsers = () => {
  console.log('Inserting users');
  let sequence = Promise.resolve();
  let i = 0;
  userIdSet.forEach(userId => {
    sequence = sequence.then(getUser.bind(null, siteSlugTemp, baseLang, userId));
    sequence = sequence.then(user => {
      if (user.aboutMe) {
        dbStats.userWordCount += user.aboutMe.split(' ').length;
      }
      // Add in the page for per page querying
      user.page = Math.ceil(++i / usersPerPage);
      return user;
    });

    // Update all of the questions with the user info
    sequence = sequence.then((user) => {
      return new Promise((resolve, reject) => {
        let promises = [];
        getQuestionsStream(siteSlug, baseLang, { ownerUserId: user.id }, question => {
          question.ownerDisplayName = user.displayName;
          promises.push(addQuestion.bind(null, siteSlug, question));
        }).then(Promise.all(promises)).then(resolve.bind(null, user)).catch(reject);
      });
    });

    // Update all of the answers with the user info
    sequence = sequence.then((user) => {
      return new Promise((resolve, reject) => {
        let promises = [];
        getAnswersStream(siteSlug, baseLang, { ownerUserId: user.id }, answer => {
          answer.ownerDisplayName = user.displayName;
          promises.push(addAnswer.bind(null, siteSlug, answer));
        }).then(Promise.all(promises)).then(resolve.bind(null, user)).catch(reject);
      });
    });

    sequence = sequence.then((user) => addUser(siteSlug, user));
  });
  return sequence;
};

export let insertTags = () => {
  console.log('Inserting tags');
  let sequence = Promise.resolve();
  tagMap.forEach((tagCount, tagName) => {
    sequence = sequence.then(getTag.bind(null, siteSlugTemp, baseLang, tagName));
    sequence = sequence.then(tag => {
      tag.count = tagCount;
      return tag;
    });
    sequence = sequence.then((tag) => addTag(siteSlug, tag));
  });
  console.log('Waiting for tags to insert');
  return sequence;
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
