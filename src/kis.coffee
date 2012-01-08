
jade = require 'jade'
cs = require 'coffee-script'
util = require 'util'
fs = require 'fs'
fpath = require 'path'
strata = require 'strata'
opti = require 'optimist'
#iuglyjs = require 'uglify-js'
stylus = require 'stylus'
exec = require('child_process').exec
  
argv = opti.usage('''
  Examples: 
    kis new
    kis build
    kis serve -p 8080
  
  Commands:
    new     Create new base project
    build   Build your project
    watch   Wacth and rebuild your project
    serve   Start a simple HTTP server on port 3000, watch and build your project
    ''')
.default({p: 3000, c: false})
.argv;

class Kis

  options:
    public: '.'

  compiledExt:
    '.jade': '.html'
    '.coffee': '.js'
    '.less': '.css'

  constructor: ->
    action = @['_' + argv._[0]]
    if action then action.call(@) else @_help()

  # Actions
  _new: ->
    if @isDirClean('.') or argv.force
      console.log 'Starting project'
      path = fpath.normalize "#{__dirname}/../example"
      exec "cp -R #{path}/ ./", @stdLog
    else
      console.log 'Directory is not clean, removed files and try again or use --force'

  _build: ->
    @walk @options.public, (file) ->
      @[@ext file](file)

  _watch: ->
    @_build()
    @walk @options.public, @watchFile

  _serve: ->
    @_watch()
    app = new strata.Builder
    app.use strata.commonLogger
    app.use strata.file, @options.public, ['index.html', 'index.htm']
    strata.run app, { port: argv.p }

  _clean: ->
    @walk '.', (file) ->
      ext = fpath.extname file
      switch ext
        when '.jade'
          html = @changeExt(file, '.html')
          console.log html
          if fpath.existsSync html
            fs.unlinkSync html

  _help: ->
    opti.showHelp()

  # Compilers, by extension
  jade: (fin) ->
    @layout = jade.compile fs.readFileSync('_layout.jade'), filename: '.' if not @layout
    if fpath.basename(fin).charAt(0) isnt '_'
      tmpl = jade.compile fs.readFileSync(fin), filename: '.'
      fout = @changeExt fin, '.html'
      fs.writeFileSync fout, @layout body: tmpl()
      util.log "BUILD (Jade) - #{fin} -> #{fout}"

  coffee: (fin) ->
    script = cs.compile fs.readFileSync(fin, 'utf8')
    fout = @changeExt fin, '.js'
    fs.writeFileSync fout, script
    util.log "BUILD (Coffee) - #{fin} -> #{fout}"

  styl: (fin) ->
    stylus(fs.readFileSync(fin, 'utf8'))
      .set('filename', 'nesting.css')
      .render (err, css) =>
        fout = @changeExt fin, '.css'
        fs.writeFile fout, css
        util.log "BUILD (Stylus) - #{fin} -> #{fout}"
      
  # Util
  ext: (file) ->
    return fpath.extname(file).substr(1)
  
  changeExt: (file, ext) ->
    fpath.join fpath.dirname(file), fpath.basename(file, fpath.extname(file)) + ext
  
  stdLog: (err, stdout, stderr) ->
    console.log 'stdout: ' + stdout if stdout
    console.log 'stderr: ' + stderr if stderr
    if err isnt null
      console.log 'exec error: ' + err
  
  isDirClean: (path) ->
    for f in fs.readdirSync(path)
      return false
    true
    

  # Does the .html, .css, or .js file have an associated 
  #          .jade, .styl, or .coffee file?
  isCompiledFromSrc: (srcFile) ->
    srcExt = fpath.extname srcFile
    cmpFile = @changeExt srcFile, @compiledExt[srcExt]
    if fpath.existsSync cmpFile
      console.log "#{cmpFile} <- #{srcFile}"
      return true
    console.log "#{srcFile} <- is an original and should be watched for changes"
    false
  
  #isCompiled: (file) ->
  
  walk: (path, callback) ->
    stats = fs.statSync path
    if stats.isFile()
      callback.call(@, path) if @isWatchable(path)
    else
      for f in fs.readdirSync(path)
        f = fpath.join(path, f)
        stats = fs.statSync(f)
        if stats.isDirectory()
          @walk f, callback
        else
          callback.call(@, f) if @isWatchable(f)

  isWatchable: (file) ->
    switch fpath.extname file 
      when '.coffee', '.less', '.styl', '.jade' then return true
    false

  watchFile: (file) ->
    fs.watchFile file, (curr, prev) =>
      if curr and (curr.nlink is 0 or +curr.mtime isnt +prev.mtime)
        @[@ext file](file)







new Kis()
