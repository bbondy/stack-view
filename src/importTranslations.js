const siteSlug = process.argv[2];
const fs = require('fs');

let path = `./translations/export/${siteSlug}`;
if (!fs.existsSync(path)) {
  console.error(`Import files do not exist!\nCheck ${path}`);
  process.exit();
}
