var sm = require('sitemap');
var fs = require('fs');
import {sites, baseUrl} from './config.js';
import {getTagsStream, getQuestionsStream, getUsersStream, getUsers, uninitDB} from './datastore.js';

// Must have sitemaps 50k URLs or less and less than 50MB uncompressed.
// Otherwise use sitemap index: https://support.google.com/webmasters/answer/75712?vid=1-635773935364676498-3941691634&rd=1

export function sitemapItemFromQuestion(slug, question) {
  return {
    url: `${slug}/questions/${question.id}`,
    lastmod: question.lastEditDate,
  };
}

export function sitemapItemFromUser(slug, user) {
  return {
    url: `${slug}/users/${user.id}`,
  };
}

function genSitemapForSite(slug) {
  return new Promise((resolve, reject) => {
    let sitemap = sm.createSitemap({
      hostname: baseUrl,
      cacheTime: 0,
      urls: [
        { url: `/` },
        { url: `${slug}/tags` },
      ]
    });
    getTagsStream(slug, question => {
      sitemap.add(sitemapItemFromQuestion(slug, question));
    }).then(getUsersStream(slug, user => {
      sitemap.add(sitemapItemFromUser(slug, user));
    })).then(() => {
      sitemap.toXML(xml => {
        if (!fs.existsSync(`src/${slug}`)) {
          fs.mkdirSync(`src/${slug}`);
        }
        fs.writeFileSync(`src/${slug}/sitemap.xml`, xml);
      });
      resolve();
    }).catch((err) => {
      console.error(err);
    });
  });
}

let promises = [];
sites.map(site => site.slug).forEach((site) => {
  promises.push(genSitemapForSite(site))
});
Promise.all(promises).then(uninitDB);
