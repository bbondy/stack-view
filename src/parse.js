let fs = require('fs');
let PriorityQueue = require('priorityqueuejs');
import {addUser, addQuestion, addAnswer, addTag, uninitDB} from './datastore.js';
let strict = true;
let userMap = new Map();
let questionIdSet = new Set();
let siteSlug = 'programmers';

let pq = new PriorityQueue((a, b) => b.viewCount - a.viewCount);

const maxQuestions = 5;
const usersPerPage = 5;

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
      let p = onOpenTag(node);
      if (p) {
        promises.push(p);
      }
    });

    saxStream.on('end', () => {
      // parser stream is done, and ready to have more stuff written to it.
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
  userMap.set(user.id, user);

  // Add in the page for per page querying
  user.page = Math.ceil(userMap.size / usersPerPage);

  return addUser(siteSlug, user).catch((err) => {
      console.error(`Could not add user id: ${user.id}, err: ${err}`);
  });
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
        closedDate: new Date(node.attributes.ClosedDate),
        //communityOwnedDate: new Date(node.attributes.CommunityOwnedDate),
      };

      // Since the data dump doesn't always include it, set the display name here
      let user = userMap.get(data.ownerUserId);
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
      while (!pq.isEmpty()) {
        let question = pq.deq();
        let promises = [];
        questionIdSet.add(question.id);
        promises.push(addQuestion(siteSlug, question));
        console.log('adding question ID', question.id, 'with viewcount of: ', question.viewCount);
        Promise.all(promises).then(resolve).catch(reject);
      }
    });
  });
};

export let parseAnswers = parseFile.bind(null, 'Posts.xml', (node) => {
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
    closedDate: new Date(node.attributes.ClosedDate),
    //communityOwnedDate: new Date(node.attributes.CommunityOwnedDate),
  };

  // Since the data dump doesn't always include it, set the display name here
  let user = userMap.get(data.ownerUserId);
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
  return addAnswer(siteSlug, data).catch((err) => {
    console.error(`Could not add answer for question: ${data.parentId}: ${err}`);
  });
});

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

  // For whatever reason the other dumps reference tags by their tagName, so index that way
  return addTag(siteSlug, tag).catch((err) => {
    console.error(`Could not add tagName: ${tag.tagName}: ${err}`);
  });
});

/*
parseUsers().then(parsePosts).then(parseTags).then(uninitDB).catch((err) => {
  console.error('err: ', err);
});
*/

parseUsers().then(parseQuestions).then(uninitDB);
