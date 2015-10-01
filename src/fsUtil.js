const fs = require('fs');

export function createDirs(dir) {
  let subdirs = dir.split('/').splice(1);
  let path = './';
  subdirs.forEach(subdir => {
    path += `${subdir}/`;
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
  });
}
