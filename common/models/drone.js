'use strict';

module.exports = function(Drone) {
  var app = require('../../server/server');
  //Import GoogleMapsAPI as a datasource
  var MapsAPI = app.models.Project;

  Drone.observe('before save', function getElevation(ctx, next) {
    MapsAPI.run();
        next();
    },
    function (reason) {
      console.log(reason);
      next();
    });
};
