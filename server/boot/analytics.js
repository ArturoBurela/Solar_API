'use strict';

module.exports = function(app) {
  var SA = app.datasources.SolarAnalytics;
  var request = require('request');
  var accessToken = null;
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
  function requestToken() {
    request(options, function(error, response, body) {
      if (error) throw new Error(error);
      var UAAresponse = JSON.parse(body);
      console.log(UAAresponse);
      accessToken = UAAresponse.access_token;
      var schedule = require('node-schedule');
      var date = new Date(2012, 11, 21, 5, 30, 0);
      var j = schedule.scheduleJob(date, function() {
        console.log('The world is going to end today.');
      });
    });
  };
  requestToken();
  /*
  // List available Analytics
    /// api/v1/catalog/analytics
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
      json: data,
    };
    request(options, function(error, response, body) {
      if (error) throw new Error(error);
      console.log(body);
    });
   */
  var SACon = SA.connector;
// Set the before execute process
  SACon.observe('before execute', function(ctx, next) {
    ctx.req.headers = {
      'Predix-Zone-Id': '00c30eb0-8b5e-411c-bc3f-9d3a5d70f0d0',
      'content-type': 'application/json',
      authorization: 'Bearer ' + accessToken,
    };
    console.log(ctx);
    next();
  });
};
