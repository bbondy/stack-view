const siteSlug = process.argv[2];
const fs = require('fs');
import { getQuestionsStream, uninitDB } from './datastore.js';
import { decodify } from './codify.js';
const baseLang = 'en';

let sequence = Promise.resolve();
sequence = sequence.then(getQuestionsStream.bind(null, siteSlug, baseLang, { }, question => {
  if (!fs.existsSync('./translations')) {
    fs.mkdirSync('./translations');
  }
  sequence = sequence.then(decodify.bind(null, question.body));
  sequence = sequence.then(data => {
    fs.writeFileSync(`./translations/q${question.id}.html`, data.normalizedBody);
    fs.writeFileSync(`./translations/t${question.id}.html`, question.title);
  });
}));

sequence = sequence.then(uninitDB);
sequence.catch(err => console.error(err));
