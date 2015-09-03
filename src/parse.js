var fs = require('fs');
var strict = true;

let parseFile = (filePath, openTag) => {
  var saxStream = require('sax').createStream(strict, {})
    saxStream.on('error', function (e) {
    // unhandled errors will throw, since this is a proper node
    // event emitter.
    console.error('error!', e)
    // clear the error
    this._parser.error = null
    this._parser.resume()
  });

  saxStream.on('opentag', function (node) {
    let data = openTag(node);
    console.log(data);
  });
  fs.createReadStream(filePath)
    .pipe(saxStream);
};

export let parseUsers = parseFile.bind(null, 'Users.xml', (node) => {
  return {
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
  } else if (data.postTypeId === 2) {
    data.parentId = node.attributes.ParentID;
  }
  return data;
});
