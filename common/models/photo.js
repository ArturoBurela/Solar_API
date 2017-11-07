'use strict';

module.exports = function(Photo) {
  // Import AWS skd to manage blobstore
  var AWS = require('aws-sdk');
  var s3 = new AWS.S3();
  // Bucket names must be unique across all S3 users
  var myBucket = process.env.AWS_BLOBSTORE_BUCKET;
  var params;

  function getPhoto(key, callback) {
    params = {Bucket: myBucket, Key: key.toString()};
    s3.getObject(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        callback(err);
      } else {
        callback(data.Body.toString());
      }
    });
  }

  function savePhoto(key, data, callback) {
    params = {Bucket: myBucket, Key: key.toString(), Body: data};
    s3.putObject(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        callback(err);
      } else {
        callback(true);
      }
    });
  }

  function listPhotos(callback) {
    var params = {
      Bucket: myBucket,
      MaxKeys: 10,
    };
    s3.listObjects(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        callback(err);
      } else {
        console.log(data);
        callback(data);
      }
    });
  }

  function deletePhoto(key, callback) {
    params = {Bucket: myBucket, Key: key.toString()};
    s3.deleteObject(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        callback(err);
      } else {
        callback(data);
      }
    });
  }

  // Set hooks to access and save photos
  /* Photo.afterRemote('find', function(ctx, photo, next) {
    if (!!photo) {
      // Obtener imagen desde el blobstore
      getPhoto(photo.id, function(err, data) {
        photo.image = data;
        next();
      });
    } else {
      next();
    }
  }); */
  Photo.afterRemote('findById', function(ctx, photo, next) {
    if (!!photo) {
      // Obtener imagen desde el blobstore
      getPhoto(photo.id, function(data) {
        photo.image = data;
        next();
      });
    } else {
      next();
    }
  });
  Photo.observe('after save', function(ctx, next) {
    // Guardar imagen en blobstore
    savePhoto(ctx.instance.id, ctx.instance.image, function() {
      next();
    });
  });
  Photo.observe('before delete', function(ctx, next) {
    // Delete image from blobstore
    deletePhoto(ctx.where.id, function() {
      next();
    });
  });
};
