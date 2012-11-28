// Kis: Config
(function() {

  "use strict";

  var KisConfig = {
    // Directory that contains your source files to be run through
    // Kis and outputted to the "build" directory
    "source": "source",

    // Generated content ends up in specified directory. The build directory
    // should be different from the source directory.
    "build": "build",

    // Content, in the form of JSON that you may use in your templates.
    "content": "content"

  };


  // Helpers
  KisConfig.helpers = {};


  
  module.exports = exports = KisConfig;
})();