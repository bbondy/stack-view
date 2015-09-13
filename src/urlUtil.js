import {sites} from './config.js';


export const userUrl = (siteSlug, lang, userId) => userId !== undefined ? `/${siteSlug}/${lang}/users/${userId}` : `/${siteSlug}/${lang}/users`;
export const questionUrl = (siteSlug, lang, questionId) => questionId !== undefined ? `/${siteSlug}/${lang}/questions/${questionId}` : `/${siteSlug}/${lang}/questions`;

export const seUserUrl = (siteSlug, userId) => {
  let foundSite = sites.find(site => siteSlug === site.slug);
  return `${foundSite.seUrl}users/${userId}`;
};
export const seQuestionUrl = (siteSlug, userId) => {
  let foundSite = sites.find(site => siteSlug === site.slug);
  return `${foundSite.seUrl}questions/${userId}`;
};
