'use strict';
var app = require('../../server/server');

module.exports = function(Project) {
  var MapsAPI = app.datasources.GoogleMaps;
  Project.observe('before save', function getElevation(ctx, next) {
    MapsAPI.getElevation("39.6391536,-104.9847034|12.23423,-99.1").then(function(value) {
      // cumplimiento
      console.log(value);
    }, function(reason) {
      // rechazo
      console.log(reason);
    });
    next();
  });
};
