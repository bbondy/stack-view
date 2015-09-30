var jsdom = require('jsdom');

export function decodify(html) {
  return new Promise((resolve) => {
    let convertedHTML = html;
    jsdom.env(html, (err, window) => {
      let snippets = Array.from(window.document.querySelectorAll('code'));
      let snippetsHTML = [];
      snippets.forEach((snippet, i) => {
        snippetsHTML.push(snippet.outerHTML);
        snippet.outerHTML = `{CODE_${i + 1}}`;
      });
      convertedHTML = window.document.documentElement.outerHTML;
      resolve({
        normalizedBody: convertedHTML,
        snippetsHTML,
      });
    });
  });
}

export function codify(html, snippets) {
  snippets.forEach((snippet, i) => {
    let snippetCode = `{CODE_${i + 1}}`;
    html = html.replace(snippetCode, snippet);
  });
  return html;
}
