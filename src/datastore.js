var monk = require('monk');

import {sites} from './config.js';

let dbInfoMap = new Map();

sites.forEach(site => {
  let db = monk(site.db);
  let dbInfo = {
    db,
    questions: db.get('questions'),
    answers: db.get('answers'),
    users: db.get('users'),
    tags: db.get('tags')
  };

  dbInfo.questions.index('id',{ unique: true });
  dbInfo.answers.index('id parentId', { unique: true });
  dbInfo.users.index('id', { unique: true });
  dbInfo.tags.index({ 'tagName': 1 }, { unique: true });
  dbInfoMap.set(site.slug, dbInfo);
});

function set(collection, query, obj) {
  return new Promise((resolve, reject) => {
    collection.findAndModify(query, obj, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      if (data) {
        resolve(data);
      } else {
        collection.insert(obj, (err2, data2) => {
          if (err2) {
            reject(err2);
            return;
          }
          resolve(data2);
        });
      }
    });
  });
}

/**
 * Obtains an object for the key, and deserializes it
 */
function get(collection, query, options) {
  return new Promise((resolve, reject) => {
    collection.find(query, options, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
}

/**
 * Obtains an object for the key, and deserializes it
 */
function getOne(collection, query, options) {
  return new Promise((resolve, reject) => {
    collection.find(query, options, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data ? data[0] : null);
    });
  });
}

/**
 * Calls a callback for each item in a query resultset
 */
function getStream(collection, filter, eachCB) {
  return new Promise((resolve, reject) => {
    collection.find(filter, { stream: true })
      .each(eachCB)
      .error(reject)
      .success(resolve);
  });
}

/**
 * Adds the specified question to the DB
 */
export function addQuestion(siteSlug, question) {
  return set(dbInfoMap.get(siteSlug).questions, { id: question.id }, question);
}

/**
 * Adds the specified answer to the DB
 */
export function addAnswer(siteSlug, answer) {
  return set(dbInfoMap.get(siteSlug).answers, { id: answer.id, parentId: answer.parentId }, answer);
}

/**
 * Adds the specified user to the DB
 */
export function addUser(siteSlug, user) {
  return set(dbInfoMap.get(siteSlug).users, { id: user.id}, user);
}

/**
 * Adds the specified tag to the DB to the tag list
 */
export function addTag(siteSlug, tag) {
  return set(dbInfoMap.get(siteSlug).tags, { tagName: tag.tagName}, tag);
}

/**
 * Obtains the specified question from the DB
 */
export function getQuestion(siteSlug, questionId) {
  return getOne(dbInfoMap.get(siteSlug).questions, { id: questionId });
}

/**
 * Obtains all questions from the DB calling eachCB for each, and resolves once done
 */
export function getQuestionsStream(siteSlug, eachCB) {
  return getStream(dbInfoMap.get(siteSlug).questions, {}, eachCB);
}

/**
 * Obtains all users from the DB calling eachCB for each, and resolves once done
 */
export function getUsersStream(siteSlug, eachCB) {
  return getStream(dbInfoMap.get(siteSlug).users, {}, eachCB);
}

/**
 * Obtains all tags from the DB calling eachCB for each, and resolves once done
 */
export function getTagsStream(siteSlug, eachCB) {
  return getStream(dbInfoMap.get(siteSlug).tags, {}, eachCB);
}


/**
 * Obtains a list of answers for the specified questionId.
 */
export function getAnswers(siteSlug, questionId) {
  return get(dbInfoMap.get(siteSlug).answers, { parentId: questionId }, { sort: { score: -1 }} );
}

/**
 * Adds the specified user to the DB
 */
export function getUser(siteSlug, userId) {
  return getOne(dbInfoMap.get(siteSlug).users, { id: userId });
}

/**
 * Obtains a list of tags
 */
export function getTags(siteSlug) {
  return get(dbInfoMap.get(siteSlug).tags, {} ,{sort: { tagName: 1 }});
}

/**
 * Uninitialize the DB connection
 */
export function uninitDB() {
  dbInfoMap.forEach(dbInfo => dbInfo.db.close());
}
