 'use strict';
module.exports = function (app) {
  var models = app.models();
  var modelos=[];
  var Role = app.models.Role;
  models.forEach(function(Model) {
    modelos.push(Model.modelName);
});
  app.datasources.SolarDB.isActual(modelos, function(err, actual) {
    if(!actual){
      app.datasources.SolarDB.autoupdate(modelos, function(err, result){
        if(!err){
          Role.create({
            name: 'admin'
          }, function(err, role) {
            if (err) cb(err);
          });
        }
      });
    }
});
}
