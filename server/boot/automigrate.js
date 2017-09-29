module.exports = function (app) {
   app.dataSources.SolarDB.autoupdate();
   console.log("Performed automigration.");
}
