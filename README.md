# About

kis is a simple static site generator using Jade, CoffeeScript, and Stylus

# Installation

    npm install -g kis

# Usage

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

    Options:
      -p       Port to start simple webserver on        [default: 3000]
      -d       Directory to run commands against        [default: "."]
      --force  Force an action, regardless of warnings
