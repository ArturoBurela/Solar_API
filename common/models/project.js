'use strict';

module.exports = function(Project) {
  // Add remote hook to trigger events when Area will be saved
  /* Project.observe('before save', function getElevation(ctx, next) {

  }); */

  Project.instance = null;

  /*Project.instance = NULL;

  Project.createInstance = new function(msg, cb) {

  }

  Project.Singleton = function(msg, cb) {

    function createInstance() {
      var object = new Object('I am the instance');
      return object;
    }

    return {
      getInstance: function() {
        if (!instance) {
          instance = createInstance();
        }
        return instance;
      },
    };
      cb(null, 'Greetings... ' + msg);
    }

  Project.run = function(msg, cb) {
    var instance1 = Project.Singleton.getInstance("l");
    var instance2 = Project.Singleton.getInstance("l");
    console.log('Same instance? ' + (instance1 === instance2));
  }*/
};
