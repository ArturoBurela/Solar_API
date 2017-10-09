'use strict';
var cheerio = require('cheerio'), cheerioTableparser = require('cheerio-tableparser');
//Import app object
var app = require('../../server/server');
//Import GoogleMapsAPI as a datasource
var MapsAPI = app.datasources.GoogleMaps;

const request = require('request');
function array2DToJSON(a, p, nl) {
      var i, j, s = '[{"' + p + '":{';
      nl = nl || '';
      for (i = 0; i < a.length; ++i) {
        s += nl + arrayToJSON(a[i]);
        if (i < a.length - 1)
          s += ',';
      }
      s += nl + '}}]';
      return s;
    }
    function arrayToJSON(a, p) {
      var i, s = '';
      for (i = 0; i < a.length; ++i) {
        if (typeof a[i] == 'string')
          s += '"' + a[i] + '"';
        else  // assume number type
          s += a[i];
        if (i < a.length - 1)
          s += ':';
      }
      s += '';
      if (p)
        return '{"' + p + '":' + s + '}';
      return s;
    }
module.exports = function(Area) {
  //Add remote hook to trigger events when Area will be saved
  Area.observe('before save', function getElevation(ctx, next) {
    //Get the elevation from google
    MapsAPI.getElevation("39.6391536,-104.9847034|12.23423,-99.1").then(function(value) {
      //If elevation is received then call nasa API
      console.log(value);
      request('https://eosweb.larc.nasa.gov/cgi-bin/sse/grid.cgi?&=&num=147037&lat=-34&submit=Submit&hgt=100&veg=17&email=&sitelev=&step=2&p=grid_id&p=avg_dnr&p=azi_ang&p=T10M&lon=-34', function (error, response, body) {
        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode);
        console.log(response.headers['content-type']); // Print the response status code if a response was received
        console.log('body:', body); // Print the HTML for the Google homepage.
        //create JSON from HTML table
        var $ = cheerio.load(body);
        cheerioTableparser($);
        $('table').eq(4).find('caption').remove();
        $('table').eq(4).find('br').remove();
        $('table').eq(4).find('tr').eq(0).find('td').eq(0).remove();
        $('table').eq(4).find('tr').eq(1).find('td').eq(0).remove();
        var table = $('table').eq(4).parsetable();
        table = array2DToJSON(table,'radiation');

        console.log(JSON.parse(table));
        //console.log(body.getElementsByTagName('table'));
        next();
      });
    }, function(reason) {
      //If elevation cant be obtained respond with error
      console.log(reason);
      next();
    });
  });
};
