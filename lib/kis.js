
(function(exports) {
  var 
    Kis = {},
    argv = {};

  var
    jade    = require('jade'),
    hogan = require('hogan.js'),
    cs      = require('coffee-script'),
    util    = require('util'),
    fs      = require('fs'),
    fpath   = require('path'),
    connect = require('connect'),
    stylus  = require('stylus'),
    exec    = require('child_process').exec;



  Kis._new = function(argv) {
    var path;
    if (this.isDirClean(argv.d) || argv.force) {
      console.log('Starting project');
      path = fpath.normalize("" + __dirname + "/../example");
      return exec("cp -R " + path + "/ ./", this.stdLog);
    } else {
      return console.log('Directory is not clean, removed files and try again or use --force');
    }
  };

  Kis._build = function(argv) {
    return this.walk(argv.d, function(file) {
      return this[this.ext(file)](file);
    });
  };

  Kis._watch = function(argv) {
    this._build(argv);
    return this.walk(argv.d, this.watchFile);
  };

  Kis._serve = function(argv) {
    var app;
    this._watch(argv);
    return app = connect().use(connect.logger('dev')).use(connect["static"](fpath.resolve(argv.d))).listen(argv.p);
  };

  Kis.jade = function(fin) {
    var fout, tmpl;
    try {
      if (fpath.basename(fin).charAt(0) !== '_') {
        tmpl = jade.compile(fs.readFileSync(fin), {
          filename: fin
        });
        fout = this.changeExt(fin, '.html');
        fs.writeFileSync(fout, tmpl());
        return util.log("BUILD (Jade) - " + fin + " -> " + fout);
      }
    } catch (e) {
      return util.log(e);
    }
  };

  Kis.mustache = function(fin) {
    var fout, tmpl;
    try {
      if (fpath.basename(fin).charAt(0) !== '_') {
        tmpl = hogan.compile(fs.readFileSync(fin, 'utf8'))
        fout = this.changeExt(fin, '.html');
        fs.writeFileSync(fout, tmpl.render());
        return util.log("BUILD (Hogan.js) - " + fin + " -> " + fout);
      }
    } catch (e) {
      return util.log(e);
    }
  };


  Kis.coffee = function(fin) {
    var fout, script;
    try {
      script = cs.compile(fs.readFileSync(fin, 'utf8'));
      fout = this.changeExt(fin, '.js');
      fs.writeFileSync(fout, script);
      return util.log("BUILD (Coffee) - " + fin + " -> " + fout);
    } catch (e) {
      return util.log(e);
    }
  };

  Kis.styl = function(fin) {
    var _this = this;
    try {
      if (fpath.basename(fin).charAt(0) !== '_') {
        return stylus(fs.readFileSync(fin, 'utf8')).set('filename', fin).set('paths', [argv.d]).render(function(err, css) {
          var fout;
          if (err) {
            return util.log(err);
          } else {
            fout = _this.changeExt(fin, '.css');
            fs.writeFile(fout, css);
            return util.log("BUILD (Stylus) - " + fin + " -> " + fout);
          }
        });
      }
    } catch (e) {
      return util.log(e);
    }
  };

  Kis.readFileSync = function(file) {
    if (fs.fileExistsSync(file)) {
      return fs.readFileSync(file);
    }
    return false;
  };

  Kis.ext = function(file) {
    return fpath.extname(file).substr(1);
  };

  Kis.changeExt = function(file, ext) {
    return fpath.join(fpath.dirname(file), fpath.basename(file, fpath.extname(file)) + ext);
  };

  Kis.stdLog = function(err, stdout, stderr) {
    if (stdout) {
      console.log('stdout: ' + stdout);
    }
    if (stderr) {
      console.log('stderr: ' + stderr);
    }
    if (err !== null) {
      return console.log('exec error: ' + err);
    }
  };

  Kis.isDirClean = function(path) {
    var f, _i, _len, _ref;
    _ref = fs.readdirSync(path);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      f = _ref[_i];
      return false;
    }
    return true;
  };

  Kis.walk = function(path, callback) {
    var f, stats, _i, _len, _ref, _results;
    stats = fs.statSync(path);
    if (stats.isFile()) {
      if (this.isWatchable(path)) {
        return callback.call(this, path);
      }
    } else {
      _ref = fs.readdirSync(path);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        f = _ref[_i];
        f = fpath.join(path, f);
        stats = fs.statSync(f);
        if (stats.isDirectory()) {
          _results.push(this.walk(f, callback));
        } else {
          if (this.isWatchable(f)) {
            _results.push(callback.call(this, f));
          } else {
            _results.push(void 0);
          }
        }
      }
      return _results;
    }
  };

  Kis.isWatchable = function(file) {
    switch (fpath.extname(file)) {
      case '.coffee':
      case '.styl':
      case '.jade':
      case '.mustache':
        return true;
    }
    return false;
  };

  Kis.watchFile = function(file) {
    var _this = this;
    return fs.watchFile(file, function(curr, prev) {
      if (curr && (curr.nlink === 0 || +curr.mtime !== +prev.mtime)) {
        return _this[_this.ext(file)](file);
      }
    });
  };

  module.exports = exports = Kis;

})(exports);
