var fs = require('fs');
import {initRedis, uninitRedis, addUser, addQuestion, addAnswer} from './datastore.js';
var strict = true;

initRedis();

let parseFile = (filePath, onOpenTag) => {
  return new Promise((resolve, reject) => {
    var saxStream = require('sax').createStream(strict, {})
    saxStream.on('error', (e) => {
      // unhandled errors will throw, since this is a proper node
      // event emitter.
      console.error('error!', e)
      // clear the error
      //this._parser.error = null
      //this._parser.resume()
      reject(e);
    });

    saxStream.on('opentag', (node) => {
      onOpenTag(node);
    });

    saxStream.on('end', () => {
      // parser stream is done, and ready to have more stuff written to it.
      resolve();
    });

    fs.createReadStream(filePath)
      .pipe(saxStream);
  });
};

export let parseUsers = parseFile.bind(null, 'Users.xml', (node) => {
  let user = {
    id: node.attributes.Id,
    reputation: Number(node.attributes.Reputation),
    creationdate: new Date(node.attributes.CreationDate),
    displayName: node.attributes.DisplayName,
    lastAccessDate: new Date(node.attributes.LastAccessDate),
    websiteUrl: node.attributes.websiteUrl,
    location: node.attributes.Location,
    aboutMe: node.attributes.AboutMe,
    views: Number(node.attributes.Views),
    upVotes: Number(node.attributes.UpVotes),
    downVotes: Number(node.attributes.DownVotes),
    emailhash: node.attributes.EmailHash,
    accountId: node.attributes.AccountId,
    profileImageUrl: node.attributes.ProfileImageUrl,
    age: node.attributes.age,
  };
  addUser(user.id, user).catch((err) => {
      console.log(`Could not add user id: ${id}`);
  });
});

export let parsePosts = parseFile.bind(null, 'Posts.xml', (node) => {
  let data = {
    id: node.attributes.Id,
    postTypeId: Number(node.attributes.PostTypeId),
    creationDate: new Date(node.attributes.CreationDate),
    score: Number(node.attributes.Score),
    viewCount: Number(node.attributes.ViewCount),
    body: node.attributes.Body,
    ownerUserId: node.attributes.OwnerUserId,
    ownerDisplayName: node.attributes.OwnerDisplayName,
    lastEditorUserId: node.attributes.LastEditorUserId,
    lastEditDate: new Date(node.attributes.LastEditDate),
    lastActivityDate: new Date(node.attributes.LastActivityDate),
    title: node.attributes.Title,
    tags: node.attributes.Tags,
    answerCount: Number(node.attributes.AnswerCount),
    commentCount: Number(node.attributes.CommentCount),
    favoriteCount: Number(node.attributes.favoriteCount),
    closedDate: new Date(node.attributes.ClosedDate),
    communityOwnedDate: new Date(node.attributes.CommunityOwnedDate),
  };

  if (data.postTypeId === 1) {
    data.acceptedAnswerId = node.attributes.AcceptedAnswerId;
      addQuestion(data.id, data).catch((err) => {
      console.log(`Could not add questionid: ${data.id}: ${err}`);
    });
  } else if (data.postTypeId === 2) {
    data.parentId = node.attributes.ParentId;
    addAnswer(data.parentId, data).catch((err) => {
      console.log(`Could not add answer for question: ${data.parentId}: ${err}`);
    });
  }
});

Promise.all([parseUsers(), parsePosts()]).then(() => {
  uninitRedis();
});
