'use strict';

module.exports = function(Result) {
  var dataROI = {
    energiaGenerada:"",
    distintosPaneles:"",
    distintosInversores:"",
    numPaneles:"",
    numInversores:"",
    costoPanel:"",
    costoInversor:"",
    aumentoCFE:"",
    inflacion:"",
    kWh:""
  };
  var dataPhotovoltaicAnalytic = {
    data:{
      plant_data: {
        tilt: "",
        system_capacity: "",
        array_azimuth: ""
      },
      system_data:{
        inverter_data:{
          inverter_efficiency:"" ,
          inverter_losses: ""
        },
        pv_module_data:{
          array_losses: "",
          pv_module_efficiency: "",
          noct: "",
          temperature_coefficient: ""
        }
      },
      resource_data:{
        latitude: "",
        air_temperature: "",
        daily_solar_radiation: ""
      }
    },
    config:{}
  };

  var dataAreaDelimitationAnalytic={

  };
  var dataPhotovoltaicSystemConfiguration={
    Voc: "",
    Isc: "",
    Vmp: "",
    Imp: "",
    vDCInverter:"",
    iDCInverter: ""

  };


  var request = require('request');
  var options = {
    method: 'POST',
    url: 'https://8dc085ff-272e-4cac-901e-15c3f90233ee.predix-uaa.run.aws-usw02-pr.ice.predix.io/oauth/token',
    headers:
    {
      'cache-control': 'no-cache',
      'content-type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic YWZfcnQ6cGFzc3dvcmQ='
    },
// eslint-disable-next-line camelcase
    form: {client_id: 'af_rt', grant_type: 'client_credentials'}
  };
  request(options, function(error, response, body) {
    if (error) throw new Error(error);
    var UAAresponse = JSON.parse(body);
  options = {
    method: 'POST',
    url: 'https://predix-analytics-catalog-release.run.aws-usw02-pr.ice.predix.io/api/v1/catalog/analytics/aa7bbd17-23c0-4bf1-8a53-3ddd13267f68/execution',
    headers:
    {
      'Predix-Zone-Id': '00c30eb0-8b5e-411c-bc3f-9d3a5d70f0d0',
      'content-type': 'application/json',
      'authorization': 'Bearer ' + UAAresponse.access_token
    },
    json: data
  };
  console.log(JSON.stringify(data));
  request(options, function(error, response, body) {
    if (error) throw new Error(error);
    console.log(body);
  });

});

}
