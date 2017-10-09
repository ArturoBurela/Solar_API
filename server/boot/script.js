'use strict';
module.exports = function (app) {
  var Role = app.models.Role;
  //automigrar todos los modelos a base de datos en postgresql
  app.datasources.SolarDB.autoupdate(function(err, result){
    if(err){
      throw err;
    }else{
      console.log("Performed automigration");
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
  });
  //Get token from UAA to use Analytics Framework
  var request = require("request");
  var options = { method: 'POST',
  url: 'https://8dc085ff-272e-4cac-901e-15c3f90233ee.predix-uaa.run.aws-usw02-pr.ice.predix.io/oauth/token',
  headers:
  { 'cache-control': 'no-cache',
  'content-type': 'application/x-www-form-urlencoded',
  authorization: 'Basic YWZfcnQ6cGFzc3dvcmQ=' },
  form: { client_id: 'af_rt', grant_type: 'client_credentials' } };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);

    console.log(body);
  });

  //var AWS = require('aws-sdk');


}
