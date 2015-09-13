let fs = require('fs');
let PriorityQueue = require('priorityqueuejs');
import {addUser, addQuestion, addAnswer, addTag, setStats, uninitDB} from './datastore.js';
let strict = true;
let allUsersMap = new Map();
let questionIdSet = new Set();
let userIdSet = new Set();
// Maps a tag name to a numberof instances it was encountered
let tagMap = new Map();
let acceptedAnswerIdSet = new Set();
// Maps a question ID to a prioirty queue of answers
let answersMap = new Map();
let siteSlug = 'programmers';

let questionWordCount = 0;
let answerWordCount = 0;
let userWordCount = 0;

let pq = new PriorityQueue((a, b) => b.viewCount - a.viewCount);

const maxQuestions = 20;
const usersPerPage = 5;
const questionsPerPage = 5;

function queueQuestion(question) {
  pq.enq(question);
  if (pq.size() > maxQuestions) {
    pq.deq();
  }
}

let parseFile = (filePath, onOpenTag) => {
  return new Promise((resolve, reject) => {
    var saxStream = require('sax').createStream(strict, {});
    let promises = [];
    saxStream.on('error', (e) => {
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
      Promise.all(promises).then(resolve).catch((err) => console.error('Promise.all err is: ', err));
    });

    fs.createReadStream(filePath)
      .pipe(saxStream);
  });
};

export let parseUsers = parseFile.bind(null, 'Users.xml', (node) => {
  let user = {
    id: node.attributes.Id,
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
  if (!user.id) {
    console.warn('user has blanks for user: ', user);
    return Promise.resolve();
  }
  allUsersMap.set(user.id, user);
});

export let parseQuestions = () => {
  return new Promise((resolve, reject) => {
    parseFile('Posts.xml', (node) => {
      let data = {
        id: node.attributes.Id,
        postTypeId: Number(node.attributes.PostTypeId),
        //creationDate: new Date(node.attributes.CreationDate),
        score: Number(node.attributes.Score),
        viewCount: Number(node.attributes.ViewCount),
        body: node.attributes.Body,
        ownerUserId: node.attributes.OwnerUserId,
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

      // Since the data dump doesn't always include it, set the display name here
      let user = allUsersMap.get(data.ownerUserId);
      if (user) {
        data.ownerDisplayName = user.displayName;
      }

      if (data.postTypeId !== 1) {
        return;
      }
      data.acceptedAnswerId = node.attributes.AcceptedAnswerId;
      if (!data.id) {
        console.warn('question has blanks for question: ', data);
        return;
      }

      queueQuestion(data);
    }).then(() => {
      let promises = [];
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
        if (question.ownerUserId) {
          userIdSet.add(question.ownerUserId);
        } else {
          console.warn('null user specified for question:', question);
        }
        if (question.acceptedAnswerId) {
          acceptedAnswerIdSet.add(question.acceptedAnswerId);
        }
        if (question.tags) {
          // Split up tags like <tag1><tag2><tag3> into an array of strings iwth the tag names
          // Do this by replacing the starting < and the ending > with nothing, then split on the middle ><
          question.tags = question.tags.replace(/^</, '').replace(/>$/, '').split('><');
          question.tags.forEach(addTagFn);
        }

        questionWordCount += question.title.split(' ').length + question.body.split(' ').length;

        // Add in the page for per page querying
        question.page = Math.ceil(questionIdSet.size / questionsPerPage);
        promises.push(addQuestion(siteSlug, question));
      }
      console.log('waiting for all questions to insert');
      Promise.all(promises).then(resolve).catch(reject);
    }).catch(err => console.error('parseQuestions error: ', err));
  });
};

export let parseAnswers = () => {
  return new Promise((resolve, reject) => {
    parseFile('Posts.xml', (node) => {
      let data = {
        id: node.attributes.Id,
        postTypeId: Number(node.attributes.PostTypeId),
        //creationDate: new Date(node.attributes.CreationDate),
        score: Number(node.attributes.Score),
        viewCount: Number(node.attributes.ViewCount),
        body: node.attributes.Body,
        ownerUserId: node.attributes.OwnerUserId,
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

      // Since the data dump doesn't always include it, set the display name here
      let user = allUsersMap.get(data.ownerUserId);
      if (user) {
        data.ownerDisplayName = user.displayName;
      }

      if (data.postTypeId !== 2) {
        return;
      }
      data.parentId = node.attributes.ParentId;
      if (!data.id || !data.parentId) {
        console.warn('answer has blanks for answer: ', data);
        return;
      }

      // If this answer is for a question which is interesting to us
      if (questionIdSet.has(data.parentId)) {
        // To figure out which answer is best to keep, add them all to a piroirty queue and keep only the best one.
        // If the answersMap doesn't have an association to a PQ yet, then set one up here.
        if (!answersMap.has(data.parentId)) {
          answersMap.set(data.parentId, new PriorityQueue((a, b) => {
            if (acceptedAnswerIdSet.has(a.id)) {
              return 1;
            }
            if (acceptedAnswerIdSet.has(b.id)) {
              return -1;
            }
            return a.score - b.score;
          }));
        }
        // Now add the answer to the appropriate PQ which we know exists from above
        let answersPQ = answersMap.get(data.parentId);
        answersPQ.enq(data);
      }
    }).then(() => {
      // Now for each question, get the associated answers and figure out the
      // best one to keep.
      let promises = [];
      questionIdSet.forEach(questionId => {
        let answersPQ = answersMap.get(questionId);
        if (answersPQ.size()) {
          // Take only the best answer
          let answer = answersPQ.deq();
          if (answer.ownerUserId) {
            userIdSet.add(answer.ownerUserId);
          } else {
            console.warn('null user specified for answer:', answer);
          }
          answerWordCount += answer.body.split(' ').length;
          promises.push(addAnswer(siteSlug, answer).catch((err) => {
            console.error(`Could not add answer for question: ${answer.parentId}: ${err}`);
          }));
        }
      });
      Promise.all(promises).then(resolve).catch(reject);
    }).catch(err => console.error('parseAnswers error: ', err));
  });
};

export let parseTags = parseFile.bind(null, 'Tags.xml', (node) => {
  let tag = {
    id: node.attributes.Id,
    tagName: node.attributes.TagName,
    count: node.attributes.Count,
    excerptPostId: node.attributes.ExcerptPostId,
    wikiPostId: node.attributes.WikiPostId,
  };

  if (!tag.tagName) {
    console.warn('tagName is blank for tag: ', tag);
    return;
  }

  if (!tagMap.has(tag.tagName)) {
    return;
  }

  // Fix the tag count to only be what we know about
  tag.count = tagMap.get(tag.tagName);

  // For whatever reason the other dumps reference tags by their tagName, so index that way
  console.log('Adding tag for tag:', tag);
  return addTag(siteSlug, tag).catch((err) => {
    console.error(`Could not add tagName: ${tag.tagName}: ${err}`);
  });
});

export let insertUsers = () => {
  return new Promise((resolve, reject) => {
    let promises = [];
    let i = 0;
    userIdSet.forEach((userId) => {
      i++;
      let user = allUsersMap.get(userId);
      // Add in the page for per page querying
      user.page = Math.ceil(i / usersPerPage);

      if (user.aboutMe) {
        userWordCount += user.aboutMe.split(' ').length;
      }

      promises.push(addUser(siteSlug, user).catch((err) => {
          console.error(`Could not add user id: ${user.id}, err: ${err}`);
      }));
    });
    Promise.all(promises).then(resolve).catch((err) => { reject(err); console.error('Promise.all insertUsers err is: ', err);});
  });
};

export let insertStats = () => {
  let stats = {
    userCount: userIdSet.size,
    tagCount: tagMap.size,
    questionCount: questionIdSet.size,
    questionWordCount,
    answerWordCount,
    userWordCount,
  };
  console.log('Stats:', stats);
  return setStats(siteSlug, stats);
};

parseUsers().then(parseQuestions).then(parseAnswers).then(insertUsers).then(parseTags).then(insertStats).then(uninitDB).catch(err => {
  console.error('top err: ', err);
});
