'use strict';

module.exports = function(Photo) {
  var request = require('request');
  var AWS = require('aws-sdk');
  var s3 = new AWS.S3();

// Bucket names must be unique across all S3 users

  var myBucket = process.env.AWS_BLOBSTORE_BUCKET;

  var myKey = 'myBucketKey';
  var params;
  params = {Bucket: myBucket, Key: myKey, Body: 'Hello!'};
  function getPhoto() {
    var params = {
      Bucket: myBucket,
      MaxKeys: 5,
    };
    s3.listObjects(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
      /*
      data = {
       Contents: [
          {
         ETag: "\"70ee1738b6b21e2c8a43f3a5ab0eee71\"",
         Key: "example1.jpg",
         LastModified: <Date Representation>,
         Owner: {
          DisplayName: "myname",
          ID: "12345example25102679df27bb0ae12b3f85be6f290b936c4393484be31bebcc"
         },
         Size: 11,
         StorageClass: "STANDARD"
        },
          {
         ETag: "\"9c8af9a76df052144598c115ef33e511\"",
         Key: "example2.jpg",
         LastModified: <Date Representation>,
         Owner: {
          DisplayName: "myname",
          ID: "12345example25102679df27bb0ae12b3f85be6f290b936c4393484be31bebcc"
         },
         Size: 713193,
         StorageClass: "STANDARD"
        }
       ],
       NextMarker: "eyJNYXJrZXIiOiBudWxsLCAiYm90b190cnVuY2F0ZV9hbW91bnQiOiAyfQ=="
      }
      */
    });
  };

  s3.putObject(params, function(err, data) {
    if (err) {
      console.log(err);
    } else {
      console.log('Successfully uploaded data to myBucket/myKey');
    }
  });
  // Set the before execute process
  Photo.observe('access', function(ctx, next) {
    getPhoto();
    console.log(ctx);
    next();
  });
};
