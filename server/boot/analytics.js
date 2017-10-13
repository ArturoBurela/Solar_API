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
      return accessToken;
    });
  };
  SA.getToken = function() {
    if (!!accessToken) {
      return accessToken;
    } else {
      return requestToken();
    }
  };
  var SACon = SA.connector;
// Set the before execute process
  SACon.observe('before execute', function(ctx, next) {
    console.log(ctx);
    next();
  });
  
};
