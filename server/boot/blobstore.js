'use strict';

module.exports = function(app) {
  // var SA = app.datasources.SolarAnalytics;
  // Set REST API Blobstore
  /* var ak = 'AKIAIVS7MIZMEOIIC34Q';
  var bn = 'bucket-16909670-8588-4793-a261-2ffc3a64d3c4';
  var host = 's3-us-west-2.amazonaws.com';
  var sak = 'vUnSsLZm8F/f+V2cBqFL+cCESDYBhnorZ9heHLLD';
  var url = 'https://bucket-16909670-8588-4793-a261-2ffc3a64d3c4.s3-us-west-2.amazonaws.com';
  var date = new Date();
  var string = 'GET\n\n\n' + date.toUTCString() + '\n/' + bn + '/';
  var string2 = 'POST\n\nmultipart/form-data\n' + date.toUTCString() + '\n/' + bn + '/';
  // console.log(string);
  var crypto = require('crypto');
  var hash = crypto.createHmac('sha1', sak).update(string).digest('base64');
  var hash2 = crypto.createHmac('sha1', sak).update(string2).digest('base64');
  // var string2 = 'GET\nelasticmapreduce.amazonaws.com\n/\nAWSAccessKeyId=AKIAIOSFODNN7EXAMPLE&Action=DescribeJobFlows&SignatureMethod=HmacSHA256&SignatureVersion=2&Timestamp=2011-10-03T15%3A19%3A30&Version=2009-03-31';
  // var hash2 = crypto.createHmac('sha256', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY').update(string2).digest('base64');
  var options = {
    method: 'GET',
    url: url,
    headers: {
      'Date': date.toUTCString(),
      'Authorization': ' AWS ' + ak + ':' + hash,
    },
  };
  var options2 = {
    method: 'POST',
    url: url,
    headers: {
      'Date': date.toUTCString(),
      'Authorization': ' AWS ' + ak + ':' + hash2,
      'Content-Type': 'multipart/form-data',
    },
  };
  request(options, function(error, response, body) {
    if (error) throw new Error(error);
    // console.log(body);
  });
  // XML parser for Blobstore responses
  var parseString = require('xml2js').parseString;
  // Import GoogleMapsAPI as a datasource
  var BlobStore = app.datasources.BlobStore;
  var BlobStoreConnector = BlobStore.connector;
  // Set the before execute process
  BlobStoreConnector.observe('before execute', function(ctx, next) {
    if (ctx.req.headers.Type == 'upload') {
      console.log('Llamando a upload');
      ctx.req.headers = options2.headers;
    } else {
      ctx.req.headers = options.headers;
    }
    // console.log(ctx);
    next();
  });

  // Get the elevation from google
  BlobStore.list().then(function(value) {
    console.log(value);
    // console.log(value);
  }, function(reason) {
    // If elevation cant be obtained respond with error
    console.log(reason);
  });
  var photoFoo = 'asdasds';
  BlobStore.uploadPhoto(photoFoo).then(function(value) {
    console.log(value);
  }, function(reason) {
    // If elevation cant be obtained respond with error
    console.log(reason);
  }); */
  // var SACon = SA.connector;
// Set the before execute process
  /* SACon.observe('before execute', function(ctx, next) {
    console.log(ctx);
    next();
  }); */
};
