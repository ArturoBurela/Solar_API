'use strict';
module.exports = function(app) {
  // const cv = require('opencv');
  /* cv.readImage('image.jpg', function(err, img) {
    if (err) {
      throw err;
    }

    const width = img.width();
    const height = img.height();

    if (width < 1 || height < 1) {
      throw new Error('Image has no size');
    }

    // do some cool stuff with img
    img.convertGrayscale();
    img.gaussianBlur([3, 3]);
    const lowThresh = 0;
    const highThresh = 150;
    const iterations = 2;

    img.canny(lowThresh, highThresh);
    img.dilate(iterations);
    const WHITE = [255, 255, 255];
    const GREEN = [0, 255, 0];
    var contours = img.findContours();
    var largestContourImg = img;
    var largestAreaIndex;
    var largestArea = 500;

    for (var i = 0; i < contours.size(); i++) {
      if (contours.area(i) > largestArea) {
        largestContourImg.drawContour(contours, i, GREEN, 3, 1);
      }
    }
    // save img
    largestContourImg.save('newimage.jpg');
  }); */
  /* var lowThresh = 0;
  var highThresh = 100;
  var nIters = 2;
  var minArea = 2000;

  var BLUE  = [255, 0, 0]; // B, G, R
  var RED   = [0, 0, 255]; // B, G, R
  var GREEN = [0, 255, 0]; // B, G, R
  var WHITE = [255, 255, 255]; // B, G, R

  cv.readImage('image2.jpg', function(err, im) {
    if (err) throw err;

    var width = im.width();
    var height = im.height();
    if (width < 1 || height < 1) throw new Error('Image has no size');

    var out = new cv.Matrix(height, width);
    im.convertGrayscale();
    var imCanny = im.copy();
    imCanny.canny(lowThresh, highThresh);
    imCanny.dilate(nIters);

    var contours = imCanny.findContours();

    for (var i = 0; i < contours.size(); i++) {
      if (contours.area(i) < minArea) continue;

      var arcLength = contours.arcLength(i, true);
      contours.approxPolyDP(i, 0.001 * arcLength, true);

      switch (contours.cornerCount(i)) {
        case 3:
          out.drawContour(contours, i, GREEN);
          break;
        case 4:
          out.drawContour(contours, i, RED);
          break;
        default:
          out.drawContour(contours, i, WHITE);
      }
    }

    out.save('detect-shapes.png');
    console.log('Image saved to ./tmp/detect-shapes.png');
  }); */
  var Role = app.models.Role;
  // automigrar todos los modelos a base de datos en postgresql
  app.datasources.SolarDB.autoupdate(function(err, result) {
    if (err) {
      throw err;
    } else {
      console.log('Performed autoupdate');
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
};
