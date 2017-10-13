'use strict';

module.exports = function(Drone) {
  var app = require('../../server/server');
  // Import GoogleMapsAPI as a datasource
  var SA = app.datasources.SolarAnalytics;
  var data = '{"data": {"plant_data": {"tilt": 5, "system_capacity": 1000, "array_azimuth": 0}, "system_data": {"inverter_data": {"inverter_efficiency": 0.9, "inverter_losses": 0.05}, "pv_module_data": {"array_losses": 0.05, "pv_module_efficiency": 0.11, "noct": 45.0, "temperature_coefficient": 0.004}}, "resource_data": {"latitude": 51.3, "air_temperature": [-0.2, 0.8, 3.9, 7.9, 12.6, 15.6, 17.2, 16.9, 13.5, 9.3, 4.1, 1.1], "daily_solar_radiation": [0.67, 1.39, 2.28, 3.69, 4.83, 4.78, 4.81, 4.08, 2.81, 1.56, 0.81, 0.47]}}, "config": {}}';
  Drone.observe('before save', function filterProperties(ctx, next) {
    SA.executePhotovoltaic(data).then(function(value) {
      console.log(value);
    }, function(reason) {
      // If elevation cant be obtained respond with error
      console.log(reason);
    });
    next();
  });
};
