var monk = require('monk');

import {sites} from './config.js';

let dbInfoMap = new Map();

let newDB = (site, temp) => {
  let db = monk(site.db + (temp? '-temp' : ''));
  let dbInfo = {
    db,
    questions: db.get('questions'),
    answers: db.get('answers'),
    users: db.get('users'),
    tags: db.get('tags'),
    stats: db.get('stats'),
  };

  dbInfo.questions.index('id',{ unique: true });
  dbInfo.questions.index('page');
  dbInfo.questions.index('ownerUserId');
  dbInfo.answers.index('id', { unique: true});
  dbInfo.answers.index('id parentId', { unique: true });
  dbInfo.answers.index('parentId');
  dbInfo.answers.index('ownerUserId');
  dbInfo.users.index('id', { unique: true });
  dbInfo.users.index('page');
  dbInfo.tags.index({ 'tagName': 1 }, { unique: true });

  return dbInfo;
};

sites.forEach(site => {
    dbInfoMap.set(site.slug, newDB(site));
    dbInfoMap.set(`${site.slug}-temp`, newDB(site, true));
});

function set(collection, query, obj) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    try {
      collection.findAndModify(query, obj, { timeout: false }, (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        if (data) {
          resolve(data);
        } else {
          collection.insert(obj, { timeout: false }, (err2, data2) => {
            if (err2) {
              reject(err2);
              return;
            }
            resolve(data2);
          });
        }
      });
    } catch (e) {
      retries++;
      console.error('caught exception in set with', retries, ' retries. Exception:', e);
      if (e.stack) {
        console.error(e.stack);
      }
      if (retries > 5) {
        throw e;
      }
      return set(collection, query, obj);
    }
  });
}

/**
 * Obtains an object for the key, and deserializes it
 */
function get(collection, query, options) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    try {
      options = options || {};
      options.timeout = false;
      collection.find(query, options, (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data);
      });
    } catch (e) {
      retries++;
      console.error('caught exception in get with', retries, ' retries. Exception:', e);
      if (e.stack) {
        console.error(e.stack);
      }
      if (retries > 5) {
        throw e;
      }
      return get(collection, query, options);
    }
  });
}

/**
 * Obtains an object for the key, and deserializes it
 */
function count(collection, query) {
  return new Promise((resolve, reject) => {
    collection.count(query, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

/**
 * Obtains an object for the key, and deserializes it
 */
function getOne(collection, query, options) {
  return new Promise((resolve, reject) => {
    get(collection, query, options).then((data) => {
      resolve(data[0]);
    }).catch(reject);
  });
}

/**
 * Calls a callback for each item in a query resultset
 */
function getStream(collection, filter, eachCB) {
  return new Promise((resolve, reject) => {
    collection.find(filter, { stream: true, timeout: false })
      .each(eachCB)
      .error(reject)
      .success(resolve);
  });
}

/**
 * Adds the specified question to the DB
 * Note that there is only 1 entry total, not 1 per language.
 */
export function setStats(siteSlug, stats) {
  return set(dbInfoMap.get(siteSlug).stats, {}, stats);
}

/**
 * Adds the specified question to the DB
 * Note that there is only 1 entry total, not 1 per language.
 */
export function addQuestion(siteSlug, question) {
  return set(dbInfoMap.get(siteSlug).questions, { id: Number(question.id) }, question);
}

/**
 * Adds the specified answer to the DB
 * Note that there is only 1 entry total, not 1 per language.
 */
export function addAnswer(siteSlug, answer) {
  return set(dbInfoMap.get(siteSlug).answers, { id: Number(answer.id), parentId: answer.parentId }, answer);
}

/**
 * Adds the specified user to the DB
 * Note that there is only 1 entry total, not 1 per language.
 */
export function addUser(siteSlug, user) {
  return set(dbInfoMap.get(siteSlug).users, { id: Number(user.id)}, user);
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
export function getQuestionsStream(siteSlug, lang, filter, eachCB) {
  return getStream(dbInfoMap.get(siteSlug).questions, filter, (question) => {
    // TODO: Normalize question to specified format
    eachCB(question);
  });
}

/**
 * Obtains all answers from the DB calling eachCB for each, and resolves once done
 * Results will be localized in the specified language.
 */
export function getAnswersStream(siteSlug, lang, filter, eachCB) {
  return getStream(dbInfoMap.get(siteSlug).answers, filter, (question) => {
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
export function getStats(siteSlug) {
  return getOne(dbInfoMap.get(siteSlug).stats, {});
}

/**
 * Obtains the specified question from the DB.
 * Results will be localized in the specified language.
 */
export function getQuestion(siteSlug, lang, questionId) {
  return new Promise((resolve, reject) => {
    getOne(dbInfoMap.get(siteSlug).questions, { id: Number(questionId) }).then(question => {
      // TODO: normalize question to localized format
      resolve(question);
    }).catch(reject);
  });
}


/**
 * Obtains all questions from the DB.
 * Results will be localized in the specified language.
 */
export function getQuestions(siteSlug, lang, page) {
  return new Promise((resolve, reject) => {
    get(dbInfoMap.get(siteSlug).questions, { page: Number(page) }).then(questions => {
      // TODO: normalize question to localized format
      resolve(questions);
    }).catch(reject);
  });
}

/**
 * Obtains all users from the DB.
 * Results will be localized in the specified language.
 */
export function getUsers(siteSlug, lang, page) {
  return new Promise((resolve, reject) => {
    get(dbInfoMap.get(siteSlug).users, { page: Number(page) }).then(users => {
      // TODO: normalize question to localized format
      resolve(users);
    }).catch(reject);
  });
}

/**
 * Obtains a single answer by the answerId.
 * Results will be localized in the specified language.
 */
export function getAnswer(siteSlug, lang, answerId) {
  return new Promise((resolve, reject) => {
    getOne(dbInfoMap.get(siteSlug).answers, { id: Number(answerId) }).then(answer => {
      // TODO: normalize answers to localized format
      resolve(answer);
    }).catch(reject);
  });
}

/**
 * Obtains a list of answers for the specified questionId.
 * Results will be localized in the specified language.
 */
export function getAnswers(siteSlug, lang, questionId) {
  return new Promise((resolve, reject) => {
    get(dbInfoMap.get(siteSlug).answers, { parentId: Number(questionId) }, { sort: { score: -1 }} ).then(answers => {
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
    getOne(dbInfoMap.get(siteSlug).users, { id: Number(userId) }).then(user => {
      // TODO: normalize user to localized format
      resolve(user);
    }).catch(reject);
  });
}


export function getTags(siteSlug, lang) {
  return new Promise((resolve, reject) => {
    get(dbInfoMap.get(siteSlug).tags, {} ,{sort: { tagName: 1 }}).then(tags => {
      // TODO: normalize tags to localized format
      resolve(tags);
    }).catch(reject);
  });
}

export function getTag(siteSlug, lang, tagName) {
  return new Promise((resolve, reject) => {
    getOne(dbInfoMap.get(siteSlug).tags, { tagName }).then(tag => {
      // TODO: normalize tags to localized format
      resolve(tag);
    }).catch(reject);
  });
}

export function getQuestionsCount(siteSlug, query = {}) {
  return count(dbInfoMap.get(siteSlug).questions, query);
}

export function getAnswersCount(siteSlug, query = {}) {
  return count(dbInfoMap.get(siteSlug).answers, query);
}

export function getTagsCount(siteSlug, query = {}) {
  return count(dbInfoMap.get(siteSlug).tags, query);
}

export function getUsersCount(siteSlug, query = {}) {
  return count(dbInfoMap.get(siteSlug).users, query);
}

/**
 * Uninitialize the DB connection
 */
export function uninitDB() {
  dbInfoMap.forEach(dbInfo => dbInfo.db.close());
}
