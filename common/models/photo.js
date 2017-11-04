'use strict';

module.exports = function(Photo) {
  // Import AWS skd to manage blobstore
  var AWS = require('aws-sdk');
  var s3 = new AWS.S3();
  // Bucket names must be unique across all S3 users
  var myBucket = process.env.AWS_BLOBSTORE_BUCKET;
  var myKey = 'myBucketKey';
  var params;

  function getPhoto() {
    params = {Bucket: myBucket, Key: myKey};
    s3.getObject(params, function(err, data) {
      if (err) console.log(err, err.stack);
      else {
        console.log(data.Body.toString());
        return data.Body.toString();
      }
    });
  };

  function savePhoto() {
    params = {Bucket: myBucket, Key: myKey, Body: 'Hello!'};
    s3.putObject(params, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log('Successfully uploaded data to myBucket/myKey');
      }
    });
  };
  function listPhotos() {
    var params = {
      Bucket: myBucket,
      MaxKeys: 10,
    };
    s3.listObjects(params, function(err, data) {
      if (err) console.log(err, err.stack);
      else     console.log(data);
    });
  }
  // USE CALLBACSK OR OTHER SHIT TO RETURN VALUE
  function deletePhoto() {
    params = {Bucket: myBucket, Key: myKey};
    s3.deleteObject(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });
  };
  // Set hooks to access and save photos
  Photo.afterRemote('find', function(ctx, photo, next) {
    console.log(photo);
    if (!!photo) {
      // Obtener imagen desde el blobstore
      photo.image = getPhoto();
    }
    next();
  });
  Photo.afterRemote('findById', function(ctx, photo, next) {
    // listPhotos();
    console.log(photo);
    if (!!photo) {
      // Obtener imagen desde el blobstore
      photo.image = getPhoto();
    }
    next();
  });
  /* Photo.observe('before save', function(ctx, next) {
    savePhoto();
    console.log(ctx);
    next();
  });
  Photo.observe('before delete', function(ctx, next) {
    deletePhoto();
    console.log(ctx);
    next();
  }); */
};
