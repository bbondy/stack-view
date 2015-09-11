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
function getStream(collection, lang, filter, eachCB) {
  return new Promise((resolve, reject) => {
    collection.find(filter, { stream: true })
      .each(eachCB)
      .error(reject)
      .success(resolve);
  });
}

/**
 * Adds the specified question to the DB
 * Note that there is only 1 entry total, not 1 per language.
 */
export function addQuestion(siteSlug, question) {
  return set(dbInfoMap.get(siteSlug).questions, { id: question.id }, question);
}

/**
 * Adds the specified answer to the DB
 * Note that there is only 1 entry total, not 1 per language.
 */
export function addAnswer(siteSlug, answer) {
  return set(dbInfoMap.get(siteSlug).answers, { id: answer.id, parentId: answer.parentId }, answer);
}

/**
 * Adds the specified user to the DB
 * Note that there is only 1 entry total, not 1 per language.
 */
export function addUser(siteSlug, user) {
  return set(dbInfoMap.get(siteSlug).users, { id: user.id}, user);
}

/**
 * Adds the specified tag to the DB to the tag list
 * Note that there is only 1 entry total, not 1 per language.
 */
export function addTag(siteSlug, tag) {
  return set(dbInfoMap.get(siteSlug).tags, { tagName: tag.tagName}, tag);
}

/**
 * Obtains all questions from the DB calling eachCB for each, and resolves once done
 * Results will be localized in the specified language.
 */
export function getQuestionsStream(siteSlug, lang, eachCB) {
  return getStream(dbInfoMap.get(siteSlug).questions, {}, (question) => {
    // TODO: Normalize question to specified format
    eachCB(question);
  });
}

/**
 * Obtains all users from the DB calling eachCB for each, and resolves once done
 * Results will be localized in the specified language.
 */
export function getUsersStream(siteSlug, lang, eachCB) {
  return getStream(dbInfoMap.get(siteSlug).users, {}, (user) => {
    // TODO: Normalize user to specified format
    eachCB(user);
  });
}

/**
 * Obtains all tags from the DB calling eachCB for each, and resolves once done
 * Results will be localized in the specified language.
 */
export function getTagsStream(siteSlug, lang, eachCB) {
  return getStream(dbInfoMap.get(siteSlug).tags, {}, (tag) => {
    // TODO: Normalize tag to specified format
    eachCB(tag);
  });
}

/**
 * Obtains the specified question from the DB.
 * Results will be localized in the specified language.
 */
export function getQuestion(siteSlug, lang, questionId) {
  return new Promise((resolve, reject) => {
    getOne(dbInfoMap.get(siteSlug).questions, { id: questionId }).then(question => {
      // TODO: normalize question to localized format
      resolve(question);
    }).catch(reject);
  });
}


/**
 * Obtains a list of answers for the specified questionId.
 * Results will be localized in the specified language.
 */
export function getAnswers(siteSlug, lang, questionId) {
  return new Promise((resolve, reject) => {
    get(dbInfoMap.get(siteSlug).answers, { parentId: questionId }, { sort: { score: -1 }} ).then(answers => {
      // TODO: normalize answers to localized format
      resolve(answers);
    }).catch(reject);
  });
}

/**
 * Obtains the specified user from the DB
 * Results will be localized in the specified language.
 */
export function getUser(siteSlug, lang, userId) {
  return new Promise((resolve, reject) => {
    getOne(dbInfoMap.get(siteSlug).users, { id: userId }).then(user => {
      // TODO: normalize user to localized format
      resolve(user);
    }).catch(reject);
  });
}

/**
 * Obtains a list of tags
 * Results will be localized in the specified language.
 */
export function getTags(siteSlug, lang) {
  return new Promise((resolve, reject) => {
    get(dbInfoMap.get(siteSlug).tags, {} ,{sort: { tagName: 1 }}).then(tags => {
      // TODO: normalize tags to localized format
      resolve(tags);
    }).catch(reject);
  });
}

/**
 * Uninitialize the DB connection
 */
export function uninitDB() {
  dbInfoMap.forEach(dbInfo => dbInfo.db.close());
}
