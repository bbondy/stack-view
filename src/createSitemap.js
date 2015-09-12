var sm = require('sitemap');
var fs = require('fs');
import {sites, baseUrl} from './config.js';
import {getQuestionsStream, getUsersStream, uninitDB} from './datastore.js';

// Must have sitemaps 50k URLs or less and less than 50MB uncompressed.
// Otherwise use sitemap index: https://support.google.com/webmasters/answer/75712?vid=1-635773935364676498-3941691634&rd=1

export function sitemapItemFromQuestion(lang, slug, question) {
  return {
    url: `${slug}/${lang}/questions/${question.id}`,
    lastmod: question.lastEditDate,
  };
}

export function sitemapItemFromUser(lang, slug, user) {
  return {
    url: `${slug}/${lang}/users/${user.id}`,
  };
}

function genSitemapForSite(lang, slug) {
  return new Promise((resolve, reject) => {
    let sitemap = sm.createSitemap({
      hostname: baseUrl,
      cacheTime: 0,
      urls: [
        { url: `/` },
        { url: `${slug}/${lang}/tags` },
      ]
    });
    getQuestionsStream(slug, lang, question => {
      sitemap.add(sitemapItemFromQuestion(lang, slug, question));
    }).then(getUsersStream(slug, lang, user => {
      sitemap.add(sitemapItemFromUser(lang, slug, user));
    })).then(() => {
      sitemap.toXML(xml => {
        if (!fs.existsSync(`src/${slug}`)) {
          fs.mkdirSync(`src/${slug}`);
        }
        fs.writeFileSync(`src/${slug}/sitemap-${lang}.xml`, xml);
      });
      resolve();
    }).catch((err) => {
      console.error(err);
      reject(err);
    });
  });
}

let promises = [];
sites.forEach((site) => {
  site.langs.forEach(lang => {
    promises.push(genSitemapForSite(lang, site.slug));
  });
});
Promise.all(promises).then(uninitDB);
