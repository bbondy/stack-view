const siteSlug = process.argv[2];
const fs = require('fs');
import { getQuestionsStream, getAnswersStream, uninitDB } from './datastore.js';
import { decodify } from './codify.js';
const baseLang = 'en';

let sequence = Promise.resolve();
sequence = sequence.then(getQuestionsStream.bind(null, siteSlug, baseLang, { }, question => {
  if (!fs.existsSync('./translations')) {
    fs.mkdirSync('./translations');
  }
  if (!fs.existsSync(`./translations/${siteSlug}`)) {
    fs.mkdirSync(`./translations/${siteSlug}`);
  }
  sequence = sequence.then(decodify.bind(null, question.body));
  sequence = sequence.then(data => {
    fs.writeFileSync(`./translations/${siteSlug}/q${question.id}.html`, data.normalizedBody);
    fs.writeFileSync(`./translations/${siteSlug}/t${question.id}.html`, question.title);
  });
}));

sequence = sequence.then(getAnswersStream.bind(null, siteSlug, baseLang, { }, answer => {
  sequence = sequence.then(decodify.bind(null, answer.body));
  sequence = sequence.then(data => {
    fs.writeFileSync(`./translations/${siteSlug}/a${answer.id}.html`, data.normalizedBody);
  });
}));


sequence = sequence.then(uninitDB);
sequence.catch(err => console.error(err));
