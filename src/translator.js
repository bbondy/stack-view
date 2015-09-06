var MsTranslator = require('mstranslator');
import {mstranslatorClientID, mstranslatorSecret} from './secrets.js';

// Second parameter to constructor (true) indicates that
// the token should be auto-generated.
var client = new MsTranslator({
  client_id: mstranslatorClientID,
  client_secret: mstranslatorSecret
}, true);

export function translate(text, from, to) {
  return new Promise((resolve, reject) => {
    // Don't worry about access token, it will be auto-generated if needed.
    client.translate({text, from, to}, function(err, data) {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
}

/*
translate('hello world', 'en', 'de').then((text) => {
  console.log(text);
}).catch((err) => {
  console.log('there was an error: ', err);
});
*/
