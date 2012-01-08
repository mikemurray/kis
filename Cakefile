{spawn} = require 'child_process'
{log} = require 'util'

build = (callback) ->
  c = spawn 'coffee', ['-c', '-o', 'lib', 'src']
  c.stdout.on 'data', (data) -> log data.toString()
  c.stderr.on 'data', (data) -> log data.toString()
  c.on 'exit', (status) -> callback?() if status is 0

task 'build', 'Build src/ to lib/', ->
  build()
