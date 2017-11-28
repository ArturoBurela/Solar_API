'use strict';
var cheerio = require('cheerio');
var cheerioTableparser = require('cheerio-tableparser');
//Import app object
var app = require('../../server/server');
var nasaData = app.datasources.NASA;
var nasaConnector = nasaData.connector;
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
  noct: 45,
  ctemp: "",
  potencia_max_cd: "",
  potencia_max_er_ca: "",
  corriente_max: "",
  tension_nominal:"",
  temperatura_ambiente_minima:-10,
  radiacion:800,
  espectro:1.5,
  temperatura_ambiente:20,
  velocidad_viento:1,
  radiacion_estandar:1000,
  temperatura_celdas:25,
  masa_aire:1.5,
  numero_total_paneles:""
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
        inverter_efficiency:0.90,
        inverter_losses: 0.05
      },
      pv_module_data:{
        array_losses: 0.05,
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
var dataROI = {
  energiaGenerada:"",
  distintosPaneles: 1,
  distintosInversores:1,
  numPaneles:"",
  numInversores:"",
  costoPanel:"",
  costoInversor:"",
  aumentoCFE:"",
  inflacion:"",
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
    returns:{arg:'latitude', type: 'number'}
  });
  Result.computeResult = function (id, cb) {
    var Area = app.models.Area;
    var Material = app.models.Material;
    var Project = app.models.Project;
    var azimuth;
    Area.find({"fields":{"center":"true", "projectId":"true"},"where":{"id":id}}, function(err, area){
      if (err) {
        throw err;
      }
      area = JSON.stringify(area[0]);
      area = JSON.parse(area);
      if (area.center.lat >= 0) {
          azimuth = 0;
      }
      if (area.center.lat < 0) {
          azimuth = 180;
      }
      dataPhotovoltaicAnalytic.data.plant_data.array_azimuth = azimuth;
      dataPhotovoltaicAnalytic.data.plant_data.tilt = area.center.lat;
      dataPhotovoltaicAnalytic.data.resource_data.latitude = area.center.lat;
      nasaConnector.observe('after execute', function getNASAData(ctx, next) {
        nasaData.getNASAData(area.center.lat, area.center.lng).then(function(body){

            var $ = cheerio.load(body);//load response in cheerio
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
        },
        function (reason) {
          console.log(reason);
          radiation = [4.78,5.73,6.55,6.50,6.24,5.60,5.51,5.42,4.95,4.92,4.81,4.49];
          airTemp = [12.8,14.4,16.7,18.8,19.5,18.5,18.0,18.0,17.3,15.9,14.4,13.0];
          dataPhotovoltaicAnalytic.data.resource_data.daily_solar_radiation = radiation;
          dataPhotovoltaicAnalytic.data.resource_data.air_temperature = airTemp;
          next();
        });

      Project.find({"fields":{"Cost": "true"},"where":{"id":area.projectId}}, function (err, project) {
        if (err) {
          throw err;
        }
        project = JSON.stringify(project[0]);
        project = JSON.parse(project);
        dataROI.kWh = project.Cost;
      });
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
                  for (var i = 0; i < panel.length; i++) {
                    for (var j = 0; j < inversor.length; j++) {
                      dataPhotovoltaicSystemConfiguration.voc = panel[i].Voc;
                      dataPhotovoltaicSystemConfiguration.isc = panel[i].Isc;
                      dataPhotovoltaicSystemConfiguration.pmp = panel[i].Pmp;
                      dataPhotovoltaicSystemConfiguration.vmp = panel[i].Vmp;
                      dataPhotovoltaicSystemConfiguration.imp = panel[i].Imp;
                      dataROI.costoPanel = panel[i].Cost;
                      dataROI.costoInversor = inversor[j].Cost;
                      dataPhotovoltaicAnalytic.data.system_data.pv_module_data.pv_module_efficiency = panel[i].ModuleEfficiency;
                      dataPhotovoltaicAnalytic.data.system_data.pv_module_data.noct = panel[i].NOCTW;
                      dataPhotovoltaicAnalytic.data.system_data.pv_module_data.temperature_coefficient = panel[i].tempCoeffVoc;
                      dataPhotovoltaicSystemConfiguration.potencia_max_cd= inversor[j].inverterMaxPowerCD;
                      dataPhotovoltaicSystemConfiguration.potencia_max_er_ca = inversor[j].inverterMaxPowerCA;
                      dataPhotovoltaicSystemConfiguration.corriente_max = inversor[j].inverterMaxCurrentCD;
                      dataPhotovoltaicSystemConfiguration.tension_nominal = inversor[j].inverterNominalVoltage;
                      console.log(i,'.',j,"system config: ",JSON.stringify(dataPhotovoltaicSystemConfiguration),"\n\n");
                      console.log(i,'.',j,"photovoltaic analytics: ",JSON.stringify(dataPhotovoltaicAnalytic),"\n\n");
                      console.log(i,'.',j,"ROI: ",JSON.stringify(dataROI),"\n\n");
                    }
                  }
                }
              });
          }
        });
      cb(null,area.center.lat);
    });
  }
  /*
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
url: 'https://predix-analytics-catalog-release.run.aws-usw02-pr.ice.predix.io/api/v1/catalog/analytics/4617c044-51ae-4094-b1bb-076c7b03abea/execution',
headers:
{
'Predix-Zone-Id': '00c30eb0-8b5e-411c-bc3f-9d3a5d70f0d0',
'content-type': 'application/json',
'authorization': 'Bearer ' + UAAresponse.access_token
},
json: dataPhotovoltaicAnalytic
};
console.log(JSON.stringify(dataPhotovoltaicAnalytic));
request(options, function(error, response, body) {
if (error) throw new Error(error);
console.log(body);
var resultPhotovoltaic = JSON.parse(body);
dataROI.energiaGenerada = resultPhotovoltaic.annual_energy;
dataROI.numPaneles = resultArea.paneles;
dataROI.numInversores = resultConfiguration.inversores;



});

});
});*/
};
