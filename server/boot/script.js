'use strict';
module.exports = function (app) {
  var Role = app.models.Role;
  //automigrar todos los modelos a base de datos en postgresql
  app.datasources.SolarDB.autoupdate(function(err, result){
    console.log("Performed automigration");
    if(err) throw err;
  });
  //crear Role
  Role.find({ name: 'admin' }, function(err, results) {//Encontrar el Role
    if (err) { throw err; }

    if (results.length < 1) {//si no existe entonces crearlo
        Role.create({
          name: 'admin'
        }, function(err, role) {
          if (err) throw err;
        });
    }
  });
}
