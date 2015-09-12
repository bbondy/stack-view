import {sites} from './config.js';

export const userUrl = (siteSlug, lang, userId) => `/${siteSlug}/${lang}/users/${userId}`;
export const seUserUrl = (siteSlug, userId) => {
  let foundSite = sites.find(site => siteSlug === site.slug);
  return `${foundSite.seUrl}users/${userId}`;
};
export const questionUrl = (siteSlug, lang, userId) => `/${siteSlug}/${lang}/questions/${userId}`;
export const seQuestionUrl = (siteSlug, userId) => {
  let foundSite = sites.find(site => siteSlug === site.slug);
  return `${foundSite.seUrl}questions/${userId}`;
};
