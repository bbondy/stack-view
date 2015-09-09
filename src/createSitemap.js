var sm = require('sitemap');
import {sites} from '../config.js';
import {getQuestions, getUsers} from './datastore.js';

function genSitemapForSite(slug) {
  let sitemap = sm.createSitemap({
    hostname: 'http://rosettastack.com',
    cacheTime: 0,
    urls: [
      { url: `${slug}/tags` },
    ]
  });
  sitemap.toXML(xml =>
    fs.writeFileSync('sitemap.xml', xml);
}

sites.map(site => site.slug).forEach(genSitemapForSite);
