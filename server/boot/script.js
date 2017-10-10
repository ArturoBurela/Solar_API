'use strict';
module.exports = function (app) {
  var Role = app.models.Role;
  //automigrar todos los modelos a base de datos en postgresql
  app.datasources.SolarDB.autoupdate(function(err, result){
    if(err){
      throw err;
    }else{
      console.log("Performed automigration");
      //crear Role
      Role.find({ name: 'admin' }, function(err, results) {//Encontrar el Role
        if (err) { throw err; }
        if (results.length < 1) {//si no existe entonces crearlo
          Role.create({
            name: 'admin'
          }, function(err, role) {
            if (err) throw err;
          });
        }
      });
    }
  });
  //Get token from UAA to use Analytics Framework
  var request = require("request");
  var options = { method: 'POST',
  url: 'https://8dc085ff-272e-4cac-901e-15c3f90233ee.predix-uaa.run.aws-usw02-pr.ice.predix.io/oauth/token',
  headers:
  { 'cache-control': 'no-cache',
  'content-type': 'application/x-www-form-urlencoded',
  authorization: 'Basic YWZfcnQ6cGFzc3dvcmQ=' },
  form: { client_id: 'af_rt', grant_type: 'client_credentials' } };
  /*
  request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
});
*/
//Set REST API Blobstore
/*options = { method: 'POST',
url: 'https://8dc085ff-272e-4cac-901e-15c3f90233ee.predix-uaa.run.aws-usw02-pr.ice.predix.io/oauth/token',
headers:
{ 'cache-control': 'no-cache',
'content-type': 'application/x-www-form-urlencoded',
authorization: 'Basic YWZfcnQ6cGFzc3dvcmQ=' },
form: { client_id: 'af_rt', grant_type: 'client_credentials' } };

request(options, function (error, response, body) {
if (error) throw new Error(error);

console.log(body);
});*/
require('request').debug = true

var ak = "AKIAIVS7MIZMEOIIC34Q";
var bn = "bucket-16909670-8588-4793-a261-2ffc3a64d3c4";
var host = "s3-us-west-2.amazonaws.com";
var sak = "vUnSsLZm8F/f+V2cBqFL+cCESDYBhnorZ9heHLLD";
var url = "https://bucket-16909670-8588-4793-a261-2ffc3a64d3c4.s3-us-west-2.amazonaws.com";
var date = new Date();

var string = 'GET\n\n\n'+date.toUTCString()+'\n/'+bn+'/';

console.log(string);

var crypto = require('crypto')
  , text = string
  , key = ak
  , hash

hash = crypto.createHmac('sha1', sak).update(string).digest('base64');

/*var string2 = 'GET\nelasticmapreduce.amazonaws.com\n/\nAWSAccessKeyId=AKIAIOSFODNN7EXAMPLE&Action=DescribeJobFlows&SignatureMethod=HmacSHA256&SignatureVersion=2&Timestamp=2011-10-03T15%3A19%3A30&Version=2009-03-31';
var hash2 = crypto.createHmac('sha256', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY').update(string2).digest('base64');
*/
options = { method: 'GET',
url: url,
headers:
{
'Date': date.toUTCString(),
'Authorization':' AWS '+key+':'+hash } };

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
});

}
