"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/universalify/index.js
var require_universalify = __commonJS({
  "node_modules/universalify/index.js"(exports2) {
    "use strict";
    exports2.fromCallback = function(fn) {
      return Object.defineProperty(function(...args) {
        if (typeof args[args.length - 1] === "function") fn.apply(this, args);
        else {
          return new Promise((resolve, reject) => {
            args.push((err, res) => err != null ? reject(err) : resolve(res));
            fn.apply(this, args);
          });
        }
      }, "name", { value: fn.name });
    };
    exports2.fromPromise = function(fn) {
      return Object.defineProperty(function(...args) {
        const cb = args[args.length - 1];
        if (typeof cb !== "function") return fn.apply(this, args);
        else {
          args.pop();
          fn.apply(this, args).then((r) => cb(null, r), cb);
        }
      }, "name", { value: fn.name });
    };
  }
});

// node_modules/graceful-fs/polyfills.js
var require_polyfills = __commonJS({
  "node_modules/graceful-fs/polyfills.js"(exports2, module2) {
    var constants = require("constants");
    var origCwd = process.cwd;
    var cwd = null;
    var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
    process.cwd = function() {
      if (!cwd)
        cwd = origCwd.call(process);
      return cwd;
    };
    try {
      process.cwd();
    } catch (er) {
    }
    if (typeof process.chdir === "function") {
      chdir = process.chdir;
      process.chdir = function(d) {
        cwd = null;
        chdir.call(process, d);
      };
      if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir);
    }
    var chdir;
    module2.exports = patch;
    function patch(fs) {
      if (constants.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
        patchLchmod(fs);
      }
      if (!fs.lutimes) {
        patchLutimes(fs);
      }
      fs.chown = chownFix(fs.chown);
      fs.fchown = chownFix(fs.fchown);
      fs.lchown = chownFix(fs.lchown);
      fs.chmod = chmodFix(fs.chmod);
      fs.fchmod = chmodFix(fs.fchmod);
      fs.lchmod = chmodFix(fs.lchmod);
      fs.chownSync = chownFixSync(fs.chownSync);
      fs.fchownSync = chownFixSync(fs.fchownSync);
      fs.lchownSync = chownFixSync(fs.lchownSync);
      fs.chmodSync = chmodFixSync(fs.chmodSync);
      fs.fchmodSync = chmodFixSync(fs.fchmodSync);
      fs.lchmodSync = chmodFixSync(fs.lchmodSync);
      fs.stat = statFix(fs.stat);
      fs.fstat = statFix(fs.fstat);
      fs.lstat = statFix(fs.lstat);
      fs.statSync = statFixSync(fs.statSync);
      fs.fstatSync = statFixSync(fs.fstatSync);
      fs.lstatSync = statFixSync(fs.lstatSync);
      if (fs.chmod && !fs.lchmod) {
        fs.lchmod = function(path2, mode, cb) {
          if (cb) process.nextTick(cb);
        };
        fs.lchmodSync = function() {
        };
      }
      if (fs.chown && !fs.lchown) {
        fs.lchown = function(path2, uid, gid, cb) {
          if (cb) process.nextTick(cb);
        };
        fs.lchownSync = function() {
        };
      }
      if (platform === "win32") {
        fs.rename = typeof fs.rename !== "function" ? fs.rename : function(fs$rename) {
          function rename(from, to, cb) {
            var start = Date.now();
            var backoff = 0;
            fs$rename(from, to, function CB(er) {
              if (er && (er.code === "EACCES" || er.code === "EPERM" || er.code === "EBUSY") && Date.now() - start < 6e4) {
                setTimeout(function() {
                  fs.stat(to, function(stater, st) {
                    if (stater && stater.code === "ENOENT")
                      fs$rename(from, to, CB);
                    else
                      cb(er);
                  });
                }, backoff);
                if (backoff < 100)
                  backoff += 10;
                return;
              }
              if (cb) cb(er);
            });
          }
          if (Object.setPrototypeOf) Object.setPrototypeOf(rename, fs$rename);
          return rename;
        }(fs.rename);
      }
      fs.read = typeof fs.read !== "function" ? fs.read : function(fs$read) {
        function read(fd, buffer, offset, length, position, callback_) {
          var callback;
          if (callback_ && typeof callback_ === "function") {
            var eagCounter = 0;
            callback = function(er, _, __) {
              if (er && er.code === "EAGAIN" && eagCounter < 10) {
                eagCounter++;
                return fs$read.call(fs, fd, buffer, offset, length, position, callback);
              }
              callback_.apply(this, arguments);
            };
          }
          return fs$read.call(fs, fd, buffer, offset, length, position, callback);
        }
        if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read);
        return read;
      }(fs.read);
      fs.readSync = typeof fs.readSync !== "function" ? fs.readSync : /* @__PURE__ */ function(fs$readSync) {
        return function(fd, buffer, offset, length, position) {
          var eagCounter = 0;
          while (true) {
            try {
              return fs$readSync.call(fs, fd, buffer, offset, length, position);
            } catch (er) {
              if (er.code === "EAGAIN" && eagCounter < 10) {
                eagCounter++;
                continue;
              }
              throw er;
            }
          }
        };
      }(fs.readSync);
      function patchLchmod(fs2) {
        fs2.lchmod = function(path2, mode, callback) {
          fs2.open(
            path2,
            constants.O_WRONLY | constants.O_SYMLINK,
            mode,
            function(err, fd) {
              if (err) {
                if (callback) callback(err);
                return;
              }
              fs2.fchmod(fd, mode, function(err2) {
                fs2.close(fd, function(err22) {
                  if (callback) callback(err2 || err22);
                });
              });
            }
          );
        };
        fs2.lchmodSync = function(path2, mode) {
          var fd = fs2.openSync(path2, constants.O_WRONLY | constants.O_SYMLINK, mode);
          var threw = true;
          var ret;
          try {
            ret = fs2.fchmodSync(fd, mode);
            threw = false;
          } finally {
            if (threw) {
              try {
                fs2.closeSync(fd);
              } catch (er) {
              }
            } else {
              fs2.closeSync(fd);
            }
          }
          return ret;
        };
      }
      function patchLutimes(fs2) {
        if (constants.hasOwnProperty("O_SYMLINK") && fs2.futimes) {
          fs2.lutimes = function(path2, at, mt, cb) {
            fs2.open(path2, constants.O_SYMLINK, function(er, fd) {
              if (er) {
                if (cb) cb(er);
                return;
              }
              fs2.futimes(fd, at, mt, function(er2) {
                fs2.close(fd, function(er22) {
                  if (cb) cb(er2 || er22);
                });
              });
            });
          };
          fs2.lutimesSync = function(path2, at, mt) {
            var fd = fs2.openSync(path2, constants.O_SYMLINK);
            var ret;
            var threw = true;
            try {
              ret = fs2.futimesSync(fd, at, mt);
              threw = false;
            } finally {
              if (threw) {
                try {
                  fs2.closeSync(fd);
                } catch (er) {
                }
              } else {
                fs2.closeSync(fd);
              }
            }
            return ret;
          };
        } else if (fs2.futimes) {
          fs2.lutimes = function(_a, _b, _c, cb) {
            if (cb) process.nextTick(cb);
          };
          fs2.lutimesSync = function() {
          };
        }
      }
      function chmodFix(orig) {
        if (!orig) return orig;
        return function(target, mode, cb) {
          return orig.call(fs, target, mode, function(er) {
            if (chownErOk(er)) er = null;
            if (cb) cb.apply(this, arguments);
          });
        };
      }
      function chmodFixSync(orig) {
        if (!orig) return orig;
        return function(target, mode) {
          try {
            return orig.call(fs, target, mode);
          } catch (er) {
            if (!chownErOk(er)) throw er;
          }
        };
      }
      function chownFix(orig) {
        if (!orig) return orig;
        return function(target, uid, gid, cb) {
          return orig.call(fs, target, uid, gid, function(er) {
            if (chownErOk(er)) er = null;
            if (cb) cb.apply(this, arguments);
          });
        };
      }
      function chownFixSync(orig) {
        if (!orig) return orig;
        return function(target, uid, gid) {
          try {
            return orig.call(fs, target, uid, gid);
          } catch (er) {
            if (!chownErOk(er)) throw er;
          }
        };
      }
      function statFix(orig) {
        if (!orig) return orig;
        return function(target, options, cb) {
          if (typeof options === "function") {
            cb = options;
            options = null;
          }
          function callback(er, stats) {
            if (stats) {
              if (stats.uid < 0) stats.uid += 4294967296;
              if (stats.gid < 0) stats.gid += 4294967296;
            }
            if (cb) cb.apply(this, arguments);
          }
          return options ? orig.call(fs, target, options, callback) : orig.call(fs, target, callback);
        };
      }
      function statFixSync(orig) {
        if (!orig) return orig;
        return function(target, options) {
          var stats = options ? orig.call(fs, target, options) : orig.call(fs, target);
          if (stats) {
            if (stats.uid < 0) stats.uid += 4294967296;
            if (stats.gid < 0) stats.gid += 4294967296;
          }
          return stats;
        };
      }
      function chownErOk(er) {
        if (!er)
          return true;
        if (er.code === "ENOSYS")
          return true;
        var nonroot = !process.getuid || process.getuid() !== 0;
        if (nonroot) {
          if (er.code === "EINVAL" || er.code === "EPERM")
            return true;
        }
        return false;
      }
    }
  }
});

// node_modules/graceful-fs/legacy-streams.js
var require_legacy_streams = __commonJS({
  "node_modules/graceful-fs/legacy-streams.js"(exports2, module2) {
    var Stream = require("stream").Stream;
    module2.exports = legacy;
    function legacy(fs) {
      return {
        ReadStream,
        WriteStream
      };
      function ReadStream(path2, options) {
        if (!(this instanceof ReadStream)) return new ReadStream(path2, options);
        Stream.call(this);
        var self = this;
        this.path = path2;
        this.fd = null;
        this.readable = true;
        this.paused = false;
        this.flags = "r";
        this.mode = 438;
        this.bufferSize = 64 * 1024;
        options = options || {};
        var keys = Object.keys(options);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index];
          this[key] = options[key];
        }
        if (this.encoding) this.setEncoding(this.encoding);
        if (this.start !== void 0) {
          if ("number" !== typeof this.start) {
            throw TypeError("start must be a Number");
          }
          if (this.end === void 0) {
            this.end = Infinity;
          } else if ("number" !== typeof this.end) {
            throw TypeError("end must be a Number");
          }
          if (this.start > this.end) {
            throw new Error("start must be <= end");
          }
          this.pos = this.start;
        }
        if (this.fd !== null) {
          process.nextTick(function() {
            self._read();
          });
          return;
        }
        fs.open(this.path, this.flags, this.mode, function(err, fd) {
          if (err) {
            self.emit("error", err);
            self.readable = false;
            return;
          }
          self.fd = fd;
          self.emit("open", fd);
          self._read();
        });
      }
      function WriteStream(path2, options) {
        if (!(this instanceof WriteStream)) return new WriteStream(path2, options);
        Stream.call(this);
        this.path = path2;
        this.fd = null;
        this.writable = true;
        this.flags = "w";
        this.encoding = "binary";
        this.mode = 438;
        this.bytesWritten = 0;
        options = options || {};
        var keys = Object.keys(options);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index];
          this[key] = options[key];
        }
        if (this.start !== void 0) {
          if ("number" !== typeof this.start) {
            throw TypeError("start must be a Number");
          }
          if (this.start < 0) {
            throw new Error("start must be >= zero");
          }
          this.pos = this.start;
        }
        this.busy = false;
        this._queue = [];
        if (this.fd === null) {
          this._open = fs.open;
          this._queue.push([this._open, this.path, this.flags, this.mode, void 0]);
          this.flush();
        }
      }
    }
  }
});

// node_modules/graceful-fs/clone.js
var require_clone = __commonJS({
  "node_modules/graceful-fs/clone.js"(exports2, module2) {
    "use strict";
    module2.exports = clone;
    var getPrototypeOf = Object.getPrototypeOf || function(obj) {
      return obj.__proto__;
    };
    function clone(obj) {
      if (obj === null || typeof obj !== "object")
        return obj;
      if (obj instanceof Object)
        var copy = { __proto__: getPrototypeOf(obj) };
      else
        var copy = /* @__PURE__ */ Object.create(null);
      Object.getOwnPropertyNames(obj).forEach(function(key) {
        Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
      });
      return copy;
    }
  }
});

// node_modules/graceful-fs/graceful-fs.js
var require_graceful_fs = __commonJS({
  "node_modules/graceful-fs/graceful-fs.js"(exports2, module2) {
    var fs = require("fs");
    var polyfills = require_polyfills();
    var legacy = require_legacy_streams();
    var clone = require_clone();
    var util = require("util");
    var gracefulQueue;
    var previousSymbol;
    if (typeof Symbol === "function" && typeof Symbol.for === "function") {
      gracefulQueue = Symbol.for("graceful-fs.queue");
      previousSymbol = Symbol.for("graceful-fs.previous");
    } else {
      gracefulQueue = "___graceful-fs.queue";
      previousSymbol = "___graceful-fs.previous";
    }
    function noop() {
    }
    function publishQueue(context, queue2) {
      Object.defineProperty(context, gracefulQueue, {
        get: function() {
          return queue2;
        }
      });
    }
    var debug = noop;
    if (util.debuglog)
      debug = util.debuglog("gfs4");
    else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ""))
      debug = function() {
        var m = util.format.apply(util, arguments);
        m = "GFS4: " + m.split(/\n/).join("\nGFS4: ");
        console.error(m);
      };
    if (!fs[gracefulQueue]) {
      queue = global[gracefulQueue] || [];
      publishQueue(fs, queue);
      fs.close = function(fs$close) {
        function close(fd, cb) {
          return fs$close.call(fs, fd, function(err) {
            if (!err) {
              resetQueue();
            }
            if (typeof cb === "function")
              cb.apply(this, arguments);
          });
        }
        Object.defineProperty(close, previousSymbol, {
          value: fs$close
        });
        return close;
      }(fs.close);
      fs.closeSync = function(fs$closeSync) {
        function closeSync(fd) {
          fs$closeSync.apply(fs, arguments);
          resetQueue();
        }
        Object.defineProperty(closeSync, previousSymbol, {
          value: fs$closeSync
        });
        return closeSync;
      }(fs.closeSync);
      if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || "")) {
        process.on("exit", function() {
          debug(fs[gracefulQueue]);
          require("assert").equal(fs[gracefulQueue].length, 0);
        });
      }
    }
    var queue;
    if (!global[gracefulQueue]) {
      publishQueue(global, fs[gracefulQueue]);
    }
    module2.exports = patch(clone(fs));
    if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs.__patched) {
      module2.exports = patch(fs);
      fs.__patched = true;
    }
    function patch(fs2) {
      polyfills(fs2);
      fs2.gracefulify = patch;
      fs2.createReadStream = createReadStream;
      fs2.createWriteStream = createWriteStream;
      var fs$readFile = fs2.readFile;
      fs2.readFile = readFile;
      function readFile(path2, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$readFile(path2, options, cb);
        function go$readFile(path3, options2, cb2, startTime) {
          return fs$readFile(path3, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$readFile, [path3, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$writeFile = fs2.writeFile;
      fs2.writeFile = writeFile;
      function writeFile(path2, data, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$writeFile(path2, data, options, cb);
        function go$writeFile(path3, data2, options2, cb2, startTime) {
          return fs$writeFile(path3, data2, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$writeFile, [path3, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$appendFile = fs2.appendFile;
      if (fs$appendFile)
        fs2.appendFile = appendFile;
      function appendFile(path2, data, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$appendFile(path2, data, options, cb);
        function go$appendFile(path3, data2, options2, cb2, startTime) {
          return fs$appendFile(path3, data2, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$appendFile, [path3, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$copyFile = fs2.copyFile;
      if (fs$copyFile)
        fs2.copyFile = copyFile;
      function copyFile(src, dest, flags, cb) {
        if (typeof flags === "function") {
          cb = flags;
          flags = 0;
        }
        return go$copyFile(src, dest, flags, cb);
        function go$copyFile(src2, dest2, flags2, cb2, startTime) {
          return fs$copyFile(src2, dest2, flags2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$copyFile, [src2, dest2, flags2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$readdir = fs2.readdir;
      fs2.readdir = readdir;
      var noReaddirOptionVersions = /^v[0-5]\./;
      function readdir(path2, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        var go$readdir = noReaddirOptionVersions.test(process.version) ? function go$readdir2(path3, options2, cb2, startTime) {
          return fs$readdir(path3, fs$readdirCallback(
            path3,
            options2,
            cb2,
            startTime
          ));
        } : function go$readdir2(path3, options2, cb2, startTime) {
          return fs$readdir(path3, options2, fs$readdirCallback(
            path3,
            options2,
            cb2,
            startTime
          ));
        };
        return go$readdir(path2, options, cb);
        function fs$readdirCallback(path3, options2, cb2, startTime) {
          return function(err, files) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([
                go$readdir,
                [path3, options2, cb2],
                err,
                startTime || Date.now(),
                Date.now()
              ]);
            else {
              if (files && files.sort)
                files.sort();
              if (typeof cb2 === "function")
                cb2.call(this, err, files);
            }
          };
        }
      }
      if (process.version.substr(0, 4) === "v0.8") {
        var legStreams = legacy(fs2);
        ReadStream = legStreams.ReadStream;
        WriteStream = legStreams.WriteStream;
      }
      var fs$ReadStream = fs2.ReadStream;
      if (fs$ReadStream) {
        ReadStream.prototype = Object.create(fs$ReadStream.prototype);
        ReadStream.prototype.open = ReadStream$open;
      }
      var fs$WriteStream = fs2.WriteStream;
      if (fs$WriteStream) {
        WriteStream.prototype = Object.create(fs$WriteStream.prototype);
        WriteStream.prototype.open = WriteStream$open;
      }
      Object.defineProperty(fs2, "ReadStream", {
        get: function() {
          return ReadStream;
        },
        set: function(val) {
          ReadStream = val;
        },
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(fs2, "WriteStream", {
        get: function() {
          return WriteStream;
        },
        set: function(val) {
          WriteStream = val;
        },
        enumerable: true,
        configurable: true
      });
      var FileReadStream = ReadStream;
      Object.defineProperty(fs2, "FileReadStream", {
        get: function() {
          return FileReadStream;
        },
        set: function(val) {
          FileReadStream = val;
        },
        enumerable: true,
        configurable: true
      });
      var FileWriteStream = WriteStream;
      Object.defineProperty(fs2, "FileWriteStream", {
        get: function() {
          return FileWriteStream;
        },
        set: function(val) {
          FileWriteStream = val;
        },
        enumerable: true,
        configurable: true
      });
      function ReadStream(path2, options) {
        if (this instanceof ReadStream)
          return fs$ReadStream.apply(this, arguments), this;
        else
          return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
      }
      function ReadStream$open() {
        var that = this;
        open(that.path, that.flags, that.mode, function(err, fd) {
          if (err) {
            if (that.autoClose)
              that.destroy();
            that.emit("error", err);
          } else {
            that.fd = fd;
            that.emit("open", fd);
            that.read();
          }
        });
      }
      function WriteStream(path2, options) {
        if (this instanceof WriteStream)
          return fs$WriteStream.apply(this, arguments), this;
        else
          return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
      }
      function WriteStream$open() {
        var that = this;
        open(that.path, that.flags, that.mode, function(err, fd) {
          if (err) {
            that.destroy();
            that.emit("error", err);
          } else {
            that.fd = fd;
            that.emit("open", fd);
          }
        });
      }
      function createReadStream(path2, options) {
        return new fs2.ReadStream(path2, options);
      }
      function createWriteStream(path2, options) {
        return new fs2.WriteStream(path2, options);
      }
      var fs$open = fs2.open;
      fs2.open = open;
      function open(path2, flags, mode, cb) {
        if (typeof mode === "function")
          cb = mode, mode = null;
        return go$open(path2, flags, mode, cb);
        function go$open(path3, flags2, mode2, cb2, startTime) {
          return fs$open(path3, flags2, mode2, function(err, fd) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$open, [path3, flags2, mode2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      return fs2;
    }
    function enqueue(elem) {
      debug("ENQUEUE", elem[0].name, elem[1]);
      fs[gracefulQueue].push(elem);
      retry();
    }
    var retryTimer;
    function resetQueue() {
      var now = Date.now();
      for (var i = 0; i < fs[gracefulQueue].length; ++i) {
        if (fs[gracefulQueue][i].length > 2) {
          fs[gracefulQueue][i][3] = now;
          fs[gracefulQueue][i][4] = now;
        }
      }
      retry();
    }
    function retry() {
      clearTimeout(retryTimer);
      retryTimer = void 0;
      if (fs[gracefulQueue].length === 0)
        return;
      var elem = fs[gracefulQueue].shift();
      var fn = elem[0];
      var args = elem[1];
      var err = elem[2];
      var startTime = elem[3];
      var lastTime = elem[4];
      if (startTime === void 0) {
        debug("RETRY", fn.name, args);
        fn.apply(null, args);
      } else if (Date.now() - startTime >= 6e4) {
        debug("TIMEOUT", fn.name, args);
        var cb = args.pop();
        if (typeof cb === "function")
          cb.call(null, err);
      } else {
        var sinceAttempt = Date.now() - lastTime;
        var sinceStart = Math.max(lastTime - startTime, 1);
        var desiredDelay = Math.min(sinceStart * 1.2, 100);
        if (sinceAttempt >= desiredDelay) {
          debug("RETRY", fn.name, args);
          fn.apply(null, args.concat([startTime]));
        } else {
          fs[gracefulQueue].push(elem);
        }
      }
      if (retryTimer === void 0) {
        retryTimer = setTimeout(retry, 0);
      }
    }
  }
});

// node_modules/fs-extra/lib/fs/index.js
var require_fs = __commonJS({
  "node_modules/fs-extra/lib/fs/index.js"(exports2) {
    "use strict";
    var u = require_universalify().fromCallback;
    var fs = require_graceful_fs();
    var api = [
      "access",
      "appendFile",
      "chmod",
      "chown",
      "close",
      "copyFile",
      "fchmod",
      "fchown",
      "fdatasync",
      "fstat",
      "fsync",
      "ftruncate",
      "futimes",
      "lchmod",
      "lchown",
      "link",
      "lstat",
      "mkdir",
      "mkdtemp",
      "open",
      "opendir",
      "readdir",
      "readFile",
      "readlink",
      "realpath",
      "rename",
      "rm",
      "rmdir",
      "stat",
      "symlink",
      "truncate",
      "unlink",
      "utimes",
      "writeFile"
    ].filter((key) => {
      return typeof fs[key] === "function";
    });
    Object.assign(exports2, fs);
    api.forEach((method) => {
      exports2[method] = u(fs[method]);
    });
    exports2.exists = function(filename, callback) {
      if (typeof callback === "function") {
        return fs.exists(filename, callback);
      }
      return new Promise((resolve) => {
        return fs.exists(filename, resolve);
      });
    };
    exports2.read = function(fd, buffer, offset, length, position, callback) {
      if (typeof callback === "function") {
        return fs.read(fd, buffer, offset, length, position, callback);
      }
      return new Promise((resolve, reject) => {
        fs.read(fd, buffer, offset, length, position, (err, bytesRead, buffer2) => {
          if (err) return reject(err);
          resolve({ bytesRead, buffer: buffer2 });
        });
      });
    };
    exports2.write = function(fd, buffer, ...args) {
      if (typeof args[args.length - 1] === "function") {
        return fs.write(fd, buffer, ...args);
      }
      return new Promise((resolve, reject) => {
        fs.write(fd, buffer, ...args, (err, bytesWritten, buffer2) => {
          if (err) return reject(err);
          resolve({ bytesWritten, buffer: buffer2 });
        });
      });
    };
    exports2.readv = function(fd, buffers, ...args) {
      if (typeof args[args.length - 1] === "function") {
        return fs.readv(fd, buffers, ...args);
      }
      return new Promise((resolve, reject) => {
        fs.readv(fd, buffers, ...args, (err, bytesRead, buffers2) => {
          if (err) return reject(err);
          resolve({ bytesRead, buffers: buffers2 });
        });
      });
    };
    exports2.writev = function(fd, buffers, ...args) {
      if (typeof args[args.length - 1] === "function") {
        return fs.writev(fd, buffers, ...args);
      }
      return new Promise((resolve, reject) => {
        fs.writev(fd, buffers, ...args, (err, bytesWritten, buffers2) => {
          if (err) return reject(err);
          resolve({ bytesWritten, buffers: buffers2 });
        });
      });
    };
    if (typeof fs.realpath.native === "function") {
      exports2.realpath.native = u(fs.realpath.native);
    } else {
      process.emitWarning(
        "fs.realpath.native is not a function. Is fs being monkey-patched?",
        "Warning",
        "fs-extra-WARN0003"
      );
    }
  }
});

// node_modules/fs-extra/lib/mkdirs/utils.js
var require_utils = __commonJS({
  "node_modules/fs-extra/lib/mkdirs/utils.js"(exports2, module2) {
    "use strict";
    var path2 = require("path");
    module2.exports.checkPath = function checkPath(pth) {
      if (process.platform === "win32") {
        const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path2.parse(pth).root, ""));
        if (pathHasInvalidWinCharacters) {
          const error = new Error(`Path contains invalid characters: ${pth}`);
          error.code = "EINVAL";
          throw error;
        }
      }
    };
  }
});

// node_modules/fs-extra/lib/mkdirs/make-dir.js
var require_make_dir = __commonJS({
  "node_modules/fs-extra/lib/mkdirs/make-dir.js"(exports2, module2) {
    "use strict";
    var fs = require_fs();
    var { checkPath } = require_utils();
    var getMode = (options) => {
      const defaults = { mode: 511 };
      if (typeof options === "number") return options;
      return { ...defaults, ...options }.mode;
    };
    module2.exports.makeDir = async (dir, options) => {
      checkPath(dir);
      return fs.mkdir(dir, {
        mode: getMode(options),
        recursive: true
      });
    };
    module2.exports.makeDirSync = (dir, options) => {
      checkPath(dir);
      return fs.mkdirSync(dir, {
        mode: getMode(options),
        recursive: true
      });
    };
  }
});

// node_modules/fs-extra/lib/mkdirs/index.js
var require_mkdirs = __commonJS({
  "node_modules/fs-extra/lib/mkdirs/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var { makeDir: _makeDir, makeDirSync } = require_make_dir();
    var makeDir = u(_makeDir);
    module2.exports = {
      mkdirs: makeDir,
      mkdirsSync: makeDirSync,
      // alias
      mkdirp: makeDir,
      mkdirpSync: makeDirSync,
      ensureDir: makeDir,
      ensureDirSync: makeDirSync
    };
  }
});

// node_modules/fs-extra/lib/path-exists/index.js
var require_path_exists = __commonJS({
  "node_modules/fs-extra/lib/path-exists/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var fs = require_fs();
    function pathExists(path2) {
      return fs.access(path2).then(() => true).catch(() => false);
    }
    module2.exports = {
      pathExists: u(pathExists),
      pathExistsSync: fs.existsSync
    };
  }
});

// node_modules/fs-extra/lib/util/utimes.js
var require_utimes = __commonJS({
  "node_modules/fs-extra/lib/util/utimes.js"(exports2, module2) {
    "use strict";
    var fs = require_fs();
    var u = require_universalify().fromPromise;
    async function utimesMillis(path2, atime, mtime) {
      const fd = await fs.open(path2, "r+");
      let closeErr = null;
      try {
        await fs.futimes(fd, atime, mtime);
      } finally {
        try {
          await fs.close(fd);
        } catch (e) {
          closeErr = e;
        }
      }
      if (closeErr) {
        throw closeErr;
      }
    }
    function utimesMillisSync(path2, atime, mtime) {
      const fd = fs.openSync(path2, "r+");
      fs.futimesSync(fd, atime, mtime);
      return fs.closeSync(fd);
    }
    module2.exports = {
      utimesMillis: u(utimesMillis),
      utimesMillisSync
    };
  }
});

// node_modules/fs-extra/lib/util/stat.js
var require_stat = __commonJS({
  "node_modules/fs-extra/lib/util/stat.js"(exports2, module2) {
    "use strict";
    var fs = require_fs();
    var path2 = require("path");
    var u = require_universalify().fromPromise;
    function getStats(src, dest, opts) {
      const statFunc = opts.dereference ? (file) => fs.stat(file, { bigint: true }) : (file) => fs.lstat(file, { bigint: true });
      return Promise.all([
        statFunc(src),
        statFunc(dest).catch((err) => {
          if (err.code === "ENOENT") return null;
          throw err;
        })
      ]).then(([srcStat, destStat]) => ({ srcStat, destStat }));
    }
    function getStatsSync(src, dest, opts) {
      let destStat;
      const statFunc = opts.dereference ? (file) => fs.statSync(file, { bigint: true }) : (file) => fs.lstatSync(file, { bigint: true });
      const srcStat = statFunc(src);
      try {
        destStat = statFunc(dest);
      } catch (err) {
        if (err.code === "ENOENT") return { srcStat, destStat: null };
        throw err;
      }
      return { srcStat, destStat };
    }
    async function checkPaths(src, dest, funcName, opts) {
      const { srcStat, destStat } = await getStats(src, dest, opts);
      if (destStat) {
        if (areIdentical(srcStat, destStat)) {
          const srcBaseName = path2.basename(src);
          const destBaseName = path2.basename(dest);
          if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
            return { srcStat, destStat, isChangingCase: true };
          }
          throw new Error("Source and destination must not be the same.");
        }
        if (srcStat.isDirectory() && !destStat.isDirectory()) {
          throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
        }
        if (!srcStat.isDirectory() && destStat.isDirectory()) {
          throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`);
        }
      }
      if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
        throw new Error(errMsg(src, dest, funcName));
      }
      return { srcStat, destStat };
    }
    function checkPathsSync(src, dest, funcName, opts) {
      const { srcStat, destStat } = getStatsSync(src, dest, opts);
      if (destStat) {
        if (areIdentical(srcStat, destStat)) {
          const srcBaseName = path2.basename(src);
          const destBaseName = path2.basename(dest);
          if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
            return { srcStat, destStat, isChangingCase: true };
          }
          throw new Error("Source and destination must not be the same.");
        }
        if (srcStat.isDirectory() && !destStat.isDirectory()) {
          throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
        }
        if (!srcStat.isDirectory() && destStat.isDirectory()) {
          throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`);
        }
      }
      if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
        throw new Error(errMsg(src, dest, funcName));
      }
      return { srcStat, destStat };
    }
    async function checkParentPaths(src, srcStat, dest, funcName) {
      const srcParent = path2.resolve(path2.dirname(src));
      const destParent = path2.resolve(path2.dirname(dest));
      if (destParent === srcParent || destParent === path2.parse(destParent).root) return;
      let destStat;
      try {
        destStat = await fs.stat(destParent, { bigint: true });
      } catch (err) {
        if (err.code === "ENOENT") return;
        throw err;
      }
      if (areIdentical(srcStat, destStat)) {
        throw new Error(errMsg(src, dest, funcName));
      }
      return checkParentPaths(src, srcStat, destParent, funcName);
    }
    function checkParentPathsSync(src, srcStat, dest, funcName) {
      const srcParent = path2.resolve(path2.dirname(src));
      const destParent = path2.resolve(path2.dirname(dest));
      if (destParent === srcParent || destParent === path2.parse(destParent).root) return;
      let destStat;
      try {
        destStat = fs.statSync(destParent, { bigint: true });
      } catch (err) {
        if (err.code === "ENOENT") return;
        throw err;
      }
      if (areIdentical(srcStat, destStat)) {
        throw new Error(errMsg(src, dest, funcName));
      }
      return checkParentPathsSync(src, srcStat, destParent, funcName);
    }
    function areIdentical(srcStat, destStat) {
      return destStat.ino && destStat.dev && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev;
    }
    function isSrcSubdir(src, dest) {
      const srcArr = path2.resolve(src).split(path2.sep).filter((i) => i);
      const destArr = path2.resolve(dest).split(path2.sep).filter((i) => i);
      return srcArr.every((cur, i) => destArr[i] === cur);
    }
    function errMsg(src, dest, funcName) {
      return `Cannot ${funcName} '${src}' to a subdirectory of itself, '${dest}'.`;
    }
    module2.exports = {
      // checkPaths
      checkPaths: u(checkPaths),
      checkPathsSync,
      // checkParent
      checkParentPaths: u(checkParentPaths),
      checkParentPathsSync,
      // Misc
      isSrcSubdir,
      areIdentical
    };
  }
});

// node_modules/fs-extra/lib/copy/copy.js
var require_copy = __commonJS({
  "node_modules/fs-extra/lib/copy/copy.js"(exports2, module2) {
    "use strict";
    var fs = require_fs();
    var path2 = require("path");
    var { mkdirs } = require_mkdirs();
    var { pathExists } = require_path_exists();
    var { utimesMillis } = require_utimes();
    var stat = require_stat();
    async function copy(src, dest, opts = {}) {
      if (typeof opts === "function") {
        opts = { filter: opts };
      }
      opts.clobber = "clobber" in opts ? !!opts.clobber : true;
      opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
      if (opts.preserveTimestamps && process.arch === "ia32") {
        process.emitWarning(
          "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269",
          "Warning",
          "fs-extra-WARN0001"
        );
      }
      const { srcStat, destStat } = await stat.checkPaths(src, dest, "copy", opts);
      await stat.checkParentPaths(src, srcStat, dest, "copy");
      const include = await runFilter(src, dest, opts);
      if (!include) return;
      const destParent = path2.dirname(dest);
      const dirExists = await pathExists(destParent);
      if (!dirExists) {
        await mkdirs(destParent);
      }
      await getStatsAndPerformCopy(destStat, src, dest, opts);
    }
    async function runFilter(src, dest, opts) {
      if (!opts.filter) return true;
      return opts.filter(src, dest);
    }
    async function getStatsAndPerformCopy(destStat, src, dest, opts) {
      const statFn = opts.dereference ? fs.stat : fs.lstat;
      const srcStat = await statFn(src);
      if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts);
      if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts);
      if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts);
      if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`);
      if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`);
      throw new Error(`Unknown file: ${src}`);
    }
    async function onFile(srcStat, destStat, src, dest, opts) {
      if (!destStat) return copyFile(srcStat, src, dest, opts);
      if (opts.overwrite) {
        await fs.unlink(dest);
        return copyFile(srcStat, src, dest, opts);
      }
      if (opts.errorOnExist) {
        throw new Error(`'${dest}' already exists`);
      }
    }
    async function copyFile(srcStat, src, dest, opts) {
      await fs.copyFile(src, dest);
      if (opts.preserveTimestamps) {
        if (fileIsNotWritable(srcStat.mode)) {
          await makeFileWritable(dest, srcStat.mode);
        }
        const updatedSrcStat = await fs.stat(src);
        await utimesMillis(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
      }
      return fs.chmod(dest, srcStat.mode);
    }
    function fileIsNotWritable(srcMode) {
      return (srcMode & 128) === 0;
    }
    function makeFileWritable(dest, srcMode) {
      return fs.chmod(dest, srcMode | 128);
    }
    async function onDir(srcStat, destStat, src, dest, opts) {
      if (!destStat) {
        await fs.mkdir(dest);
      }
      const items = await fs.readdir(src);
      await Promise.all(items.map(async (item) => {
        const srcItem = path2.join(src, item);
        const destItem = path2.join(dest, item);
        const include = await runFilter(srcItem, destItem, opts);
        if (!include) return;
        const { destStat: destStat2 } = await stat.checkPaths(srcItem, destItem, "copy", opts);
        return getStatsAndPerformCopy(destStat2, srcItem, destItem, opts);
      }));
      if (!destStat) {
        await fs.chmod(dest, srcStat.mode);
      }
    }
    async function onLink(destStat, src, dest, opts) {
      let resolvedSrc = await fs.readlink(src);
      if (opts.dereference) {
        resolvedSrc = path2.resolve(process.cwd(), resolvedSrc);
      }
      if (!destStat) {
        return fs.symlink(resolvedSrc, dest);
      }
      let resolvedDest = null;
      try {
        resolvedDest = await fs.readlink(dest);
      } catch (e) {
        if (e.code === "EINVAL" || e.code === "UNKNOWN") return fs.symlink(resolvedSrc, dest);
        throw e;
      }
      if (opts.dereference) {
        resolvedDest = path2.resolve(process.cwd(), resolvedDest);
      }
      if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
        throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
      }
      if (stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
        throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
      }
      await fs.unlink(dest);
      return fs.symlink(resolvedSrc, dest);
    }
    module2.exports = copy;
  }
});

// node_modules/fs-extra/lib/copy/copy-sync.js
var require_copy_sync = __commonJS({
  "node_modules/fs-extra/lib/copy/copy-sync.js"(exports2, module2) {
    "use strict";
    var fs = require_graceful_fs();
    var path2 = require("path");
    var mkdirsSync = require_mkdirs().mkdirsSync;
    var utimesMillisSync = require_utimes().utimesMillisSync;
    var stat = require_stat();
    function copySync(src, dest, opts) {
      if (typeof opts === "function") {
        opts = { filter: opts };
      }
      opts = opts || {};
      opts.clobber = "clobber" in opts ? !!opts.clobber : true;
      opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
      if (opts.preserveTimestamps && process.arch === "ia32") {
        process.emitWarning(
          "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269",
          "Warning",
          "fs-extra-WARN0002"
        );
      }
      const { srcStat, destStat } = stat.checkPathsSync(src, dest, "copy", opts);
      stat.checkParentPathsSync(src, srcStat, dest, "copy");
      if (opts.filter && !opts.filter(src, dest)) return;
      const destParent = path2.dirname(dest);
      if (!fs.existsSync(destParent)) mkdirsSync(destParent);
      return getStats(destStat, src, dest, opts);
    }
    function getStats(destStat, src, dest, opts) {
      const statSync = opts.dereference ? fs.statSync : fs.lstatSync;
      const srcStat = statSync(src);
      if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts);
      else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts);
      else if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts);
      else if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`);
      else if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`);
      throw new Error(`Unknown file: ${src}`);
    }
    function onFile(srcStat, destStat, src, dest, opts) {
      if (!destStat) return copyFile(srcStat, src, dest, opts);
      return mayCopyFile(srcStat, src, dest, opts);
    }
    function mayCopyFile(srcStat, src, dest, opts) {
      if (opts.overwrite) {
        fs.unlinkSync(dest);
        return copyFile(srcStat, src, dest, opts);
      } else if (opts.errorOnExist) {
        throw new Error(`'${dest}' already exists`);
      }
    }
    function copyFile(srcStat, src, dest, opts) {
      fs.copyFileSync(src, dest);
      if (opts.preserveTimestamps) handleTimestamps(srcStat.mode, src, dest);
      return setDestMode(dest, srcStat.mode);
    }
    function handleTimestamps(srcMode, src, dest) {
      if (fileIsNotWritable(srcMode)) makeFileWritable(dest, srcMode);
      return setDestTimestamps(src, dest);
    }
    function fileIsNotWritable(srcMode) {
      return (srcMode & 128) === 0;
    }
    function makeFileWritable(dest, srcMode) {
      return setDestMode(dest, srcMode | 128);
    }
    function setDestMode(dest, srcMode) {
      return fs.chmodSync(dest, srcMode);
    }
    function setDestTimestamps(src, dest) {
      const updatedSrcStat = fs.statSync(src);
      return utimesMillisSync(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
    }
    function onDir(srcStat, destStat, src, dest, opts) {
      if (!destStat) return mkDirAndCopy(srcStat.mode, src, dest, opts);
      return copyDir(src, dest, opts);
    }
    function mkDirAndCopy(srcMode, src, dest, opts) {
      fs.mkdirSync(dest);
      copyDir(src, dest, opts);
      return setDestMode(dest, srcMode);
    }
    function copyDir(src, dest, opts) {
      fs.readdirSync(src).forEach((item) => copyDirItem(item, src, dest, opts));
    }
    function copyDirItem(item, src, dest, opts) {
      const srcItem = path2.join(src, item);
      const destItem = path2.join(dest, item);
      if (opts.filter && !opts.filter(srcItem, destItem)) return;
      const { destStat } = stat.checkPathsSync(srcItem, destItem, "copy", opts);
      return getStats(destStat, srcItem, destItem, opts);
    }
    function onLink(destStat, src, dest, opts) {
      let resolvedSrc = fs.readlinkSync(src);
      if (opts.dereference) {
        resolvedSrc = path2.resolve(process.cwd(), resolvedSrc);
      }
      if (!destStat) {
        return fs.symlinkSync(resolvedSrc, dest);
      } else {
        let resolvedDest;
        try {
          resolvedDest = fs.readlinkSync(dest);
        } catch (err) {
          if (err.code === "EINVAL" || err.code === "UNKNOWN") return fs.symlinkSync(resolvedSrc, dest);
          throw err;
        }
        if (opts.dereference) {
          resolvedDest = path2.resolve(process.cwd(), resolvedDest);
        }
        if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
          throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
        }
        if (stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
          throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
        }
        return copyLink(resolvedSrc, dest);
      }
    }
    function copyLink(resolvedSrc, dest) {
      fs.unlinkSync(dest);
      return fs.symlinkSync(resolvedSrc, dest);
    }
    module2.exports = copySync;
  }
});

// node_modules/fs-extra/lib/copy/index.js
var require_copy2 = __commonJS({
  "node_modules/fs-extra/lib/copy/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    module2.exports = {
      copy: u(require_copy()),
      copySync: require_copy_sync()
    };
  }
});

// node_modules/fs-extra/lib/remove/index.js
var require_remove = __commonJS({
  "node_modules/fs-extra/lib/remove/index.js"(exports2, module2) {
    "use strict";
    var fs = require_graceful_fs();
    var u = require_universalify().fromCallback;
    function remove(path2, callback) {
      fs.rm(path2, { recursive: true, force: true }, callback);
    }
    function removeSync(path2) {
      fs.rmSync(path2, { recursive: true, force: true });
    }
    module2.exports = {
      remove: u(remove),
      removeSync
    };
  }
});

// node_modules/fs-extra/lib/empty/index.js
var require_empty = __commonJS({
  "node_modules/fs-extra/lib/empty/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var fs = require_fs();
    var path2 = require("path");
    var mkdir = require_mkdirs();
    var remove = require_remove();
    var emptyDir = u(async function emptyDir2(dir) {
      let items;
      try {
        items = await fs.readdir(dir);
      } catch {
        return mkdir.mkdirs(dir);
      }
      return Promise.all(items.map((item) => remove.remove(path2.join(dir, item))));
    });
    function emptyDirSync(dir) {
      let items;
      try {
        items = fs.readdirSync(dir);
      } catch {
        return mkdir.mkdirsSync(dir);
      }
      items.forEach((item) => {
        item = path2.join(dir, item);
        remove.removeSync(item);
      });
    }
    module2.exports = {
      emptyDirSync,
      emptydirSync: emptyDirSync,
      emptyDir,
      emptydir: emptyDir
    };
  }
});

// node_modules/fs-extra/lib/ensure/file.js
var require_file = __commonJS({
  "node_modules/fs-extra/lib/ensure/file.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var path2 = require("path");
    var fs = require_fs();
    var mkdir = require_mkdirs();
    async function createFile(file) {
      let stats;
      try {
        stats = await fs.stat(file);
      } catch {
      }
      if (stats && stats.isFile()) return;
      const dir = path2.dirname(file);
      let dirStats = null;
      try {
        dirStats = await fs.stat(dir);
      } catch (err) {
        if (err.code === "ENOENT") {
          await mkdir.mkdirs(dir);
          await fs.writeFile(file, "");
          return;
        } else {
          throw err;
        }
      }
      if (dirStats.isDirectory()) {
        await fs.writeFile(file, "");
      } else {
        await fs.readdir(dir);
      }
    }
    function createFileSync(file) {
      let stats;
      try {
        stats = fs.statSync(file);
      } catch {
      }
      if (stats && stats.isFile()) return;
      const dir = path2.dirname(file);
      try {
        if (!fs.statSync(dir).isDirectory()) {
          fs.readdirSync(dir);
        }
      } catch (err) {
        if (err && err.code === "ENOENT") mkdir.mkdirsSync(dir);
        else throw err;
      }
      fs.writeFileSync(file, "");
    }
    module2.exports = {
      createFile: u(createFile),
      createFileSync
    };
  }
});

// node_modules/fs-extra/lib/ensure/link.js
var require_link = __commonJS({
  "node_modules/fs-extra/lib/ensure/link.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var path2 = require("path");
    var fs = require_fs();
    var mkdir = require_mkdirs();
    var { pathExists } = require_path_exists();
    var { areIdentical } = require_stat();
    async function createLink(srcpath, dstpath) {
      let dstStat;
      try {
        dstStat = await fs.lstat(dstpath);
      } catch {
      }
      let srcStat;
      try {
        srcStat = await fs.lstat(srcpath);
      } catch (err) {
        err.message = err.message.replace("lstat", "ensureLink");
        throw err;
      }
      if (dstStat && areIdentical(srcStat, dstStat)) return;
      const dir = path2.dirname(dstpath);
      const dirExists = await pathExists(dir);
      if (!dirExists) {
        await mkdir.mkdirs(dir);
      }
      await fs.link(srcpath, dstpath);
    }
    function createLinkSync(srcpath, dstpath) {
      let dstStat;
      try {
        dstStat = fs.lstatSync(dstpath);
      } catch {
      }
      try {
        const srcStat = fs.lstatSync(srcpath);
        if (dstStat && areIdentical(srcStat, dstStat)) return;
      } catch (err) {
        err.message = err.message.replace("lstat", "ensureLink");
        throw err;
      }
      const dir = path2.dirname(dstpath);
      const dirExists = fs.existsSync(dir);
      if (dirExists) return fs.linkSync(srcpath, dstpath);
      mkdir.mkdirsSync(dir);
      return fs.linkSync(srcpath, dstpath);
    }
    module2.exports = {
      createLink: u(createLink),
      createLinkSync
    };
  }
});

// node_modules/fs-extra/lib/ensure/symlink-paths.js
var require_symlink_paths = __commonJS({
  "node_modules/fs-extra/lib/ensure/symlink-paths.js"(exports2, module2) {
    "use strict";
    var path2 = require("path");
    var fs = require_fs();
    var { pathExists } = require_path_exists();
    var u = require_universalify().fromPromise;
    async function symlinkPaths(srcpath, dstpath) {
      if (path2.isAbsolute(srcpath)) {
        try {
          await fs.lstat(srcpath);
        } catch (err) {
          err.message = err.message.replace("lstat", "ensureSymlink");
          throw err;
        }
        return {
          toCwd: srcpath,
          toDst: srcpath
        };
      }
      const dstdir = path2.dirname(dstpath);
      const relativeToDst = path2.join(dstdir, srcpath);
      const exists = await pathExists(relativeToDst);
      if (exists) {
        return {
          toCwd: relativeToDst,
          toDst: srcpath
        };
      }
      try {
        await fs.lstat(srcpath);
      } catch (err) {
        err.message = err.message.replace("lstat", "ensureSymlink");
        throw err;
      }
      return {
        toCwd: srcpath,
        toDst: path2.relative(dstdir, srcpath)
      };
    }
    function symlinkPathsSync(srcpath, dstpath) {
      if (path2.isAbsolute(srcpath)) {
        const exists2 = fs.existsSync(srcpath);
        if (!exists2) throw new Error("absolute srcpath does not exist");
        return {
          toCwd: srcpath,
          toDst: srcpath
        };
      }
      const dstdir = path2.dirname(dstpath);
      const relativeToDst = path2.join(dstdir, srcpath);
      const exists = fs.existsSync(relativeToDst);
      if (exists) {
        return {
          toCwd: relativeToDst,
          toDst: srcpath
        };
      }
      const srcExists = fs.existsSync(srcpath);
      if (!srcExists) throw new Error("relative srcpath does not exist");
      return {
        toCwd: srcpath,
        toDst: path2.relative(dstdir, srcpath)
      };
    }
    module2.exports = {
      symlinkPaths: u(symlinkPaths),
      symlinkPathsSync
    };
  }
});

// node_modules/fs-extra/lib/ensure/symlink-type.js
var require_symlink_type = __commonJS({
  "node_modules/fs-extra/lib/ensure/symlink-type.js"(exports2, module2) {
    "use strict";
    var fs = require_fs();
    var u = require_universalify().fromPromise;
    async function symlinkType(srcpath, type) {
      if (type) return type;
      let stats;
      try {
        stats = await fs.lstat(srcpath);
      } catch {
        return "file";
      }
      return stats && stats.isDirectory() ? "dir" : "file";
    }
    function symlinkTypeSync(srcpath, type) {
      if (type) return type;
      let stats;
      try {
        stats = fs.lstatSync(srcpath);
      } catch {
        return "file";
      }
      return stats && stats.isDirectory() ? "dir" : "file";
    }
    module2.exports = {
      symlinkType: u(symlinkType),
      symlinkTypeSync
    };
  }
});

// node_modules/fs-extra/lib/ensure/symlink.js
var require_symlink = __commonJS({
  "node_modules/fs-extra/lib/ensure/symlink.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var path2 = require("path");
    var fs = require_fs();
    var { mkdirs, mkdirsSync } = require_mkdirs();
    var { symlinkPaths, symlinkPathsSync } = require_symlink_paths();
    var { symlinkType, symlinkTypeSync } = require_symlink_type();
    var { pathExists } = require_path_exists();
    var { areIdentical } = require_stat();
    async function createSymlink(srcpath, dstpath, type) {
      let stats;
      try {
        stats = await fs.lstat(dstpath);
      } catch {
      }
      if (stats && stats.isSymbolicLink()) {
        const [srcStat, dstStat] = await Promise.all([
          fs.stat(srcpath),
          fs.stat(dstpath)
        ]);
        if (areIdentical(srcStat, dstStat)) return;
      }
      const relative = await symlinkPaths(srcpath, dstpath);
      srcpath = relative.toDst;
      const toType = await symlinkType(relative.toCwd, type);
      const dir = path2.dirname(dstpath);
      if (!await pathExists(dir)) {
        await mkdirs(dir);
      }
      return fs.symlink(srcpath, dstpath, toType);
    }
    function createSymlinkSync(srcpath, dstpath, type) {
      let stats;
      try {
        stats = fs.lstatSync(dstpath);
      } catch {
      }
      if (stats && stats.isSymbolicLink()) {
        const srcStat = fs.statSync(srcpath);
        const dstStat = fs.statSync(dstpath);
        if (areIdentical(srcStat, dstStat)) return;
      }
      const relative = symlinkPathsSync(srcpath, dstpath);
      srcpath = relative.toDst;
      type = symlinkTypeSync(relative.toCwd, type);
      const dir = path2.dirname(dstpath);
      const exists = fs.existsSync(dir);
      if (exists) return fs.symlinkSync(srcpath, dstpath, type);
      mkdirsSync(dir);
      return fs.symlinkSync(srcpath, dstpath, type);
    }
    module2.exports = {
      createSymlink: u(createSymlink),
      createSymlinkSync
    };
  }
});

// node_modules/fs-extra/lib/ensure/index.js
var require_ensure = __commonJS({
  "node_modules/fs-extra/lib/ensure/index.js"(exports2, module2) {
    "use strict";
    var { createFile, createFileSync } = require_file();
    var { createLink, createLinkSync } = require_link();
    var { createSymlink, createSymlinkSync } = require_symlink();
    module2.exports = {
      // file
      createFile,
      createFileSync,
      ensureFile: createFile,
      ensureFileSync: createFileSync,
      // link
      createLink,
      createLinkSync,
      ensureLink: createLink,
      ensureLinkSync: createLinkSync,
      // symlink
      createSymlink,
      createSymlinkSync,
      ensureSymlink: createSymlink,
      ensureSymlinkSync: createSymlinkSync
    };
  }
});

// node_modules/jsonfile/utils.js
var require_utils2 = __commonJS({
  "node_modules/jsonfile/utils.js"(exports2, module2) {
    function stringify(obj, { EOL = "\n", finalEOL = true, replacer = null, spaces } = {}) {
      const EOF = finalEOL ? EOL : "";
      const str = JSON.stringify(obj, replacer, spaces);
      return str.replace(/\n/g, EOL) + EOF;
    }
    function stripBom(content) {
      if (Buffer.isBuffer(content)) content = content.toString("utf8");
      return content.replace(/^\uFEFF/, "");
    }
    module2.exports = { stringify, stripBom };
  }
});

// node_modules/jsonfile/index.js
var require_jsonfile = __commonJS({
  "node_modules/jsonfile/index.js"(exports2, module2) {
    var _fs;
    try {
      _fs = require_graceful_fs();
    } catch (_) {
      _fs = require("fs");
    }
    var universalify = require_universalify();
    var { stringify, stripBom } = require_utils2();
    async function _readFile(file, options = {}) {
      if (typeof options === "string") {
        options = { encoding: options };
      }
      const fs = options.fs || _fs;
      const shouldThrow = "throws" in options ? options.throws : true;
      let data = await universalify.fromCallback(fs.readFile)(file, options);
      data = stripBom(data);
      let obj;
      try {
        obj = JSON.parse(data, options ? options.reviver : null);
      } catch (err) {
        if (shouldThrow) {
          err.message = `${file}: ${err.message}`;
          throw err;
        } else {
          return null;
        }
      }
      return obj;
    }
    var readFile = universalify.fromPromise(_readFile);
    function readFileSync(file, options = {}) {
      if (typeof options === "string") {
        options = { encoding: options };
      }
      const fs = options.fs || _fs;
      const shouldThrow = "throws" in options ? options.throws : true;
      try {
        let content = fs.readFileSync(file, options);
        content = stripBom(content);
        return JSON.parse(content, options.reviver);
      } catch (err) {
        if (shouldThrow) {
          err.message = `${file}: ${err.message}`;
          throw err;
        } else {
          return null;
        }
      }
    }
    async function _writeFile(file, obj, options = {}) {
      const fs = options.fs || _fs;
      const str = stringify(obj, options);
      await universalify.fromCallback(fs.writeFile)(file, str, options);
    }
    var writeFile = universalify.fromPromise(_writeFile);
    function writeFileSync(file, obj, options = {}) {
      const fs = options.fs || _fs;
      const str = stringify(obj, options);
      return fs.writeFileSync(file, str, options);
    }
    var jsonfile = {
      readFile,
      readFileSync,
      writeFile,
      writeFileSync
    };
    module2.exports = jsonfile;
  }
});

// node_modules/fs-extra/lib/json/jsonfile.js
var require_jsonfile2 = __commonJS({
  "node_modules/fs-extra/lib/json/jsonfile.js"(exports2, module2) {
    "use strict";
    var jsonFile = require_jsonfile();
    module2.exports = {
      // jsonfile exports
      readJson: jsonFile.readFile,
      readJsonSync: jsonFile.readFileSync,
      writeJson: jsonFile.writeFile,
      writeJsonSync: jsonFile.writeFileSync
    };
  }
});

// node_modules/fs-extra/lib/output-file/index.js
var require_output_file = __commonJS({
  "node_modules/fs-extra/lib/output-file/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var fs = require_fs();
    var path2 = require("path");
    var mkdir = require_mkdirs();
    var pathExists = require_path_exists().pathExists;
    async function outputFile(file, data, encoding = "utf-8") {
      const dir = path2.dirname(file);
      if (!await pathExists(dir)) {
        await mkdir.mkdirs(dir);
      }
      return fs.writeFile(file, data, encoding);
    }
    function outputFileSync(file, ...args) {
      const dir = path2.dirname(file);
      if (!fs.existsSync(dir)) {
        mkdir.mkdirsSync(dir);
      }
      fs.writeFileSync(file, ...args);
    }
    module2.exports = {
      outputFile: u(outputFile),
      outputFileSync
    };
  }
});

// node_modules/fs-extra/lib/json/output-json.js
var require_output_json = __commonJS({
  "node_modules/fs-extra/lib/json/output-json.js"(exports2, module2) {
    "use strict";
    var { stringify } = require_utils2();
    var { outputFile } = require_output_file();
    async function outputJson(file, data, options = {}) {
      const str = stringify(data, options);
      await outputFile(file, str, options);
    }
    module2.exports = outputJson;
  }
});

// node_modules/fs-extra/lib/json/output-json-sync.js
var require_output_json_sync = __commonJS({
  "node_modules/fs-extra/lib/json/output-json-sync.js"(exports2, module2) {
    "use strict";
    var { stringify } = require_utils2();
    var { outputFileSync } = require_output_file();
    function outputJsonSync(file, data, options) {
      const str = stringify(data, options);
      outputFileSync(file, str, options);
    }
    module2.exports = outputJsonSync;
  }
});

// node_modules/fs-extra/lib/json/index.js
var require_json = __commonJS({
  "node_modules/fs-extra/lib/json/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var jsonFile = require_jsonfile2();
    jsonFile.outputJson = u(require_output_json());
    jsonFile.outputJsonSync = require_output_json_sync();
    jsonFile.outputJSON = jsonFile.outputJson;
    jsonFile.outputJSONSync = jsonFile.outputJsonSync;
    jsonFile.writeJSON = jsonFile.writeJson;
    jsonFile.writeJSONSync = jsonFile.writeJsonSync;
    jsonFile.readJSON = jsonFile.readJson;
    jsonFile.readJSONSync = jsonFile.readJsonSync;
    module2.exports = jsonFile;
  }
});

// node_modules/fs-extra/lib/move/move.js
var require_move = __commonJS({
  "node_modules/fs-extra/lib/move/move.js"(exports2, module2) {
    "use strict";
    var fs = require_fs();
    var path2 = require("path");
    var { copy } = require_copy2();
    var { remove } = require_remove();
    var { mkdirp } = require_mkdirs();
    var { pathExists } = require_path_exists();
    var stat = require_stat();
    async function move(src, dest, opts = {}) {
      const overwrite = opts.overwrite || opts.clobber || false;
      const { srcStat, isChangingCase = false } = await stat.checkPaths(src, dest, "move", opts);
      await stat.checkParentPaths(src, srcStat, dest, "move");
      const destParent = path2.dirname(dest);
      const parsedParentPath = path2.parse(destParent);
      if (parsedParentPath.root !== destParent) {
        await mkdirp(destParent);
      }
      return doRename(src, dest, overwrite, isChangingCase);
    }
    async function doRename(src, dest, overwrite, isChangingCase) {
      if (!isChangingCase) {
        if (overwrite) {
          await remove(dest);
        } else if (await pathExists(dest)) {
          throw new Error("dest already exists.");
        }
      }
      try {
        await fs.rename(src, dest);
      } catch (err) {
        if (err.code !== "EXDEV") {
          throw err;
        }
        await moveAcrossDevice(src, dest, overwrite);
      }
    }
    async function moveAcrossDevice(src, dest, overwrite) {
      const opts = {
        overwrite,
        errorOnExist: true,
        preserveTimestamps: true
      };
      await copy(src, dest, opts);
      return remove(src);
    }
    module2.exports = move;
  }
});

// node_modules/fs-extra/lib/move/move-sync.js
var require_move_sync = __commonJS({
  "node_modules/fs-extra/lib/move/move-sync.js"(exports2, module2) {
    "use strict";
    var fs = require_graceful_fs();
    var path2 = require("path");
    var copySync = require_copy2().copySync;
    var removeSync = require_remove().removeSync;
    var mkdirpSync = require_mkdirs().mkdirpSync;
    var stat = require_stat();
    function moveSync(src, dest, opts) {
      opts = opts || {};
      const overwrite = opts.overwrite || opts.clobber || false;
      const { srcStat, isChangingCase = false } = stat.checkPathsSync(src, dest, "move", opts);
      stat.checkParentPathsSync(src, srcStat, dest, "move");
      if (!isParentRoot(dest)) mkdirpSync(path2.dirname(dest));
      return doRename(src, dest, overwrite, isChangingCase);
    }
    function isParentRoot(dest) {
      const parent = path2.dirname(dest);
      const parsedPath = path2.parse(parent);
      return parsedPath.root === parent;
    }
    function doRename(src, dest, overwrite, isChangingCase) {
      if (isChangingCase) return rename(src, dest, overwrite);
      if (overwrite) {
        removeSync(dest);
        return rename(src, dest, overwrite);
      }
      if (fs.existsSync(dest)) throw new Error("dest already exists.");
      return rename(src, dest, overwrite);
    }
    function rename(src, dest, overwrite) {
      try {
        fs.renameSync(src, dest);
      } catch (err) {
        if (err.code !== "EXDEV") throw err;
        return moveAcrossDevice(src, dest, overwrite);
      }
    }
    function moveAcrossDevice(src, dest, overwrite) {
      const opts = {
        overwrite,
        errorOnExist: true,
        preserveTimestamps: true
      };
      copySync(src, dest, opts);
      return removeSync(src);
    }
    module2.exports = moveSync;
  }
});

// node_modules/fs-extra/lib/move/index.js
var require_move2 = __commonJS({
  "node_modules/fs-extra/lib/move/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    module2.exports = {
      move: u(require_move()),
      moveSync: require_move_sync()
    };
  }
});

// node_modules/fs-extra/lib/index.js
var require_lib = __commonJS({
  "node_modules/fs-extra/lib/index.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      // Export promiseified graceful-fs:
      ...require_fs(),
      // Export extra methods:
      ...require_copy2(),
      ...require_empty(),
      ...require_ensure(),
      ...require_json(),
      ...require_mkdirs(),
      ...require_move2(),
      ...require_output_file(),
      ...require_path_exists(),
      ...require_remove()
    };
  }
});

// src/index.tsx
var src_exports = {};
__export(src_exports, {
  default: () => src_default,
  version: () => version
});
module.exports = __toCommonJS(src_exports);
var import_api3 = require("@raycast/api");
var import_fs_extra = __toESM(require_lib());
var import_path2 = require("path");

// src/components/LocalItem.tsx
var import_api2 = require("@raycast/api");

// node_modules/tildify/index.js
var import_node_path = __toESM(require("node:path"), 1);
var import_node_os = __toESM(require("node:os"), 1);
var homeDirectory = import_node_os.default.homedir();
function tildify(absolutePath) {
  const normalizedPath = import_node_path.default.normalize(absolutePath) + import_node_path.default.sep;
  return (normalizedPath.startsWith(homeDirectory) ? normalizedPath.replace(homeDirectory + import_node_path.default.sep, `~${import_node_path.default.sep}`) : normalizedPath).slice(0, -1);
}

// src/components/LocalItem.tsx
var import_path = require("path");

// src/preference.ts
var import_api = require("@raycast/api");
var preferences = (0, import_api.getPreferenceValues)();
function getBundleIdentifier() {
  switch (preferences.build) {
    case "Code" /* Code */:
      return "com.microsoft.VSCode";
    case "Code - Insiders" /* Insiders */:
      return "com.microsoft.VSCodeInsiders";
    case "VSCodium" /* VSCodium */:
      return "com.vscodium";
    case "VSCodium < 1.71" /* VSCodiumMinor */:
      return "com.visualstudio.code.oss";
    case "WebStorm" /* WebStorm */:
      return "com.jetbrains.WebStorm";
  }
}
var build = preferences.build;
var bundleIdentifier = getBundleIdentifier();
var workspacePath = preferences.workspacePath;

// src/components/LocalItem.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function LocalItem({ project }) {
  const projectArrs = project.split("/");
  const name = projectArrs[projectArrs.length - 1];
  const prettyPath = tildify(project);
  const subtitle = (0, import_path.dirname)(prettyPath);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_api2.List.Item,
    {
      title: name,
      subtitle,
      icon: { fileIcon: project },
      keywords: [name],
      actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_api2.ActionPanel, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_api2.ActionPanel.Section, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_api2.Action.Open,
            {
              title: `Open in ${build}`,
              icon: "action-icon.png",
              target: project,
              application: bundleIdentifier
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api2.Action.ShowInFinder, { path: project }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api2.Action.OpenWith, { path: project, shortcut: { modifiers: ["cmd"], key: "o" } })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_api2.ActionPanel.Section, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api2.Action.CopyToClipboard, { title: "Copy Name", content: name, shortcut: { modifiers: ["cmd"], key: "." } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_api2.Action.CopyToClipboard,
            {
              title: "Copy Path",
              content: prettyPath,
              shortcut: { modifiers: ["cmd", "shift"], key: "." }
            }
          )
        ] })
      ] })
    }
  );
}

// package.json
var package_default = {
  $schema: "https://www.raycast.com/schemas/extension.json",
  name: "visual-studio-code-workspace-manager",
  title: "Visual Studio Code Workspace Manager",
  description: "Quickly open your workspace project!",
  icon: "command-icon.png",
  author: "jeasonnow",
  owner: "santree",
  categories: [
    "Developer Tools"
  ],
  license: "MIT",
  commands: [
    {
      name: "index",
      title: "Visual Studio Code Workspace Manager",
      subtitle: "VSCode Workspace Manager",
      description: "Quickly open your workspace project!",
      mode: "view"
    }
  ],
  preferences: [
    {
      name: "workspacePath",
      type: "textfield",
      required: true,
      default: "",
      title: "Path of your workspce",
      description: "The project space folder you use to store all your projects"
    },
    {
      name: "build",
      type: "dropdown",
      required: false,
      title: "Build",
      default: "Code",
      description: "Select which build of Visual Studio Code to use",
      data: [
        {
          value: "Code",
          title: "Visual Studio Code"
        },
        {
          value: "Code - Insiders",
          title: "Visual Studio Code - Insiders"
        },
        {
          value: "VSCodium",
          title: "VSCodium"
        },
        {
          value: "VSCodium < 1.71",
          title: "VSCodium < 1.71"
        }
      ]
    }
  ],
  dependencies: {
    "@raycast/api": "^1.57.2",
    "fs-extra": "^11.1.1",
    tildify: "^3.0.0"
  },
  devDependencies: {
    "@raycast/eslint-config": "1.0.5",
    "@types/fs-extra": "^11.0.1",
    "@types/jsonfile": "^6.1.1",
    "@types/node": "18.8.3",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    eslint: "^7.32.0",
    prettier: "^2.5.1",
    typescript: "^4.4.3"
  },
  scripts: {
    build: "ray build -o dist",
    dev: "ray develop",
    "fix-lint": "ray lint --fix",
    lint: "ray lint",
    publish: "npx @raycast/api@latest publish"
  },
  version: "1.0.0"
};

// src/index.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var version = package_default.version;
function VisualStudioCodeWorkspaceManager() {
  const WORKSPACE_DIR = workspacePath;
  const directoryFilter = (filename) => {
    return (0, import_fs_extra.lstatSync)((0, import_path2.join)(WORKSPACE_DIR, filename)).isDirectory();
  };
  const dirs = (0, import_fs_extra.readdirSync)((0, import_path2.join)(WORKSPACE_DIR)).filter(directoryFilter);
  const projects = dirs.map((item) => (0, import_path2.join)(WORKSPACE_DIR, item));
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_api3.List, { searchBarPlaceholder: "Search Project Name...", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_api3.List.Section, { title: "Result", children: projects.map((project) => {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(LocalItem, { project }, project);
  }) }) });
}
var src_default = VisualStudioCodeWorkspaceManager;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  version
});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vbm9kZV9tb2R1bGVzL3VuaXZlcnNhbGlmeS9pbmRleC5qcyIsICIuLi9ub2RlX21vZHVsZXMvZ3JhY2VmdWwtZnMvcG9seWZpbGxzLmpzIiwgIi4uL25vZGVfbW9kdWxlcy9ncmFjZWZ1bC1mcy9sZWdhY3ktc3RyZWFtcy5qcyIsICIuLi9ub2RlX21vZHVsZXMvZ3JhY2VmdWwtZnMvY2xvbmUuanMiLCAiLi4vbm9kZV9tb2R1bGVzL2dyYWNlZnVsLWZzL2dyYWNlZnVsLWZzLmpzIiwgIi4uL25vZGVfbW9kdWxlcy9mcy1leHRyYS9saWIvZnMvaW5kZXguanMiLCAiLi4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9ta2RpcnMvdXRpbHMuanMiLCAiLi4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9ta2RpcnMvbWFrZS1kaXIuanMiLCAiLi4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9ta2RpcnMvaW5kZXguanMiLCAiLi4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9wYXRoLWV4aXN0cy9pbmRleC5qcyIsICIuLi9ub2RlX21vZHVsZXMvZnMtZXh0cmEvbGliL3V0aWwvdXRpbWVzLmpzIiwgIi4uL25vZGVfbW9kdWxlcy9mcy1leHRyYS9saWIvdXRpbC9zdGF0LmpzIiwgIi4uL25vZGVfbW9kdWxlcy9mcy1leHRyYS9saWIvY29weS9jb3B5LmpzIiwgIi4uL25vZGVfbW9kdWxlcy9mcy1leHRyYS9saWIvY29weS9jb3B5LXN5bmMuanMiLCAiLi4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9jb3B5L2luZGV4LmpzIiwgIi4uL25vZGVfbW9kdWxlcy9mcy1leHRyYS9saWIvcmVtb3ZlL2luZGV4LmpzIiwgIi4uL25vZGVfbW9kdWxlcy9mcy1leHRyYS9saWIvZW1wdHkvaW5kZXguanMiLCAiLi4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9lbnN1cmUvZmlsZS5qcyIsICIuLi9ub2RlX21vZHVsZXMvZnMtZXh0cmEvbGliL2Vuc3VyZS9saW5rLmpzIiwgIi4uL25vZGVfbW9kdWxlcy9mcy1leHRyYS9saWIvZW5zdXJlL3N5bWxpbmstcGF0aHMuanMiLCAiLi4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9lbnN1cmUvc3ltbGluay10eXBlLmpzIiwgIi4uL25vZGVfbW9kdWxlcy9mcy1leHRyYS9saWIvZW5zdXJlL3N5bWxpbmsuanMiLCAiLi4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9lbnN1cmUvaW5kZXguanMiLCAiLi4vbm9kZV9tb2R1bGVzL2pzb25maWxlL3V0aWxzLmpzIiwgIi4uL25vZGVfbW9kdWxlcy9qc29uZmlsZS9pbmRleC5qcyIsICIuLi9ub2RlX21vZHVsZXMvZnMtZXh0cmEvbGliL2pzb24vanNvbmZpbGUuanMiLCAiLi4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9vdXRwdXQtZmlsZS9pbmRleC5qcyIsICIuLi9ub2RlX21vZHVsZXMvZnMtZXh0cmEvbGliL2pzb24vb3V0cHV0LWpzb24uanMiLCAiLi4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9qc29uL291dHB1dC1qc29uLXN5bmMuanMiLCAiLi4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9qc29uL2luZGV4LmpzIiwgIi4uL25vZGVfbW9kdWxlcy9mcy1leHRyYS9saWIvbW92ZS9tb3ZlLmpzIiwgIi4uL25vZGVfbW9kdWxlcy9mcy1leHRyYS9saWIvbW92ZS9tb3ZlLXN5bmMuanMiLCAiLi4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9tb3ZlL2luZGV4LmpzIiwgIi4uL25vZGVfbW9kdWxlcy9mcy1leHRyYS9saWIvaW5kZXguanMiLCAiLi4vc3JjL2luZGV4LnRzeCIsICIuLi9zcmMvY29tcG9uZW50cy9Mb2NhbEl0ZW0udHN4IiwgIi4uL25vZGVfbW9kdWxlcy90aWxkaWZ5L2luZGV4LmpzIiwgIi4uL3NyYy9wcmVmZXJlbmNlLnRzIiwgIi4uL3BhY2thZ2UuanNvbiJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiJ3VzZSBzdHJpY3QnXG5cbmV4cG9ydHMuZnJvbUNhbGxiYWNrID0gZnVuY3Rpb24gKGZuKSB7XG4gIHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkoZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICBpZiAodHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PT0gJ2Z1bmN0aW9uJykgZm4uYXBwbHkodGhpcywgYXJncylcbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGFyZ3MucHVzaCgoZXJyLCByZXMpID0+IChlcnIgIT0gbnVsbCkgPyByZWplY3QoZXJyKSA6IHJlc29sdmUocmVzKSlcbiAgICAgICAgZm4uYXBwbHkodGhpcywgYXJncylcbiAgICAgIH0pXG4gICAgfVxuICB9LCAnbmFtZScsIHsgdmFsdWU6IGZuLm5hbWUgfSlcbn1cblxuZXhwb3J0cy5mcm9tUHJvbWlzZSA9IGZ1bmN0aW9uIChmbikge1xuICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgY29uc3QgY2IgPSBhcmdzW2FyZ3MubGVuZ3RoIC0gMV1cbiAgICBpZiAodHlwZW9mIGNiICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJncylcbiAgICBlbHNlIHtcbiAgICAgIGFyZ3MucG9wKClcbiAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3MpLnRoZW4ociA9PiBjYihudWxsLCByKSwgY2IpXG4gICAgfVxuICB9LCAnbmFtZScsIHsgdmFsdWU6IGZuLm5hbWUgfSlcbn1cbiIsICJ2YXIgY29uc3RhbnRzID0gcmVxdWlyZSgnY29uc3RhbnRzJylcblxudmFyIG9yaWdDd2QgPSBwcm9jZXNzLmN3ZFxudmFyIGN3ZCA9IG51bGxcblxudmFyIHBsYXRmb3JtID0gcHJvY2Vzcy5lbnYuR1JBQ0VGVUxfRlNfUExBVEZPUk0gfHwgcHJvY2Vzcy5wbGF0Zm9ybVxuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIWN3ZClcbiAgICBjd2QgPSBvcmlnQ3dkLmNhbGwocHJvY2VzcylcbiAgcmV0dXJuIGN3ZFxufVxudHJ5IHtcbiAgcHJvY2Vzcy5jd2QoKVxufSBjYXRjaCAoZXIpIHt9XG5cbi8vIFRoaXMgY2hlY2sgaXMgbmVlZGVkIHVudGlsIG5vZGUuanMgMTIgaXMgcmVxdWlyZWRcbmlmICh0eXBlb2YgcHJvY2Vzcy5jaGRpciA9PT0gJ2Z1bmN0aW9uJykge1xuICB2YXIgY2hkaXIgPSBwcm9jZXNzLmNoZGlyXG4gIHByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZCkge1xuICAgIGN3ZCA9IG51bGxcbiAgICBjaGRpci5jYWxsKHByb2Nlc3MsIGQpXG4gIH1cbiAgaWYgKE9iamVjdC5zZXRQcm90b3R5cGVPZikgT2JqZWN0LnNldFByb3RvdHlwZU9mKHByb2Nlc3MuY2hkaXIsIGNoZGlyKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBhdGNoXG5cbmZ1bmN0aW9uIHBhdGNoIChmcykge1xuICAvLyAocmUtKWltcGxlbWVudCBzb21lIHRoaW5ncyB0aGF0IGFyZSBrbm93biBidXN0ZWQgb3IgbWlzc2luZy5cblxuICAvLyBsY2htb2QsIGJyb2tlbiBwcmlvciB0byAwLjYuMlxuICAvLyBiYWNrLXBvcnQgdGhlIGZpeCBoZXJlLlxuICBpZiAoY29uc3RhbnRzLmhhc093blByb3BlcnR5KCdPX1NZTUxJTksnKSAmJlxuICAgICAgcHJvY2Vzcy52ZXJzaW9uLm1hdGNoKC9edjBcXC42XFwuWzAtMl18XnYwXFwuNVxcLi8pKSB7XG4gICAgcGF0Y2hMY2htb2QoZnMpXG4gIH1cblxuICAvLyBsdXRpbWVzIGltcGxlbWVudGF0aW9uLCBvciBuby1vcFxuICBpZiAoIWZzLmx1dGltZXMpIHtcbiAgICBwYXRjaEx1dGltZXMoZnMpXG4gIH1cblxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vaXNhYWNzL25vZGUtZ3JhY2VmdWwtZnMvaXNzdWVzLzRcbiAgLy8gQ2hvd24gc2hvdWxkIG5vdCBmYWlsIG9uIGVpbnZhbCBvciBlcGVybSBpZiBub24tcm9vdC5cbiAgLy8gSXQgc2hvdWxkIG5vdCBmYWlsIG9uIGVub3N5cyBldmVyLCBhcyB0aGlzIGp1c3QgaW5kaWNhdGVzXG4gIC8vIHRoYXQgYSBmcyBkb2Vzbid0IHN1cHBvcnQgdGhlIGludGVuZGVkIG9wZXJhdGlvbi5cblxuICBmcy5jaG93biA9IGNob3duRml4KGZzLmNob3duKVxuICBmcy5mY2hvd24gPSBjaG93bkZpeChmcy5mY2hvd24pXG4gIGZzLmxjaG93biA9IGNob3duRml4KGZzLmxjaG93bilcblxuICBmcy5jaG1vZCA9IGNobW9kRml4KGZzLmNobW9kKVxuICBmcy5mY2htb2QgPSBjaG1vZEZpeChmcy5mY2htb2QpXG4gIGZzLmxjaG1vZCA9IGNobW9kRml4KGZzLmxjaG1vZClcblxuICBmcy5jaG93blN5bmMgPSBjaG93bkZpeFN5bmMoZnMuY2hvd25TeW5jKVxuICBmcy5mY2hvd25TeW5jID0gY2hvd25GaXhTeW5jKGZzLmZjaG93blN5bmMpXG4gIGZzLmxjaG93blN5bmMgPSBjaG93bkZpeFN5bmMoZnMubGNob3duU3luYylcblxuICBmcy5jaG1vZFN5bmMgPSBjaG1vZEZpeFN5bmMoZnMuY2htb2RTeW5jKVxuICBmcy5mY2htb2RTeW5jID0gY2htb2RGaXhTeW5jKGZzLmZjaG1vZFN5bmMpXG4gIGZzLmxjaG1vZFN5bmMgPSBjaG1vZEZpeFN5bmMoZnMubGNobW9kU3luYylcblxuICBmcy5zdGF0ID0gc3RhdEZpeChmcy5zdGF0KVxuICBmcy5mc3RhdCA9IHN0YXRGaXgoZnMuZnN0YXQpXG4gIGZzLmxzdGF0ID0gc3RhdEZpeChmcy5sc3RhdClcblxuICBmcy5zdGF0U3luYyA9IHN0YXRGaXhTeW5jKGZzLnN0YXRTeW5jKVxuICBmcy5mc3RhdFN5bmMgPSBzdGF0Rml4U3luYyhmcy5mc3RhdFN5bmMpXG4gIGZzLmxzdGF0U3luYyA9IHN0YXRGaXhTeW5jKGZzLmxzdGF0U3luYylcblxuICAvLyBpZiBsY2htb2QvbGNob3duIGRvIG5vdCBleGlzdCwgdGhlbiBtYWtlIHRoZW0gbm8tb3BzXG4gIGlmIChmcy5jaG1vZCAmJiAhZnMubGNobW9kKSB7XG4gICAgZnMubGNobW9kID0gZnVuY3Rpb24gKHBhdGgsIG1vZGUsIGNiKSB7XG4gICAgICBpZiAoY2IpIHByb2Nlc3MubmV4dFRpY2soY2IpXG4gICAgfVxuICAgIGZzLmxjaG1vZFN5bmMgPSBmdW5jdGlvbiAoKSB7fVxuICB9XG4gIGlmIChmcy5jaG93biAmJiAhZnMubGNob3duKSB7XG4gICAgZnMubGNob3duID0gZnVuY3Rpb24gKHBhdGgsIHVpZCwgZ2lkLCBjYikge1xuICAgICAgaWYgKGNiKSBwcm9jZXNzLm5leHRUaWNrKGNiKVxuICAgIH1cbiAgICBmcy5sY2hvd25TeW5jID0gZnVuY3Rpb24gKCkge31cbiAgfVxuXG4gIC8vIG9uIFdpbmRvd3MsIEEvViBzb2Z0d2FyZSBjYW4gbG9jayB0aGUgZGlyZWN0b3J5LCBjYXVzaW5nIHRoaXNcbiAgLy8gdG8gZmFpbCB3aXRoIGFuIEVBQ0NFUyBvciBFUEVSTSBpZiB0aGUgZGlyZWN0b3J5IGNvbnRhaW5zIG5ld2x5XG4gIC8vIGNyZWF0ZWQgZmlsZXMuICBUcnkgYWdhaW4gb24gZmFpbHVyZSwgZm9yIHVwIHRvIDYwIHNlY29uZHMuXG5cbiAgLy8gU2V0IHRoZSB0aW1lb3V0IHRoaXMgbG9uZyBiZWNhdXNlIHNvbWUgV2luZG93cyBBbnRpLVZpcnVzLCBzdWNoIGFzIFBhcml0eVxuICAvLyBiaXQ5LCBtYXkgbG9jayBmaWxlcyBmb3IgdXAgdG8gYSBtaW51dGUsIGNhdXNpbmcgbnBtIHBhY2thZ2UgaW5zdGFsbFxuICAvLyBmYWlsdXJlcy4gQWxzbywgdGFrZSBjYXJlIHRvIHlpZWxkIHRoZSBzY2hlZHVsZXIuIFdpbmRvd3Mgc2NoZWR1bGluZyBnaXZlc1xuICAvLyBDUFUgdG8gYSBidXN5IGxvb3BpbmcgcHJvY2Vzcywgd2hpY2ggY2FuIGNhdXNlIHRoZSBwcm9ncmFtIGNhdXNpbmcgdGhlIGxvY2tcbiAgLy8gY29udGVudGlvbiB0byBiZSBzdGFydmVkIG9mIENQVSBieSBub2RlLCBzbyB0aGUgY29udGVudGlvbiBkb2Vzbid0IHJlc29sdmUuXG4gIGlmIChwbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiKSB7XG4gICAgZnMucmVuYW1lID0gdHlwZW9mIGZzLnJlbmFtZSAhPT0gJ2Z1bmN0aW9uJyA/IGZzLnJlbmFtZVxuICAgIDogKGZ1bmN0aW9uIChmcyRyZW5hbWUpIHtcbiAgICAgIGZ1bmN0aW9uIHJlbmFtZSAoZnJvbSwgdG8sIGNiKSB7XG4gICAgICAgIHZhciBzdGFydCA9IERhdGUubm93KClcbiAgICAgICAgdmFyIGJhY2tvZmYgPSAwO1xuICAgICAgICBmcyRyZW5hbWUoZnJvbSwgdG8sIGZ1bmN0aW9uIENCIChlcikge1xuICAgICAgICAgIGlmIChlclxuICAgICAgICAgICAgICAmJiAoZXIuY29kZSA9PT0gXCJFQUNDRVNcIiB8fCBlci5jb2RlID09PSBcIkVQRVJNXCIgfHwgZXIuY29kZSA9PT0gXCJFQlVTWVwiKVxuICAgICAgICAgICAgICAmJiBEYXRlLm5vdygpIC0gc3RhcnQgPCA2MDAwMCkge1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgZnMuc3RhdCh0bywgZnVuY3Rpb24gKHN0YXRlciwgc3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGVyICYmIHN0YXRlci5jb2RlID09PSBcIkVOT0VOVFwiKVxuICAgICAgICAgICAgICAgICAgZnMkcmVuYW1lKGZyb20sIHRvLCBDQik7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgY2IoZXIpXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9LCBiYWNrb2ZmKVxuICAgICAgICAgICAgaWYgKGJhY2tvZmYgPCAxMDApXG4gICAgICAgICAgICAgIGJhY2tvZmYgKz0gMTA7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjYikgY2IoZXIpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICBpZiAoT2JqZWN0LnNldFByb3RvdHlwZU9mKSBPYmplY3Quc2V0UHJvdG90eXBlT2YocmVuYW1lLCBmcyRyZW5hbWUpXG4gICAgICByZXR1cm4gcmVuYW1lXG4gICAgfSkoZnMucmVuYW1lKVxuICB9XG5cbiAgLy8gaWYgcmVhZCgpIHJldHVybnMgRUFHQUlOLCB0aGVuIGp1c3QgdHJ5IGl0IGFnYWluLlxuICBmcy5yZWFkID0gdHlwZW9mIGZzLnJlYWQgIT09ICdmdW5jdGlvbicgPyBmcy5yZWFkXG4gIDogKGZ1bmN0aW9uIChmcyRyZWFkKSB7XG4gICAgZnVuY3Rpb24gcmVhZCAoZmQsIGJ1ZmZlciwgb2Zmc2V0LCBsZW5ndGgsIHBvc2l0aW9uLCBjYWxsYmFja18pIHtcbiAgICAgIHZhciBjYWxsYmFja1xuICAgICAgaWYgKGNhbGxiYWNrXyAmJiB0eXBlb2YgY2FsbGJhY2tfID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhciBlYWdDb3VudGVyID0gMFxuICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uIChlciwgXywgX18pIHtcbiAgICAgICAgICBpZiAoZXIgJiYgZXIuY29kZSA9PT0gJ0VBR0FJTicgJiYgZWFnQ291bnRlciA8IDEwKSB7XG4gICAgICAgICAgICBlYWdDb3VudGVyICsrXG4gICAgICAgICAgICByZXR1cm4gZnMkcmVhZC5jYWxsKGZzLCBmZCwgYnVmZmVyLCBvZmZzZXQsIGxlbmd0aCwgcG9zaXRpb24sIGNhbGxiYWNrKVxuICAgICAgICAgIH1cbiAgICAgICAgICBjYWxsYmFja18uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZnMkcmVhZC5jYWxsKGZzLCBmZCwgYnVmZmVyLCBvZmZzZXQsIGxlbmd0aCwgcG9zaXRpb24sIGNhbGxiYWNrKVxuICAgIH1cblxuICAgIC8vIFRoaXMgZW5zdXJlcyBgdXRpbC5wcm9taXNpZnlgIHdvcmtzIGFzIGl0IGRvZXMgZm9yIG5hdGl2ZSBgZnMucmVhZGAuXG4gICAgaWYgKE9iamVjdC5zZXRQcm90b3R5cGVPZikgT2JqZWN0LnNldFByb3RvdHlwZU9mKHJlYWQsIGZzJHJlYWQpXG4gICAgcmV0dXJuIHJlYWRcbiAgfSkoZnMucmVhZClcblxuICBmcy5yZWFkU3luYyA9IHR5cGVvZiBmcy5yZWFkU3luYyAhPT0gJ2Z1bmN0aW9uJyA/IGZzLnJlYWRTeW5jXG4gIDogKGZ1bmN0aW9uIChmcyRyZWFkU3luYykgeyByZXR1cm4gZnVuY3Rpb24gKGZkLCBidWZmZXIsIG9mZnNldCwgbGVuZ3RoLCBwb3NpdGlvbikge1xuICAgIHZhciBlYWdDb3VudGVyID0gMFxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gZnMkcmVhZFN5bmMuY2FsbChmcywgZmQsIGJ1ZmZlciwgb2Zmc2V0LCBsZW5ndGgsIHBvc2l0aW9uKVxuICAgICAgfSBjYXRjaCAoZXIpIHtcbiAgICAgICAgaWYgKGVyLmNvZGUgPT09ICdFQUdBSU4nICYmIGVhZ0NvdW50ZXIgPCAxMCkge1xuICAgICAgICAgIGVhZ0NvdW50ZXIgKytcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICAgIHRocm93IGVyXG4gICAgICB9XG4gICAgfVxuICB9fSkoZnMucmVhZFN5bmMpXG5cbiAgZnVuY3Rpb24gcGF0Y2hMY2htb2QgKGZzKSB7XG4gICAgZnMubGNobW9kID0gZnVuY3Rpb24gKHBhdGgsIG1vZGUsIGNhbGxiYWNrKSB7XG4gICAgICBmcy5vcGVuKCBwYXRoXG4gICAgICAgICAgICAgLCBjb25zdGFudHMuT19XUk9OTFkgfCBjb25zdGFudHMuT19TWU1MSU5LXG4gICAgICAgICAgICAgLCBtb2RlXG4gICAgICAgICAgICAgLCBmdW5jdGlvbiAoZXJyLCBmZCkge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhlcnIpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgLy8gcHJlZmVyIHRvIHJldHVybiB0aGUgY2htb2QgZXJyb3IsIGlmIG9uZSBvY2N1cnMsXG4gICAgICAgIC8vIGJ1dCBzdGlsbCB0cnkgdG8gY2xvc2UsIGFuZCByZXBvcnQgY2xvc2luZyBlcnJvcnMgaWYgdGhleSBvY2N1ci5cbiAgICAgICAgZnMuZmNobW9kKGZkLCBtb2RlLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgZnMuY2xvc2UoZmQsIGZ1bmN0aW9uKGVycjIpIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soZXJyIHx8IGVycjIpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgZnMubGNobW9kU3luYyA9IGZ1bmN0aW9uIChwYXRoLCBtb2RlKSB7XG4gICAgICB2YXIgZmQgPSBmcy5vcGVuU3luYyhwYXRoLCBjb25zdGFudHMuT19XUk9OTFkgfCBjb25zdGFudHMuT19TWU1MSU5LLCBtb2RlKVxuXG4gICAgICAvLyBwcmVmZXIgdG8gcmV0dXJuIHRoZSBjaG1vZCBlcnJvciwgaWYgb25lIG9jY3VycyxcbiAgICAgIC8vIGJ1dCBzdGlsbCB0cnkgdG8gY2xvc2UsIGFuZCByZXBvcnQgY2xvc2luZyBlcnJvcnMgaWYgdGhleSBvY2N1ci5cbiAgICAgIHZhciB0aHJldyA9IHRydWVcbiAgICAgIHZhciByZXRcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldCA9IGZzLmZjaG1vZFN5bmMoZmQsIG1vZGUpXG4gICAgICAgIHRocmV3ID0gZmFsc2VcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGlmICh0aHJldykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmcy5jbG9zZVN5bmMoZmQpXG4gICAgICAgICAgfSBjYXRjaCAoZXIpIHt9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZnMuY2xvc2VTeW5jKGZkKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmV0XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcGF0Y2hMdXRpbWVzIChmcykge1xuICAgIGlmIChjb25zdGFudHMuaGFzT3duUHJvcGVydHkoXCJPX1NZTUxJTktcIikgJiYgZnMuZnV0aW1lcykge1xuICAgICAgZnMubHV0aW1lcyA9IGZ1bmN0aW9uIChwYXRoLCBhdCwgbXQsIGNiKSB7XG4gICAgICAgIGZzLm9wZW4ocGF0aCwgY29uc3RhbnRzLk9fU1lNTElOSywgZnVuY3Rpb24gKGVyLCBmZCkge1xuICAgICAgICAgIGlmIChlcikge1xuICAgICAgICAgICAgaWYgKGNiKSBjYihlcilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cbiAgICAgICAgICBmcy5mdXRpbWVzKGZkLCBhdCwgbXQsIGZ1bmN0aW9uIChlcikge1xuICAgICAgICAgICAgZnMuY2xvc2UoZmQsIGZ1bmN0aW9uIChlcjIpIHtcbiAgICAgICAgICAgICAgaWYgKGNiKSBjYihlciB8fCBlcjIpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIGZzLmx1dGltZXNTeW5jID0gZnVuY3Rpb24gKHBhdGgsIGF0LCBtdCkge1xuICAgICAgICB2YXIgZmQgPSBmcy5vcGVuU3luYyhwYXRoLCBjb25zdGFudHMuT19TWU1MSU5LKVxuICAgICAgICB2YXIgcmV0XG4gICAgICAgIHZhciB0aHJldyA9IHRydWVcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXQgPSBmcy5mdXRpbWVzU3luYyhmZCwgYXQsIG10KVxuICAgICAgICAgIHRocmV3ID0gZmFsc2VcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBpZiAodGhyZXcpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGZzLmNsb3NlU3luYyhmZClcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVyKSB7fVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmcy5jbG9zZVN5bmMoZmQpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXRcbiAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAoZnMuZnV0aW1lcykge1xuICAgICAgZnMubHV0aW1lcyA9IGZ1bmN0aW9uIChfYSwgX2IsIF9jLCBjYikgeyBpZiAoY2IpIHByb2Nlc3MubmV4dFRpY2soY2IpIH1cbiAgICAgIGZzLmx1dGltZXNTeW5jID0gZnVuY3Rpb24gKCkge31cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjaG1vZEZpeCAob3JpZykge1xuICAgIGlmICghb3JpZykgcmV0dXJuIG9yaWdcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwgbW9kZSwgY2IpIHtcbiAgICAgIHJldHVybiBvcmlnLmNhbGwoZnMsIHRhcmdldCwgbW9kZSwgZnVuY3Rpb24gKGVyKSB7XG4gICAgICAgIGlmIChjaG93bkVyT2soZXIpKSBlciA9IG51bGxcbiAgICAgICAgaWYgKGNiKSBjYi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNobW9kRml4U3luYyAob3JpZykge1xuICAgIGlmICghb3JpZykgcmV0dXJuIG9yaWdcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwgbW9kZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIG9yaWcuY2FsbChmcywgdGFyZ2V0LCBtb2RlKVxuICAgICAgfSBjYXRjaCAoZXIpIHtcbiAgICAgICAgaWYgKCFjaG93bkVyT2soZXIpKSB0aHJvdyBlclxuICAgICAgfVxuICAgIH1cbiAgfVxuXG5cbiAgZnVuY3Rpb24gY2hvd25GaXggKG9yaWcpIHtcbiAgICBpZiAoIW9yaWcpIHJldHVybiBvcmlnXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIHVpZCwgZ2lkLCBjYikge1xuICAgICAgcmV0dXJuIG9yaWcuY2FsbChmcywgdGFyZ2V0LCB1aWQsIGdpZCwgZnVuY3Rpb24gKGVyKSB7XG4gICAgICAgIGlmIChjaG93bkVyT2soZXIpKSBlciA9IG51bGxcbiAgICAgICAgaWYgKGNiKSBjYi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNob3duRml4U3luYyAob3JpZykge1xuICAgIGlmICghb3JpZykgcmV0dXJuIG9yaWdcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwgdWlkLCBnaWQpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBvcmlnLmNhbGwoZnMsIHRhcmdldCwgdWlkLCBnaWQpXG4gICAgICB9IGNhdGNoIChlcikge1xuICAgICAgICBpZiAoIWNob3duRXJPayhlcikpIHRocm93IGVyXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc3RhdEZpeCAob3JpZykge1xuICAgIGlmICghb3JpZykgcmV0dXJuIG9yaWdcbiAgICAvLyBPbGRlciB2ZXJzaW9ucyBvZiBOb2RlIGVycm9uZW91c2x5IHJldHVybmVkIHNpZ25lZCBpbnRlZ2VycyBmb3JcbiAgICAvLyB1aWQgKyBnaWQuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIG9wdGlvbnMsIGNiKSB7XG4gICAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2IgPSBvcHRpb25zXG4gICAgICAgIG9wdGlvbnMgPSBudWxsXG4gICAgICB9XG4gICAgICBmdW5jdGlvbiBjYWxsYmFjayAoZXIsIHN0YXRzKSB7XG4gICAgICAgIGlmIChzdGF0cykge1xuICAgICAgICAgIGlmIChzdGF0cy51aWQgPCAwKSBzdGF0cy51aWQgKz0gMHgxMDAwMDAwMDBcbiAgICAgICAgICBpZiAoc3RhdHMuZ2lkIDwgMCkgc3RhdHMuZ2lkICs9IDB4MTAwMDAwMDAwXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNiKSBjYi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICB9XG4gICAgICByZXR1cm4gb3B0aW9ucyA/IG9yaWcuY2FsbChmcywgdGFyZ2V0LCBvcHRpb25zLCBjYWxsYmFjaylcbiAgICAgICAgOiBvcmlnLmNhbGwoZnMsIHRhcmdldCwgY2FsbGJhY2spXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc3RhdEZpeFN5bmMgKG9yaWcpIHtcbiAgICBpZiAoIW9yaWcpIHJldHVybiBvcmlnXG4gICAgLy8gT2xkZXIgdmVyc2lvbnMgb2YgTm9kZSBlcnJvbmVvdXNseSByZXR1cm5lZCBzaWduZWQgaW50ZWdlcnMgZm9yXG4gICAgLy8gdWlkICsgZ2lkLlxuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBvcHRpb25zKSB7XG4gICAgICB2YXIgc3RhdHMgPSBvcHRpb25zID8gb3JpZy5jYWxsKGZzLCB0YXJnZXQsIG9wdGlvbnMpXG4gICAgICAgIDogb3JpZy5jYWxsKGZzLCB0YXJnZXQpXG4gICAgICBpZiAoc3RhdHMpIHtcbiAgICAgICAgaWYgKHN0YXRzLnVpZCA8IDApIHN0YXRzLnVpZCArPSAweDEwMDAwMDAwMFxuICAgICAgICBpZiAoc3RhdHMuZ2lkIDwgMCkgc3RhdHMuZ2lkICs9IDB4MTAwMDAwMDAwXG4gICAgICB9XG4gICAgICByZXR1cm4gc3RhdHM7XG4gICAgfVxuICB9XG5cbiAgLy8gRU5PU1lTIG1lYW5zIHRoYXQgdGhlIGZzIGRvZXNuJ3Qgc3VwcG9ydCB0aGUgb3AuIEp1c3QgaWdub3JlXG4gIC8vIHRoYXQsIGJlY2F1c2UgaXQgZG9lc24ndCBtYXR0ZXIuXG4gIC8vXG4gIC8vIGlmIHRoZXJlJ3Mgbm8gZ2V0dWlkLCBvciBpZiBnZXR1aWQoKSBpcyBzb21ldGhpbmcgb3RoZXJcbiAgLy8gdGhhbiAwLCBhbmQgdGhlIGVycm9yIGlzIEVJTlZBTCBvciBFUEVSTSwgdGhlbiBqdXN0IGlnbm9yZVxuICAvLyBpdC5cbiAgLy9cbiAgLy8gVGhpcyBzcGVjaWZpYyBjYXNlIGlzIGEgc2lsZW50IGZhaWx1cmUgaW4gY3AsIGluc3RhbGwsIHRhcixcbiAgLy8gYW5kIG1vc3Qgb3RoZXIgdW5peCB0b29scyB0aGF0IG1hbmFnZSBwZXJtaXNzaW9ucy5cbiAgLy9cbiAgLy8gV2hlbiBydW5uaW5nIGFzIHJvb3QsIG9yIGlmIG90aGVyIHR5cGVzIG9mIGVycm9ycyBhcmVcbiAgLy8gZW5jb3VudGVyZWQsIHRoZW4gaXQncyBzdHJpY3QuXG4gIGZ1bmN0aW9uIGNob3duRXJPayAoZXIpIHtcbiAgICBpZiAoIWVyKVxuICAgICAgcmV0dXJuIHRydWVcblxuICAgIGlmIChlci5jb2RlID09PSBcIkVOT1NZU1wiKVxuICAgICAgcmV0dXJuIHRydWVcblxuICAgIHZhciBub25yb290ID0gIXByb2Nlc3MuZ2V0dWlkIHx8IHByb2Nlc3MuZ2V0dWlkKCkgIT09IDBcbiAgICBpZiAobm9ucm9vdCkge1xuICAgICAgaWYgKGVyLmNvZGUgPT09IFwiRUlOVkFMXCIgfHwgZXIuY29kZSA9PT0gXCJFUEVSTVwiKVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG4iLCAidmFyIFN0cmVhbSA9IHJlcXVpcmUoJ3N0cmVhbScpLlN0cmVhbVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxlZ2FjeVxuXG5mdW5jdGlvbiBsZWdhY3kgKGZzKSB7XG4gIHJldHVybiB7XG4gICAgUmVhZFN0cmVhbTogUmVhZFN0cmVhbSxcbiAgICBXcml0ZVN0cmVhbTogV3JpdGVTdHJlYW1cbiAgfVxuXG4gIGZ1bmN0aW9uIFJlYWRTdHJlYW0gKHBhdGgsIG9wdGlvbnMpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUmVhZFN0cmVhbSkpIHJldHVybiBuZXcgUmVhZFN0cmVhbShwYXRoLCBvcHRpb25zKTtcblxuICAgIFN0cmVhbS5jYWxsKHRoaXMpO1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICB0aGlzLmZkID0gbnVsbDtcbiAgICB0aGlzLnJlYWRhYmxlID0gdHJ1ZTtcbiAgICB0aGlzLnBhdXNlZCA9IGZhbHNlO1xuXG4gICAgdGhpcy5mbGFncyA9ICdyJztcbiAgICB0aGlzLm1vZGUgPSA0Mzg7IC8qPTA2NjYqL1xuICAgIHRoaXMuYnVmZmVyU2l6ZSA9IDY0ICogMTAyNDtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgLy8gTWl4aW4gb3B0aW9ucyBpbnRvIHRoaXNcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9wdGlvbnMpO1xuICAgIGZvciAodmFyIGluZGV4ID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIga2V5ID0ga2V5c1tpbmRleF07XG4gICAgICB0aGlzW2tleV0gPSBvcHRpb25zW2tleV07XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZW5jb2RpbmcpIHRoaXMuc2V0RW5jb2RpbmcodGhpcy5lbmNvZGluZyk7XG5cbiAgICBpZiAodGhpcy5zdGFydCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoJ251bWJlcicgIT09IHR5cGVvZiB0aGlzLnN0YXJ0KSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignc3RhcnQgbXVzdCBiZSBhIE51bWJlcicpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuZW5kID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5lbmQgPSBJbmZpbml0eTtcbiAgICAgIH0gZWxzZSBpZiAoJ251bWJlcicgIT09IHR5cGVvZiB0aGlzLmVuZCkge1xuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2VuZCBtdXN0IGJlIGEgTnVtYmVyJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnN0YXJ0ID4gdGhpcy5lbmQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzdGFydCBtdXN0IGJlIDw9IGVuZCcpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnBvcyA9IHRoaXMuc3RhcnQ7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZmQgIT09IG51bGwpIHtcbiAgICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgIHNlbGYuX3JlYWQoKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZzLm9wZW4odGhpcy5wYXRoLCB0aGlzLmZsYWdzLCB0aGlzLm1vZGUsIGZ1bmN0aW9uIChlcnIsIGZkKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHNlbGYuZW1pdCgnZXJyb3InLCBlcnIpO1xuICAgICAgICBzZWxmLnJlYWRhYmxlID0gZmFsc2U7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgc2VsZi5mZCA9IGZkO1xuICAgICAgc2VsZi5lbWl0KCdvcGVuJywgZmQpO1xuICAgICAgc2VsZi5fcmVhZCgpO1xuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBXcml0ZVN0cmVhbSAocGF0aCwgb3B0aW9ucykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBXcml0ZVN0cmVhbSkpIHJldHVybiBuZXcgV3JpdGVTdHJlYW0ocGF0aCwgb3B0aW9ucyk7XG5cbiAgICBTdHJlYW0uY2FsbCh0aGlzKTtcblxuICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgdGhpcy5mZCA9IG51bGw7XG4gICAgdGhpcy53cml0YWJsZSA9IHRydWU7XG5cbiAgICB0aGlzLmZsYWdzID0gJ3cnO1xuICAgIHRoaXMuZW5jb2RpbmcgPSAnYmluYXJ5JztcbiAgICB0aGlzLm1vZGUgPSA0Mzg7IC8qPTA2NjYqL1xuICAgIHRoaXMuYnl0ZXNXcml0dGVuID0gMDtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgLy8gTWl4aW4gb3B0aW9ucyBpbnRvIHRoaXNcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9wdGlvbnMpO1xuICAgIGZvciAodmFyIGluZGV4ID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIga2V5ID0ga2V5c1tpbmRleF07XG4gICAgICB0aGlzW2tleV0gPSBvcHRpb25zW2tleV07XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RhcnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKCdudW1iZXInICE9PSB0eXBlb2YgdGhpcy5zdGFydCkge1xuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ3N0YXJ0IG11c3QgYmUgYSBOdW1iZXInKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnN0YXJ0IDwgMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3N0YXJ0IG11c3QgYmUgPj0gemVybycpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnBvcyA9IHRoaXMuc3RhcnQ7XG4gICAgfVxuXG4gICAgdGhpcy5idXN5ID0gZmFsc2U7XG4gICAgdGhpcy5fcXVldWUgPSBbXTtcblxuICAgIGlmICh0aGlzLmZkID09PSBudWxsKSB7XG4gICAgICB0aGlzLl9vcGVuID0gZnMub3BlbjtcbiAgICAgIHRoaXMuX3F1ZXVlLnB1c2goW3RoaXMuX29wZW4sIHRoaXMucGF0aCwgdGhpcy5mbGFncywgdGhpcy5tb2RlLCB1bmRlZmluZWRdKTtcbiAgICAgIHRoaXMuZmx1c2goKTtcbiAgICB9XG4gIH1cbn1cbiIsICIndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSBjbG9uZVxuXG52YXIgZ2V0UHJvdG90eXBlT2YgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gb2JqLl9fcHJvdG9fX1xufVxuXG5mdW5jdGlvbiBjbG9uZSAob2JqKSB7XG4gIGlmIChvYmogPT09IG51bGwgfHwgdHlwZW9mIG9iaiAhPT0gJ29iamVjdCcpXG4gICAgcmV0dXJuIG9ialxuXG4gIGlmIChvYmogaW5zdGFuY2VvZiBPYmplY3QpXG4gICAgdmFyIGNvcHkgPSB7IF9fcHJvdG9fXzogZ2V0UHJvdG90eXBlT2Yob2JqKSB9XG4gIGVsc2VcbiAgICB2YXIgY29weSA9IE9iamVjdC5jcmVhdGUobnVsbClcblxuICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhvYmopLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjb3B5LCBrZXksIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBrZXkpKVxuICB9KVxuXG4gIHJldHVybiBjb3B5XG59XG4iLCAidmFyIGZzID0gcmVxdWlyZSgnZnMnKVxudmFyIHBvbHlmaWxscyA9IHJlcXVpcmUoJy4vcG9seWZpbGxzLmpzJylcbnZhciBsZWdhY3kgPSByZXF1aXJlKCcuL2xlZ2FjeS1zdHJlYW1zLmpzJylcbnZhciBjbG9uZSA9IHJlcXVpcmUoJy4vY2xvbmUuanMnKVxuXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKVxuXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAtIG5vZGUgMC54IHBvbHlmaWxsICovXG52YXIgZ3JhY2VmdWxRdWV1ZVxudmFyIHByZXZpb3VzU3ltYm9sXG5cbi8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlIC0gbm9kZSAwLnggcG9seWZpbGwgKi9cbmlmICh0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBTeW1ib2wuZm9yID09PSAnZnVuY3Rpb24nKSB7XG4gIGdyYWNlZnVsUXVldWUgPSBTeW1ib2wuZm9yKCdncmFjZWZ1bC1mcy5xdWV1ZScpXG4gIC8vIFRoaXMgaXMgdXNlZCBpbiB0ZXN0aW5nIGJ5IGZ1dHVyZSB2ZXJzaW9uc1xuICBwcmV2aW91c1N5bWJvbCA9IFN5bWJvbC5mb3IoJ2dyYWNlZnVsLWZzLnByZXZpb3VzJylcbn0gZWxzZSB7XG4gIGdyYWNlZnVsUXVldWUgPSAnX19fZ3JhY2VmdWwtZnMucXVldWUnXG4gIHByZXZpb3VzU3ltYm9sID0gJ19fX2dyYWNlZnVsLWZzLnByZXZpb3VzJ1xufVxuXG5mdW5jdGlvbiBub29wICgpIHt9XG5cbmZ1bmN0aW9uIHB1Ymxpc2hRdWV1ZShjb250ZXh0LCBxdWV1ZSkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29udGV4dCwgZ3JhY2VmdWxRdWV1ZSwge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcXVldWVcbiAgICB9XG4gIH0pXG59XG5cbnZhciBkZWJ1ZyA9IG5vb3BcbmlmICh1dGlsLmRlYnVnbG9nKVxuICBkZWJ1ZyA9IHV0aWwuZGVidWdsb2coJ2dmczQnKVxuZWxzZSBpZiAoL1xcYmdmczRcXGIvaS50ZXN0KHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJycpKVxuICBkZWJ1ZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtID0gdXRpbC5mb3JtYXQuYXBwbHkodXRpbCwgYXJndW1lbnRzKVxuICAgIG0gPSAnR0ZTNDogJyArIG0uc3BsaXQoL1xcbi8pLmpvaW4oJ1xcbkdGUzQ6ICcpXG4gICAgY29uc29sZS5lcnJvcihtKVxuICB9XG5cbi8vIE9uY2UgdGltZSBpbml0aWFsaXphdGlvblxuaWYgKCFmc1tncmFjZWZ1bFF1ZXVlXSkge1xuICAvLyBUaGlzIHF1ZXVlIGNhbiBiZSBzaGFyZWQgYnkgbXVsdGlwbGUgbG9hZGVkIGluc3RhbmNlc1xuICB2YXIgcXVldWUgPSBnbG9iYWxbZ3JhY2VmdWxRdWV1ZV0gfHwgW11cbiAgcHVibGlzaFF1ZXVlKGZzLCBxdWV1ZSlcblxuICAvLyBQYXRjaCBmcy5jbG9zZS9jbG9zZVN5bmMgdG8gc2hhcmVkIHF1ZXVlIHZlcnNpb24sIGJlY2F1c2Ugd2UgbmVlZFxuICAvLyB0byByZXRyeSgpIHdoZW5ldmVyIGEgY2xvc2UgaGFwcGVucyAqYW55d2hlcmUqIGluIHRoZSBwcm9ncmFtLlxuICAvLyBUaGlzIGlzIGVzc2VudGlhbCB3aGVuIG11bHRpcGxlIGdyYWNlZnVsLWZzIGluc3RhbmNlcyBhcmVcbiAgLy8gaW4gcGxheSBhdCB0aGUgc2FtZSB0aW1lLlxuICBmcy5jbG9zZSA9IChmdW5jdGlvbiAoZnMkY2xvc2UpIHtcbiAgICBmdW5jdGlvbiBjbG9zZSAoZmQsIGNiKSB7XG4gICAgICByZXR1cm4gZnMkY2xvc2UuY2FsbChmcywgZmQsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiB1c2VzIHRoZSBncmFjZWZ1bC1mcyBzaGFyZWQgcXVldWVcbiAgICAgICAgaWYgKCFlcnIpIHtcbiAgICAgICAgICByZXNldFF1ZXVlKClcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgY2IuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2xvc2UsIHByZXZpb3VzU3ltYm9sLCB7XG4gICAgICB2YWx1ZTogZnMkY2xvc2VcbiAgICB9KVxuICAgIHJldHVybiBjbG9zZVxuICB9KShmcy5jbG9zZSlcblxuICBmcy5jbG9zZVN5bmMgPSAoZnVuY3Rpb24gKGZzJGNsb3NlU3luYykge1xuICAgIGZ1bmN0aW9uIGNsb3NlU3luYyAoZmQpIHtcbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gdXNlcyB0aGUgZ3JhY2VmdWwtZnMgc2hhcmVkIHF1ZXVlXG4gICAgICBmcyRjbG9zZVN5bmMuYXBwbHkoZnMsIGFyZ3VtZW50cylcbiAgICAgIHJlc2V0UXVldWUoKVxuICAgIH1cblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjbG9zZVN5bmMsIHByZXZpb3VzU3ltYm9sLCB7XG4gICAgICB2YWx1ZTogZnMkY2xvc2VTeW5jXG4gICAgfSlcbiAgICByZXR1cm4gY2xvc2VTeW5jXG4gIH0pKGZzLmNsb3NlU3luYylcblxuICBpZiAoL1xcYmdmczRcXGIvaS50ZXN0KHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJycpKSB7XG4gICAgcHJvY2Vzcy5vbignZXhpdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgZGVidWcoZnNbZ3JhY2VmdWxRdWV1ZV0pXG4gICAgICByZXF1aXJlKCdhc3NlcnQnKS5lcXVhbChmc1tncmFjZWZ1bFF1ZXVlXS5sZW5ndGgsIDApXG4gICAgfSlcbiAgfVxufVxuXG5pZiAoIWdsb2JhbFtncmFjZWZ1bFF1ZXVlXSkge1xuICBwdWJsaXNoUXVldWUoZ2xvYmFsLCBmc1tncmFjZWZ1bFF1ZXVlXSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcGF0Y2goY2xvbmUoZnMpKVxuaWYgKHByb2Nlc3MuZW52LlRFU1RfR1JBQ0VGVUxfRlNfR0xPQkFMX1BBVENIICYmICFmcy5fX3BhdGNoZWQpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHBhdGNoKGZzKVxuICAgIGZzLl9fcGF0Y2hlZCA9IHRydWU7XG59XG5cbmZ1bmN0aW9uIHBhdGNoIChmcykge1xuICAvLyBFdmVyeXRoaW5nIHRoYXQgcmVmZXJlbmNlcyB0aGUgb3BlbigpIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIGluIGhlcmVcbiAgcG9seWZpbGxzKGZzKVxuICBmcy5ncmFjZWZ1bGlmeSA9IHBhdGNoXG5cbiAgZnMuY3JlYXRlUmVhZFN0cmVhbSA9IGNyZWF0ZVJlYWRTdHJlYW1cbiAgZnMuY3JlYXRlV3JpdGVTdHJlYW0gPSBjcmVhdGVXcml0ZVN0cmVhbVxuICB2YXIgZnMkcmVhZEZpbGUgPSBmcy5yZWFkRmlsZVxuICBmcy5yZWFkRmlsZSA9IHJlYWRGaWxlXG4gIGZ1bmN0aW9uIHJlYWRGaWxlIChwYXRoLCBvcHRpb25zLCBjYikge1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIGNiID0gb3B0aW9ucywgb3B0aW9ucyA9IG51bGxcblxuICAgIHJldHVybiBnbyRyZWFkRmlsZShwYXRoLCBvcHRpb25zLCBjYilcblxuICAgIGZ1bmN0aW9uIGdvJHJlYWRGaWxlIChwYXRoLCBvcHRpb25zLCBjYiwgc3RhcnRUaW1lKSB7XG4gICAgICByZXR1cm4gZnMkcmVhZEZpbGUocGF0aCwgb3B0aW9ucywgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBpZiAoZXJyICYmIChlcnIuY29kZSA9PT0gJ0VNRklMRScgfHwgZXJyLmNvZGUgPT09ICdFTkZJTEUnKSlcbiAgICAgICAgICBlbnF1ZXVlKFtnbyRyZWFkRmlsZSwgW3BhdGgsIG9wdGlvbnMsIGNiXSwgZXJyLCBzdGFydFRpbWUgfHwgRGF0ZS5ub3coKSwgRGF0ZS5ub3coKV0pXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGlmICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgICBjYi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgdmFyIGZzJHdyaXRlRmlsZSA9IGZzLndyaXRlRmlsZVxuICBmcy53cml0ZUZpbGUgPSB3cml0ZUZpbGVcbiAgZnVuY3Rpb24gd3JpdGVGaWxlIChwYXRoLCBkYXRhLCBvcHRpb25zLCBjYikge1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIGNiID0gb3B0aW9ucywgb3B0aW9ucyA9IG51bGxcblxuICAgIHJldHVybiBnbyR3cml0ZUZpbGUocGF0aCwgZGF0YSwgb3B0aW9ucywgY2IpXG5cbiAgICBmdW5jdGlvbiBnbyR3cml0ZUZpbGUgKHBhdGgsIGRhdGEsIG9wdGlvbnMsIGNiLCBzdGFydFRpbWUpIHtcbiAgICAgIHJldHVybiBmcyR3cml0ZUZpbGUocGF0aCwgZGF0YSwgb3B0aW9ucywgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBpZiAoZXJyICYmIChlcnIuY29kZSA9PT0gJ0VNRklMRScgfHwgZXJyLmNvZGUgPT09ICdFTkZJTEUnKSlcbiAgICAgICAgICBlbnF1ZXVlKFtnbyR3cml0ZUZpbGUsIFtwYXRoLCBkYXRhLCBvcHRpb25zLCBjYl0sIGVyciwgc3RhcnRUaW1lIHx8IERhdGUubm93KCksIERhdGUubm93KCldKVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKVxuICAgICAgICAgICAgY2IuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIHZhciBmcyRhcHBlbmRGaWxlID0gZnMuYXBwZW5kRmlsZVxuICBpZiAoZnMkYXBwZW5kRmlsZSlcbiAgICBmcy5hcHBlbmRGaWxlID0gYXBwZW5kRmlsZVxuICBmdW5jdGlvbiBhcHBlbmRGaWxlIChwYXRoLCBkYXRhLCBvcHRpb25zLCBjYikge1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIGNiID0gb3B0aW9ucywgb3B0aW9ucyA9IG51bGxcblxuICAgIHJldHVybiBnbyRhcHBlbmRGaWxlKHBhdGgsIGRhdGEsIG9wdGlvbnMsIGNiKVxuXG4gICAgZnVuY3Rpb24gZ28kYXBwZW5kRmlsZSAocGF0aCwgZGF0YSwgb3B0aW9ucywgY2IsIHN0YXJ0VGltZSkge1xuICAgICAgcmV0dXJuIGZzJGFwcGVuZEZpbGUocGF0aCwgZGF0YSwgb3B0aW9ucywgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBpZiAoZXJyICYmIChlcnIuY29kZSA9PT0gJ0VNRklMRScgfHwgZXJyLmNvZGUgPT09ICdFTkZJTEUnKSlcbiAgICAgICAgICBlbnF1ZXVlKFtnbyRhcHBlbmRGaWxlLCBbcGF0aCwgZGF0YSwgb3B0aW9ucywgY2JdLCBlcnIsIHN0YXJ0VGltZSB8fCBEYXRlLm5vdygpLCBEYXRlLm5vdygpXSlcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICAgIGNiLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICB2YXIgZnMkY29weUZpbGUgPSBmcy5jb3B5RmlsZVxuICBpZiAoZnMkY29weUZpbGUpXG4gICAgZnMuY29weUZpbGUgPSBjb3B5RmlsZVxuICBmdW5jdGlvbiBjb3B5RmlsZSAoc3JjLCBkZXN0LCBmbGFncywgY2IpIHtcbiAgICBpZiAodHlwZW9mIGZsYWdzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYiA9IGZsYWdzXG4gICAgICBmbGFncyA9IDBcbiAgICB9XG4gICAgcmV0dXJuIGdvJGNvcHlGaWxlKHNyYywgZGVzdCwgZmxhZ3MsIGNiKVxuXG4gICAgZnVuY3Rpb24gZ28kY29weUZpbGUgKHNyYywgZGVzdCwgZmxhZ3MsIGNiLCBzdGFydFRpbWUpIHtcbiAgICAgIHJldHVybiBmcyRjb3B5RmlsZShzcmMsIGRlc3QsIGZsYWdzLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGlmIChlcnIgJiYgKGVyci5jb2RlID09PSAnRU1GSUxFJyB8fCBlcnIuY29kZSA9PT0gJ0VORklMRScpKVxuICAgICAgICAgIGVucXVldWUoW2dvJGNvcHlGaWxlLCBbc3JjLCBkZXN0LCBmbGFncywgY2JdLCBlcnIsIHN0YXJ0VGltZSB8fCBEYXRlLm5vdygpLCBEYXRlLm5vdygpXSlcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICAgIGNiLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICB2YXIgZnMkcmVhZGRpciA9IGZzLnJlYWRkaXJcbiAgZnMucmVhZGRpciA9IHJlYWRkaXJcbiAgdmFyIG5vUmVhZGRpck9wdGlvblZlcnNpb25zID0gL152WzAtNV1cXC4vXG4gIGZ1bmN0aW9uIHJlYWRkaXIgKHBhdGgsIG9wdGlvbnMsIGNiKSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKVxuICAgICAgY2IgPSBvcHRpb25zLCBvcHRpb25zID0gbnVsbFxuXG4gICAgdmFyIGdvJHJlYWRkaXIgPSBub1JlYWRkaXJPcHRpb25WZXJzaW9ucy50ZXN0KHByb2Nlc3MudmVyc2lvbilcbiAgICAgID8gZnVuY3Rpb24gZ28kcmVhZGRpciAocGF0aCwgb3B0aW9ucywgY2IsIHN0YXJ0VGltZSkge1xuICAgICAgICByZXR1cm4gZnMkcmVhZGRpcihwYXRoLCBmcyRyZWFkZGlyQ2FsbGJhY2soXG4gICAgICAgICAgcGF0aCwgb3B0aW9ucywgY2IsIHN0YXJ0VGltZVxuICAgICAgICApKVxuICAgICAgfVxuICAgICAgOiBmdW5jdGlvbiBnbyRyZWFkZGlyIChwYXRoLCBvcHRpb25zLCBjYiwgc3RhcnRUaW1lKSB7XG4gICAgICAgIHJldHVybiBmcyRyZWFkZGlyKHBhdGgsIG9wdGlvbnMsIGZzJHJlYWRkaXJDYWxsYmFjayhcbiAgICAgICAgICBwYXRoLCBvcHRpb25zLCBjYiwgc3RhcnRUaW1lXG4gICAgICAgICkpXG4gICAgICB9XG5cbiAgICByZXR1cm4gZ28kcmVhZGRpcihwYXRoLCBvcHRpb25zLCBjYilcblxuICAgIGZ1bmN0aW9uIGZzJHJlYWRkaXJDYWxsYmFjayAocGF0aCwgb3B0aW9ucywgY2IsIHN0YXJ0VGltZSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChlcnIsIGZpbGVzKSB7XG4gICAgICAgIGlmIChlcnIgJiYgKGVyci5jb2RlID09PSAnRU1GSUxFJyB8fCBlcnIuY29kZSA9PT0gJ0VORklMRScpKVxuICAgICAgICAgIGVucXVldWUoW1xuICAgICAgICAgICAgZ28kcmVhZGRpcixcbiAgICAgICAgICAgIFtwYXRoLCBvcHRpb25zLCBjYl0sXG4gICAgICAgICAgICBlcnIsXG4gICAgICAgICAgICBzdGFydFRpbWUgfHwgRGF0ZS5ub3coKSxcbiAgICAgICAgICAgIERhdGUubm93KClcbiAgICAgICAgICBdKVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpZiAoZmlsZXMgJiYgZmlsZXMuc29ydClcbiAgICAgICAgICAgIGZpbGVzLnNvcnQoKVxuXG4gICAgICAgICAgaWYgKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICAgIGNiLmNhbGwodGhpcywgZXJyLCBmaWxlcylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChwcm9jZXNzLnZlcnNpb24uc3Vic3RyKDAsIDQpID09PSAndjAuOCcpIHtcbiAgICB2YXIgbGVnU3RyZWFtcyA9IGxlZ2FjeShmcylcbiAgICBSZWFkU3RyZWFtID0gbGVnU3RyZWFtcy5SZWFkU3RyZWFtXG4gICAgV3JpdGVTdHJlYW0gPSBsZWdTdHJlYW1zLldyaXRlU3RyZWFtXG4gIH1cblxuICB2YXIgZnMkUmVhZFN0cmVhbSA9IGZzLlJlYWRTdHJlYW1cbiAgaWYgKGZzJFJlYWRTdHJlYW0pIHtcbiAgICBSZWFkU3RyZWFtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoZnMkUmVhZFN0cmVhbS5wcm90b3R5cGUpXG4gICAgUmVhZFN0cmVhbS5wcm90b3R5cGUub3BlbiA9IFJlYWRTdHJlYW0kb3BlblxuICB9XG5cbiAgdmFyIGZzJFdyaXRlU3RyZWFtID0gZnMuV3JpdGVTdHJlYW1cbiAgaWYgKGZzJFdyaXRlU3RyZWFtKSB7XG4gICAgV3JpdGVTdHJlYW0ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShmcyRXcml0ZVN0cmVhbS5wcm90b3R5cGUpXG4gICAgV3JpdGVTdHJlYW0ucHJvdG90eXBlLm9wZW4gPSBXcml0ZVN0cmVhbSRvcGVuXG4gIH1cblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZnMsICdSZWFkU3RyZWFtJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIFJlYWRTdHJlYW1cbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gKHZhbCkge1xuICAgICAgUmVhZFN0cmVhbSA9IHZhbFxuICAgIH0sXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSlcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGZzLCAnV3JpdGVTdHJlYW0nLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gV3JpdGVTdHJlYW1cbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gKHZhbCkge1xuICAgICAgV3JpdGVTdHJlYW0gPSB2YWxcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0pXG5cbiAgLy8gbGVnYWN5IG5hbWVzXG4gIHZhciBGaWxlUmVhZFN0cmVhbSA9IFJlYWRTdHJlYW1cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGZzLCAnRmlsZVJlYWRTdHJlYW0nLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gRmlsZVJlYWRTdHJlYW1cbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gKHZhbCkge1xuICAgICAgRmlsZVJlYWRTdHJlYW0gPSB2YWxcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0pXG4gIHZhciBGaWxlV3JpdGVTdHJlYW0gPSBXcml0ZVN0cmVhbVxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZnMsICdGaWxlV3JpdGVTdHJlYW0nLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gRmlsZVdyaXRlU3RyZWFtXG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgIEZpbGVXcml0ZVN0cmVhbSA9IHZhbFxuICAgIH0sXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSlcblxuICBmdW5jdGlvbiBSZWFkU3RyZWFtIChwYXRoLCBvcHRpb25zKSB7XG4gICAgaWYgKHRoaXMgaW5zdGFuY2VvZiBSZWFkU3RyZWFtKVxuICAgICAgcmV0dXJuIGZzJFJlYWRTdHJlYW0uYXBwbHkodGhpcywgYXJndW1lbnRzKSwgdGhpc1xuICAgIGVsc2VcbiAgICAgIHJldHVybiBSZWFkU3RyZWFtLmFwcGx5KE9iamVjdC5jcmVhdGUoUmVhZFN0cmVhbS5wcm90b3R5cGUpLCBhcmd1bWVudHMpXG4gIH1cblxuICBmdW5jdGlvbiBSZWFkU3RyZWFtJG9wZW4gKCkge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIG9wZW4odGhhdC5wYXRoLCB0aGF0LmZsYWdzLCB0aGF0Lm1vZGUsIGZ1bmN0aW9uIChlcnIsIGZkKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGlmICh0aGF0LmF1dG9DbG9zZSlcbiAgICAgICAgICB0aGF0LmRlc3Ryb3koKVxuXG4gICAgICAgIHRoYXQuZW1pdCgnZXJyb3InLCBlcnIpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGF0LmZkID0gZmRcbiAgICAgICAgdGhhdC5lbWl0KCdvcGVuJywgZmQpXG4gICAgICAgIHRoYXQucmVhZCgpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIFdyaXRlU3RyZWFtIChwYXRoLCBvcHRpb25zKSB7XG4gICAgaWYgKHRoaXMgaW5zdGFuY2VvZiBXcml0ZVN0cmVhbSlcbiAgICAgIHJldHVybiBmcyRXcml0ZVN0cmVhbS5hcHBseSh0aGlzLCBhcmd1bWVudHMpLCB0aGlzXG4gICAgZWxzZVxuICAgICAgcmV0dXJuIFdyaXRlU3RyZWFtLmFwcGx5KE9iamVjdC5jcmVhdGUoV3JpdGVTdHJlYW0ucHJvdG90eXBlKSwgYXJndW1lbnRzKVxuICB9XG5cbiAgZnVuY3Rpb24gV3JpdGVTdHJlYW0kb3BlbiAoKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzXG4gICAgb3Blbih0aGF0LnBhdGgsIHRoYXQuZmxhZ3MsIHRoYXQubW9kZSwgZnVuY3Rpb24gKGVyciwgZmQpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgdGhhdC5kZXN0cm95KClcbiAgICAgICAgdGhhdC5lbWl0KCdlcnJvcicsIGVycilcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoYXQuZmQgPSBmZFxuICAgICAgICB0aGF0LmVtaXQoJ29wZW4nLCBmZClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlUmVhZFN0cmVhbSAocGF0aCwgb3B0aW9ucykge1xuICAgIHJldHVybiBuZXcgZnMuUmVhZFN0cmVhbShwYXRoLCBvcHRpb25zKVxuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlV3JpdGVTdHJlYW0gKHBhdGgsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbmV3IGZzLldyaXRlU3RyZWFtKHBhdGgsIG9wdGlvbnMpXG4gIH1cblxuICB2YXIgZnMkb3BlbiA9IGZzLm9wZW5cbiAgZnMub3BlbiA9IG9wZW5cbiAgZnVuY3Rpb24gb3BlbiAocGF0aCwgZmxhZ3MsIG1vZGUsIGNiKSB7XG4gICAgaWYgKHR5cGVvZiBtb2RlID09PSAnZnVuY3Rpb24nKVxuICAgICAgY2IgPSBtb2RlLCBtb2RlID0gbnVsbFxuXG4gICAgcmV0dXJuIGdvJG9wZW4ocGF0aCwgZmxhZ3MsIG1vZGUsIGNiKVxuXG4gICAgZnVuY3Rpb24gZ28kb3BlbiAocGF0aCwgZmxhZ3MsIG1vZGUsIGNiLCBzdGFydFRpbWUpIHtcbiAgICAgIHJldHVybiBmcyRvcGVuKHBhdGgsIGZsYWdzLCBtb2RlLCBmdW5jdGlvbiAoZXJyLCBmZCkge1xuICAgICAgICBpZiAoZXJyICYmIChlcnIuY29kZSA9PT0gJ0VNRklMRScgfHwgZXJyLmNvZGUgPT09ICdFTkZJTEUnKSlcbiAgICAgICAgICBlbnF1ZXVlKFtnbyRvcGVuLCBbcGF0aCwgZmxhZ3MsIG1vZGUsIGNiXSwgZXJyLCBzdGFydFRpbWUgfHwgRGF0ZS5ub3coKSwgRGF0ZS5ub3coKV0pXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGlmICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgICBjYi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZzXG59XG5cbmZ1bmN0aW9uIGVucXVldWUgKGVsZW0pIHtcbiAgZGVidWcoJ0VOUVVFVUUnLCBlbGVtWzBdLm5hbWUsIGVsZW1bMV0pXG4gIGZzW2dyYWNlZnVsUXVldWVdLnB1c2goZWxlbSlcbiAgcmV0cnkoKVxufVxuXG4vLyBrZWVwIHRyYWNrIG9mIHRoZSB0aW1lb3V0IGJldHdlZW4gcmV0cnkoKSBjYWxsc1xudmFyIHJldHJ5VGltZXJcblxuLy8gcmVzZXQgdGhlIHN0YXJ0VGltZSBhbmQgbGFzdFRpbWUgdG8gbm93XG4vLyB0aGlzIHJlc2V0cyB0aGUgc3RhcnQgb2YgdGhlIDYwIHNlY29uZCBvdmVyYWxsIHRpbWVvdXQgYXMgd2VsbCBhcyB0aGVcbi8vIGRlbGF5IGJldHdlZW4gYXR0ZW1wdHMgc28gdGhhdCB3ZSdsbCByZXRyeSB0aGVzZSBqb2JzIHNvb25lclxuZnVuY3Rpb24gcmVzZXRRdWV1ZSAoKSB7XG4gIHZhciBub3cgPSBEYXRlLm5vdygpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZnNbZ3JhY2VmdWxRdWV1ZV0ubGVuZ3RoOyArK2kpIHtcbiAgICAvLyBlbnRyaWVzIHRoYXQgYXJlIG9ubHkgYSBsZW5ndGggb2YgMiBhcmUgZnJvbSBhbiBvbGRlciB2ZXJzaW9uLCBkb24ndFxuICAgIC8vIGJvdGhlciBtb2RpZnlpbmcgdGhvc2Ugc2luY2UgdGhleSdsbCBiZSByZXRyaWVkIGFueXdheS5cbiAgICBpZiAoZnNbZ3JhY2VmdWxRdWV1ZV1baV0ubGVuZ3RoID4gMikge1xuICAgICAgZnNbZ3JhY2VmdWxRdWV1ZV1baV1bM10gPSBub3cgLy8gc3RhcnRUaW1lXG4gICAgICBmc1tncmFjZWZ1bFF1ZXVlXVtpXVs0XSA9IG5vdyAvLyBsYXN0VGltZVxuICAgIH1cbiAgfVxuICAvLyBjYWxsIHJldHJ5IHRvIG1ha2Ugc3VyZSB3ZSdyZSBhY3RpdmVseSBwcm9jZXNzaW5nIHRoZSBxdWV1ZVxuICByZXRyeSgpXG59XG5cbmZ1bmN0aW9uIHJldHJ5ICgpIHtcbiAgLy8gY2xlYXIgdGhlIHRpbWVyIGFuZCByZW1vdmUgaXQgdG8gaGVscCBwcmV2ZW50IHVuaW50ZW5kZWQgY29uY3VycmVuY3lcbiAgY2xlYXJUaW1lb3V0KHJldHJ5VGltZXIpXG4gIHJldHJ5VGltZXIgPSB1bmRlZmluZWRcblxuICBpZiAoZnNbZ3JhY2VmdWxRdWV1ZV0ubGVuZ3RoID09PSAwKVxuICAgIHJldHVyblxuXG4gIHZhciBlbGVtID0gZnNbZ3JhY2VmdWxRdWV1ZV0uc2hpZnQoKVxuICB2YXIgZm4gPSBlbGVtWzBdXG4gIHZhciBhcmdzID0gZWxlbVsxXVxuICAvLyB0aGVzZSBpdGVtcyBtYXkgYmUgdW5zZXQgaWYgdGhleSB3ZXJlIGFkZGVkIGJ5IGFuIG9sZGVyIGdyYWNlZnVsLWZzXG4gIHZhciBlcnIgPSBlbGVtWzJdXG4gIHZhciBzdGFydFRpbWUgPSBlbGVtWzNdXG4gIHZhciBsYXN0VGltZSA9IGVsZW1bNF1cblxuICAvLyBpZiB3ZSBkb24ndCBoYXZlIGEgc3RhcnRUaW1lIHdlIGhhdmUgbm8gd2F5IG9mIGtub3dpbmcgaWYgd2UndmUgd2FpdGVkXG4gIC8vIGxvbmcgZW5vdWdoLCBzbyBnbyBhaGVhZCBhbmQgcmV0cnkgdGhpcyBpdGVtIG5vd1xuICBpZiAoc3RhcnRUaW1lID09PSB1bmRlZmluZWQpIHtcbiAgICBkZWJ1ZygnUkVUUlknLCBmbi5uYW1lLCBhcmdzKVxuICAgIGZuLmFwcGx5KG51bGwsIGFyZ3MpXG4gIH0gZWxzZSBpZiAoRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSA+PSA2MDAwMCkge1xuICAgIC8vIGl0J3MgYmVlbiBtb3JlIHRoYW4gNjAgc2Vjb25kcyB0b3RhbCwgYmFpbCBub3dcbiAgICBkZWJ1ZygnVElNRU9VVCcsIGZuLm5hbWUsIGFyZ3MpXG4gICAgdmFyIGNiID0gYXJncy5wb3AoKVxuICAgIGlmICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpXG4gICAgICBjYi5jYWxsKG51bGwsIGVycilcbiAgfSBlbHNlIHtcbiAgICAvLyB0aGUgYW1vdW50IG9mIHRpbWUgYmV0d2VlbiB0aGUgbGFzdCBhdHRlbXB0IGFuZCByaWdodCBub3dcbiAgICB2YXIgc2luY2VBdHRlbXB0ID0gRGF0ZS5ub3coKSAtIGxhc3RUaW1lXG4gICAgLy8gdGhlIGFtb3VudCBvZiB0aW1lIGJldHdlZW4gd2hlbiB3ZSBmaXJzdCB0cmllZCwgYW5kIHdoZW4gd2UgbGFzdCB0cmllZFxuICAgIC8vIHJvdW5kZWQgdXAgdG8gYXQgbGVhc3QgMVxuICAgIHZhciBzaW5jZVN0YXJ0ID0gTWF0aC5tYXgobGFzdFRpbWUgLSBzdGFydFRpbWUsIDEpXG4gICAgLy8gYmFja29mZi4gd2FpdCBsb25nZXIgdGhhbiB0aGUgdG90YWwgdGltZSB3ZSd2ZSBiZWVuIHJldHJ5aW5nLCBidXQgb25seVxuICAgIC8vIHVwIHRvIGEgbWF4aW11bSBvZiAxMDBtc1xuICAgIHZhciBkZXNpcmVkRGVsYXkgPSBNYXRoLm1pbihzaW5jZVN0YXJ0ICogMS4yLCAxMDApXG4gICAgLy8gaXQncyBiZWVuIGxvbmcgZW5vdWdoIHNpbmNlIHRoZSBsYXN0IHJldHJ5LCBkbyBpdCBhZ2FpblxuICAgIGlmIChzaW5jZUF0dGVtcHQgPj0gZGVzaXJlZERlbGF5KSB7XG4gICAgICBkZWJ1ZygnUkVUUlknLCBmbi5uYW1lLCBhcmdzKVxuICAgICAgZm4uYXBwbHkobnVsbCwgYXJncy5jb25jYXQoW3N0YXJ0VGltZV0pKVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBpZiB3ZSBjYW4ndCBkbyB0aGlzIGpvYiB5ZXQsIHB1c2ggaXQgdG8gdGhlIGVuZCBvZiB0aGUgcXVldWVcbiAgICAgIC8vIGFuZCBsZXQgdGhlIG5leHQgaXRlcmF0aW9uIGNoZWNrIGFnYWluXG4gICAgICBmc1tncmFjZWZ1bFF1ZXVlXS5wdXNoKGVsZW0pXG4gICAgfVxuICB9XG5cbiAgLy8gc2NoZWR1bGUgb3VyIG5leHQgcnVuIGlmIG9uZSBpc24ndCBhbHJlYWR5IHNjaGVkdWxlZFxuICBpZiAocmV0cnlUaW1lciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0cnlUaW1lciA9IHNldFRpbWVvdXQocmV0cnksIDApXG4gIH1cbn1cbiIsICIndXNlIHN0cmljdCdcbi8vIFRoaXMgaXMgYWRhcHRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9ub3JtYWxpemUvbXpcbi8vIENvcHlyaWdodCAoYykgMjAxNC0yMDE2IEpvbmF0aGFuIE9uZyBtZUBqb25nbGViZXJyeS5jb20gYW5kIENvbnRyaWJ1dG9yc1xuY29uc3QgdSA9IHJlcXVpcmUoJ3VuaXZlcnNhbGlmeScpLmZyb21DYWxsYmFja1xuY29uc3QgZnMgPSByZXF1aXJlKCdncmFjZWZ1bC1mcycpXG5cbmNvbnN0IGFwaSA9IFtcbiAgJ2FjY2VzcycsXG4gICdhcHBlbmRGaWxlJyxcbiAgJ2NobW9kJyxcbiAgJ2Nob3duJyxcbiAgJ2Nsb3NlJyxcbiAgJ2NvcHlGaWxlJyxcbiAgJ2ZjaG1vZCcsXG4gICdmY2hvd24nLFxuICAnZmRhdGFzeW5jJyxcbiAgJ2ZzdGF0JyxcbiAgJ2ZzeW5jJyxcbiAgJ2Z0cnVuY2F0ZScsXG4gICdmdXRpbWVzJyxcbiAgJ2xjaG1vZCcsXG4gICdsY2hvd24nLFxuICAnbGluaycsXG4gICdsc3RhdCcsXG4gICdta2RpcicsXG4gICdta2R0ZW1wJyxcbiAgJ29wZW4nLFxuICAnb3BlbmRpcicsXG4gICdyZWFkZGlyJyxcbiAgJ3JlYWRGaWxlJyxcbiAgJ3JlYWRsaW5rJyxcbiAgJ3JlYWxwYXRoJyxcbiAgJ3JlbmFtZScsXG4gICdybScsXG4gICdybWRpcicsXG4gICdzdGF0JyxcbiAgJ3N5bWxpbmsnLFxuICAndHJ1bmNhdGUnLFxuICAndW5saW5rJyxcbiAgJ3V0aW1lcycsXG4gICd3cml0ZUZpbGUnXG5dLmZpbHRlcihrZXkgPT4ge1xuICAvLyBTb21lIGNvbW1hbmRzIGFyZSBub3QgYXZhaWxhYmxlIG9uIHNvbWUgc3lzdGVtcy4gRXg6XG4gIC8vIGZzLmNwIHdhcyBhZGRlZCBpbiBOb2RlLmpzIHYxNi43LjBcbiAgLy8gZnMubGNob3duIGlzIG5vdCBhdmFpbGFibGUgb24gYXQgbGVhc3Qgc29tZSBMaW51eFxuICByZXR1cm4gdHlwZW9mIGZzW2tleV0gPT09ICdmdW5jdGlvbidcbn0pXG5cbi8vIEV4cG9ydCBjbG9uZWQgZnM6XG5PYmplY3QuYXNzaWduKGV4cG9ydHMsIGZzKVxuXG4vLyBVbml2ZXJzYWxpZnkgYXN5bmMgbWV0aG9kczpcbmFwaS5mb3JFYWNoKG1ldGhvZCA9PiB7XG4gIGV4cG9ydHNbbWV0aG9kXSA9IHUoZnNbbWV0aG9kXSlcbn0pXG5cbi8vIFdlIGRpZmZlciBmcm9tIG16L2ZzIGluIHRoYXQgd2Ugc3RpbGwgc2hpcCB0aGUgb2xkLCBicm9rZW4sIGZzLmV4aXN0cygpXG4vLyBzaW5jZSB3ZSBhcmUgYSBkcm9wLWluIHJlcGxhY2VtZW50IGZvciB0aGUgbmF0aXZlIG1vZHVsZVxuZXhwb3J0cy5leGlzdHMgPSBmdW5jdGlvbiAoZmlsZW5hbWUsIGNhbGxiYWNrKSB7XG4gIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZnMuZXhpc3RzKGZpbGVuYW1lLCBjYWxsYmFjaylcbiAgfVxuICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgcmV0dXJuIGZzLmV4aXN0cyhmaWxlbmFtZSwgcmVzb2x2ZSlcbiAgfSlcbn1cblxuLy8gZnMucmVhZCgpLCBmcy53cml0ZSgpLCBmcy5yZWFkdigpLCAmIGZzLndyaXRldigpIG5lZWQgc3BlY2lhbCB0cmVhdG1lbnQgZHVlIHRvIG11bHRpcGxlIGNhbGxiYWNrIGFyZ3NcblxuZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24gKGZkLCBidWZmZXIsIG9mZnNldCwgbGVuZ3RoLCBwb3NpdGlvbiwgY2FsbGJhY2spIHtcbiAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmcy5yZWFkKGZkLCBidWZmZXIsIG9mZnNldCwgbGVuZ3RoLCBwb3NpdGlvbiwgY2FsbGJhY2spXG4gIH1cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBmcy5yZWFkKGZkLCBidWZmZXIsIG9mZnNldCwgbGVuZ3RoLCBwb3NpdGlvbiwgKGVyciwgYnl0ZXNSZWFkLCBidWZmZXIpID0+IHtcbiAgICAgIGlmIChlcnIpIHJldHVybiByZWplY3QoZXJyKVxuICAgICAgcmVzb2x2ZSh7IGJ5dGVzUmVhZCwgYnVmZmVyIH0pXG4gICAgfSlcbiAgfSlcbn1cblxuLy8gRnVuY3Rpb24gc2lnbmF0dXJlIGNhbiBiZVxuLy8gZnMud3JpdGUoZmQsIGJ1ZmZlclssIG9mZnNldFssIGxlbmd0aFssIHBvc2l0aW9uXV1dLCBjYWxsYmFjaylcbi8vIE9SXG4vLyBmcy53cml0ZShmZCwgc3RyaW5nWywgcG9zaXRpb25bLCBlbmNvZGluZ11dLCBjYWxsYmFjaylcbi8vIFdlIG5lZWQgdG8gaGFuZGxlIGJvdGggY2FzZXMsIHNvIHdlIHVzZSAuLi5hcmdzXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24gKGZkLCBidWZmZXIsIC4uLmFyZ3MpIHtcbiAgaWYgKHR5cGVvZiBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZnMud3JpdGUoZmQsIGJ1ZmZlciwgLi4uYXJncylcbiAgfVxuXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgZnMud3JpdGUoZmQsIGJ1ZmZlciwgLi4uYXJncywgKGVyciwgYnl0ZXNXcml0dGVuLCBidWZmZXIpID0+IHtcbiAgICAgIGlmIChlcnIpIHJldHVybiByZWplY3QoZXJyKVxuICAgICAgcmVzb2x2ZSh7IGJ5dGVzV3JpdHRlbiwgYnVmZmVyIH0pXG4gICAgfSlcbiAgfSlcbn1cblxuLy8gRnVuY3Rpb24gc2lnbmF0dXJlIGlzXG4vLyBzLnJlYWR2KGZkLCBidWZmZXJzWywgcG9zaXRpb25dLCBjYWxsYmFjaylcbi8vIFdlIG5lZWQgdG8gaGFuZGxlIHRoZSBvcHRpb25hbCBhcmcsIHNvIHdlIHVzZSAuLi5hcmdzXG5leHBvcnRzLnJlYWR2ID0gZnVuY3Rpb24gKGZkLCBidWZmZXJzLCAuLi5hcmdzKSB7XG4gIGlmICh0eXBlb2YgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZzLnJlYWR2KGZkLCBidWZmZXJzLCAuLi5hcmdzKVxuICB9XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBmcy5yZWFkdihmZCwgYnVmZmVycywgLi4uYXJncywgKGVyciwgYnl0ZXNSZWFkLCBidWZmZXJzKSA9PiB7XG4gICAgICBpZiAoZXJyKSByZXR1cm4gcmVqZWN0KGVycilcbiAgICAgIHJlc29sdmUoeyBieXRlc1JlYWQsIGJ1ZmZlcnMgfSlcbiAgICB9KVxuICB9KVxufVxuXG4vLyBGdW5jdGlvbiBzaWduYXR1cmUgaXNcbi8vIHMud3JpdGV2KGZkLCBidWZmZXJzWywgcG9zaXRpb25dLCBjYWxsYmFjaylcbi8vIFdlIG5lZWQgdG8gaGFuZGxlIHRoZSBvcHRpb25hbCBhcmcsIHNvIHdlIHVzZSAuLi5hcmdzXG5leHBvcnRzLndyaXRldiA9IGZ1bmN0aW9uIChmZCwgYnVmZmVycywgLi4uYXJncykge1xuICBpZiAodHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmcy53cml0ZXYoZmQsIGJ1ZmZlcnMsIC4uLmFyZ3MpXG4gIH1cblxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGZzLndyaXRldihmZCwgYnVmZmVycywgLi4uYXJncywgKGVyciwgYnl0ZXNXcml0dGVuLCBidWZmZXJzKSA9PiB7XG4gICAgICBpZiAoZXJyKSByZXR1cm4gcmVqZWN0KGVycilcbiAgICAgIHJlc29sdmUoeyBieXRlc1dyaXR0ZW4sIGJ1ZmZlcnMgfSlcbiAgICB9KVxuICB9KVxufVxuXG4vLyBmcy5yZWFscGF0aC5uYXRpdmUgc29tZXRpbWVzIG5vdCBhdmFpbGFibGUgaWYgZnMgaXMgbW9ua2V5LXBhdGNoZWRcbmlmICh0eXBlb2YgZnMucmVhbHBhdGgubmF0aXZlID09PSAnZnVuY3Rpb24nKSB7XG4gIGV4cG9ydHMucmVhbHBhdGgubmF0aXZlID0gdShmcy5yZWFscGF0aC5uYXRpdmUpXG59IGVsc2Uge1xuICBwcm9jZXNzLmVtaXRXYXJuaW5nKFxuICAgICdmcy5yZWFscGF0aC5uYXRpdmUgaXMgbm90IGEgZnVuY3Rpb24uIElzIGZzIGJlaW5nIG1vbmtleS1wYXRjaGVkPycsXG4gICAgJ1dhcm5pbmcnLCAnZnMtZXh0cmEtV0FSTjAwMDMnXG4gIClcbn1cbiIsICIvLyBBZGFwdGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL3NpbmRyZXNvcmh1cy9tYWtlLWRpclxuLy8gQ29weXJpZ2h0IChjKSBTaW5kcmUgU29yaHVzIDxzaW5kcmVzb3JodXNAZ21haWwuY29tPiAoc2luZHJlc29yaHVzLmNvbSlcbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuJ3VzZSBzdHJpY3QnXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlanMvbm9kZS9pc3N1ZXMvODk4N1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL2xpYnV2L2xpYnV2L3B1bGwvMTA4OFxubW9kdWxlLmV4cG9ydHMuY2hlY2tQYXRoID0gZnVuY3Rpb24gY2hlY2tQYXRoIChwdGgpIHtcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICBjb25zdCBwYXRoSGFzSW52YWxpZFdpbkNoYXJhY3RlcnMgPSAvWzw+OlwifD8qXS8udGVzdChwdGgucmVwbGFjZShwYXRoLnBhcnNlKHB0aCkucm9vdCwgJycpKVxuXG4gICAgaWYgKHBhdGhIYXNJbnZhbGlkV2luQ2hhcmFjdGVycykge1xuICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYFBhdGggY29udGFpbnMgaW52YWxpZCBjaGFyYWN0ZXJzOiAke3B0aH1gKVxuICAgICAgZXJyb3IuY29kZSA9ICdFSU5WQUwnXG4gICAgICB0aHJvdyBlcnJvclxuICAgIH1cbiAgfVxufVxuIiwgIid1c2Ugc3RyaWN0J1xuY29uc3QgZnMgPSByZXF1aXJlKCcuLi9mcycpXG5jb25zdCB7IGNoZWNrUGF0aCB9ID0gcmVxdWlyZSgnLi91dGlscycpXG5cbmNvbnN0IGdldE1vZGUgPSBvcHRpb25zID0+IHtcbiAgY29uc3QgZGVmYXVsdHMgPSB7IG1vZGU6IDBvNzc3IH1cbiAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnbnVtYmVyJykgcmV0dXJuIG9wdGlvbnNcbiAgcmV0dXJuICh7IC4uLmRlZmF1bHRzLCAuLi5vcHRpb25zIH0pLm1vZGVcbn1cblxubW9kdWxlLmV4cG9ydHMubWFrZURpciA9IGFzeW5jIChkaXIsIG9wdGlvbnMpID0+IHtcbiAgY2hlY2tQYXRoKGRpcilcblxuICByZXR1cm4gZnMubWtkaXIoZGlyLCB7XG4gICAgbW9kZTogZ2V0TW9kZShvcHRpb25zKSxcbiAgICByZWN1cnNpdmU6IHRydWVcbiAgfSlcbn1cblxubW9kdWxlLmV4cG9ydHMubWFrZURpclN5bmMgPSAoZGlyLCBvcHRpb25zKSA9PiB7XG4gIGNoZWNrUGF0aChkaXIpXG5cbiAgcmV0dXJuIGZzLm1rZGlyU3luYyhkaXIsIHtcbiAgICBtb2RlOiBnZXRNb2RlKG9wdGlvbnMpLFxuICAgIHJlY3Vyc2l2ZTogdHJ1ZVxuICB9KVxufVxuIiwgIid1c2Ugc3RyaWN0J1xuY29uc3QgdSA9IHJlcXVpcmUoJ3VuaXZlcnNhbGlmeScpLmZyb21Qcm9taXNlXG5jb25zdCB7IG1ha2VEaXI6IF9tYWtlRGlyLCBtYWtlRGlyU3luYyB9ID0gcmVxdWlyZSgnLi9tYWtlLWRpcicpXG5jb25zdCBtYWtlRGlyID0gdShfbWFrZURpcilcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1rZGlyczogbWFrZURpcixcbiAgbWtkaXJzU3luYzogbWFrZURpclN5bmMsXG4gIC8vIGFsaWFzXG4gIG1rZGlycDogbWFrZURpcixcbiAgbWtkaXJwU3luYzogbWFrZURpclN5bmMsXG4gIGVuc3VyZURpcjogbWFrZURpcixcbiAgZW5zdXJlRGlyU3luYzogbWFrZURpclN5bmNcbn1cbiIsICIndXNlIHN0cmljdCdcbmNvbnN0IHUgPSByZXF1aXJlKCd1bml2ZXJzYWxpZnknKS5mcm9tUHJvbWlzZVxuY29uc3QgZnMgPSByZXF1aXJlKCcuLi9mcycpXG5cbmZ1bmN0aW9uIHBhdGhFeGlzdHMgKHBhdGgpIHtcbiAgcmV0dXJuIGZzLmFjY2VzcyhwYXRoKS50aGVuKCgpID0+IHRydWUpLmNhdGNoKCgpID0+IGZhbHNlKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgcGF0aEV4aXN0czogdShwYXRoRXhpc3RzKSxcbiAgcGF0aEV4aXN0c1N5bmM6IGZzLmV4aXN0c1N5bmNcbn1cbiIsICIndXNlIHN0cmljdCdcblxuY29uc3QgZnMgPSByZXF1aXJlKCcuLi9mcycpXG5jb25zdCB1ID0gcmVxdWlyZSgndW5pdmVyc2FsaWZ5JykuZnJvbVByb21pc2VcblxuYXN5bmMgZnVuY3Rpb24gdXRpbWVzTWlsbGlzIChwYXRoLCBhdGltZSwgbXRpbWUpIHtcbiAgLy8gaWYgKCFIQVNfTUlMTElTX1JFUykgcmV0dXJuIGZzLnV0aW1lcyhwYXRoLCBhdGltZSwgbXRpbWUsIGNhbGxiYWNrKVxuICBjb25zdCBmZCA9IGF3YWl0IGZzLm9wZW4ocGF0aCwgJ3IrJylcblxuICBsZXQgY2xvc2VFcnIgPSBudWxsXG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy5mdXRpbWVzKGZkLCBhdGltZSwgbXRpbWUpXG4gIH0gZmluYWxseSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLmNsb3NlKGZkKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNsb3NlRXJyID0gZVxuICAgIH1cbiAgfVxuXG4gIGlmIChjbG9zZUVycikge1xuICAgIHRocm93IGNsb3NlRXJyXG4gIH1cbn1cblxuZnVuY3Rpb24gdXRpbWVzTWlsbGlzU3luYyAocGF0aCwgYXRpbWUsIG10aW1lKSB7XG4gIGNvbnN0IGZkID0gZnMub3BlblN5bmMocGF0aCwgJ3IrJylcbiAgZnMuZnV0aW1lc1N5bmMoZmQsIGF0aW1lLCBtdGltZSlcbiAgcmV0dXJuIGZzLmNsb3NlU3luYyhmZClcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHV0aW1lc01pbGxpczogdSh1dGltZXNNaWxsaXMpLFxuICB1dGltZXNNaWxsaXNTeW5jXG59XG4iLCAiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IGZzID0gcmVxdWlyZSgnLi4vZnMnKVxuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuY29uc3QgdSA9IHJlcXVpcmUoJ3VuaXZlcnNhbGlmeScpLmZyb21Qcm9taXNlXG5cbmZ1bmN0aW9uIGdldFN0YXRzIChzcmMsIGRlc3QsIG9wdHMpIHtcbiAgY29uc3Qgc3RhdEZ1bmMgPSBvcHRzLmRlcmVmZXJlbmNlXG4gICAgPyAoZmlsZSkgPT4gZnMuc3RhdChmaWxlLCB7IGJpZ2ludDogdHJ1ZSB9KVxuICAgIDogKGZpbGUpID0+IGZzLmxzdGF0KGZpbGUsIHsgYmlnaW50OiB0cnVlIH0pXG4gIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgc3RhdEZ1bmMoc3JjKSxcbiAgICBzdGF0RnVuYyhkZXN0KS5jYXRjaChlcnIgPT4ge1xuICAgICAgaWYgKGVyci5jb2RlID09PSAnRU5PRU5UJykgcmV0dXJuIG51bGxcbiAgICAgIHRocm93IGVyclxuICAgIH0pXG4gIF0pLnRoZW4oKFtzcmNTdGF0LCBkZXN0U3RhdF0pID0+ICh7IHNyY1N0YXQsIGRlc3RTdGF0IH0pKVxufVxuXG5mdW5jdGlvbiBnZXRTdGF0c1N5bmMgKHNyYywgZGVzdCwgb3B0cykge1xuICBsZXQgZGVzdFN0YXRcbiAgY29uc3Qgc3RhdEZ1bmMgPSBvcHRzLmRlcmVmZXJlbmNlXG4gICAgPyAoZmlsZSkgPT4gZnMuc3RhdFN5bmMoZmlsZSwgeyBiaWdpbnQ6IHRydWUgfSlcbiAgICA6IChmaWxlKSA9PiBmcy5sc3RhdFN5bmMoZmlsZSwgeyBiaWdpbnQ6IHRydWUgfSlcbiAgY29uc3Qgc3JjU3RhdCA9IHN0YXRGdW5jKHNyYylcbiAgdHJ5IHtcbiAgICBkZXN0U3RhdCA9IHN0YXRGdW5jKGRlc3QpXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpIHJldHVybiB7IHNyY1N0YXQsIGRlc3RTdGF0OiBudWxsIH1cbiAgICB0aHJvdyBlcnJcbiAgfVxuICByZXR1cm4geyBzcmNTdGF0LCBkZXN0U3RhdCB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNoZWNrUGF0aHMgKHNyYywgZGVzdCwgZnVuY05hbWUsIG9wdHMpIHtcbiAgY29uc3QgeyBzcmNTdGF0LCBkZXN0U3RhdCB9ID0gYXdhaXQgZ2V0U3RhdHMoc3JjLCBkZXN0LCBvcHRzKVxuICBpZiAoZGVzdFN0YXQpIHtcbiAgICBpZiAoYXJlSWRlbnRpY2FsKHNyY1N0YXQsIGRlc3RTdGF0KSkge1xuICAgICAgY29uc3Qgc3JjQmFzZU5hbWUgPSBwYXRoLmJhc2VuYW1lKHNyYylcbiAgICAgIGNvbnN0IGRlc3RCYXNlTmFtZSA9IHBhdGguYmFzZW5hbWUoZGVzdClcbiAgICAgIGlmIChmdW5jTmFtZSA9PT0gJ21vdmUnICYmXG4gICAgICAgIHNyY0Jhc2VOYW1lICE9PSBkZXN0QmFzZU5hbWUgJiZcbiAgICAgICAgc3JjQmFzZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gZGVzdEJhc2VOYW1lLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgcmV0dXJuIHsgc3JjU3RhdCwgZGVzdFN0YXQsIGlzQ2hhbmdpbmdDYXNlOiB0cnVlIH1cbiAgICAgIH1cbiAgICAgIHRocm93IG5ldyBFcnJvcignU291cmNlIGFuZCBkZXN0aW5hdGlvbiBtdXN0IG5vdCBiZSB0aGUgc2FtZS4nKVxuICAgIH1cbiAgICBpZiAoc3JjU3RhdC5pc0RpcmVjdG9yeSgpICYmICFkZXN0U3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBvdmVyd3JpdGUgbm9uLWRpcmVjdG9yeSAnJHtkZXN0fScgd2l0aCBkaXJlY3RvcnkgJyR7c3JjfScuYClcbiAgICB9XG4gICAgaWYgKCFzcmNTdGF0LmlzRGlyZWN0b3J5KCkgJiYgZGVzdFN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3Qgb3ZlcndyaXRlIGRpcmVjdG9yeSAnJHtkZXN0fScgd2l0aCBub24tZGlyZWN0b3J5ICcke3NyY30nLmApXG4gICAgfVxuICB9XG5cbiAgaWYgKHNyY1N0YXQuaXNEaXJlY3RvcnkoKSAmJiBpc1NyY1N1YmRpcihzcmMsIGRlc3QpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGVyck1zZyhzcmMsIGRlc3QsIGZ1bmNOYW1lKSlcbiAgfVxuXG4gIHJldHVybiB7IHNyY1N0YXQsIGRlc3RTdGF0IH1cbn1cblxuZnVuY3Rpb24gY2hlY2tQYXRoc1N5bmMgKHNyYywgZGVzdCwgZnVuY05hbWUsIG9wdHMpIHtcbiAgY29uc3QgeyBzcmNTdGF0LCBkZXN0U3RhdCB9ID0gZ2V0U3RhdHNTeW5jKHNyYywgZGVzdCwgb3B0cylcblxuICBpZiAoZGVzdFN0YXQpIHtcbiAgICBpZiAoYXJlSWRlbnRpY2FsKHNyY1N0YXQsIGRlc3RTdGF0KSkge1xuICAgICAgY29uc3Qgc3JjQmFzZU5hbWUgPSBwYXRoLmJhc2VuYW1lKHNyYylcbiAgICAgIGNvbnN0IGRlc3RCYXNlTmFtZSA9IHBhdGguYmFzZW5hbWUoZGVzdClcbiAgICAgIGlmIChmdW5jTmFtZSA9PT0gJ21vdmUnICYmXG4gICAgICAgIHNyY0Jhc2VOYW1lICE9PSBkZXN0QmFzZU5hbWUgJiZcbiAgICAgICAgc3JjQmFzZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gZGVzdEJhc2VOYW1lLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgcmV0dXJuIHsgc3JjU3RhdCwgZGVzdFN0YXQsIGlzQ2hhbmdpbmdDYXNlOiB0cnVlIH1cbiAgICAgIH1cbiAgICAgIHRocm93IG5ldyBFcnJvcignU291cmNlIGFuZCBkZXN0aW5hdGlvbiBtdXN0IG5vdCBiZSB0aGUgc2FtZS4nKVxuICAgIH1cbiAgICBpZiAoc3JjU3RhdC5pc0RpcmVjdG9yeSgpICYmICFkZXN0U3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBvdmVyd3JpdGUgbm9uLWRpcmVjdG9yeSAnJHtkZXN0fScgd2l0aCBkaXJlY3RvcnkgJyR7c3JjfScuYClcbiAgICB9XG4gICAgaWYgKCFzcmNTdGF0LmlzRGlyZWN0b3J5KCkgJiYgZGVzdFN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3Qgb3ZlcndyaXRlIGRpcmVjdG9yeSAnJHtkZXN0fScgd2l0aCBub24tZGlyZWN0b3J5ICcke3NyY30nLmApXG4gICAgfVxuICB9XG5cbiAgaWYgKHNyY1N0YXQuaXNEaXJlY3RvcnkoKSAmJiBpc1NyY1N1YmRpcihzcmMsIGRlc3QpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGVyck1zZyhzcmMsIGRlc3QsIGZ1bmNOYW1lKSlcbiAgfVxuICByZXR1cm4geyBzcmNTdGF0LCBkZXN0U3RhdCB9XG59XG5cbi8vIHJlY3Vyc2l2ZWx5IGNoZWNrIGlmIGRlc3QgcGFyZW50IGlzIGEgc3ViZGlyZWN0b3J5IG9mIHNyYy5cbi8vIEl0IHdvcmtzIGZvciBhbGwgZmlsZSB0eXBlcyBpbmNsdWRpbmcgc3ltbGlua3Mgc2luY2UgaXRcbi8vIGNoZWNrcyB0aGUgc3JjIGFuZCBkZXN0IGlub2Rlcy4gSXQgc3RhcnRzIGZyb20gdGhlIGRlZXBlc3Rcbi8vIHBhcmVudCBhbmQgc3RvcHMgb25jZSBpdCByZWFjaGVzIHRoZSBzcmMgcGFyZW50IG9yIHRoZSByb290IHBhdGguXG5hc3luYyBmdW5jdGlvbiBjaGVja1BhcmVudFBhdGhzIChzcmMsIHNyY1N0YXQsIGRlc3QsIGZ1bmNOYW1lKSB7XG4gIGNvbnN0IHNyY1BhcmVudCA9IHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUoc3JjKSlcbiAgY29uc3QgZGVzdFBhcmVudCA9IHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUoZGVzdCkpXG4gIGlmIChkZXN0UGFyZW50ID09PSBzcmNQYXJlbnQgfHwgZGVzdFBhcmVudCA9PT0gcGF0aC5wYXJzZShkZXN0UGFyZW50KS5yb290KSByZXR1cm5cblxuICBsZXQgZGVzdFN0YXRcbiAgdHJ5IHtcbiAgICBkZXN0U3RhdCA9IGF3YWl0IGZzLnN0YXQoZGVzdFBhcmVudCwgeyBiaWdpbnQ6IHRydWUgfSlcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyci5jb2RlID09PSAnRU5PRU5UJykgcmV0dXJuXG4gICAgdGhyb3cgZXJyXG4gIH1cblxuICBpZiAoYXJlSWRlbnRpY2FsKHNyY1N0YXQsIGRlc3RTdGF0KSkge1xuICAgIHRocm93IG5ldyBFcnJvcihlcnJNc2coc3JjLCBkZXN0LCBmdW5jTmFtZSkpXG4gIH1cblxuICByZXR1cm4gY2hlY2tQYXJlbnRQYXRocyhzcmMsIHNyY1N0YXQsIGRlc3RQYXJlbnQsIGZ1bmNOYW1lKVxufVxuXG5mdW5jdGlvbiBjaGVja1BhcmVudFBhdGhzU3luYyAoc3JjLCBzcmNTdGF0LCBkZXN0LCBmdW5jTmFtZSkge1xuICBjb25zdCBzcmNQYXJlbnQgPSBwYXRoLnJlc29sdmUocGF0aC5kaXJuYW1lKHNyYykpXG4gIGNvbnN0IGRlc3RQYXJlbnQgPSBwYXRoLnJlc29sdmUocGF0aC5kaXJuYW1lKGRlc3QpKVxuICBpZiAoZGVzdFBhcmVudCA9PT0gc3JjUGFyZW50IHx8IGRlc3RQYXJlbnQgPT09IHBhdGgucGFyc2UoZGVzdFBhcmVudCkucm9vdCkgcmV0dXJuXG4gIGxldCBkZXN0U3RhdFxuICB0cnkge1xuICAgIGRlc3RTdGF0ID0gZnMuc3RhdFN5bmMoZGVzdFBhcmVudCwgeyBiaWdpbnQ6IHRydWUgfSlcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyci5jb2RlID09PSAnRU5PRU5UJykgcmV0dXJuXG4gICAgdGhyb3cgZXJyXG4gIH1cbiAgaWYgKGFyZUlkZW50aWNhbChzcmNTdGF0LCBkZXN0U3RhdCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZXJyTXNnKHNyYywgZGVzdCwgZnVuY05hbWUpKVxuICB9XG4gIHJldHVybiBjaGVja1BhcmVudFBhdGhzU3luYyhzcmMsIHNyY1N0YXQsIGRlc3RQYXJlbnQsIGZ1bmNOYW1lKVxufVxuXG5mdW5jdGlvbiBhcmVJZGVudGljYWwgKHNyY1N0YXQsIGRlc3RTdGF0KSB7XG4gIHJldHVybiBkZXN0U3RhdC5pbm8gJiYgZGVzdFN0YXQuZGV2ICYmIGRlc3RTdGF0LmlubyA9PT0gc3JjU3RhdC5pbm8gJiYgZGVzdFN0YXQuZGV2ID09PSBzcmNTdGF0LmRldlxufVxuXG4vLyByZXR1cm4gdHJ1ZSBpZiBkZXN0IGlzIGEgc3ViZGlyIG9mIHNyYywgb3RoZXJ3aXNlIGZhbHNlLlxuLy8gSXQgb25seSBjaGVja3MgdGhlIHBhdGggc3RyaW5ncy5cbmZ1bmN0aW9uIGlzU3JjU3ViZGlyIChzcmMsIGRlc3QpIHtcbiAgY29uc3Qgc3JjQXJyID0gcGF0aC5yZXNvbHZlKHNyYykuc3BsaXQocGF0aC5zZXApLmZpbHRlcihpID0+IGkpXG4gIGNvbnN0IGRlc3RBcnIgPSBwYXRoLnJlc29sdmUoZGVzdCkuc3BsaXQocGF0aC5zZXApLmZpbHRlcihpID0+IGkpXG4gIHJldHVybiBzcmNBcnIuZXZlcnkoKGN1ciwgaSkgPT4gZGVzdEFycltpXSA9PT0gY3VyKVxufVxuXG5mdW5jdGlvbiBlcnJNc2cgKHNyYywgZGVzdCwgZnVuY05hbWUpIHtcbiAgcmV0dXJuIGBDYW5ub3QgJHtmdW5jTmFtZX0gJyR7c3JjfScgdG8gYSBzdWJkaXJlY3Rvcnkgb2YgaXRzZWxmLCAnJHtkZXN0fScuYFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgLy8gY2hlY2tQYXRoc1xuICBjaGVja1BhdGhzOiB1KGNoZWNrUGF0aHMpLFxuICBjaGVja1BhdGhzU3luYyxcbiAgLy8gY2hlY2tQYXJlbnRcbiAgY2hlY2tQYXJlbnRQYXRoczogdShjaGVja1BhcmVudFBhdGhzKSxcbiAgY2hlY2tQYXJlbnRQYXRoc1N5bmMsXG4gIC8vIE1pc2NcbiAgaXNTcmNTdWJkaXIsXG4gIGFyZUlkZW50aWNhbFxufVxuIiwgIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBmcyA9IHJlcXVpcmUoJy4uL2ZzJylcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcbmNvbnN0IHsgbWtkaXJzIH0gPSByZXF1aXJlKCcuLi9ta2RpcnMnKVxuY29uc3QgeyBwYXRoRXhpc3RzIH0gPSByZXF1aXJlKCcuLi9wYXRoLWV4aXN0cycpXG5jb25zdCB7IHV0aW1lc01pbGxpcyB9ID0gcmVxdWlyZSgnLi4vdXRpbC91dGltZXMnKVxuY29uc3Qgc3RhdCA9IHJlcXVpcmUoJy4uL3V0aWwvc3RhdCcpXG5cbmFzeW5jIGZ1bmN0aW9uIGNvcHkgKHNyYywgZGVzdCwgb3B0cyA9IHt9KSB7XG4gIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIG9wdHMgPSB7IGZpbHRlcjogb3B0cyB9XG4gIH1cblxuICBvcHRzLmNsb2JiZXIgPSAnY2xvYmJlcicgaW4gb3B0cyA/ICEhb3B0cy5jbG9iYmVyIDogdHJ1ZSAvLyBkZWZhdWx0IHRvIHRydWUgZm9yIG5vd1xuICBvcHRzLm92ZXJ3cml0ZSA9ICdvdmVyd3JpdGUnIGluIG9wdHMgPyAhIW9wdHMub3ZlcndyaXRlIDogb3B0cy5jbG9iYmVyIC8vIG92ZXJ3cml0ZSBmYWxscyBiYWNrIHRvIGNsb2JiZXJcblxuICAvLyBXYXJuIGFib3V0IHVzaW5nIHByZXNlcnZlVGltZXN0YW1wcyBvbiAzMi1iaXQgbm9kZVxuICBpZiAob3B0cy5wcmVzZXJ2ZVRpbWVzdGFtcHMgJiYgcHJvY2Vzcy5hcmNoID09PSAnaWEzMicpIHtcbiAgICBwcm9jZXNzLmVtaXRXYXJuaW5nKFxuICAgICAgJ1VzaW5nIHRoZSBwcmVzZXJ2ZVRpbWVzdGFtcHMgb3B0aW9uIGluIDMyLWJpdCBub2RlIGlzIG5vdCByZWNvbW1lbmRlZDtcXG5cXG4nICtcbiAgICAgICdcXHRzZWUgaHR0cHM6Ly9naXRodWIuY29tL2pwcmljaGFyZHNvbi9ub2RlLWZzLWV4dHJhL2lzc3Vlcy8yNjknLFxuICAgICAgJ1dhcm5pbmcnLCAnZnMtZXh0cmEtV0FSTjAwMDEnXG4gICAgKVxuICB9XG5cbiAgY29uc3QgeyBzcmNTdGF0LCBkZXN0U3RhdCB9ID0gYXdhaXQgc3RhdC5jaGVja1BhdGhzKHNyYywgZGVzdCwgJ2NvcHknLCBvcHRzKVxuXG4gIGF3YWl0IHN0YXQuY2hlY2tQYXJlbnRQYXRocyhzcmMsIHNyY1N0YXQsIGRlc3QsICdjb3B5JylcblxuICBjb25zdCBpbmNsdWRlID0gYXdhaXQgcnVuRmlsdGVyKHNyYywgZGVzdCwgb3B0cylcblxuICBpZiAoIWluY2x1ZGUpIHJldHVyblxuXG4gIC8vIGNoZWNrIGlmIHRoZSBwYXJlbnQgb2YgZGVzdCBleGlzdHMsIGFuZCBjcmVhdGUgaXQgaWYgaXQgZG9lc24ndCBleGlzdFxuICBjb25zdCBkZXN0UGFyZW50ID0gcGF0aC5kaXJuYW1lKGRlc3QpXG4gIGNvbnN0IGRpckV4aXN0cyA9IGF3YWl0IHBhdGhFeGlzdHMoZGVzdFBhcmVudClcbiAgaWYgKCFkaXJFeGlzdHMpIHtcbiAgICBhd2FpdCBta2RpcnMoZGVzdFBhcmVudClcbiAgfVxuXG4gIGF3YWl0IGdldFN0YXRzQW5kUGVyZm9ybUNvcHkoZGVzdFN0YXQsIHNyYywgZGVzdCwgb3B0cylcbn1cblxuYXN5bmMgZnVuY3Rpb24gcnVuRmlsdGVyIChzcmMsIGRlc3QsIG9wdHMpIHtcbiAgaWYgKCFvcHRzLmZpbHRlcikgcmV0dXJuIHRydWVcbiAgcmV0dXJuIG9wdHMuZmlsdGVyKHNyYywgZGVzdClcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0U3RhdHNBbmRQZXJmb3JtQ29weSAoZGVzdFN0YXQsIHNyYywgZGVzdCwgb3B0cykge1xuICBjb25zdCBzdGF0Rm4gPSBvcHRzLmRlcmVmZXJlbmNlID8gZnMuc3RhdCA6IGZzLmxzdGF0XG4gIGNvbnN0IHNyY1N0YXQgPSBhd2FpdCBzdGF0Rm4oc3JjKVxuXG4gIGlmIChzcmNTdGF0LmlzRGlyZWN0b3J5KCkpIHJldHVybiBvbkRpcihzcmNTdGF0LCBkZXN0U3RhdCwgc3JjLCBkZXN0LCBvcHRzKVxuXG4gIGlmIChcbiAgICBzcmNTdGF0LmlzRmlsZSgpIHx8XG4gICAgc3JjU3RhdC5pc0NoYXJhY3RlckRldmljZSgpIHx8XG4gICAgc3JjU3RhdC5pc0Jsb2NrRGV2aWNlKClcbiAgKSByZXR1cm4gb25GaWxlKHNyY1N0YXQsIGRlc3RTdGF0LCBzcmMsIGRlc3QsIG9wdHMpXG5cbiAgaWYgKHNyY1N0YXQuaXNTeW1ib2xpY0xpbmsoKSkgcmV0dXJuIG9uTGluayhkZXN0U3RhdCwgc3JjLCBkZXN0LCBvcHRzKVxuICBpZiAoc3JjU3RhdC5pc1NvY2tldCgpKSB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBjb3B5IGEgc29ja2V0IGZpbGU6ICR7c3JjfWApXG4gIGlmIChzcmNTdGF0LmlzRklGTygpKSB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBjb3B5IGEgRklGTyBwaXBlOiAke3NyY31gKVxuICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gZmlsZTogJHtzcmN9YClcbn1cblxuYXN5bmMgZnVuY3Rpb24gb25GaWxlIChzcmNTdGF0LCBkZXN0U3RhdCwgc3JjLCBkZXN0LCBvcHRzKSB7XG4gIGlmICghZGVzdFN0YXQpIHJldHVybiBjb3B5RmlsZShzcmNTdGF0LCBzcmMsIGRlc3QsIG9wdHMpXG5cbiAgaWYgKG9wdHMub3ZlcndyaXRlKSB7XG4gICAgYXdhaXQgZnMudW5saW5rKGRlc3QpXG4gICAgcmV0dXJuIGNvcHlGaWxlKHNyY1N0YXQsIHNyYywgZGVzdCwgb3B0cylcbiAgfVxuICBpZiAob3B0cy5lcnJvck9uRXhpc3QpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCcke2Rlc3R9JyBhbHJlYWR5IGV4aXN0c2ApXG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY29weUZpbGUgKHNyY1N0YXQsIHNyYywgZGVzdCwgb3B0cykge1xuICBhd2FpdCBmcy5jb3B5RmlsZShzcmMsIGRlc3QpXG4gIGlmIChvcHRzLnByZXNlcnZlVGltZXN0YW1wcykge1xuICAgIC8vIE1ha2Ugc3VyZSB0aGUgZmlsZSBpcyB3cml0YWJsZSBiZWZvcmUgc2V0dGluZyB0aGUgdGltZXN0YW1wXG4gICAgLy8gb3RoZXJ3aXNlIG9wZW4gZmFpbHMgd2l0aCBFUEVSTSB3aGVuIGludm9rZWQgd2l0aCAncisnXG4gICAgLy8gKHRocm91Z2ggdXRpbWVzIGNhbGwpXG4gICAgaWYgKGZpbGVJc05vdFdyaXRhYmxlKHNyY1N0YXQubW9kZSkpIHtcbiAgICAgIGF3YWl0IG1ha2VGaWxlV3JpdGFibGUoZGVzdCwgc3JjU3RhdC5tb2RlKVxuICAgIH1cblxuICAgIC8vIFNldCB0aW1lc3RhbXBzIGFuZCBtb2RlIGNvcnJlc3BvbmRpbmdseVxuXG4gICAgLy8gTm90ZSB0aGF0IFRoZSBpbml0aWFsIHNyY1N0YXQuYXRpbWUgY2Fubm90IGJlIHRydXN0ZWRcbiAgICAvLyBiZWNhdXNlIGl0IGlzIG1vZGlmaWVkIGJ5IHRoZSByZWFkKDIpIHN5c3RlbSBjYWxsXG4gICAgLy8gKFNlZSBodHRwczovL25vZGVqcy5vcmcvYXBpL2ZzLmh0bWwjZnNfc3RhdF90aW1lX3ZhbHVlcylcbiAgICBjb25zdCB1cGRhdGVkU3JjU3RhdCA9IGF3YWl0IGZzLnN0YXQoc3JjKVxuICAgIGF3YWl0IHV0aW1lc01pbGxpcyhkZXN0LCB1cGRhdGVkU3JjU3RhdC5hdGltZSwgdXBkYXRlZFNyY1N0YXQubXRpbWUpXG4gIH1cblxuICByZXR1cm4gZnMuY2htb2QoZGVzdCwgc3JjU3RhdC5tb2RlKVxufVxuXG5mdW5jdGlvbiBmaWxlSXNOb3RXcml0YWJsZSAoc3JjTW9kZSkge1xuICByZXR1cm4gKHNyY01vZGUgJiAwbzIwMCkgPT09IDBcbn1cblxuZnVuY3Rpb24gbWFrZUZpbGVXcml0YWJsZSAoZGVzdCwgc3JjTW9kZSkge1xuICByZXR1cm4gZnMuY2htb2QoZGVzdCwgc3JjTW9kZSB8IDBvMjAwKVxufVxuXG5hc3luYyBmdW5jdGlvbiBvbkRpciAoc3JjU3RhdCwgZGVzdFN0YXQsIHNyYywgZGVzdCwgb3B0cykge1xuICAvLyB0aGUgZGVzdCBkaXJlY3RvcnkgbWlnaHQgbm90IGV4aXN0LCBjcmVhdGUgaXRcbiAgaWYgKCFkZXN0U3RhdCkge1xuICAgIGF3YWl0IGZzLm1rZGlyKGRlc3QpXG4gIH1cblxuICBjb25zdCBpdGVtcyA9IGF3YWl0IGZzLnJlYWRkaXIoc3JjKVxuXG4gIC8vIGxvb3AgdGhyb3VnaCB0aGUgZmlsZXMgaW4gdGhlIGN1cnJlbnQgZGlyZWN0b3J5IHRvIGNvcHkgZXZlcnl0aGluZ1xuICBhd2FpdCBQcm9taXNlLmFsbChpdGVtcy5tYXAoYXN5bmMgaXRlbSA9PiB7XG4gICAgY29uc3Qgc3JjSXRlbSA9IHBhdGguam9pbihzcmMsIGl0ZW0pXG4gICAgY29uc3QgZGVzdEl0ZW0gPSBwYXRoLmpvaW4oZGVzdCwgaXRlbSlcblxuICAgIC8vIHNraXAgdGhlIGl0ZW0gaWYgaXQgaXMgbWF0Y2hlcyBieSB0aGUgZmlsdGVyIGZ1bmN0aW9uXG4gICAgY29uc3QgaW5jbHVkZSA9IGF3YWl0IHJ1bkZpbHRlcihzcmNJdGVtLCBkZXN0SXRlbSwgb3B0cylcbiAgICBpZiAoIWluY2x1ZGUpIHJldHVyblxuXG4gICAgY29uc3QgeyBkZXN0U3RhdCB9ID0gYXdhaXQgc3RhdC5jaGVja1BhdGhzKHNyY0l0ZW0sIGRlc3RJdGVtLCAnY29weScsIG9wdHMpXG5cbiAgICAvLyBJZiB0aGUgaXRlbSBpcyBhIGNvcHlhYmxlIGZpbGUsIGBnZXRTdGF0c0FuZFBlcmZvcm1Db3B5YCB3aWxsIGNvcHkgaXRcbiAgICAvLyBJZiB0aGUgaXRlbSBpcyBhIGRpcmVjdG9yeSwgYGdldFN0YXRzQW5kUGVyZm9ybUNvcHlgIHdpbGwgY2FsbCBgb25EaXJgIHJlY3Vyc2l2ZWx5XG4gICAgcmV0dXJuIGdldFN0YXRzQW5kUGVyZm9ybUNvcHkoZGVzdFN0YXQsIHNyY0l0ZW0sIGRlc3RJdGVtLCBvcHRzKVxuICB9KSlcblxuICBpZiAoIWRlc3RTdGF0KSB7XG4gICAgYXdhaXQgZnMuY2htb2QoZGVzdCwgc3JjU3RhdC5tb2RlKVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG9uTGluayAoZGVzdFN0YXQsIHNyYywgZGVzdCwgb3B0cykge1xuICBsZXQgcmVzb2x2ZWRTcmMgPSBhd2FpdCBmcy5yZWFkbGluayhzcmMpXG4gIGlmIChvcHRzLmRlcmVmZXJlbmNlKSB7XG4gICAgcmVzb2x2ZWRTcmMgPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgcmVzb2x2ZWRTcmMpXG4gIH1cbiAgaWYgKCFkZXN0U3RhdCkge1xuICAgIHJldHVybiBmcy5zeW1saW5rKHJlc29sdmVkU3JjLCBkZXN0KVxuICB9XG5cbiAgbGV0IHJlc29sdmVkRGVzdCA9IG51bGxcbiAgdHJ5IHtcbiAgICByZXNvbHZlZERlc3QgPSBhd2FpdCBmcy5yZWFkbGluayhkZXN0KVxuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gZGVzdCBleGlzdHMgYW5kIGlzIGEgcmVndWxhciBmaWxlIG9yIGRpcmVjdG9yeSxcbiAgICAvLyBXaW5kb3dzIG1heSB0aHJvdyBVTktOT1dOIGVycm9yLiBJZiBkZXN0IGFscmVhZHkgZXhpc3RzLFxuICAgIC8vIGZzIHRocm93cyBlcnJvciBhbnl3YXksIHNvIG5vIG5lZWQgdG8gZ3VhcmQgYWdhaW5zdCBpdCBoZXJlLlxuICAgIGlmIChlLmNvZGUgPT09ICdFSU5WQUwnIHx8IGUuY29kZSA9PT0gJ1VOS05PV04nKSByZXR1cm4gZnMuc3ltbGluayhyZXNvbHZlZFNyYywgZGVzdClcbiAgICB0aHJvdyBlXG4gIH1cbiAgaWYgKG9wdHMuZGVyZWZlcmVuY2UpIHtcbiAgICByZXNvbHZlZERlc3QgPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgcmVzb2x2ZWREZXN0KVxuICB9XG4gIGlmIChzdGF0LmlzU3JjU3ViZGlyKHJlc29sdmVkU3JjLCByZXNvbHZlZERlc3QpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgY29weSAnJHtyZXNvbHZlZFNyY30nIHRvIGEgc3ViZGlyZWN0b3J5IG9mIGl0c2VsZiwgJyR7cmVzb2x2ZWREZXN0fScuYClcbiAgfVxuXG4gIC8vIGRvIG5vdCBjb3B5IGlmIHNyYyBpcyBhIHN1YmRpciBvZiBkZXN0IHNpbmNlIHVubGlua2luZ1xuICAvLyBkZXN0IGluIHRoaXMgY2FzZSB3b3VsZCByZXN1bHQgaW4gcmVtb3Zpbmcgc3JjIGNvbnRlbnRzXG4gIC8vIGFuZCB0aGVyZWZvcmUgYSBicm9rZW4gc3ltbGluayB3b3VsZCBiZSBjcmVhdGVkLlxuICBpZiAoc3RhdC5pc1NyY1N1YmRpcihyZXNvbHZlZERlc3QsIHJlc29sdmVkU3JjKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IG92ZXJ3cml0ZSAnJHtyZXNvbHZlZERlc3R9JyB3aXRoICcke3Jlc29sdmVkU3JjfScuYClcbiAgfVxuXG4gIC8vIGNvcHkgdGhlIGxpbmtcbiAgYXdhaXQgZnMudW5saW5rKGRlc3QpXG4gIHJldHVybiBmcy5zeW1saW5rKHJlc29sdmVkU3JjLCBkZXN0KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNvcHlcbiIsICIndXNlIHN0cmljdCdcblxuY29uc3QgZnMgPSByZXF1aXJlKCdncmFjZWZ1bC1mcycpXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5jb25zdCBta2RpcnNTeW5jID0gcmVxdWlyZSgnLi4vbWtkaXJzJykubWtkaXJzU3luY1xuY29uc3QgdXRpbWVzTWlsbGlzU3luYyA9IHJlcXVpcmUoJy4uL3V0aWwvdXRpbWVzJykudXRpbWVzTWlsbGlzU3luY1xuY29uc3Qgc3RhdCA9IHJlcXVpcmUoJy4uL3V0aWwvc3RhdCcpXG5cbmZ1bmN0aW9uIGNvcHlTeW5jIChzcmMsIGRlc3QsIG9wdHMpIHtcbiAgaWYgKHR5cGVvZiBvcHRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgb3B0cyA9IHsgZmlsdGVyOiBvcHRzIH1cbiAgfVxuXG4gIG9wdHMgPSBvcHRzIHx8IHt9XG4gIG9wdHMuY2xvYmJlciA9ICdjbG9iYmVyJyBpbiBvcHRzID8gISFvcHRzLmNsb2JiZXIgOiB0cnVlIC8vIGRlZmF1bHQgdG8gdHJ1ZSBmb3Igbm93XG4gIG9wdHMub3ZlcndyaXRlID0gJ292ZXJ3cml0ZScgaW4gb3B0cyA/ICEhb3B0cy5vdmVyd3JpdGUgOiBvcHRzLmNsb2JiZXIgLy8gb3ZlcndyaXRlIGZhbGxzIGJhY2sgdG8gY2xvYmJlclxuXG4gIC8vIFdhcm4gYWJvdXQgdXNpbmcgcHJlc2VydmVUaW1lc3RhbXBzIG9uIDMyLWJpdCBub2RlXG4gIGlmIChvcHRzLnByZXNlcnZlVGltZXN0YW1wcyAmJiBwcm9jZXNzLmFyY2ggPT09ICdpYTMyJykge1xuICAgIHByb2Nlc3MuZW1pdFdhcm5pbmcoXG4gICAgICAnVXNpbmcgdGhlIHByZXNlcnZlVGltZXN0YW1wcyBvcHRpb24gaW4gMzItYml0IG5vZGUgaXMgbm90IHJlY29tbWVuZGVkO1xcblxcbicgK1xuICAgICAgJ1xcdHNlZSBodHRwczovL2dpdGh1Yi5jb20vanByaWNoYXJkc29uL25vZGUtZnMtZXh0cmEvaXNzdWVzLzI2OScsXG4gICAgICAnV2FybmluZycsICdmcy1leHRyYS1XQVJOMDAwMidcbiAgICApXG4gIH1cblxuICBjb25zdCB7IHNyY1N0YXQsIGRlc3RTdGF0IH0gPSBzdGF0LmNoZWNrUGF0aHNTeW5jKHNyYywgZGVzdCwgJ2NvcHknLCBvcHRzKVxuICBzdGF0LmNoZWNrUGFyZW50UGF0aHNTeW5jKHNyYywgc3JjU3RhdCwgZGVzdCwgJ2NvcHknKVxuICBpZiAob3B0cy5maWx0ZXIgJiYgIW9wdHMuZmlsdGVyKHNyYywgZGVzdCkpIHJldHVyblxuICBjb25zdCBkZXN0UGFyZW50ID0gcGF0aC5kaXJuYW1lKGRlc3QpXG4gIGlmICghZnMuZXhpc3RzU3luYyhkZXN0UGFyZW50KSkgbWtkaXJzU3luYyhkZXN0UGFyZW50KVxuICByZXR1cm4gZ2V0U3RhdHMoZGVzdFN0YXQsIHNyYywgZGVzdCwgb3B0cylcbn1cblxuZnVuY3Rpb24gZ2V0U3RhdHMgKGRlc3RTdGF0LCBzcmMsIGRlc3QsIG9wdHMpIHtcbiAgY29uc3Qgc3RhdFN5bmMgPSBvcHRzLmRlcmVmZXJlbmNlID8gZnMuc3RhdFN5bmMgOiBmcy5sc3RhdFN5bmNcbiAgY29uc3Qgc3JjU3RhdCA9IHN0YXRTeW5jKHNyYylcblxuICBpZiAoc3JjU3RhdC5pc0RpcmVjdG9yeSgpKSByZXR1cm4gb25EaXIoc3JjU3RhdCwgZGVzdFN0YXQsIHNyYywgZGVzdCwgb3B0cylcbiAgZWxzZSBpZiAoc3JjU3RhdC5pc0ZpbGUoKSB8fFxuICAgICAgICAgICBzcmNTdGF0LmlzQ2hhcmFjdGVyRGV2aWNlKCkgfHxcbiAgICAgICAgICAgc3JjU3RhdC5pc0Jsb2NrRGV2aWNlKCkpIHJldHVybiBvbkZpbGUoc3JjU3RhdCwgZGVzdFN0YXQsIHNyYywgZGVzdCwgb3B0cylcbiAgZWxzZSBpZiAoc3JjU3RhdC5pc1N5bWJvbGljTGluaygpKSByZXR1cm4gb25MaW5rKGRlc3RTdGF0LCBzcmMsIGRlc3QsIG9wdHMpXG4gIGVsc2UgaWYgKHNyY1N0YXQuaXNTb2NrZXQoKSkgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgY29weSBhIHNvY2tldCBmaWxlOiAke3NyY31gKVxuICBlbHNlIGlmIChzcmNTdGF0LmlzRklGTygpKSB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBjb3B5IGEgRklGTyBwaXBlOiAke3NyY31gKVxuICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gZmlsZTogJHtzcmN9YClcbn1cblxuZnVuY3Rpb24gb25GaWxlIChzcmNTdGF0LCBkZXN0U3RhdCwgc3JjLCBkZXN0LCBvcHRzKSB7XG4gIGlmICghZGVzdFN0YXQpIHJldHVybiBjb3B5RmlsZShzcmNTdGF0LCBzcmMsIGRlc3QsIG9wdHMpXG4gIHJldHVybiBtYXlDb3B5RmlsZShzcmNTdGF0LCBzcmMsIGRlc3QsIG9wdHMpXG59XG5cbmZ1bmN0aW9uIG1heUNvcHlGaWxlIChzcmNTdGF0LCBzcmMsIGRlc3QsIG9wdHMpIHtcbiAgaWYgKG9wdHMub3ZlcndyaXRlKSB7XG4gICAgZnMudW5saW5rU3luYyhkZXN0KVxuICAgIHJldHVybiBjb3B5RmlsZShzcmNTdGF0LCBzcmMsIGRlc3QsIG9wdHMpXG4gIH0gZWxzZSBpZiAob3B0cy5lcnJvck9uRXhpc3QpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCcke2Rlc3R9JyBhbHJlYWR5IGV4aXN0c2ApXG4gIH1cbn1cblxuZnVuY3Rpb24gY29weUZpbGUgKHNyY1N0YXQsIHNyYywgZGVzdCwgb3B0cykge1xuICBmcy5jb3B5RmlsZVN5bmMoc3JjLCBkZXN0KVxuICBpZiAob3B0cy5wcmVzZXJ2ZVRpbWVzdGFtcHMpIGhhbmRsZVRpbWVzdGFtcHMoc3JjU3RhdC5tb2RlLCBzcmMsIGRlc3QpXG4gIHJldHVybiBzZXREZXN0TW9kZShkZXN0LCBzcmNTdGF0Lm1vZGUpXG59XG5cbmZ1bmN0aW9uIGhhbmRsZVRpbWVzdGFtcHMgKHNyY01vZGUsIHNyYywgZGVzdCkge1xuICAvLyBNYWtlIHN1cmUgdGhlIGZpbGUgaXMgd3JpdGFibGUgYmVmb3JlIHNldHRpbmcgdGhlIHRpbWVzdGFtcFxuICAvLyBvdGhlcndpc2Ugb3BlbiBmYWlscyB3aXRoIEVQRVJNIHdoZW4gaW52b2tlZCB3aXRoICdyKydcbiAgLy8gKHRocm91Z2ggdXRpbWVzIGNhbGwpXG4gIGlmIChmaWxlSXNOb3RXcml0YWJsZShzcmNNb2RlKSkgbWFrZUZpbGVXcml0YWJsZShkZXN0LCBzcmNNb2RlKVxuICByZXR1cm4gc2V0RGVzdFRpbWVzdGFtcHMoc3JjLCBkZXN0KVxufVxuXG5mdW5jdGlvbiBmaWxlSXNOb3RXcml0YWJsZSAoc3JjTW9kZSkge1xuICByZXR1cm4gKHNyY01vZGUgJiAwbzIwMCkgPT09IDBcbn1cblxuZnVuY3Rpb24gbWFrZUZpbGVXcml0YWJsZSAoZGVzdCwgc3JjTW9kZSkge1xuICByZXR1cm4gc2V0RGVzdE1vZGUoZGVzdCwgc3JjTW9kZSB8IDBvMjAwKVxufVxuXG5mdW5jdGlvbiBzZXREZXN0TW9kZSAoZGVzdCwgc3JjTW9kZSkge1xuICByZXR1cm4gZnMuY2htb2RTeW5jKGRlc3QsIHNyY01vZGUpXG59XG5cbmZ1bmN0aW9uIHNldERlc3RUaW1lc3RhbXBzIChzcmMsIGRlc3QpIHtcbiAgLy8gVGhlIGluaXRpYWwgc3JjU3RhdC5hdGltZSBjYW5ub3QgYmUgdHJ1c3RlZFxuICAvLyBiZWNhdXNlIGl0IGlzIG1vZGlmaWVkIGJ5IHRoZSByZWFkKDIpIHN5c3RlbSBjYWxsXG4gIC8vIChTZWUgaHR0cHM6Ly9ub2RlanMub3JnL2FwaS9mcy5odG1sI2ZzX3N0YXRfdGltZV92YWx1ZXMpXG4gIGNvbnN0IHVwZGF0ZWRTcmNTdGF0ID0gZnMuc3RhdFN5bmMoc3JjKVxuICByZXR1cm4gdXRpbWVzTWlsbGlzU3luYyhkZXN0LCB1cGRhdGVkU3JjU3RhdC5hdGltZSwgdXBkYXRlZFNyY1N0YXQubXRpbWUpXG59XG5cbmZ1bmN0aW9uIG9uRGlyIChzcmNTdGF0LCBkZXN0U3RhdCwgc3JjLCBkZXN0LCBvcHRzKSB7XG4gIGlmICghZGVzdFN0YXQpIHJldHVybiBta0RpckFuZENvcHkoc3JjU3RhdC5tb2RlLCBzcmMsIGRlc3QsIG9wdHMpXG4gIHJldHVybiBjb3B5RGlyKHNyYywgZGVzdCwgb3B0cylcbn1cblxuZnVuY3Rpb24gbWtEaXJBbmRDb3B5IChzcmNNb2RlLCBzcmMsIGRlc3QsIG9wdHMpIHtcbiAgZnMubWtkaXJTeW5jKGRlc3QpXG4gIGNvcHlEaXIoc3JjLCBkZXN0LCBvcHRzKVxuICByZXR1cm4gc2V0RGVzdE1vZGUoZGVzdCwgc3JjTW9kZSlcbn1cblxuZnVuY3Rpb24gY29weURpciAoc3JjLCBkZXN0LCBvcHRzKSB7XG4gIGZzLnJlYWRkaXJTeW5jKHNyYykuZm9yRWFjaChpdGVtID0+IGNvcHlEaXJJdGVtKGl0ZW0sIHNyYywgZGVzdCwgb3B0cykpXG59XG5cbmZ1bmN0aW9uIGNvcHlEaXJJdGVtIChpdGVtLCBzcmMsIGRlc3QsIG9wdHMpIHtcbiAgY29uc3Qgc3JjSXRlbSA9IHBhdGguam9pbihzcmMsIGl0ZW0pXG4gIGNvbnN0IGRlc3RJdGVtID0gcGF0aC5qb2luKGRlc3QsIGl0ZW0pXG4gIGlmIChvcHRzLmZpbHRlciAmJiAhb3B0cy5maWx0ZXIoc3JjSXRlbSwgZGVzdEl0ZW0pKSByZXR1cm5cbiAgY29uc3QgeyBkZXN0U3RhdCB9ID0gc3RhdC5jaGVja1BhdGhzU3luYyhzcmNJdGVtLCBkZXN0SXRlbSwgJ2NvcHknLCBvcHRzKVxuICByZXR1cm4gZ2V0U3RhdHMoZGVzdFN0YXQsIHNyY0l0ZW0sIGRlc3RJdGVtLCBvcHRzKVxufVxuXG5mdW5jdGlvbiBvbkxpbmsgKGRlc3RTdGF0LCBzcmMsIGRlc3QsIG9wdHMpIHtcbiAgbGV0IHJlc29sdmVkU3JjID0gZnMucmVhZGxpbmtTeW5jKHNyYylcbiAgaWYgKG9wdHMuZGVyZWZlcmVuY2UpIHtcbiAgICByZXNvbHZlZFNyYyA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCByZXNvbHZlZFNyYylcbiAgfVxuXG4gIGlmICghZGVzdFN0YXQpIHtcbiAgICByZXR1cm4gZnMuc3ltbGlua1N5bmMocmVzb2x2ZWRTcmMsIGRlc3QpXG4gIH0gZWxzZSB7XG4gICAgbGV0IHJlc29sdmVkRGVzdFxuICAgIHRyeSB7XG4gICAgICByZXNvbHZlZERlc3QgPSBmcy5yZWFkbGlua1N5bmMoZGVzdClcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIC8vIGRlc3QgZXhpc3RzIGFuZCBpcyBhIHJlZ3VsYXIgZmlsZSBvciBkaXJlY3RvcnksXG4gICAgICAvLyBXaW5kb3dzIG1heSB0aHJvdyBVTktOT1dOIGVycm9yLiBJZiBkZXN0IGFscmVhZHkgZXhpc3RzLFxuICAgICAgLy8gZnMgdGhyb3dzIGVycm9yIGFueXdheSwgc28gbm8gbmVlZCB0byBndWFyZCBhZ2FpbnN0IGl0IGhlcmUuXG4gICAgICBpZiAoZXJyLmNvZGUgPT09ICdFSU5WQUwnIHx8IGVyci5jb2RlID09PSAnVU5LTk9XTicpIHJldHVybiBmcy5zeW1saW5rU3luYyhyZXNvbHZlZFNyYywgZGVzdClcbiAgICAgIHRocm93IGVyclxuICAgIH1cbiAgICBpZiAob3B0cy5kZXJlZmVyZW5jZSkge1xuICAgICAgcmVzb2x2ZWREZXN0ID0gcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksIHJlc29sdmVkRGVzdClcbiAgICB9XG4gICAgaWYgKHN0YXQuaXNTcmNTdWJkaXIocmVzb2x2ZWRTcmMsIHJlc29sdmVkRGVzdCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGNvcHkgJyR7cmVzb2x2ZWRTcmN9JyB0byBhIHN1YmRpcmVjdG9yeSBvZiBpdHNlbGYsICcke3Jlc29sdmVkRGVzdH0nLmApXG4gICAgfVxuXG4gICAgLy8gcHJldmVudCBjb3B5IGlmIHNyYyBpcyBhIHN1YmRpciBvZiBkZXN0IHNpbmNlIHVubGlua2luZ1xuICAgIC8vIGRlc3QgaW4gdGhpcyBjYXNlIHdvdWxkIHJlc3VsdCBpbiByZW1vdmluZyBzcmMgY29udGVudHNcbiAgICAvLyBhbmQgdGhlcmVmb3JlIGEgYnJva2VuIHN5bWxpbmsgd291bGQgYmUgY3JlYXRlZC5cbiAgICBpZiAoc3RhdC5pc1NyY1N1YmRpcihyZXNvbHZlZERlc3QsIHJlc29sdmVkU3JjKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3Qgb3ZlcndyaXRlICcke3Jlc29sdmVkRGVzdH0nIHdpdGggJyR7cmVzb2x2ZWRTcmN9Jy5gKVxuICAgIH1cbiAgICByZXR1cm4gY29weUxpbmsocmVzb2x2ZWRTcmMsIGRlc3QpXG4gIH1cbn1cblxuZnVuY3Rpb24gY29weUxpbmsgKHJlc29sdmVkU3JjLCBkZXN0KSB7XG4gIGZzLnVubGlua1N5bmMoZGVzdClcbiAgcmV0dXJuIGZzLnN5bWxpbmtTeW5jKHJlc29sdmVkU3JjLCBkZXN0KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNvcHlTeW5jXG4iLCAiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IHUgPSByZXF1aXJlKCd1bml2ZXJzYWxpZnknKS5mcm9tUHJvbWlzZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNvcHk6IHUocmVxdWlyZSgnLi9jb3B5JykpLFxuICBjb3B5U3luYzogcmVxdWlyZSgnLi9jb3B5LXN5bmMnKVxufVxuIiwgIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBmcyA9IHJlcXVpcmUoJ2dyYWNlZnVsLWZzJylcbmNvbnN0IHUgPSByZXF1aXJlKCd1bml2ZXJzYWxpZnknKS5mcm9tQ2FsbGJhY2tcblxuZnVuY3Rpb24gcmVtb3ZlIChwYXRoLCBjYWxsYmFjaykge1xuICBmcy5ybShwYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSwgY2FsbGJhY2spXG59XG5cbmZ1bmN0aW9uIHJlbW92ZVN5bmMgKHBhdGgpIHtcbiAgZnMucm1TeW5jKHBhdGgsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgcmVtb3ZlOiB1KHJlbW92ZSksXG4gIHJlbW92ZVN5bmNcbn1cbiIsICIndXNlIHN0cmljdCdcblxuY29uc3QgdSA9IHJlcXVpcmUoJ3VuaXZlcnNhbGlmeScpLmZyb21Qcm9taXNlXG5jb25zdCBmcyA9IHJlcXVpcmUoJy4uL2ZzJylcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcbmNvbnN0IG1rZGlyID0gcmVxdWlyZSgnLi4vbWtkaXJzJylcbmNvbnN0IHJlbW92ZSA9IHJlcXVpcmUoJy4uL3JlbW92ZScpXG5cbmNvbnN0IGVtcHR5RGlyID0gdShhc3luYyBmdW5jdGlvbiBlbXB0eURpciAoZGlyKSB7XG4gIGxldCBpdGVtc1xuICB0cnkge1xuICAgIGl0ZW1zID0gYXdhaXQgZnMucmVhZGRpcihkaXIpXG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBta2Rpci5ta2RpcnMoZGlyKVxuICB9XG5cbiAgcmV0dXJuIFByb21pc2UuYWxsKGl0ZW1zLm1hcChpdGVtID0+IHJlbW92ZS5yZW1vdmUocGF0aC5qb2luKGRpciwgaXRlbSkpKSlcbn0pXG5cbmZ1bmN0aW9uIGVtcHR5RGlyU3luYyAoZGlyKSB7XG4gIGxldCBpdGVtc1xuICB0cnkge1xuICAgIGl0ZW1zID0gZnMucmVhZGRpclN5bmMoZGlyKVxuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbWtkaXIubWtkaXJzU3luYyhkaXIpXG4gIH1cblxuICBpdGVtcy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgIGl0ZW0gPSBwYXRoLmpvaW4oZGlyLCBpdGVtKVxuICAgIHJlbW92ZS5yZW1vdmVTeW5jKGl0ZW0pXG4gIH0pXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBlbXB0eURpclN5bmMsXG4gIGVtcHR5ZGlyU3luYzogZW1wdHlEaXJTeW5jLFxuICBlbXB0eURpcixcbiAgZW1wdHlkaXI6IGVtcHR5RGlyXG59XG4iLCAiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IHUgPSByZXF1aXJlKCd1bml2ZXJzYWxpZnknKS5mcm9tUHJvbWlzZVxuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuY29uc3QgZnMgPSByZXF1aXJlKCcuLi9mcycpXG5jb25zdCBta2RpciA9IHJlcXVpcmUoJy4uL21rZGlycycpXG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUZpbGUgKGZpbGUpIHtcbiAgbGV0IHN0YXRzXG4gIHRyeSB7XG4gICAgc3RhdHMgPSBhd2FpdCBmcy5zdGF0KGZpbGUpXG4gIH0gY2F0Y2ggeyB9XG4gIGlmIChzdGF0cyAmJiBzdGF0cy5pc0ZpbGUoKSkgcmV0dXJuXG5cbiAgY29uc3QgZGlyID0gcGF0aC5kaXJuYW1lKGZpbGUpXG5cbiAgbGV0IGRpclN0YXRzID0gbnVsbFxuICB0cnkge1xuICAgIGRpclN0YXRzID0gYXdhaXQgZnMuc3RhdChkaXIpXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIGlmIHRoZSBkaXJlY3RvcnkgZG9lc24ndCBleGlzdCwgbWFrZSBpdFxuICAgIGlmIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpIHtcbiAgICAgIGF3YWl0IG1rZGlyLm1rZGlycyhkaXIpXG4gICAgICBhd2FpdCBmcy53cml0ZUZpbGUoZmlsZSwgJycpXG4gICAgICByZXR1cm5cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgZXJyXG4gICAgfVxuICB9XG5cbiAgaWYgKGRpclN0YXRzLmlzRGlyZWN0b3J5KCkpIHtcbiAgICBhd2FpdCBmcy53cml0ZUZpbGUoZmlsZSwgJycpXG4gIH0gZWxzZSB7XG4gICAgLy8gcGFyZW50IGlzIG5vdCBhIGRpcmVjdG9yeVxuICAgIC8vIFRoaXMgaXMganVzdCB0byBjYXVzZSBhbiBpbnRlcm5hbCBFTk9URElSIGVycm9yIHRvIGJlIHRocm93blxuICAgIGF3YWl0IGZzLnJlYWRkaXIoZGlyKVxuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUZpbGVTeW5jIChmaWxlKSB7XG4gIGxldCBzdGF0c1xuICB0cnkge1xuICAgIHN0YXRzID0gZnMuc3RhdFN5bmMoZmlsZSlcbiAgfSBjYXRjaCB7IH1cbiAgaWYgKHN0YXRzICYmIHN0YXRzLmlzRmlsZSgpKSByZXR1cm5cblxuICBjb25zdCBkaXIgPSBwYXRoLmRpcm5hbWUoZmlsZSlcbiAgdHJ5IHtcbiAgICBpZiAoIWZzLnN0YXRTeW5jKGRpcikuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgLy8gcGFyZW50IGlzIG5vdCBhIGRpcmVjdG9yeVxuICAgICAgLy8gVGhpcyBpcyBqdXN0IHRvIGNhdXNlIGFuIGludGVybmFsIEVOT1RESVIgZXJyb3IgdG8gYmUgdGhyb3duXG4gICAgICBmcy5yZWFkZGlyU3luYyhkaXIpXG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICAvLyBJZiB0aGUgc3RhdCBjYWxsIGFib3ZlIGZhaWxlZCBiZWNhdXNlIHRoZSBkaXJlY3RvcnkgZG9lc24ndCBleGlzdCwgY3JlYXRlIGl0XG4gICAgaWYgKGVyciAmJiBlcnIuY29kZSA9PT0gJ0VOT0VOVCcpIG1rZGlyLm1rZGlyc1N5bmMoZGlyKVxuICAgIGVsc2UgdGhyb3cgZXJyXG4gIH1cblxuICBmcy53cml0ZUZpbGVTeW5jKGZpbGUsICcnKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY3JlYXRlRmlsZTogdShjcmVhdGVGaWxlKSxcbiAgY3JlYXRlRmlsZVN5bmNcbn1cbiIsICIndXNlIHN0cmljdCdcblxuY29uc3QgdSA9IHJlcXVpcmUoJ3VuaXZlcnNhbGlmeScpLmZyb21Qcm9taXNlXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5jb25zdCBmcyA9IHJlcXVpcmUoJy4uL2ZzJylcbmNvbnN0IG1rZGlyID0gcmVxdWlyZSgnLi4vbWtkaXJzJylcbmNvbnN0IHsgcGF0aEV4aXN0cyB9ID0gcmVxdWlyZSgnLi4vcGF0aC1leGlzdHMnKVxuY29uc3QgeyBhcmVJZGVudGljYWwgfSA9IHJlcXVpcmUoJy4uL3V0aWwvc3RhdCcpXG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUxpbmsgKHNyY3BhdGgsIGRzdHBhdGgpIHtcbiAgbGV0IGRzdFN0YXRcbiAgdHJ5IHtcbiAgICBkc3RTdGF0ID0gYXdhaXQgZnMubHN0YXQoZHN0cGF0aClcbiAgfSBjYXRjaCB7XG4gICAgLy8gaWdub3JlIGVycm9yXG4gIH1cblxuICBsZXQgc3JjU3RhdFxuICB0cnkge1xuICAgIHNyY1N0YXQgPSBhd2FpdCBmcy5sc3RhdChzcmNwYXRoKVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBlcnIubWVzc2FnZSA9IGVyci5tZXNzYWdlLnJlcGxhY2UoJ2xzdGF0JywgJ2Vuc3VyZUxpbmsnKVxuICAgIHRocm93IGVyclxuICB9XG5cbiAgaWYgKGRzdFN0YXQgJiYgYXJlSWRlbnRpY2FsKHNyY1N0YXQsIGRzdFN0YXQpKSByZXR1cm5cblxuICBjb25zdCBkaXIgPSBwYXRoLmRpcm5hbWUoZHN0cGF0aClcblxuICBjb25zdCBkaXJFeGlzdHMgPSBhd2FpdCBwYXRoRXhpc3RzKGRpcilcblxuICBpZiAoIWRpckV4aXN0cykge1xuICAgIGF3YWl0IG1rZGlyLm1rZGlycyhkaXIpXG4gIH1cblxuICBhd2FpdCBmcy5saW5rKHNyY3BhdGgsIGRzdHBhdGgpXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxpbmtTeW5jIChzcmNwYXRoLCBkc3RwYXRoKSB7XG4gIGxldCBkc3RTdGF0XG4gIHRyeSB7XG4gICAgZHN0U3RhdCA9IGZzLmxzdGF0U3luYyhkc3RwYXRoKVxuICB9IGNhdGNoIHt9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBzcmNTdGF0ID0gZnMubHN0YXRTeW5jKHNyY3BhdGgpXG4gICAgaWYgKGRzdFN0YXQgJiYgYXJlSWRlbnRpY2FsKHNyY1N0YXQsIGRzdFN0YXQpKSByZXR1cm5cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgZXJyLm1lc3NhZ2UgPSBlcnIubWVzc2FnZS5yZXBsYWNlKCdsc3RhdCcsICdlbnN1cmVMaW5rJylcbiAgICB0aHJvdyBlcnJcbiAgfVxuXG4gIGNvbnN0IGRpciA9IHBhdGguZGlybmFtZShkc3RwYXRoKVxuICBjb25zdCBkaXJFeGlzdHMgPSBmcy5leGlzdHNTeW5jKGRpcilcbiAgaWYgKGRpckV4aXN0cykgcmV0dXJuIGZzLmxpbmtTeW5jKHNyY3BhdGgsIGRzdHBhdGgpXG4gIG1rZGlyLm1rZGlyc1N5bmMoZGlyKVxuXG4gIHJldHVybiBmcy5saW5rU3luYyhzcmNwYXRoLCBkc3RwYXRoKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY3JlYXRlTGluazogdShjcmVhdGVMaW5rKSxcbiAgY3JlYXRlTGlua1N5bmNcbn1cbiIsICIndXNlIHN0cmljdCdcblxuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuY29uc3QgZnMgPSByZXF1aXJlKCcuLi9mcycpXG5jb25zdCB7IHBhdGhFeGlzdHMgfSA9IHJlcXVpcmUoJy4uL3BhdGgtZXhpc3RzJylcblxuY29uc3QgdSA9IHJlcXVpcmUoJ3VuaXZlcnNhbGlmeScpLmZyb21Qcm9taXNlXG5cbi8qKlxuICogRnVuY3Rpb24gdGhhdCByZXR1cm5zIHR3byB0eXBlcyBvZiBwYXRocywgb25lIHJlbGF0aXZlIHRvIHN5bWxpbmssIGFuZCBvbmVcbiAqIHJlbGF0aXZlIHRvIHRoZSBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5LiBDaGVja3MgaWYgcGF0aCBpcyBhYnNvbHV0ZSBvclxuICogcmVsYXRpdmUuIElmIHRoZSBwYXRoIGlzIHJlbGF0aXZlLCB0aGlzIGZ1bmN0aW9uIGNoZWNrcyBpZiB0aGUgcGF0aCBpc1xuICogcmVsYXRpdmUgdG8gc3ltbGluayBvciByZWxhdGl2ZSB0byBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5LiBUaGlzIGlzIGFuXG4gKiBpbml0aWF0aXZlIHRvIGZpbmQgYSBzbWFydGVyIGBzcmNwYXRoYCB0byBzdXBwbHkgd2hlbiBidWlsZGluZyBzeW1saW5rcy5cbiAqIFRoaXMgYWxsb3dzIHlvdSB0byBkZXRlcm1pbmUgd2hpY2ggcGF0aCB0byB1c2Ugb3V0IG9mIG9uZSBvZiB0aHJlZSBwb3NzaWJsZVxuICogdHlwZXMgb2Ygc291cmNlIHBhdGhzLiBUaGUgZmlyc3QgaXMgYW4gYWJzb2x1dGUgcGF0aC4gVGhpcyBpcyBkZXRlY3RlZCBieVxuICogYHBhdGguaXNBYnNvbHV0ZSgpYC4gV2hlbiBhbiBhYnNvbHV0ZSBwYXRoIGlzIHByb3ZpZGVkLCBpdCBpcyBjaGVja2VkIHRvXG4gKiBzZWUgaWYgaXQgZXhpc3RzLiBJZiBpdCBkb2VzIGl0J3MgdXNlZCwgaWYgbm90IGFuIGVycm9yIGlzIHJldHVybmVkXG4gKiAoY2FsbGJhY2spLyB0aHJvd24gKHN5bmMpLiBUaGUgb3RoZXIgdHdvIG9wdGlvbnMgZm9yIGBzcmNwYXRoYCBhcmUgYVxuICogcmVsYXRpdmUgdXJsLiBCeSBkZWZhdWx0IE5vZGUncyBgZnMuc3ltbGlua2Agd29ya3MgYnkgY3JlYXRpbmcgYSBzeW1saW5rXG4gKiB1c2luZyBgZHN0cGF0aGAgYW5kIGV4cGVjdHMgdGhlIGBzcmNwYXRoYCB0byBiZSByZWxhdGl2ZSB0byB0aGUgbmV3bHlcbiAqIGNyZWF0ZWQgc3ltbGluay4gSWYgeW91IHByb3ZpZGUgYSBgc3JjcGF0aGAgdGhhdCBkb2VzIG5vdCBleGlzdCBvbiB0aGUgZmlsZVxuICogc3lzdGVtIGl0IHJlc3VsdHMgaW4gYSBicm9rZW4gc3ltbGluay4gVG8gbWluaW1pemUgdGhpcywgdGhlIGZ1bmN0aW9uXG4gKiBjaGVja3MgdG8gc2VlIGlmIHRoZSAncmVsYXRpdmUgdG8gc3ltbGluaycgc291cmNlIGZpbGUgZXhpc3RzLCBhbmQgaWYgaXRcbiAqIGRvZXMgaXQgd2lsbCB1c2UgaXQuIElmIGl0IGRvZXMgbm90LCBpdCBjaGVja3MgaWYgdGhlcmUncyBhIGZpbGUgdGhhdFxuICogZXhpc3RzIHRoYXQgaXMgcmVsYXRpdmUgdG8gdGhlIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnksIGlmIGRvZXMgaXRzIHVzZWQuXG4gKiBUaGlzIHByZXNlcnZlcyB0aGUgZXhwZWN0YXRpb25zIG9mIHRoZSBvcmlnaW5hbCBmcy5zeW1saW5rIHNwZWMgYW5kIGFkZHNcbiAqIHRoZSBhYmlsaXR5IHRvIHBhc3MgaW4gYHJlbGF0aXZlIHRvIGN1cnJlbnQgd29ya2luZyBkaXJlY290cnlgIHBhdGhzLlxuICovXG5cbmFzeW5jIGZ1bmN0aW9uIHN5bWxpbmtQYXRocyAoc3JjcGF0aCwgZHN0cGF0aCkge1xuICBpZiAocGF0aC5pc0Fic29sdXRlKHNyY3BhdGgpKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLmxzdGF0KHNyY3BhdGgpXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBlcnIubWVzc2FnZSA9IGVyci5tZXNzYWdlLnJlcGxhY2UoJ2xzdGF0JywgJ2Vuc3VyZVN5bWxpbmsnKVxuICAgICAgdGhyb3cgZXJyXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRvQ3dkOiBzcmNwYXRoLFxuICAgICAgdG9Ec3Q6IHNyY3BhdGhcbiAgICB9XG4gIH1cblxuICBjb25zdCBkc3RkaXIgPSBwYXRoLmRpcm5hbWUoZHN0cGF0aClcbiAgY29uc3QgcmVsYXRpdmVUb0RzdCA9IHBhdGguam9pbihkc3RkaXIsIHNyY3BhdGgpXG5cbiAgY29uc3QgZXhpc3RzID0gYXdhaXQgcGF0aEV4aXN0cyhyZWxhdGl2ZVRvRHN0KVxuICBpZiAoZXhpc3RzKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRvQ3dkOiByZWxhdGl2ZVRvRHN0LFxuICAgICAgdG9Ec3Q6IHNyY3BhdGhcbiAgICB9XG4gIH1cblxuICB0cnkge1xuICAgIGF3YWl0IGZzLmxzdGF0KHNyY3BhdGgpXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGVyci5tZXNzYWdlID0gZXJyLm1lc3NhZ2UucmVwbGFjZSgnbHN0YXQnLCAnZW5zdXJlU3ltbGluaycpXG4gICAgdGhyb3cgZXJyXG4gIH1cblxuICByZXR1cm4ge1xuICAgIHRvQ3dkOiBzcmNwYXRoLFxuICAgIHRvRHN0OiBwYXRoLnJlbGF0aXZlKGRzdGRpciwgc3JjcGF0aClcbiAgfVxufVxuXG5mdW5jdGlvbiBzeW1saW5rUGF0aHNTeW5jIChzcmNwYXRoLCBkc3RwYXRoKSB7XG4gIGlmIChwYXRoLmlzQWJzb2x1dGUoc3JjcGF0aCkpIHtcbiAgICBjb25zdCBleGlzdHMgPSBmcy5leGlzdHNTeW5jKHNyY3BhdGgpXG4gICAgaWYgKCFleGlzdHMpIHRocm93IG5ldyBFcnJvcignYWJzb2x1dGUgc3JjcGF0aCBkb2VzIG5vdCBleGlzdCcpXG4gICAgcmV0dXJuIHtcbiAgICAgIHRvQ3dkOiBzcmNwYXRoLFxuICAgICAgdG9Ec3Q6IHNyY3BhdGhcbiAgICB9XG4gIH1cblxuICBjb25zdCBkc3RkaXIgPSBwYXRoLmRpcm5hbWUoZHN0cGF0aClcbiAgY29uc3QgcmVsYXRpdmVUb0RzdCA9IHBhdGguam9pbihkc3RkaXIsIHNyY3BhdGgpXG4gIGNvbnN0IGV4aXN0cyA9IGZzLmV4aXN0c1N5bmMocmVsYXRpdmVUb0RzdClcbiAgaWYgKGV4aXN0cykge1xuICAgIHJldHVybiB7XG4gICAgICB0b0N3ZDogcmVsYXRpdmVUb0RzdCxcbiAgICAgIHRvRHN0OiBzcmNwYXRoXG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc3JjRXhpc3RzID0gZnMuZXhpc3RzU3luYyhzcmNwYXRoKVxuICBpZiAoIXNyY0V4aXN0cykgdGhyb3cgbmV3IEVycm9yKCdyZWxhdGl2ZSBzcmNwYXRoIGRvZXMgbm90IGV4aXN0JylcbiAgcmV0dXJuIHtcbiAgICB0b0N3ZDogc3JjcGF0aCxcbiAgICB0b0RzdDogcGF0aC5yZWxhdGl2ZShkc3RkaXIsIHNyY3BhdGgpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHN5bWxpbmtQYXRoczogdShzeW1saW5rUGF0aHMpLFxuICBzeW1saW5rUGF0aHNTeW5jXG59XG4iLCAiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IGZzID0gcmVxdWlyZSgnLi4vZnMnKVxuY29uc3QgdSA9IHJlcXVpcmUoJ3VuaXZlcnNhbGlmeScpLmZyb21Qcm9taXNlXG5cbmFzeW5jIGZ1bmN0aW9uIHN5bWxpbmtUeXBlIChzcmNwYXRoLCB0eXBlKSB7XG4gIGlmICh0eXBlKSByZXR1cm4gdHlwZVxuXG4gIGxldCBzdGF0c1xuICB0cnkge1xuICAgIHN0YXRzID0gYXdhaXQgZnMubHN0YXQoc3JjcGF0aClcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuICdmaWxlJ1xuICB9XG5cbiAgcmV0dXJuIChzdGF0cyAmJiBzdGF0cy5pc0RpcmVjdG9yeSgpKSA/ICdkaXInIDogJ2ZpbGUnXG59XG5cbmZ1bmN0aW9uIHN5bWxpbmtUeXBlU3luYyAoc3JjcGF0aCwgdHlwZSkge1xuICBpZiAodHlwZSkgcmV0dXJuIHR5cGVcblxuICBsZXQgc3RhdHNcbiAgdHJ5IHtcbiAgICBzdGF0cyA9IGZzLmxzdGF0U3luYyhzcmNwYXRoKVxuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gJ2ZpbGUnXG4gIH1cbiAgcmV0dXJuIChzdGF0cyAmJiBzdGF0cy5pc0RpcmVjdG9yeSgpKSA/ICdkaXInIDogJ2ZpbGUnXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBzeW1saW5rVHlwZTogdShzeW1saW5rVHlwZSksXG4gIHN5bWxpbmtUeXBlU3luY1xufVxuIiwgIid1c2Ugc3RyaWN0J1xuXG5jb25zdCB1ID0gcmVxdWlyZSgndW5pdmVyc2FsaWZ5JykuZnJvbVByb21pc2VcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcbmNvbnN0IGZzID0gcmVxdWlyZSgnLi4vZnMnKVxuXG5jb25zdCB7IG1rZGlycywgbWtkaXJzU3luYyB9ID0gcmVxdWlyZSgnLi4vbWtkaXJzJylcblxuY29uc3QgeyBzeW1saW5rUGF0aHMsIHN5bWxpbmtQYXRoc1N5bmMgfSA9IHJlcXVpcmUoJy4vc3ltbGluay1wYXRocycpXG5jb25zdCB7IHN5bWxpbmtUeXBlLCBzeW1saW5rVHlwZVN5bmMgfSA9IHJlcXVpcmUoJy4vc3ltbGluay10eXBlJylcblxuY29uc3QgeyBwYXRoRXhpc3RzIH0gPSByZXF1aXJlKCcuLi9wYXRoLWV4aXN0cycpXG5cbmNvbnN0IHsgYXJlSWRlbnRpY2FsIH0gPSByZXF1aXJlKCcuLi91dGlsL3N0YXQnKVxuXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVTeW1saW5rIChzcmNwYXRoLCBkc3RwYXRoLCB0eXBlKSB7XG4gIGxldCBzdGF0c1xuICB0cnkge1xuICAgIHN0YXRzID0gYXdhaXQgZnMubHN0YXQoZHN0cGF0aClcbiAgfSBjYXRjaCB7IH1cblxuICBpZiAoc3RhdHMgJiYgc3RhdHMuaXNTeW1ib2xpY0xpbmsoKSkge1xuICAgIGNvbnN0IFtzcmNTdGF0LCBkc3RTdGF0XSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIGZzLnN0YXQoc3JjcGF0aCksXG4gICAgICBmcy5zdGF0KGRzdHBhdGgpXG4gICAgXSlcblxuICAgIGlmIChhcmVJZGVudGljYWwoc3JjU3RhdCwgZHN0U3RhdCkpIHJldHVyblxuICB9XG5cbiAgY29uc3QgcmVsYXRpdmUgPSBhd2FpdCBzeW1saW5rUGF0aHMoc3JjcGF0aCwgZHN0cGF0aClcbiAgc3JjcGF0aCA9IHJlbGF0aXZlLnRvRHN0XG4gIGNvbnN0IHRvVHlwZSA9IGF3YWl0IHN5bWxpbmtUeXBlKHJlbGF0aXZlLnRvQ3dkLCB0eXBlKVxuICBjb25zdCBkaXIgPSBwYXRoLmRpcm5hbWUoZHN0cGF0aClcblxuICBpZiAoIShhd2FpdCBwYXRoRXhpc3RzKGRpcikpKSB7XG4gICAgYXdhaXQgbWtkaXJzKGRpcilcbiAgfVxuXG4gIHJldHVybiBmcy5zeW1saW5rKHNyY3BhdGgsIGRzdHBhdGgsIHRvVHlwZSlcbn1cblxuZnVuY3Rpb24gY3JlYXRlU3ltbGlua1N5bmMgKHNyY3BhdGgsIGRzdHBhdGgsIHR5cGUpIHtcbiAgbGV0IHN0YXRzXG4gIHRyeSB7XG4gICAgc3RhdHMgPSBmcy5sc3RhdFN5bmMoZHN0cGF0aClcbiAgfSBjYXRjaCB7IH1cbiAgaWYgKHN0YXRzICYmIHN0YXRzLmlzU3ltYm9saWNMaW5rKCkpIHtcbiAgICBjb25zdCBzcmNTdGF0ID0gZnMuc3RhdFN5bmMoc3JjcGF0aClcbiAgICBjb25zdCBkc3RTdGF0ID0gZnMuc3RhdFN5bmMoZHN0cGF0aClcbiAgICBpZiAoYXJlSWRlbnRpY2FsKHNyY1N0YXQsIGRzdFN0YXQpKSByZXR1cm5cbiAgfVxuXG4gIGNvbnN0IHJlbGF0aXZlID0gc3ltbGlua1BhdGhzU3luYyhzcmNwYXRoLCBkc3RwYXRoKVxuICBzcmNwYXRoID0gcmVsYXRpdmUudG9Ec3RcbiAgdHlwZSA9IHN5bWxpbmtUeXBlU3luYyhyZWxhdGl2ZS50b0N3ZCwgdHlwZSlcbiAgY29uc3QgZGlyID0gcGF0aC5kaXJuYW1lKGRzdHBhdGgpXG4gIGNvbnN0IGV4aXN0cyA9IGZzLmV4aXN0c1N5bmMoZGlyKVxuICBpZiAoZXhpc3RzKSByZXR1cm4gZnMuc3ltbGlua1N5bmMoc3JjcGF0aCwgZHN0cGF0aCwgdHlwZSlcbiAgbWtkaXJzU3luYyhkaXIpXG4gIHJldHVybiBmcy5zeW1saW5rU3luYyhzcmNwYXRoLCBkc3RwYXRoLCB0eXBlKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY3JlYXRlU3ltbGluazogdShjcmVhdGVTeW1saW5rKSxcbiAgY3JlYXRlU3ltbGlua1N5bmNcbn1cbiIsICIndXNlIHN0cmljdCdcblxuY29uc3QgeyBjcmVhdGVGaWxlLCBjcmVhdGVGaWxlU3luYyB9ID0gcmVxdWlyZSgnLi9maWxlJylcbmNvbnN0IHsgY3JlYXRlTGluaywgY3JlYXRlTGlua1N5bmMgfSA9IHJlcXVpcmUoJy4vbGluaycpXG5jb25zdCB7IGNyZWF0ZVN5bWxpbmssIGNyZWF0ZVN5bWxpbmtTeW5jIH0gPSByZXF1aXJlKCcuL3N5bWxpbmsnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgLy8gZmlsZVxuICBjcmVhdGVGaWxlLFxuICBjcmVhdGVGaWxlU3luYyxcbiAgZW5zdXJlRmlsZTogY3JlYXRlRmlsZSxcbiAgZW5zdXJlRmlsZVN5bmM6IGNyZWF0ZUZpbGVTeW5jLFxuICAvLyBsaW5rXG4gIGNyZWF0ZUxpbmssXG4gIGNyZWF0ZUxpbmtTeW5jLFxuICBlbnN1cmVMaW5rOiBjcmVhdGVMaW5rLFxuICBlbnN1cmVMaW5rU3luYzogY3JlYXRlTGlua1N5bmMsXG4gIC8vIHN5bWxpbmtcbiAgY3JlYXRlU3ltbGluayxcbiAgY3JlYXRlU3ltbGlua1N5bmMsXG4gIGVuc3VyZVN5bWxpbms6IGNyZWF0ZVN5bWxpbmssXG4gIGVuc3VyZVN5bWxpbmtTeW5jOiBjcmVhdGVTeW1saW5rU3luY1xufVxuIiwgImZ1bmN0aW9uIHN0cmluZ2lmeSAob2JqLCB7IEVPTCA9ICdcXG4nLCBmaW5hbEVPTCA9IHRydWUsIHJlcGxhY2VyID0gbnVsbCwgc3BhY2VzIH0gPSB7fSkge1xuICBjb25zdCBFT0YgPSBmaW5hbEVPTCA/IEVPTCA6ICcnXG4gIGNvbnN0IHN0ciA9IEpTT04uc3RyaW5naWZ5KG9iaiwgcmVwbGFjZXIsIHNwYWNlcylcblxuICByZXR1cm4gc3RyLnJlcGxhY2UoL1xcbi9nLCBFT0wpICsgRU9GXG59XG5cbmZ1bmN0aW9uIHN0cmlwQm9tIChjb250ZW50KSB7XG4gIC8vIHdlIGRvIHRoaXMgYmVjYXVzZSBKU09OLnBhcnNlIHdvdWxkIGNvbnZlcnQgaXQgdG8gYSB1dGY4IHN0cmluZyBpZiBlbmNvZGluZyB3YXNuJ3Qgc3BlY2lmaWVkXG4gIGlmIChCdWZmZXIuaXNCdWZmZXIoY29udGVudCkpIGNvbnRlbnQgPSBjb250ZW50LnRvU3RyaW5nKCd1dGY4JylcbiAgcmV0dXJuIGNvbnRlbnQucmVwbGFjZSgvXlxcdUZFRkYvLCAnJylcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IHN0cmluZ2lmeSwgc3RyaXBCb20gfVxuIiwgImxldCBfZnNcbnRyeSB7XG4gIF9mcyA9IHJlcXVpcmUoJ2dyYWNlZnVsLWZzJylcbn0gY2F0Y2ggKF8pIHtcbiAgX2ZzID0gcmVxdWlyZSgnZnMnKVxufVxuY29uc3QgdW5pdmVyc2FsaWZ5ID0gcmVxdWlyZSgndW5pdmVyc2FsaWZ5JylcbmNvbnN0IHsgc3RyaW5naWZ5LCBzdHJpcEJvbSB9ID0gcmVxdWlyZSgnLi91dGlscycpXG5cbmFzeW5jIGZ1bmN0aW9uIF9yZWFkRmlsZSAoZmlsZSwgb3B0aW9ucyA9IHt9KSB7XG4gIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ3N0cmluZycpIHtcbiAgICBvcHRpb25zID0geyBlbmNvZGluZzogb3B0aW9ucyB9XG4gIH1cblxuICBjb25zdCBmcyA9IG9wdGlvbnMuZnMgfHwgX2ZzXG5cbiAgY29uc3Qgc2hvdWxkVGhyb3cgPSAndGhyb3dzJyBpbiBvcHRpb25zID8gb3B0aW9ucy50aHJvd3MgOiB0cnVlXG5cbiAgbGV0IGRhdGEgPSBhd2FpdCB1bml2ZXJzYWxpZnkuZnJvbUNhbGxiYWNrKGZzLnJlYWRGaWxlKShmaWxlLCBvcHRpb25zKVxuXG4gIGRhdGEgPSBzdHJpcEJvbShkYXRhKVxuXG4gIGxldCBvYmpcbiAgdHJ5IHtcbiAgICBvYmogPSBKU09OLnBhcnNlKGRhdGEsIG9wdGlvbnMgPyBvcHRpb25zLnJldml2ZXIgOiBudWxsKVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoc2hvdWxkVGhyb3cpIHtcbiAgICAgIGVyci5tZXNzYWdlID0gYCR7ZmlsZX06ICR7ZXJyLm1lc3NhZ2V9YFxuICAgICAgdGhyb3cgZXJyXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG9ialxufVxuXG5jb25zdCByZWFkRmlsZSA9IHVuaXZlcnNhbGlmeS5mcm9tUHJvbWlzZShfcmVhZEZpbGUpXG5cbmZ1bmN0aW9uIHJlYWRGaWxlU3luYyAoZmlsZSwgb3B0aW9ucyA9IHt9KSB7XG4gIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ3N0cmluZycpIHtcbiAgICBvcHRpb25zID0geyBlbmNvZGluZzogb3B0aW9ucyB9XG4gIH1cblxuICBjb25zdCBmcyA9IG9wdGlvbnMuZnMgfHwgX2ZzXG5cbiAgY29uc3Qgc2hvdWxkVGhyb3cgPSAndGhyb3dzJyBpbiBvcHRpb25zID8gb3B0aW9ucy50aHJvd3MgOiB0cnVlXG5cbiAgdHJ5IHtcbiAgICBsZXQgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhmaWxlLCBvcHRpb25zKVxuICAgIGNvbnRlbnQgPSBzdHJpcEJvbShjb250ZW50KVxuICAgIHJldHVybiBKU09OLnBhcnNlKGNvbnRlbnQsIG9wdGlvbnMucmV2aXZlcilcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKHNob3VsZFRocm93KSB7XG4gICAgICBlcnIubWVzc2FnZSA9IGAke2ZpbGV9OiAke2Vyci5tZXNzYWdlfWBcbiAgICAgIHRocm93IGVyclxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBfd3JpdGVGaWxlIChmaWxlLCBvYmosIG9wdGlvbnMgPSB7fSkge1xuICBjb25zdCBmcyA9IG9wdGlvbnMuZnMgfHwgX2ZzXG5cbiAgY29uc3Qgc3RyID0gc3RyaW5naWZ5KG9iaiwgb3B0aW9ucylcblxuICBhd2FpdCB1bml2ZXJzYWxpZnkuZnJvbUNhbGxiYWNrKGZzLndyaXRlRmlsZSkoZmlsZSwgc3RyLCBvcHRpb25zKVxufVxuXG5jb25zdCB3cml0ZUZpbGUgPSB1bml2ZXJzYWxpZnkuZnJvbVByb21pc2UoX3dyaXRlRmlsZSlcblxuZnVuY3Rpb24gd3JpdGVGaWxlU3luYyAoZmlsZSwgb2JqLCBvcHRpb25zID0ge30pIHtcbiAgY29uc3QgZnMgPSBvcHRpb25zLmZzIHx8IF9mc1xuXG4gIGNvbnN0IHN0ciA9IHN0cmluZ2lmeShvYmosIG9wdGlvbnMpXG4gIC8vIG5vdCBzdXJlIGlmIGZzLndyaXRlRmlsZVN5bmMgcmV0dXJucyBhbnl0aGluZywgYnV0IGp1c3QgaW4gY2FzZVxuICByZXR1cm4gZnMud3JpdGVGaWxlU3luYyhmaWxlLCBzdHIsIG9wdGlvbnMpXG59XG5cbmNvbnN0IGpzb25maWxlID0ge1xuICByZWFkRmlsZSxcbiAgcmVhZEZpbGVTeW5jLFxuICB3cml0ZUZpbGUsXG4gIHdyaXRlRmlsZVN5bmNcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBqc29uZmlsZVxuIiwgIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBqc29uRmlsZSA9IHJlcXVpcmUoJ2pzb25maWxlJylcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIC8vIGpzb25maWxlIGV4cG9ydHNcbiAgcmVhZEpzb246IGpzb25GaWxlLnJlYWRGaWxlLFxuICByZWFkSnNvblN5bmM6IGpzb25GaWxlLnJlYWRGaWxlU3luYyxcbiAgd3JpdGVKc29uOiBqc29uRmlsZS53cml0ZUZpbGUsXG4gIHdyaXRlSnNvblN5bmM6IGpzb25GaWxlLndyaXRlRmlsZVN5bmNcbn1cbiIsICIndXNlIHN0cmljdCdcblxuY29uc3QgdSA9IHJlcXVpcmUoJ3VuaXZlcnNhbGlmeScpLmZyb21Qcm9taXNlXG5jb25zdCBmcyA9IHJlcXVpcmUoJy4uL2ZzJylcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcbmNvbnN0IG1rZGlyID0gcmVxdWlyZSgnLi4vbWtkaXJzJylcbmNvbnN0IHBhdGhFeGlzdHMgPSByZXF1aXJlKCcuLi9wYXRoLWV4aXN0cycpLnBhdGhFeGlzdHNcblxuYXN5bmMgZnVuY3Rpb24gb3V0cHV0RmlsZSAoZmlsZSwgZGF0YSwgZW5jb2RpbmcgPSAndXRmLTgnKSB7XG4gIGNvbnN0IGRpciA9IHBhdGguZGlybmFtZShmaWxlKVxuXG4gIGlmICghKGF3YWl0IHBhdGhFeGlzdHMoZGlyKSkpIHtcbiAgICBhd2FpdCBta2Rpci5ta2RpcnMoZGlyKVxuICB9XG5cbiAgcmV0dXJuIGZzLndyaXRlRmlsZShmaWxlLCBkYXRhLCBlbmNvZGluZylcbn1cblxuZnVuY3Rpb24gb3V0cHV0RmlsZVN5bmMgKGZpbGUsIC4uLmFyZ3MpIHtcbiAgY29uc3QgZGlyID0gcGF0aC5kaXJuYW1lKGZpbGUpXG4gIGlmICghZnMuZXhpc3RzU3luYyhkaXIpKSB7XG4gICAgbWtkaXIubWtkaXJzU3luYyhkaXIpXG4gIH1cblxuICBmcy53cml0ZUZpbGVTeW5jKGZpbGUsIC4uLmFyZ3MpXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBvdXRwdXRGaWxlOiB1KG91dHB1dEZpbGUpLFxuICBvdXRwdXRGaWxlU3luY1xufVxuIiwgIid1c2Ugc3RyaWN0J1xuXG5jb25zdCB7IHN0cmluZ2lmeSB9ID0gcmVxdWlyZSgnanNvbmZpbGUvdXRpbHMnKVxuY29uc3QgeyBvdXRwdXRGaWxlIH0gPSByZXF1aXJlKCcuLi9vdXRwdXQtZmlsZScpXG5cbmFzeW5jIGZ1bmN0aW9uIG91dHB1dEpzb24gKGZpbGUsIGRhdGEsIG9wdGlvbnMgPSB7fSkge1xuICBjb25zdCBzdHIgPSBzdHJpbmdpZnkoZGF0YSwgb3B0aW9ucylcblxuICBhd2FpdCBvdXRwdXRGaWxlKGZpbGUsIHN0ciwgb3B0aW9ucylcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBvdXRwdXRKc29uXG4iLCAiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IHsgc3RyaW5naWZ5IH0gPSByZXF1aXJlKCdqc29uZmlsZS91dGlscycpXG5jb25zdCB7IG91dHB1dEZpbGVTeW5jIH0gPSByZXF1aXJlKCcuLi9vdXRwdXQtZmlsZScpXG5cbmZ1bmN0aW9uIG91dHB1dEpzb25TeW5jIChmaWxlLCBkYXRhLCBvcHRpb25zKSB7XG4gIGNvbnN0IHN0ciA9IHN0cmluZ2lmeShkYXRhLCBvcHRpb25zKVxuXG4gIG91dHB1dEZpbGVTeW5jKGZpbGUsIHN0ciwgb3B0aW9ucylcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBvdXRwdXRKc29uU3luY1xuIiwgIid1c2Ugc3RyaWN0J1xuXG5jb25zdCB1ID0gcmVxdWlyZSgndW5pdmVyc2FsaWZ5JykuZnJvbVByb21pc2VcbmNvbnN0IGpzb25GaWxlID0gcmVxdWlyZSgnLi9qc29uZmlsZScpXG5cbmpzb25GaWxlLm91dHB1dEpzb24gPSB1KHJlcXVpcmUoJy4vb3V0cHV0LWpzb24nKSlcbmpzb25GaWxlLm91dHB1dEpzb25TeW5jID0gcmVxdWlyZSgnLi9vdXRwdXQtanNvbi1zeW5jJylcbi8vIGFsaWFzZXNcbmpzb25GaWxlLm91dHB1dEpTT04gPSBqc29uRmlsZS5vdXRwdXRKc29uXG5qc29uRmlsZS5vdXRwdXRKU09OU3luYyA9IGpzb25GaWxlLm91dHB1dEpzb25TeW5jXG5qc29uRmlsZS53cml0ZUpTT04gPSBqc29uRmlsZS53cml0ZUpzb25cbmpzb25GaWxlLndyaXRlSlNPTlN5bmMgPSBqc29uRmlsZS53cml0ZUpzb25TeW5jXG5qc29uRmlsZS5yZWFkSlNPTiA9IGpzb25GaWxlLnJlYWRKc29uXG5qc29uRmlsZS5yZWFkSlNPTlN5bmMgPSBqc29uRmlsZS5yZWFkSnNvblN5bmNcblxubW9kdWxlLmV4cG9ydHMgPSBqc29uRmlsZVxuIiwgIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBmcyA9IHJlcXVpcmUoJy4uL2ZzJylcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcbmNvbnN0IHsgY29weSB9ID0gcmVxdWlyZSgnLi4vY29weScpXG5jb25zdCB7IHJlbW92ZSB9ID0gcmVxdWlyZSgnLi4vcmVtb3ZlJylcbmNvbnN0IHsgbWtkaXJwIH0gPSByZXF1aXJlKCcuLi9ta2RpcnMnKVxuY29uc3QgeyBwYXRoRXhpc3RzIH0gPSByZXF1aXJlKCcuLi9wYXRoLWV4aXN0cycpXG5jb25zdCBzdGF0ID0gcmVxdWlyZSgnLi4vdXRpbC9zdGF0JylcblxuYXN5bmMgZnVuY3Rpb24gbW92ZSAoc3JjLCBkZXN0LCBvcHRzID0ge30pIHtcbiAgY29uc3Qgb3ZlcndyaXRlID0gb3B0cy5vdmVyd3JpdGUgfHwgb3B0cy5jbG9iYmVyIHx8IGZhbHNlXG5cbiAgY29uc3QgeyBzcmNTdGF0LCBpc0NoYW5naW5nQ2FzZSA9IGZhbHNlIH0gPSBhd2FpdCBzdGF0LmNoZWNrUGF0aHMoc3JjLCBkZXN0LCAnbW92ZScsIG9wdHMpXG5cbiAgYXdhaXQgc3RhdC5jaGVja1BhcmVudFBhdGhzKHNyYywgc3JjU3RhdCwgZGVzdCwgJ21vdmUnKVxuXG4gIC8vIElmIHRoZSBwYXJlbnQgb2YgZGVzdCBpcyBub3Qgcm9vdCwgbWFrZSBzdXJlIGl0IGV4aXN0cyBiZWZvcmUgcHJvY2VlZGluZ1xuICBjb25zdCBkZXN0UGFyZW50ID0gcGF0aC5kaXJuYW1lKGRlc3QpXG4gIGNvbnN0IHBhcnNlZFBhcmVudFBhdGggPSBwYXRoLnBhcnNlKGRlc3RQYXJlbnQpXG4gIGlmIChwYXJzZWRQYXJlbnRQYXRoLnJvb3QgIT09IGRlc3RQYXJlbnQpIHtcbiAgICBhd2FpdCBta2RpcnAoZGVzdFBhcmVudClcbiAgfVxuXG4gIHJldHVybiBkb1JlbmFtZShzcmMsIGRlc3QsIG92ZXJ3cml0ZSwgaXNDaGFuZ2luZ0Nhc2UpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGRvUmVuYW1lIChzcmMsIGRlc3QsIG92ZXJ3cml0ZSwgaXNDaGFuZ2luZ0Nhc2UpIHtcbiAgaWYgKCFpc0NoYW5naW5nQ2FzZSkge1xuICAgIGlmIChvdmVyd3JpdGUpIHtcbiAgICAgIGF3YWl0IHJlbW92ZShkZXN0KVxuICAgIH0gZWxzZSBpZiAoYXdhaXQgcGF0aEV4aXN0cyhkZXN0KSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdkZXN0IGFscmVhZHkgZXhpc3RzLicpXG4gICAgfVxuICB9XG5cbiAgdHJ5IHtcbiAgICAvLyBUcnkgdy8gcmVuYW1lIGZpcnN0LCBhbmQgdHJ5IGNvcHkgKyByZW1vdmUgaWYgRVhERVZcbiAgICBhd2FpdCBmcy5yZW5hbWUoc3JjLCBkZXN0KVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyLmNvZGUgIT09ICdFWERFVicpIHtcbiAgICAgIHRocm93IGVyclxuICAgIH1cbiAgICBhd2FpdCBtb3ZlQWNyb3NzRGV2aWNlKHNyYywgZGVzdCwgb3ZlcndyaXRlKVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG1vdmVBY3Jvc3NEZXZpY2UgKHNyYywgZGVzdCwgb3ZlcndyaXRlKSB7XG4gIGNvbnN0IG9wdHMgPSB7XG4gICAgb3ZlcndyaXRlLFxuICAgIGVycm9yT25FeGlzdDogdHJ1ZSxcbiAgICBwcmVzZXJ2ZVRpbWVzdGFtcHM6IHRydWVcbiAgfVxuXG4gIGF3YWl0IGNvcHkoc3JjLCBkZXN0LCBvcHRzKVxuICByZXR1cm4gcmVtb3ZlKHNyYylcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBtb3ZlXG4iLCAiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IGZzID0gcmVxdWlyZSgnZ3JhY2VmdWwtZnMnKVxuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuY29uc3QgY29weVN5bmMgPSByZXF1aXJlKCcuLi9jb3B5JykuY29weVN5bmNcbmNvbnN0IHJlbW92ZVN5bmMgPSByZXF1aXJlKCcuLi9yZW1vdmUnKS5yZW1vdmVTeW5jXG5jb25zdCBta2RpcnBTeW5jID0gcmVxdWlyZSgnLi4vbWtkaXJzJykubWtkaXJwU3luY1xuY29uc3Qgc3RhdCA9IHJlcXVpcmUoJy4uL3V0aWwvc3RhdCcpXG5cbmZ1bmN0aW9uIG1vdmVTeW5jIChzcmMsIGRlc3QsIG9wdHMpIHtcbiAgb3B0cyA9IG9wdHMgfHwge31cbiAgY29uc3Qgb3ZlcndyaXRlID0gb3B0cy5vdmVyd3JpdGUgfHwgb3B0cy5jbG9iYmVyIHx8IGZhbHNlXG5cbiAgY29uc3QgeyBzcmNTdGF0LCBpc0NoYW5naW5nQ2FzZSA9IGZhbHNlIH0gPSBzdGF0LmNoZWNrUGF0aHNTeW5jKHNyYywgZGVzdCwgJ21vdmUnLCBvcHRzKVxuICBzdGF0LmNoZWNrUGFyZW50UGF0aHNTeW5jKHNyYywgc3JjU3RhdCwgZGVzdCwgJ21vdmUnKVxuICBpZiAoIWlzUGFyZW50Um9vdChkZXN0KSkgbWtkaXJwU3luYyhwYXRoLmRpcm5hbWUoZGVzdCkpXG4gIHJldHVybiBkb1JlbmFtZShzcmMsIGRlc3QsIG92ZXJ3cml0ZSwgaXNDaGFuZ2luZ0Nhc2UpXG59XG5cbmZ1bmN0aW9uIGlzUGFyZW50Um9vdCAoZGVzdCkge1xuICBjb25zdCBwYXJlbnQgPSBwYXRoLmRpcm5hbWUoZGVzdClcbiAgY29uc3QgcGFyc2VkUGF0aCA9IHBhdGgucGFyc2UocGFyZW50KVxuICByZXR1cm4gcGFyc2VkUGF0aC5yb290ID09PSBwYXJlbnRcbn1cblxuZnVuY3Rpb24gZG9SZW5hbWUgKHNyYywgZGVzdCwgb3ZlcndyaXRlLCBpc0NoYW5naW5nQ2FzZSkge1xuICBpZiAoaXNDaGFuZ2luZ0Nhc2UpIHJldHVybiByZW5hbWUoc3JjLCBkZXN0LCBvdmVyd3JpdGUpXG4gIGlmIChvdmVyd3JpdGUpIHtcbiAgICByZW1vdmVTeW5jKGRlc3QpXG4gICAgcmV0dXJuIHJlbmFtZShzcmMsIGRlc3QsIG92ZXJ3cml0ZSlcbiAgfVxuICBpZiAoZnMuZXhpc3RzU3luYyhkZXN0KSkgdGhyb3cgbmV3IEVycm9yKCdkZXN0IGFscmVhZHkgZXhpc3RzLicpXG4gIHJldHVybiByZW5hbWUoc3JjLCBkZXN0LCBvdmVyd3JpdGUpXG59XG5cbmZ1bmN0aW9uIHJlbmFtZSAoc3JjLCBkZXN0LCBvdmVyd3JpdGUpIHtcbiAgdHJ5IHtcbiAgICBmcy5yZW5hbWVTeW5jKHNyYywgZGVzdClcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyci5jb2RlICE9PSAnRVhERVYnKSB0aHJvdyBlcnJcbiAgICByZXR1cm4gbW92ZUFjcm9zc0RldmljZShzcmMsIGRlc3QsIG92ZXJ3cml0ZSlcbiAgfVxufVxuXG5mdW5jdGlvbiBtb3ZlQWNyb3NzRGV2aWNlIChzcmMsIGRlc3QsIG92ZXJ3cml0ZSkge1xuICBjb25zdCBvcHRzID0ge1xuICAgIG92ZXJ3cml0ZSxcbiAgICBlcnJvck9uRXhpc3Q6IHRydWUsXG4gICAgcHJlc2VydmVUaW1lc3RhbXBzOiB0cnVlXG4gIH1cbiAgY29weVN5bmMoc3JjLCBkZXN0LCBvcHRzKVxuICByZXR1cm4gcmVtb3ZlU3luYyhzcmMpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gbW92ZVN5bmNcbiIsICIndXNlIHN0cmljdCdcblxuY29uc3QgdSA9IHJlcXVpcmUoJ3VuaXZlcnNhbGlmeScpLmZyb21Qcm9taXNlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbW92ZTogdShyZXF1aXJlKCcuL21vdmUnKSksXG4gIG1vdmVTeW5jOiByZXF1aXJlKCcuL21vdmUtc3luYycpXG59XG4iLCAiJ3VzZSBzdHJpY3QnXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAvLyBFeHBvcnQgcHJvbWlzZWlmaWVkIGdyYWNlZnVsLWZzOlxuICAuLi5yZXF1aXJlKCcuL2ZzJyksXG4gIC8vIEV4cG9ydCBleHRyYSBtZXRob2RzOlxuICAuLi5yZXF1aXJlKCcuL2NvcHknKSxcbiAgLi4ucmVxdWlyZSgnLi9lbXB0eScpLFxuICAuLi5yZXF1aXJlKCcuL2Vuc3VyZScpLFxuICAuLi5yZXF1aXJlKCcuL2pzb24nKSxcbiAgLi4ucmVxdWlyZSgnLi9ta2RpcnMnKSxcbiAgLi4ucmVxdWlyZSgnLi9tb3ZlJyksXG4gIC4uLnJlcXVpcmUoJy4vb3V0cHV0LWZpbGUnKSxcbiAgLi4ucmVxdWlyZSgnLi9wYXRoLWV4aXN0cycpLFxuICAuLi5yZXF1aXJlKCcuL3JlbW92ZScpXG59XG4iLCAiaW1wb3J0IHsgTGlzdCB9IGZyb20gXCJAcmF5Y2FzdC9hcGlcIjtcbmltcG9ydCB7IGxzdGF0U3luYywgcmVhZGRpclN5bmMgfSBmcm9tIFwiZnMtZXh0cmFcIjtcbmltcG9ydCB7IGpvaW4gfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IExvY2FsSXRlbSBmcm9tIFwiLi9jb21wb25lbnRzL0xvY2FsSXRlbVwiO1xuaW1wb3J0IHBrZyBmcm9tICcuLi9wYWNrYWdlLmpzb24nO1xuXG5pbXBvcnQgeyB3b3Jrc3BhY2VQYXRoIH0gZnJvbSBcIi4vcHJlZmVyZW5jZVwiO1xuXG5leHBvcnQgY29uc3QgdmVyc2lvbiA9IHBrZy52ZXJzaW9uO1xuXG5mdW5jdGlvbiBWaXN1YWxTdHVkaW9Db2RlV29ya3NwYWNlTWFuYWdlcigpIHtcbiAgY29uc3QgV09SS1NQQUNFX0RJUiA9IHdvcmtzcGFjZVBhdGg7XG5cbiAgY29uc3QgZGlyZWN0b3J5RmlsdGVyID0gKGZpbGVuYW1lOiBzdHJpbmcpID0+IHtcbiAgICByZXR1cm4gbHN0YXRTeW5jKGpvaW4oV09SS1NQQUNFX0RJUiwgZmlsZW5hbWUpKS5pc0RpcmVjdG9yeSgpO1xuICB9O1xuXG4gIGNvbnN0IGRpcnMgPSByZWFkZGlyU3luYyhqb2luKFdPUktTUEFDRV9ESVIpKS5maWx0ZXIoZGlyZWN0b3J5RmlsdGVyKTtcbiAgY29uc3QgcHJvamVjdHMgPSBkaXJzLm1hcCgoaXRlbTogc3RyaW5nKSA9PiBqb2luKFdPUktTUEFDRV9ESVIsIGl0ZW0pKTtcblxuICByZXR1cm4gKFxuICAgIDxMaXN0IHNlYXJjaEJhclBsYWNlaG9sZGVyPVwiU2VhcmNoIFByb2plY3QgTmFtZS4uLlwiPlxuICAgICAgPExpc3QuU2VjdGlvbiB0aXRsZT1cIlJlc3VsdFwiPlxuICAgICAgICB7cHJvamVjdHMubWFwKChwcm9qZWN0OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICByZXR1cm4gPExvY2FsSXRlbSBrZXk9e3Byb2plY3R9IHByb2plY3Q9e3Byb2plY3R9IC8+O1xuICAgICAgICB9KX1cbiAgICAgIDwvTGlzdC5TZWN0aW9uPlxuICAgIDwvTGlzdD5cbiAgKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgVmlzdWFsU3R1ZGlvQ29kZVdvcmtzcGFjZU1hbmFnZXI7XG4iLCAiaW1wb3J0IHsgQWN0aW9uLCBBY3Rpb25QYW5lbCwgTGlzdCB9IGZyb20gXCJAcmF5Y2FzdC9hcGlcIjtcblxuaW1wb3J0IHRpbGRpZnkgZnJvbSBcInRpbGRpZnlcIjtcbmltcG9ydCB7IGRpcm5hbWUgfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgYnVpbGQsIGJ1bmRsZUlkZW50aWZpZXIgfSBmcm9tIFwiLi4vcHJlZmVyZW5jZVwiO1xuXG5pbnRlcmZhY2UgTG9jYWxJdGVtUHJvcHMge1xuICBwcm9qZWN0OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIExvY2FsSXRlbSh7IHByb2plY3QgfTogTG9jYWxJdGVtUHJvcHMpIHtcbiAgY29uc3QgcHJvamVjdEFycnMgPSBwcm9qZWN0LnNwbGl0KFwiL1wiKTtcbiAgY29uc3QgbmFtZSA9IHByb2plY3RBcnJzW3Byb2plY3RBcnJzLmxlbmd0aCAtIDFdO1xuICBjb25zdCBwcmV0dHlQYXRoID0gdGlsZGlmeShwcm9qZWN0KTtcbiAgY29uc3Qgc3VidGl0bGUgPSBkaXJuYW1lKHByZXR0eVBhdGgpO1xuXG4gIHJldHVybiAoXG4gICAgPExpc3QuSXRlbVxuICAgICAgdGl0bGU9e25hbWV9XG4gICAgICBzdWJ0aXRsZT17c3VidGl0bGV9XG4gICAgICBpY29uPXt7IGZpbGVJY29uOiBwcm9qZWN0IH19XG4gICAgICBrZXl3b3Jkcz17W25hbWVdfVxuICAgICAgYWN0aW9ucz17XG4gICAgICAgIDxBY3Rpb25QYW5lbD5cbiAgICAgICAgICA8QWN0aW9uUGFuZWwuU2VjdGlvbj5cbiAgICAgICAgICAgIDxBY3Rpb24uT3BlblxuICAgICAgICAgICAgICB0aXRsZT17YE9wZW4gaW4gJHtidWlsZH1gfVxuICAgICAgICAgICAgICBpY29uPVwiYWN0aW9uLWljb24ucG5nXCJcbiAgICAgICAgICAgICAgdGFyZ2V0PXtwcm9qZWN0fVxuICAgICAgICAgICAgICBhcHBsaWNhdGlvbj17YnVuZGxlSWRlbnRpZmllcn1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8QWN0aW9uLlNob3dJbkZpbmRlciBwYXRoPXtwcm9qZWN0fSAvPlxuICAgICAgICAgICAgPEFjdGlvbi5PcGVuV2l0aCBwYXRoPXtwcm9qZWN0fSBzaG9ydGN1dD17eyBtb2RpZmllcnM6IFtcImNtZFwiXSwga2V5OiBcIm9cIiB9fSAvPlxuICAgICAgICAgIDwvQWN0aW9uUGFuZWwuU2VjdGlvbj5cbiAgICAgICAgICA8QWN0aW9uUGFuZWwuU2VjdGlvbj5cbiAgICAgICAgICAgIDxBY3Rpb24uQ29weVRvQ2xpcGJvYXJkIHRpdGxlPVwiQ29weSBOYW1lXCIgY29udGVudD17bmFtZX0gc2hvcnRjdXQ9e3sgbW9kaWZpZXJzOiBbXCJjbWRcIl0sIGtleTogXCIuXCIgfX0gLz5cbiAgICAgICAgICAgIDxBY3Rpb24uQ29weVRvQ2xpcGJvYXJkXG4gICAgICAgICAgICAgIHRpdGxlPVwiQ29weSBQYXRoXCJcbiAgICAgICAgICAgICAgY29udGVudD17cHJldHR5UGF0aH1cbiAgICAgICAgICAgICAgc2hvcnRjdXQ9e3sgbW9kaWZpZXJzOiBbXCJjbWRcIiwgXCJzaGlmdFwiXSwga2V5OiBcIi5cIiB9fVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L0FjdGlvblBhbmVsLlNlY3Rpb24+XG4gICAgICAgIDwvQWN0aW9uUGFuZWw+XG4gICAgICB9XG4gICAgLz5cbiAgKTtcbn1cbiIsICJpbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IG9zIGZyb20gJ25vZGU6b3MnO1xuXG5jb25zdCBob21lRGlyZWN0b3J5ID0gb3MuaG9tZWRpcigpO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB0aWxkaWZ5KGFic29sdXRlUGF0aCkge1xuXHRjb25zdCBub3JtYWxpemVkUGF0aCA9IHBhdGgubm9ybWFsaXplKGFic29sdXRlUGF0aCkgKyBwYXRoLnNlcDtcblxuXHRyZXR1cm4gKFxuXHRcdG5vcm1hbGl6ZWRQYXRoLnN0YXJ0c1dpdGgoaG9tZURpcmVjdG9yeSlcblx0XHRcdD8gbm9ybWFsaXplZFBhdGgucmVwbGFjZShob21lRGlyZWN0b3J5ICsgcGF0aC5zZXAsIGB+JHtwYXRoLnNlcH1gKVxuXHRcdFx0OiBub3JtYWxpemVkUGF0aFxuXHQpXG5cdFx0LnNsaWNlKDAsIC0xKTtcbn1cbiIsICJpbXBvcnQgeyBnZXRQcmVmZXJlbmNlVmFsdWVzIH0gZnJvbSBcIkByYXljYXN0L2FwaVwiO1xuaW1wb3J0IHsgUHJlZmVyZW5jZXMsIFZTQ29kZUJ1aWxkIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuY29uc3QgcHJlZmVyZW5jZXM6IFByZWZlcmVuY2VzID0gZ2V0UHJlZmVyZW5jZVZhbHVlcygpO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QnVuZGxlSWRlbnRpZmllcigpIHtcbiAgc3dpdGNoIChwcmVmZXJlbmNlcy5idWlsZCkge1xuICAgIGNhc2UgVlNDb2RlQnVpbGQuQ29kZTpcbiAgICAgIHJldHVybiBcImNvbS5taWNyb3NvZnQuVlNDb2RlXCI7XG4gICAgY2FzZSBWU0NvZGVCdWlsZC5JbnNpZGVyczpcbiAgICAgIHJldHVybiBcImNvbS5taWNyb3NvZnQuVlNDb2RlSW5zaWRlcnNcIjtcbiAgICBjYXNlIFZTQ29kZUJ1aWxkLlZTQ29kaXVtOlxuICAgICAgcmV0dXJuIFwiY29tLnZzY29kaXVtXCI7XG4gICAgY2FzZSBWU0NvZGVCdWlsZC5WU0NvZGl1bU1pbm9yOlxuICAgICAgcmV0dXJuIFwiY29tLnZpc3VhbHN0dWRpby5jb2RlLm9zc1wiO1xuICAgIGNhc2UgVlNDb2RlQnVpbGQuV2ViU3Rvcm06XG4gICAgICByZXR1cm4gXCJjb20uamV0YnJhaW5zLldlYlN0b3JtXCI7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGJ1aWxkID0gcHJlZmVyZW5jZXMuYnVpbGQ7XG5leHBvcnQgY29uc3QgYnVuZGxlSWRlbnRpZmllciA9IGdldEJ1bmRsZUlkZW50aWZpZXIoKTtcbmV4cG9ydCBjb25zdCB3b3Jrc3BhY2VQYXRoID0gcHJlZmVyZW5jZXMud29ya3NwYWNlUGF0aDtcbiIsICJ7XG4gIFwiJHNjaGVtYVwiOiBcImh0dHBzOi8vd3d3LnJheWNhc3QuY29tL3NjaGVtYXMvZXh0ZW5zaW9uLmpzb25cIixcbiAgXCJuYW1lXCI6IFwidmlzdWFsLXN0dWRpby1jb2RlLXdvcmtzcGFjZS1tYW5hZ2VyXCIsXG4gIFwidGl0bGVcIjogXCJWaXN1YWwgU3R1ZGlvIENvZGUgV29ya3NwYWNlIE1hbmFnZXJcIixcbiAgXCJkZXNjcmlwdGlvblwiOiBcIlF1aWNrbHkgb3BlbiB5b3VyIHdvcmtzcGFjZSBwcm9qZWN0IVwiLFxuICBcImljb25cIjogXCJjb21tYW5kLWljb24ucG5nXCIsXG4gIFwiYXV0aG9yXCI6IFwiamVhc29ubm93XCIsXG4gIFwib3duZXJcIjogXCJzYW50cmVlXCIsXG4gIFwiY2F0ZWdvcmllc1wiOiBbXG4gICAgXCJEZXZlbG9wZXIgVG9vbHNcIlxuICBdLFxuICBcImxpY2Vuc2VcIjogXCJNSVRcIixcbiAgXCJjb21tYW5kc1wiOiBbXG4gICAge1xuICAgICAgXCJuYW1lXCI6IFwiaW5kZXhcIixcbiAgICAgIFwidGl0bGVcIjogXCJWaXN1YWwgU3R1ZGlvIENvZGUgV29ya3NwYWNlIE1hbmFnZXJcIixcbiAgICAgIFwic3VidGl0bGVcIjogXCJWU0NvZGUgV29ya3NwYWNlIE1hbmFnZXJcIixcbiAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJRdWlja2x5IG9wZW4geW91ciB3b3Jrc3BhY2UgcHJvamVjdCFcIixcbiAgICAgIFwibW9kZVwiOiBcInZpZXdcIlxuICAgIH1cbiAgXSxcbiAgXCJwcmVmZXJlbmNlc1wiOiBbXG4gICAge1xuICAgICAgXCJuYW1lXCI6IFwid29ya3NwYWNlUGF0aFwiLFxuICAgICAgXCJ0eXBlXCI6IFwidGV4dGZpZWxkXCIsXG4gICAgICBcInJlcXVpcmVkXCI6IHRydWUsXG4gICAgICBcImRlZmF1bHRcIjogXCJcIixcbiAgICAgIFwidGl0bGVcIjogXCJQYXRoIG9mIHlvdXIgd29ya3NwY2VcIixcbiAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgcHJvamVjdCBzcGFjZSBmb2xkZXIgeW91IHVzZSB0byBzdG9yZSBhbGwgeW91ciBwcm9qZWN0c1wiXG4gICAgfSxcbiAgICB7XG4gICAgICBcIm5hbWVcIjogXCJidWlsZFwiLFxuICAgICAgXCJ0eXBlXCI6IFwiZHJvcGRvd25cIixcbiAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICBcInRpdGxlXCI6IFwiQnVpbGRcIixcbiAgICAgIFwiZGVmYXVsdFwiOiBcIkNvZGVcIixcbiAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJTZWxlY3Qgd2hpY2ggYnVpbGQgb2YgVmlzdWFsIFN0dWRpbyBDb2RlIHRvIHVzZVwiLFxuICAgICAgXCJkYXRhXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwidmFsdWVcIjogXCJDb2RlXCIsXG4gICAgICAgICAgXCJ0aXRsZVwiOiBcIlZpc3VhbCBTdHVkaW8gQ29kZVwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInZhbHVlXCI6IFwiQ29kZSAtIEluc2lkZXJzXCIsXG4gICAgICAgICAgXCJ0aXRsZVwiOiBcIlZpc3VhbCBTdHVkaW8gQ29kZSAtIEluc2lkZXJzXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidmFsdWVcIjogXCJWU0NvZGl1bVwiLFxuICAgICAgICAgIFwidGl0bGVcIjogXCJWU0NvZGl1bVwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInZhbHVlXCI6IFwiVlNDb2RpdW0gPCAxLjcxXCIsXG4gICAgICAgICAgXCJ0aXRsZVwiOiBcIlZTQ29kaXVtIDwgMS43MVwiXG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9XG4gIF0sXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkByYXljYXN0L2FwaVwiOiBcIl4xLjU3LjJcIixcbiAgICBcImZzLWV4dHJhXCI6IFwiXjExLjEuMVwiLFxuICAgIFwidGlsZGlmeVwiOiBcIl4zLjAuMFwiXG4gIH0sXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkByYXljYXN0L2VzbGludC1jb25maWdcIjogXCIxLjAuNVwiLFxuICAgIFwiQHR5cGVzL2ZzLWV4dHJhXCI6IFwiXjExLjAuMVwiLFxuICAgIFwiQHR5cGVzL2pzb25maWxlXCI6IFwiXjYuMS4xXCIsXG4gICAgXCJAdHlwZXMvbm9kZVwiOiBcIjE4LjguM1wiLFxuICAgIFwiQHR5cGVzL3JlYWN0XCI6IFwiXjE4LjMuM1wiLFxuICAgIFwiQHR5cGVzL3JlYWN0LWRvbVwiOiBcIl4xOC4zLjBcIixcbiAgICBcImVzbGludFwiOiBcIl43LjMyLjBcIixcbiAgICBcInByZXR0aWVyXCI6IFwiXjIuNS4xXCIsXG4gICAgXCJ0eXBlc2NyaXB0XCI6IFwiXjQuNC4zXCJcbiAgfSxcbiAgXCJzY3JpcHRzXCI6IHtcbiAgICBcImJ1aWxkXCI6IFwicmF5IGJ1aWxkIC1vIGRpc3RcIixcbiAgICBcImRldlwiOiBcInJheSBkZXZlbG9wXCIsXG4gICAgXCJmaXgtbGludFwiOiBcInJheSBsaW50IC0tZml4XCIsXG4gICAgXCJsaW50XCI6IFwicmF5IGxpbnRcIixcbiAgICBcInB1Ymxpc2hcIjogXCJucHggQHJheWNhc3QvYXBpQGxhdGVzdCBwdWJsaXNoXCJcbiAgfSxcbiAgXCJ2ZXJzaW9uXCI6IFwiMS4wLjBcIlxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQSx1Q0FBQUEsVUFBQTtBQUFBO0FBRUEsSUFBQUEsU0FBUSxlQUFlLFNBQVUsSUFBSTtBQUNuQyxhQUFPLE9BQU8sZUFBZSxZQUFhLE1BQU07QUFDOUMsWUFBSSxPQUFPLEtBQUssS0FBSyxTQUFTLENBQUMsTUFBTSxXQUFZLElBQUcsTUFBTSxNQUFNLElBQUk7QUFBQSxhQUMvRDtBQUNILGlCQUFPLElBQUksUUFBUSxDQUFDLFNBQVMsV0FBVztBQUN0QyxpQkFBSyxLQUFLLENBQUMsS0FBSyxRQUFTLE9BQU8sT0FBUSxPQUFPLEdBQUcsSUFBSSxRQUFRLEdBQUcsQ0FBQztBQUNsRSxlQUFHLE1BQU0sTUFBTSxJQUFJO0FBQUEsVUFDckIsQ0FBQztBQUFBLFFBQ0g7QUFBQSxNQUNGLEdBQUcsUUFBUSxFQUFFLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFBQSxJQUMvQjtBQUVBLElBQUFBLFNBQVEsY0FBYyxTQUFVLElBQUk7QUFDbEMsYUFBTyxPQUFPLGVBQWUsWUFBYSxNQUFNO0FBQzlDLGNBQU0sS0FBSyxLQUFLLEtBQUssU0FBUyxDQUFDO0FBQy9CLFlBQUksT0FBTyxPQUFPLFdBQVksUUFBTyxHQUFHLE1BQU0s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QTBCO0FBQUEsSUFDMUIsbUJBQW1CO0FBQUEsSUFDbkIsbUJBQW1CO0FBQUEsSUFDbkIsZUFBZTtBQUFBLElBQ2YsZ0JBQWdCO0FBQUEsSUFDaEIsb0JBQW9CO0FBQUEsSUFDcEIsUUFBVTtBQUFBLElBQ1YsVUFBWTtBQUFBLElBQ1osWUFBYztBQUFBLEVBQ2hCO0FBQUEsRUFDQSxTQUFXO0FBQUEsSUFDVCxPQUFTO0FBQUEsSUFDVCxLQUFPO0FBQUEsSUFDUCxZQUFZO0FBQUEsSUFDWixNQUFRO0FBQUEsSUFDUixTQUFXO0FBQUEsRUFDYjtBQUFBLEVBQ0EsU0FBVztBQUNiOzs7QUp6RGlCLElBQUFDLHNCQUFBO0FBaEJWLElBQU0sVUFBVSxnQkFBSTtBQUUzQixTQUFTLG1DQUFtQztBQUMxQyxRQUFNLGdCQUFnQjtBQUV0QixRQUFNLGtCQUFrQixDQUFDLGFBQXFCO0FBQzVDLGVBQU8sK0JBQVUsbUJBQUssZUFBZSxRQUFRLENBQUMsRUFBRSxZQUFZO0FBQUEsRUFDOUQ7QUFFQSxRQUFNLFdBQU8saUNBQVksbUJBQUssYUFBYSxDQUFDLEVBQUUsT0FBTyxlQUFlO0FBQ3BFLFFBQU0sV0FBVyxLQUFLLElBQUksQ0FBQyxhQUFpQixtQkFBSyxlQUFlLElBQUksQ0FBQztBQUVyRSxTQUNFLDZDQUFDLG9CQUFLLHNCQUFxQiwwQkFDekIsdURBQUMsaUJBQUssU0FBTCxFQUFhLE9BQU0sVUFDakIsbUJBQVMsSUFBSSxDQUFDLFlBQW9CO0FBQ2pDLFdBQU8sNkNBQUMsYUFBd0IsV0FBVCxPQUEyQjtBQUFBLEVBQ3BELENBQUMsR0FDSCxHQUNGO0FBRUo7QUFFQSxJQUFPLGNBQVE7IiwKICAibmFtZXMiOiBbImV4cG9ydHMiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAicGF0aCIsICJmcyIsICJlcnIiLCAiZXJyMiIsICJlciIsICJlcjIiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAicGF0aCIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJxdWV1ZSIsICJmcyIsICJwYXRoIiwgIm9wdGlvbnMiLCAiY2IiLCAiZGF0YSIsICJzcmMiLCAiZGVzdCIsICJmbGFncyIsICJnbyRyZWFkZGlyIiwgIm1vZGUiLCAiZXhwb3J0cyIsICJidWZmZXIiLCAiYnVmZmVycyIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJwYXRoIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgInBhdGgiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAicGF0aCIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJwYXRoIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgInBhdGgiLCAiZGVzdFN0YXQiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAicGF0aCIsICJyZXF1aXJlX2NvcHkiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAicGF0aCIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJwYXRoIiwgImVtcHR5RGlyIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgInBhdGgiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAicGF0aCIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJwYXRoIiwgImV4aXN0cyIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJwYXRoIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgInJlcXVpcmVfdXRpbHMiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAicmVxdWlyZV9qc29uZmlsZSIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJwYXRoIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgInBhdGgiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAicGF0aCIsICJyZXF1aXJlX21vdmUiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAiaW1wb3J0X2FwaSIsICJpbXBvcnRfcGF0aCIsICJpbXBvcnRfYXBpIiwgIm9zIiwgInBhdGgiLCAiaW1wb3J0X2pzeF9ydW50aW1lIl0KfQo=
