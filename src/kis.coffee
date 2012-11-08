
jade = require 'jade'
cs = require 'coffee-script'
util = require 'util'
fs = require 'fs'
fpath = require 'path'
connect = require 'connect'
opti = require 'optimist'
stylus = require 'stylus'
exec = require('child_process').exec
  
argv = opti.usage('''
  Examples: 
    kis new
    kis build
    kis build -d path/to/project
    kis serve -p 8080
  
  Commands:
    new     Create new base project
    build   Build your project
    watch   Wacth and rebuild your project
    serve   Start a simple HTTP server on port 3000, watch and build your project
    ''')
.default({p: 3000, d:'.'})
.describe('p', 'Port to start simple webserver on')
.describe('d', 'Directory to run commands against')
.describe('force', 'Force an action, regardless of warnings')
.argv;

class Kis
  
  constructor: ->
    action = @['_' + argv._[0]]
    if action then action.call(@) else @_help()

  # Actions
  _new: ->
    if @isDirClean(argv.d) or argv.force
      console.log 'Starting project'
      path = fpath.normalize "#{__dirname}/../example"
      exec "cp -R #{path}/ ./", @stdLog
    else
      console.log 'Directory is not clean, removed files and try again or use --force'

  _build: ->
    @walk argv.d, (file) ->
      @[@ext file](file)

  _watch: ->
    @_build()
    @walk argv.d, @watchFile

  _serve: ->
    @_watch()
    app = connect()
      .use(connect.logger('dev'))
      .use(connect.static(fpath.resolve(argv.d)))
      .listen(argv.p)

  _help: ->
    opti.showHelp()

  # Compilers, by extension
  jade: (fin) ->
    try
      #@layout = jade.compile fs.readFileSync('_layout.jade'), filename: '.' if not @layout
      if fpath.basename(fin).charAt(0) isnt '_'
        tmpl = jade.compile fs.readFileSync(fin), filename: fin
        fout = @changeExt fin, '.html'
        fs.writeFileSync fout, tmpl()
        util.log "BUILD (Jade) - #{fin} -> #{fout}"
    catch e
      util.log e

  coffee: (fin) ->
    try
      script = cs.compile fs.readFileSync(fin, 'utf8')
      fout = @changeExt fin, '.js'
      fs.writeFileSync fout, script
      util.log "BUILD (Coffee) - #{fin} -> #{fout}"
    catch e
      util.log e

  styl: (fin) ->
    try
      if fpath.basename(fin).charAt(0) isnt '_'
        stylus(fs.readFileSync(fin, 'utf8'))
          .set('filename', fin)
          .set('paths', [argv.d])
          .render (err, css) =>
            if err
              util.log err
            else
              fout = @changeExt fin, '.css'
              fs.writeFile fout, css
              util.log "BUILD (Stylus) - #{fin} -> #{fout}"
    catch e
      util.log e
     
      
  # Util
  readFileSync: (file) ->
    if fs.fileExistsSync file
      return fs.readFileSync file
    false

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
      when '.coffee', '.styl', '.jade' then return true
    false

  watchFile: (file) ->
    fs.watchFile file, (curr, prev) =>
      if curr and (curr.nlink is 0 or +curr.mtime isnt +prev.mtime)
        @[@ext file](file)


new Kis()
