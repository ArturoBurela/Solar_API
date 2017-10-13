'use strict';
module.exports = function(app) {
  var Role = app.models.Role;
  // automigrar todos los modelos a base de datos en postgresql
  app.datasources.SolarDB.autoupdate(function(err, result) {
    if (err) {
      throw err;
    } else {
      console.log('Performed automigration');
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
  app.datasources.SolarDB.instance = null;
  // Get token from UAA to use Analytics Framework
  var request = require('request');
  var options = {
    method: 'POST',
    url: 'https://8dc085ff-272e-4cac-901e-15c3f90233ee.predix-uaa.run.aws-usw02-pr.ice.predix.io/oauth/token',
    headers:
    {
      'cache-control': 'no-cache',
      'content-type': 'application/x-www-form-urlencoded',
      authorization: 'Basic YWZfcnQ6cGFzc3dvcmQ=',
    },
// eslint-disable-next-line camelcase
    form: {client_id: 'af_rt', grant_type: 'client_credentials'},
  };
  request(options, function(error, response, body) {
    if (error) throw new Error(error);
    var UAAresponse = JSON.parse(body);
    console.log(UAAresponse);
    // List available Analytics
    /// api/v1/catalog/analytics
    var data2 = {
      "totalArea": 100,
      "pvArea": 2,
      "pvCapacity": 200
    };
    var data = JSON.parse('{"data": {"plant_data": {"tilt": 5, "system_capacity": 1000, "array_azimuth": 0}, "system_data": {"inverter_data": {"inverter_efficiency": 0.9, "inverter_losses": 0.05}, "pv_module_data": {"array_losses": 0.05, "pv_module_efficiency": 0.11, "noct": 45.0, "temperature_coefficient": 0.004}}, "resource_data": {"latitude": 51.3, "air_temperature": [-0.2, 0.8, 3.9, 7.9, 12.6, 15.6, 17.2, 16.9, 13.5, 9.3, 4.1, 1.1], "daily_solar_radiation": [0.67, 1.39, 2.28, 3.69, 4.83, 4.78, 4.81, 4.08, 2.81, 1.56, 0.81, 0.47]}}, "config": {}}');
    console.log(UAAresponse.access_token);
    console.log(data);
    options = {
      method: 'POST',
      url: 'https://solar-analytics-framework.predix-analytics-ui.run.aws-usw02-pr.ice.predix.io/api/catalog/analytics/939d3928-e109-458d-81bd-4e1a912ba473/execution',
      headers:
      {
        'Predix-Zone-Id': '00c30eb0-8b5e-411c-bc3f-9d3a5d70f0d0',
        'content-type': 'application/json',
        authorization: 'Bearer ' + UAAresponse.access_token,
      },
      json: data2,
    };
    request(options, function(error, response, body) {
      if (error) throw new Error(error);
      console.log(body);
    });
  });

  var schedule = require('node-schedule');
  var date = new Date(2012, 11, 21, 5, 30, 0);
  var j = schedule.scheduleJob(date, function(){
    console.log('The world is going to end today.');
  });

  var Project = app.datasources.SolarDB;
  console.log(Project.instance);

  // Set REST API Blobstore
  // require('request').debug = true;
  /* var ak = "AKIAIVS7MIZMEOIIC34Q";
  var bn = "bucket-16909670-8588-4793-a261-2ffc3a64d3c4";
  var host = "s3-us-west-2.amazonaws.com";
  var sak = "vUnSsLZm8F/f+V2cBqFL+cCESDYBhnorZ9heHLLD";
  var url = "https://bucket-16909670-8588-4793-a261-2ffc3a64d3c4.s3-us-west-2.amazonaws.com";
  var date = new Date();
  var string = 'GET\n\n\n'+date.toUTCString()+'\n/'+bn+'/';
  console.log(string);
  var crypto = require('crypto');
  var hash = crypto.createHmac('sha1', sak).update(string).digest('base64'); */
  /* var string2 = 'GET\nelasticmapreduce.amazonaws.com\n/\nAWSAccessKeyId=AKIAIOSFODNN7EXAMPLE&Action=DescribeJobFlows&SignatureMethod=HmacSHA256&SignatureVersion=2&Timestamp=2011-10-03T15%3A19%3A30&Version=2009-03-31';
  var hash2 = crypto.createHmac('sha256', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY').update(string2).digest('base64');
  */
  /* options = {
    method: 'GET',
    url: url,
    headers: {
      'Date': date.toUTCString(),
      'Authorization':' AWS '+ak+':'+hash
    }
  }; */
  /* request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log(body);
  }); */

  // Import app object
  /* var app = require('../../server/server');
  //Import GoogleMapsAPI as a datasource
  var BlobStore = app.datasources.BlobStore;
  var BlobStoreConnector = BlobStore.connector;
  //Set the before execute process
/*  BlobStoreConnector.observe('before execute', function(ctx, next) {
    console.log(ctx);
    ctx.req.headers = options.headers;
    console.log(ctx);
    next();
  });
  //Get the elevation from google
  BlobStore.list().then(function(value) {
    console.log(value);
  }, function(reason) {
    //If elevation cant be obtained respond with error
    console.log(reason);

  }); */
};
