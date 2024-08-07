const fs = require("fs");
const mime = require('mime');
const unzipper = require('unzipper');

module.exports = class FileService {
  constructor() {}

  list(path) {
    return new Promise((resolve, reject) => {
      fs.access(path, fs.constants.R_OK, (err) => {
        if (err) {
          reject(err);
          return;
        }
        fs.readdir(path, { encoding: 'utf8', withFileTypes: true }, (err, files) => {
          if (err || files === undefined) {
            reject(err);
            return;
          }
          resolve(files.sort((a, b) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            if (aName > bName) {
              return 1;
            }
            if (aName < bName) {
              return -1;
            }
            return 0;
          }).map(item => ({ name: item.name, type: item.isDirectory() ? 2 : 1 })).sort((a, b) => {
            if (a.type > b.type) {
              return -1;
            }
            if (a.type < b.type) {
              return 1;
            }
            return 0;
          }));
        });
      });
    });
  }

  get(path) {
    return new Promise((resolve, reject) => {
      fs.access(path, (err) => {
        if (err) {
          reject(err);
          return;
        }
        fs.readFile(path, { encoding: 'utf8' }, (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(data);
        });
      });
    });
  }

  pipe(path, res) {
    return new Promise((resolve, reject) => {
      fs.access(path, (err) => {
        if (err) {
          reject(err);
          return;
        }

        const stats = fs.statSync(path);
        const readStream = fs.createReadStream(path);
        res.setHeader('Content-Type', mime.getType(path));
        res.setHeader('Content-Length', stats.size);
        readStream.pipe(res);
      });
    });
  }

  put(path, data) {
    return new Promise((resolve, reject) => {
      fs.access(path, (err) => {
        if (err) {
          reject(err);
          return;
        }
        fs.writeFile(path, data, { encoding: 'utf8', flag: 'w+' }, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    });
  }

  exists(path) {
    return new Promise((resolve) => {
      fs.access(path, fs.constants.F_OK, (err) => {
        resolve(!err);
      });
    });
  }

  delete(path) {
    return new Promise((resolve, reject) => {
      fs.access(path, (err) => {
        if (err) {
          reject(err);
          return;
        }
        fs.unlink(path, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    });
  }

  upload(path, files) {
    return new Promise((resolve, reject) => {
      fs.access(path, (err) => {
        if (err) {
          reject(err);
          return;
        }
        const uploadPromises = files.map(item => {
          return new Promise((resolve, reject) => {
            item.mv(path + '/' + item.name, err => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
        });
        Promise.all(uploadPromises).then(resolve).catch(reject);
      });
    });
  }

  extract(path) {
    return new Promise((resolve, reject) => {
      fs.access(path, (err) => {
        if (err) {
          reject(err);
          return;
        }
        const tmp = path.split('.');
        if (tmp.length > 1) {
          tmp.splice(tmp.length - 1, 1);
        }
        try {
          fs.createReadStream(path).pipe(unzipper.Extract({ path: tmp.join('.') }));
        } catch (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
      if (fs.lstatSync(path).isDirectory()) {
        fs.readdirSync(path).forEach((file) => {
          const curPath = path + "/" + file;
          this.deleteFolderRecursive(curPath);
        });
        fs.rmdirSync(path);
      } else {
        fs.unlinkSync(path);
      }
    }
  };

  createDir(path, name) {
    return new Promise((resolve, reject) => {
      fs.access(path, (err) => {
        if (err) {
          reject(err);
          return;
        }
        fs.mkdir(path + '/' + name, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    });
  }

  rename(path, name) {
    return new Promise((resolve, reject) => {
      fs.access(path, (err) => {
        if (err) {
          reject(err);
          return;
        }
        const parts = path.split('/');
        parts.splice(parts.length - 1, 1);
        const newPath = parts.join('/') + '/' + name;
        fs.rename(path, newPath, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    });
  }
};
