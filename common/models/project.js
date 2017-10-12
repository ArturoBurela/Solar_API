'use strict';

module.exports = function(Project) {
  // Add remote hook to trigger events when Area will be saved
  /* Project.observe('before save', function getElevation(ctx, next) {

  }); */
  var Singleton = (function() {
    var instance;

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
  })();

  function run() {
    var instance1 = Singleton.getInstance();
    var instance2 = Singleton.getInstance();
    console.log('Same instance? ' + (instance1 === instance2));
  }
  run();
};
