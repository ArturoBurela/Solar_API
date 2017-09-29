module.exports = function (app) {
   app.datasources.SolarDB.autoupdate();
   console.log("Performed automigration.");
}
