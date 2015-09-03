let redis = require('redis');

let redisClient;
export function initRedis(port = 19278) {
  redisClient = redis.createClient(port);
  redisClient.on('error', function (err) {
    console.error('DB: Error ' + err);
  });
}

export function uninitRedis(shutdown = false) {
  if (shutdown) {
    redisClient.shutdown();
  } else {
    redisClient.quit();
  }
}

/**
 * Adds an object to a list
 */
function pushToList(key, obj) {
  return new Promise((resolve, reject) => {
    redisClient.rpush(key, JSON.stringify(obj), err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Removes an item from the specified list
 */
function removeFromList(key, obj) {
  return new Promise((resolve, reject) => {
    redisClient.lrem(key, 1, JSON.stringify(obj), err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}


/**
 * Obtains all items in a list
 */
function getListElements(key) {
  return new Promise((resolve, reject) => {
    redisClient.lrange(key, 0, -1, (err, replies) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(replies.map(result => JSON.parse(result)));
    });
  });
}


function set(key, obj) {
  return new Promise((resolve, reject) => {
    redisClient.set(key, JSON.stringify(obj), (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

/**
 * Obtains an object for the key, and deserializes it
 */
function get(key) {
  return new Promise((resolve, reject) => {
    redisClient.get(key, function(err, result) {
      if (err) {
        reject(err);
        return;
      }
      if (!result) {
        resolve(null);
      }
      resolve(JSON.parse(result));
    });
  });
}

/**
 * Adds the specified question to the DB to the location question:{questionId}
 */
export function addQuestion(questionId, question) {
  return set(`question:${questionId}`, question);
}

/**
 * Adds the specified user to the DB to the location question:{questionId}
 */
export function addUser(userId, user) {
  return set(`user:${userId}`, user);
}

/**
 * Obtains the specified question from the DB at the location question:{questionId}
 */
export function getQuestion(questionId) {
  return get(`question:${questionId}`);
}

/**
 * Adds the specified user to the DB to the location question:{questionId}
 */
export function getUser(userId) {
  return get(`user:${userId}`);
}

/**
 * Adds the specified answer to the DB to the location answers:{questionId}
 */
export function addAnswer(questionId, answer) {
  return pushToList(`comments:${questionId}`, comment);
}

/**
 * Obtains a list of answers for the specified questionId.
 */
export function getAnswers(questionId) {
  return getListElements(`comments:${questionId}`);
}
