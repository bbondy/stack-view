import {sites} from './config.js';

export const siteUrl = (siteSlug, lang) => lang !== undefined ? `/${siteSlug}/${lang}` : `/${siteSlug}`;

export const userUrl = (siteSlug, lang, userId) => userId !== undefined ? `/${siteSlug}/${lang}/users/${userId}` : `/${siteSlug}/${lang}/users`;
export const questionUrl = (siteSlug, lang, questionId) => questionId !== undefined ? `/${siteSlug}/${lang}/questions/${questionId}` : `/${siteSlug}/${lang}/questions`;
export const questionsUrl = (siteSlug, lang, page) => page === 1 ? `/${siteSlug}/${lang}/questions` : `/${siteSlug}/${lang}/questions/page/${page}`;
export const tagsUrl = (siteSlug, lang) => `/${siteSlug}/${lang}/tags`;
export const nextQuestionsUrl = (siteSlug, lang, page) => questionsUrl(siteSlug, lang, page + 1);
export const backQuestionsUrl = (siteSlug, lang, page) => questionsUrl(siteSlug, lang, page - 1);

export const seUserUrl = (siteSlug, userId) => {
  let foundSite = sites.find(site => siteSlug === site.slug);
  return `${foundSite.seUrl}users/${userId}`;
};
export const seQuestionUrl = (siteSlug, userId) => {
  let foundSite = sites.find(site => siteSlug === site.slug);
  return `${foundSite.seUrl}questions/${userId}`;
};

export const siteLangs = (siteSlug) => {
  let foundSite = sites.find(site => siteSlug === site.slug);
  return foundSite.langs;
};

export const getQuestionsTitle = (lang, page) => page === 1 ? "Questions" : `Questions page ${page}`;
