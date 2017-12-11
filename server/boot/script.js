'use strict';
module.exports = function(app) {
  console.log(process.env);
  console.log("PŔINTING");
  //const testFolder = process.env.DEPS_DIR+'/0/opencv-compiled-2.4.9';
const fs = require('fs');
  var Role = app.models.Role;
  // automigrar todos los modelos a base de datos en postgresql
  app.datasources.SolarDB.autoupdate(function(err, result) {
    if (err) {
      throw err;
    } else {
      console.log('Performed autoupdate');
      // crear Role
      Role.find({name: 'admin'}, function(err, results) { // Encontrar el Role
        if (err) {
          throw err;
        }
        if (results.length < 1) { // si no existe entonces crearlo
          Role.create({
            name: 'admin',
          }, function(err, role) {
            if (err) throw err;
          });
        }
      });
    }
  });
};
