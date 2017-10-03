'use strict';
//Import app object
var app = require('../../server/server');
//Import GoogleMapsAPI as a datasource
var MapsAPI = app.datasources.GoogleMaps;
const request = require('request');

module.exports = function(Area) {
  //Add remote hook to trigger events when Area will be saved
  Area.observe('before save', function getElevation(ctx, next) {
    console.log(ctx.instance);
    //Get the elevation from google
    MapsAPI.getElevation("39.6391536,-104.9847034|12.23423,-99.1").then(function(value) {
      //If elevation is received then call nasa API
      //console.log(value);
      request('https://eosweb.larc.nasa.gov/cgi-bin/sse/grid.cgi?&=&num=147037&lat=-34&submit=Submit&hgt=100&veg=17&email=&sitelev=&step=2&p=grid_id&p=avg_dnr&p=azi_ang&p=T10M&lon=-34', function (error, response, body) {
        //console.log('error:', error); // Print the error if one occurred
        //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        //console.log('body:', body); // Print the HTML for the Google homepage.
        next();
      });
    }, function(reason) {
      //If elevation cant be obtained respond with error
      console.log(reason);
      next();
    });
  });
};
