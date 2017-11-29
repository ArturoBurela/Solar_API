'use strict';
var cheerio = require('cheerio');
var cheerioTableparser = require('cheerio-tableparser');
var async = require('async');
//Import app object
var app = require('../../server/server');
var request = require('request');
const noct = 45;
const tempAmbMin = -10;
const radiacionNOCT = 800;
const espectroRad = 1.5;
const tempAmbNOCT = 20;
const windSpeed = 1;
const cellTemp = 25;
const airMass = 1.5;
const radiacionSTC = 1000;
const cfeAumenta = 2.0;
const inflation = 3.0;
const difPanel = 1;
const difInverter = 1;
const inverterEfficience = 0.90;
const avgLosses = 0.05;
//var Alternative = app.models.Alternative;
var dataAreaDelimitationAnalytic=
{
area_general: [ {latitud: 19.358920, longitud: -99.259824},
{latitud: 19.358998, longitud: -99.259370},
{latitud: 19.358187, longitud: -99.259210},
{latitud: 19.358109, longitud: -99.259659},
{latitud: 19.358920, longitud: -99.259824} ],
obstaculo_1: [ {latitud : 0.000140, longitud: -0.000043},
{latitud : 0.000140, longitud: -0.000053},
{latitud : 0.000130, longitud: -0.000053},
{latitud : 0.000130, longitud: -0.000043},
{latitud : 0.000130, longitud: -0.000043} ],
largo_panel: 1.96,
ancho_panel: 0.992
};
var dataPhotovoltaicSystemConfiguration={
  voc: "",
  isc: "",
  pmp: "",
  vmp: "",
  imp: "",
  noct: noct,
  ctemp: "",
  potencia_max_cd: "",
  potencia_max_er_ca: "",
  corriente_max: "",
  tension_nominal:"",
  temperatura_ambiente_minima:tempAmbMin,
  radiacion:radiacionNOCT,
  espectro:espectroRad,
  temperatura_ambiente:tempAmbNOCT,
  velocidad_viento:windSpeed,
  radiacion_estandar: radiacionSTC,
  temperatura_celdas:cellTemp,
  masa_aire:airMass,
  numero_total_paneles:1282
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
        inverter_efficiency:inverterEfficience,
        inverter_losses: avgLosses
      },
      pv_module_data:{
        array_losses: avgLosses,
        pv_module_efficiency: "",
        noct: noct,
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

var dataROI = {
  energiaGenerada:"",
  distintosPaneles: difPanel.toString(),
  distintosInversores:difInverter.toString(),
  numPaneles:"",
  numInversores:"",
  costoPanel:"",
  costoInversor:"",
  aumentoCFE:cfeAumenta.toString(),
  inflacion:inflation.toString(),
  kWh:""
};
module.exports = function(Result) {
  //delete tags that aren't needed
  function deleteTags($,number){
    if (number === 2) {
      $('table').eq(number).find('tr').eq(1).find('td').eq(0).remove();
      $('table').eq(number).find('tr').eq(0).remove();
      for(var i= 0; i<12; i++){
        $('table').eq(number).find('tr').eq(0).find('td').eq(0).remove();
      }
    }
    else {
      $('table').eq(number).find('caption').remove();//delete tags that aren't needed
      $('table').eq(number).find('br').remove();//delete tags that aren't needed
      $('table').eq(number).find('tr').eq(0).remove();
      $('table').eq(number).find('tr').eq(0).find('td').eq(0).remove();
      $('table').eq(number).find('tr').eq(0).find('td').eq(-1).remove();
      $('table').eq(number).find('tr').eq(1).find('td').eq(-1).remove();
    }
  }

  function convertToArray(matrix, type){
    var result = [];
    if(type === 1){
      for (var i = 0; i< 1; i++) {
        for (var j =0; i< 12; i++) {
          result.push(parseFloat(matrix[i][j]));
        }
      }
    }
    else if(type === 2){
      for (var i = 0; i< 1; i++) {
        for (var j =0; i< 1; i++) {
          result = parseFloat(matrix[i][j]);
        }
      }
    }
    return result;
  }
  Result.remoteMethod('computeResult',
  {
    accepts:{arg: 'areaID', type:'number', required: true},
    http:{path: '/createAlternative', verb: 'get'},
    returns:{arg:'status', type: 'number'}
  });
//Get NASA data before start to get data from PostgreSQL and use analytics
  Result.beforeRemote('computeResult', function (ctx, modelInstance,next) {
    var Area = app.models.Area;
    var Materiales = app.models.Material;
    var Project = app.models.Project;
    var azimuth;
    Area.find({"fields":{"center":"true", "projectId":"true"},"where":{"id":ctx.req.query.idArea}}, function(err, area){
      if (err) {
        throw err;
      }
      area = JSON.stringify(area[0]);
      area = JSON.parse(area);
      console.log(area.center.lat.toString());
      console.log(area.center.lng.toString());
      if (area.center.lat >= 0) {
          azimuth = 0;
      }
      if (area.center.lat < 0) {
          azimuth = 180;
      }
      dataPhotovoltaicAnalytic.data.plant_data.array_azimuth = azimuth;
      dataPhotovoltaicAnalytic.data.plant_data.tilt = area.center.lat;
      dataPhotovoltaicAnalytic.data.resource_data.latitude = area.center.lat;
      Project.find({"fields":{"Cost": "true"},"where":{"id":area.projectId}}, function (err, project) {
        if (err) {
          throw err;
        }
        project = JSON.stringify(project[0]);
        project = JSON.parse(project);
        dataROI.kWh = project.Cost.toString();
      });
      var options = {
      method: 'GET',
      url: 'https://eosweb.larc.nasa.gov/cgi-bin/sse/grid.cgi',
      qs: {
        num: "081110",
        hgt:"100",
        veg:"17",
        p:"grid_id",
        step:"2",
        lat: area.center.lat.toString(),
        lon: area.center.lng.toString()
        }
      };
      request(options, function(error, response, body) {
      if (error || response.statusCode !==200)
      {
        radiation = [4.78,5.73,6.55,6.50,6.24,5.60,5.51,5.42,4.95,4.92,4.81,4.49];
        airTemp = [12.8,14.4,16.7,18.8,19.5,18.5,18.0,18.0,17.3,15.9,14.4,13.0];
        dataPhotovoltaicAnalytic.data.resource_data.daily_solar_radiation = radiation;
        dataPhotovoltaicAnalytic.data.resource_data.air_temperature = airTemp;
        next();
        //throw new Error(error);
      }
      const $ = cheerio.load(body);//load response in cheerio
      cheerioTableparser($);//load table parser
      for (var i = 0; i < 8; i++) {
          $('table').eq(0).remove();//delete all tables that Won't be used
      }
      for (var i = 0; i < 21; i++) {
        $('table').eq(1).remove();//delete all tables that Won't be used
      }
      for (var i = 0; i < 14 ; i++) {
        $('table').eq(3).remove();
      }
      for (var i = 0; i < $('table').length; i++) {
        $('table').eq(4).remove();
      }
      deleteTags($,0);
      var radiation = $('table').eq(0).parsetable();

      //Max value from azimuth table
      var max = 0;
      for(var i=0; i< 25; i++){
        $('table').eq(1).find('tr').eq(i).find('td').eq(0).remove();
      }
      $('table').eq(1).find('td').each(function(i, element)
      {
        var a = parseFloat( $(element).text() );
        if (a > max) max = a;
      });
      //Min value from azimuth table
      var min = Number.MAX_VALUE;
      $('table').eq(1).find('tr td').each(function(i, element)
      {
        var a = parseFloat($(element).text());
        if (a < min && a != 0) min = a;
      });
      var azimuth = (max + min) / 2;
      //Tilt Table
      $('table').eq(2).find('caption').remove();
      $('table').eq(2).find('br').remove();
      for (var i = 1; i < 7; i++) {
        $('table').eq(2).find('tr').eq(1).remove();
      }
      for (var i = 1; i < 5; i++) {
        $('table').eq(2).find('tr').eq(2).remove();
      }
      deleteTags($,2);
      var tilt=$('table').eq(2).parsetable();
      //Air Temperature Table
      deleteTags($,3);
      for (var i = 0; i < 2; i++) {
        $('table').eq(3).find('tr').eq(1).remove();
      }
      var airTemp = $('table').eq(3).parsetable();
      radiation = convertToArray(radiation,1);
      airTemp = convertToArray(airTemp,1);
      dataPhotovoltaicAnalytic.data.resource_data.daily_solar_radiation = radiation;
      dataPhotovoltaicAnalytic.data.resource_data.air_temperature = airTemp;
      next();
    });
  });
});

  Result.computeResult = function (id, cb) {
    var Material = app.models.Material;
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
      Material.find({"where":{"Type": 1}},function (err,panel){
        if (err) {
          throw err;
        }
        else if (panel.length > 0) {
            Material.find({"where":{"Type": 2}},function (err, inversor) {
              if (err) {
                throw err;
              }
              else if (inversor.length > 0) {
                var i = 0;
                async.whilst(
                  function() {return i < panel.length},
                  function(outer_callback){
                    var j = 0;

                    console.log("outer count:" + i);

                    async.whilst(
                      function () { return j < inversor.length; },
                      function (callback) {
                        console.log("inner count:" + j);
                        dataPhotovoltaicSystemConfiguration.voc = panel[i].Voc;
                        dataPhotovoltaicSystemConfiguration.isc = panel[i].Isc;
                        dataPhotovoltaicSystemConfiguration.pmp = panel[i].Pmp;
                        dataPhotovoltaicSystemConfiguration.vmp = panel[i].Vmp;
                        dataPhotovoltaicSystemConfiguration.imp = panel[i].Imp;
                        dataPhotovoltaicSystemConfiguration.ctemp = panel[i].tempCoeffVoc;
                        dataPhotovoltaicSystemConfiguration.potencia_max_cd= inversor[j].inverterMaxPowerCD;
                        dataPhotovoltaicSystemConfiguration.potencia_max_er_ca = inversor[j].inverterMaxPowerCA;
                        dataPhotovoltaicSystemConfiguration.corriente_max = inversor[j].inverterMaxCurrentCD;
                        dataPhotovoltaicSystemConfiguration.tension_nominal = inversor[j].inverterNominalVoltageCD;
                        dataROI.costoPanel = panel[i].Cost.toString();
                        dataROI.costoInversor = inversor[j].Cost.toString();
                        dataPhotovoltaicAnalytic.data.system_data.pv_module_data.pv_module_efficiency = panel[i].ModuleEfficiency;
                        dataPhotovoltaicAnalytic.data.system_data.pv_module_data.temperature_coefficient = panel[i].tempCoeffVoc;
                        options = {
                          method: 'POST',
                          url: 'https://predix-analytics-catalog-release.run.aws-usw02-pr.ice.predix.io/api/v1/catalog/analytics/37560a4e-ef8a-4904-89e3-35a375f52401/execution',
                          headers:
                          {
                          'Predix-Zone-Id': '00c30eb0-8b5e-411c-bc3f-9d3a5d70f0d0',
                          'content-type': 'application/json',
                          'authorization': 'Bearer ' + UAAresponse.access_token
                          },
                          json: dataPhotovoltaicSystemConfiguration
                        };
                        firstAnalytic(options);
                        function firstAnalytic (options){
                          request(options, function(error, response, dataPVS){
                            if (error) throw new Error(error);
                            options = {
                              method: 'POST',
                              url: 'https://predix-analytics-catalog-release.run.aws-usw02-pr.ice.predix.io/api/v1/catalog/analytics/aa7bbd17-23c0-4bf1-8a53-3ddd13267f68/execution',
                              headers:
                              {
                              'Predix-Zone-Id': '00c30eb0-8b5e-411c-bc3f-9d3a5d70f0d0',
                              'content-type': 'application/json',
                              'authorization': 'Bearer ' + UAAresponse.access_token
                              },
                              json: dataPhotovoltaicAnalytic
                            };
                            secondAnalytic(options, dataPVS);
                          });
                        }

                      function secondAnalytic (secondOptions, dataPVS){
                        var photovoltaicConfiguration = JSON.parse(dataPVS.result);
                        console.log(JSON.stringify(photovoltaicConfiguration));
                        dataPhotovoltaicAnalytic.data.plant_data.system_capacity = (dataPhotovoltaicSystemConfiguration.pmp * dataPhotovoltaicSystemConfiguration.numero_total_paneles) / 1000;
                        dataROI.numInversores =  photovoltaicConfiguration.num_minimo_inversores.toString();
                        dataROI.numPaneles = dataPhotovoltaicSystemConfiguration.numero_total_paneles.toString();
                        request(secondOptions, function(error, response, dataPSA){
                          if(error) throw new Error(error);
                          //console.log(JSON.stringify(dataROI));
                          options = {
                            method: 'POST',
                            url: 'https://predix-analytics-catalog-release.run.aws-usw02-pr.ice.predix.io/api/v1/catalog/analytics/86a45079-21ce-4c65-a5e1-2329a18016fb/execution',
                            headers:
                            {
                            'Predix-Zone-Id': '00c30eb0-8b5e-411c-bc3f-9d3a5d70f0d0',
                            'content-type': 'application/json',
                            'authorization': 'Bearer ' + UAAresponse.access_token
                            },
                            json: dataROI
                          };
                          thirdAnalytic(options, dataPSA);
                        });
                      }

                      function thirdAnalytic (thirdOptions,dataPSA){
                        var photovoltaicAnalytics = JSON.parse(dataPSA.result);
                        //console.log("Photovoltaic Analytic: ",body.result);
                        console.log(JSON.stringify(photovoltaicAnalytics));
                        var energiaTotal = photovoltaicAnalytics.annual_energy * 1000;
                        dataROI.energiaGenerada = energiaTotal.toString();
                        request(thirdOptions, function(error, response, roi){
                          if(error) throw new Error(error);
                          var finalROI = JSON.parse(unescape(roi.result));
                          console.log(JSON.stringify(finalROI));
                           j++;
                          setTimeout(callback, 0);
                        });
                      };
                      },
                      function (err) {
                        console.log("in out");
                          i++;
                        outer_callback(); // <--- here
                      }
                    );
                  },
                  function(err){
                    console.log("out out");
                  }
                );
                }
              });
            }
          });
      });
      cb(null,200);
    };
  };
