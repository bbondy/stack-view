import {mongoDB} from './secrets.js';
var db = require('monk')(mongoDB);

var questions = db.get('questions');
var answers = db.get('answers');
var users = db.get('users');
var tags = db.get('tags');

questions.index('id',{ unique: true });
answers.index('id parentId', { unique: true });
users.index('id', { unique: true });
tags.index({ 'tagName': 1 }, { unique: true });

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
 * Adds the specified question to the DB
 */
export function addQuestion(question) {
  return set(questions, { id: question.id }, question);
}

/**
 * Adds the specified answer to the DB
 */
export function addAnswer(answer) {
  return set(answers, { id: answer.id, parentId: answer.parentId }, answer);
}

/**
 * Adds the specified user to the DB
 */
export function addUser(user) {
  return set(users, { id: user.id}, user);
}

/**
 * Adds the specified tag to the DB to the tag list
 */
export function addTag(tag) {
  return set(tags, { tagName: tag.tagName}, tag);
}

/**
 * Obtains the specified question from the DB
 */
export function getQuestion(questionId) {
  return getOne(questions, { id: questionId });
}

/**
 * Obtains a list of answers for the specified questionId.
 */
export function getAnswers(questionId) {
  return get(answers, { parentId: questionId }, { sort: { score: -1 }} );
}

/**
 * Adds the specified user to the DB
 */
export function getUser(userId) {
  return getOne(users, { id: userId });
}

/**
 * Obtains a list of tags
 */
export function getTags() {
  return get(tags, {} ,{sort: { tagName: 1 }});
}

/**
 * Uninitialize the DB connection
 */
export function uninitDB() {
  db.close();
}
