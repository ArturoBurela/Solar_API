'use strict';

module.exports = function(app) {
  /*
  * The `app` object provides access to a variety of LoopBack resources such as
  * models (e.g. `app.models.YourModelName`) or data sources (e.g.
  * `app.datasources.YourDataSource`). See
  * http://docs.strongloop.com/display/public/LB/Working+with+LoopBack+objects
  * for more info.
  */
  var Role = app.models.Role;
  var dataSource = app.datasources.GoogleMaps;
  //create the admin role
  Role.create({
    name: 'admin'
  }, function(err, role) {
    if (err) cb(err);
  });

  function lol(result) {
    console.log(result);
  }

  dataSource.geocode('107 S B St', 'San Mateo', '94401').then(function(value) {
    // cumplimiento
    console.log(value);
  }, function(reason) {
    // rechazo
    console.log(reason);
  });
  dataSource.getElevation("39.6391536,-104.9847034|12.23423,-99.1").then(function(value) {
    // cumplimiento
    console.log(value);
  }, function(reason) {
    // rechazo
    console.log(reason);
  });
};
