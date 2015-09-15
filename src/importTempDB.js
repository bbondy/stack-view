let fs = require('fs');
let path = require('path');
import {addUser, addQuestion, addAnswer, addTag, uninitDB} from './datastore.js';
let strict = true;

const siteSlug = process.argv[2];
const usersXml = path.join('./data', siteSlug, 'Users.xml');
const postsXml = path.join('./data', siteSlug, 'Posts.xml');
const tagsXml = path.join('./data', siteSlug, 'Tags.xml');

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

export let parseUsers = parseFile.bind(null, usersXml, (node) => {
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

  console.log('add user:', user);
  return addUser(siteSlug, user).catch((err) => {
    console.error(`Could not add user id: ${user.id}, err: ${err}`);
  });
});

export let parseQuestions = parseFile.bind(null, postsXml, (node) => {
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

  if (data.postTypeId === 1) {
    data.acceptedAnswerId = node.attributes.AcceptedAnswerId;
    if (!data.id) {
      console.warn('question has blanks for question: ', data);
      return;
    }
    return addQuestion(siteSlug, data).catch((err) => {
      console.error(`Could not add question: ${data.id}: ${err}`);
    });
  } else if (data.postTypeId === 2) {
    data.parentId = node.attributes.ParentId;
    if (!data.id || !data.parentId) {
      console.warn('answer has blanks for answer: ', data);
      return;
    }
    return addAnswer(siteSlug, data).catch((err) => {
      console.error(`Could not add answer for question: ${data.parentId}: ${err}`);
    });
  }
});

export let parseTags = parseFile.bind(null, tagsXml, (node) => {
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
  console.log('Adding tag for tag:', tag);
  return addTag(siteSlug, tag).catch((err) => {
    console.error(`Could not add tagName: ${tag.tagName}: ${err}`);
  });
});

parseUsers().then(parseQuestions).then(parseTags).then(uninitDB).catch(err => {
  console.error('top err: ', err);
});
