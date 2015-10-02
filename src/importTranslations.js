const siteSlug = process.argv[2];
const fs = require('fs');
const path = require('path');
import {addQuestion, addAnswer, getQuestion, getAnswer, uninitDB} from './datastore.js';

let basePath = `./translations/import/${siteSlug}`;
if (!fs.existsSync(basePath)) {
  console.error(`Import files do not exist!\nCheck ${basePath}`);
  process.exit();
}

let sequence = Promise.resolve();
let langs = fs.readdirSync(basePath);

let updateField = (lang, id, getFn, addFn, fieldName, data) => {
  sequence = sequence.then(getFn.bind(null, siteSlug, lang, id));
  sequence = sequence.then(item => {
    item[fieldName] = data;
    return addFn(siteSlug, item);
  });
};

langs.forEach(lang => {
  let langDir = path.join(basePath, lang);
  let translationFiles = fs.readdirSync(langDir);

  translationFiles.forEach(translationFile => {
    let c = translationFile[0];
    let id = Number(translationFile.substring(1).split('.')[0]);
    let translationFilePath = path.join(langDir, translationFile);
    let data = fs.readFileSync(translationFilePath, 'utf-8');

    // Question title
    if (c === 't') {
      console.log('imported title for site:', siteSlug, 'lang:', lang, 'question id:', id);
      updateField(lang, id, getQuestion, addQuestion, `title-${lang}`, data);
    // Question body
    } else if (c === 'q') {
      console.log('imported body for site:', siteSlug, 'lang:', lang, 'question id:', id);
      updateField(lang, id, getQuestion, addQuestion, `body-${lang}`, data);
    // Answer
    } else if (c === 'a') {
      console.log('imported body for site:', siteSlug, 'lang:', lang, 'answer id:', id);
      updateField(lang, id, getAnswer, addAnswer `body-${lang}`, data);
    }
  });
});

sequence = sequence.then(uninitDB);
sequence.catch(err => {
  console.error(err);
  console.error(new Error().stack);
});
