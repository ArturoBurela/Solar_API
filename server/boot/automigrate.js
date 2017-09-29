module.exports = function (app) {
   app.dataSources.SolarDB.automigrate();
   console.log("Performed automigration.");
}
