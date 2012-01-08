(function() {
  var Kis, argv, cs, exec, fpath, fs, jade, opti, strata, stylus, util;

  jade = require('jade');

  cs = require('coffee-script');

  util = require('util');

  fs = require('fs');

  fpath = require('path');

  strata = require('strata');

  opti = require('optimist');

  stylus = require('stylus');

  exec = require('child_process');

  argv = opti.usage('Examples: \n  kis new\n  kis build\n  kis serve -p 8080\n\nCommands:\n  new     Create new base project\n  build   Build your project\n  watch   Wacth and rebuild your project\n  serve   Start a simple HTTP server on port 3000, watch and build your project')["default"]({
    p: 3000,
    c: false
  }).argv;

  Kis = (function() {

    Kis.prototype.options = {
      public: '.'
    };

    Kis.prototype.compiledExt = {
      '.jade': '.html',
      '.coffee': '.js',
      '.less': '.css'
    };

    function Kis() {
      var action;
      action = this['_' + argv._[0]];
      if (action) {
        action.call(this);
      } else {
        this._help();
      }
    }

    Kis.prototype._new = function() {
      return console.log(this.isDirClean('.'), fpath.normalise("" + __dirname + "../example"));
    };

    Kis.prototype._build = function() {
      return this.walk(this.options.public, function(file) {
        return this[this.ext(file)](file);
      });
    };

    Kis.prototype._watch = function() {
      this._build();
      return this.walk(this.options.public, this.watchFile);
    };

    Kis.prototype._serve = function() {
      var app;
      this._watch();
      app = new strata.Builder;
      app.use(strata.commonLogger);
      app.use(strata.file, this.options.public, ['index.html', 'index.htm']);
      return strata.run(app, {
        port: argv.p
      });
    };

    Kis.prototype._clean = function() {
      return this.walk('.', function(file) {
        var ext, html;
        ext = fpath.extname(file);
        switch (ext) {
          case '.jade':
            html = this.changeExt(file, '.html');
            console.log(html);
            if (fpath.existsSync(html)) return fs.unlinkSync(html);
        }
      });
    };

    Kis.prototype._help = function() {
      return opti.showHelp();
    };

    Kis.prototype.jade = function(fin) {
      var fout, tmpl;
      if (fpath.basename(fin).charAt(0) !== '_') {
        tmpl = jade.compile(fs.readFileSync(fin), {
          filename: '.'
        });
        fout = this.changeExt(fin, '.html');
        fs.writeFileSync(fout, tmpl());
        return util.log("BUILD (Jade) - " + fin + " -> " + fout);
      }
    };

    Kis.prototype.coffee = function(fin) {
      var fout, script;
      script = cs.compile(fs.readFileSync(fin, 'utf8'));
      fout = this.changeExt(fin, '.js');
      fs.writeFileSync(fout, script);
      return util.log("BUILD (Coffee) - " + fin + " -> " + fout);
    };

    Kis.prototype.styl = function(fin) {
      var _this = this;
      return stylus(fs.readFileSync(fin, 'utf8')).set('filename', 'nesting.css').render(function(err, css) {
        var fout;
        fout = _this.changeExt(fin, '.css');
        fs.writeFile(fout, css);
        return util.log("BUILD (Stylus) - " + fin + " -> " + fout);
      });
    };

    Kis.prototype.ext = function(file) {
      return fpath.extname(file).substr(1);
    };

    Kis.prototype.changeExt = function(file, ext) {
      return fpath.join(fpath.dirname(file), fpath.basename(file, fpath.extname(file)) + ext);
    };

    Kis.prototype.stdLog = function(err, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) return console.log('exec error: ' + err);
    };

    Kis.prototype.isDirClean = function(path) {
      var f, _i, _len, _ref;
      _ref = fs.readdirSync(path);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        f = _ref[_i];
        return false;
      }
      return true;
    };

    Kis.prototype.isCompiledFromSrc = function(srcFile) {
      var cmpFile, srcExt;
      srcExt = fpath.extname(srcFile);
      cmpFile = this.changeExt(srcFile, this.compiledExt[srcExt]);
      if (fpath.existsSync(cmpFile)) {
        console.log("" + cmpFile + " <- " + srcFile);
        return true;
      }
      console.log("" + srcFile + " <- is an original and should be watched for changes");
      return false;
    };

    Kis.prototype.walk = function(path, callback) {
      var f, stats, _i, _len, _ref, _results;
      stats = fs.statSync(path);
      if (stats.isFile()) {
        if (this.isWatchable(path)) return callback.call(this, path);
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

    Kis.prototype.isWatchable = function(file) {
      switch (fpath.extname(file)) {
        case '.coffee':
        case '.less':
        case '.styl':
        case '.jade':
          return true;
      }
      return false;
    };

    Kis.prototype.watchFile = function(file) {
      var _this = this;
      return fs.watchFile(file, function(curr, prev) {
        if (curr && (curr.nlink === 0 || +curr.mtime !== +prev.mtime)) {
          return _this[_this.ext(file)](file);
        }
      });
    };

    return Kis;

  })();

  new Kis();

}).call(this);
