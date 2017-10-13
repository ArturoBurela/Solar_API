'use strict';

module.exports = function(Drone) {
  var app = require('../../server/server');
  // Import GoogleMapsAPI as a datasource
  var SA = app.datasources.SolarAnalytics;

  Drone.observe('before save', function getElevation(ctx, next) {
    console.log(SA.getToken());
    SA.executeCustom(20, 20, 20);
    next();
  },
    function(reason) {
      console.log(reason);
    });
};
