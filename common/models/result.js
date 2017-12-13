'use strict';
/*result.js
Use of nested requests and asynchronous loops to complete all analytics
*/
//Have JQuery
var cheerio = require('cheerio');
var cheerioTableparser = require('cheerio-tableparser');//Table parser of cheerio
var async = require('async');//async functions for flow control
//Import app object
var app = require('../../server/server');
var request = require('request');
//constant values
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
const largoPanel72 = 1.96;
const anchoPanel72 = 0.992;

//structures for analytics
var dataAreaDelimitationAnalytic=
{
area_general:"",
obstaculos: "",
largo_panel: largoPanel72,
ancho_panel: anchoPanel72
};
var dataPhotovoltaicSystemConfiguration={
  mpp: "",
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
    accepts:[{arg: 'areaID', type:'number', required: true},
            {arg: 'firstPhotoId', type:'number',required:false},
            {arg: 'lastPhotoId', type:'number', required:false}],
    http:{path: '/createAlternative', verb: 'post'},
    returns:{arg:'status', type: 'number'}
  });
//Get NASA data before start to get data from PostgreSQL and use analytics
  Result.beforeRemote('computeResult', function (ctx, modelInstance,next) {
    var Area = app.models.Area;
    var Materiales = app.models.Material;
    var Project = app.models.Project;
    var azimuth;
    //Build general area input for dataAreaDelimitationAnalytic
    Area.find({"include":["limits"],"where":{"id":ctx.req.query.idArea}},function(err,limit){
      var limitesArea = [];
      limit = JSON.stringify(limit[0]);
      limit = JSON.parse(limit);
      limit = JSON.stringify(limit.limits);
      limit = JSON.parse(limit);
      for (var i = 0; i < limit.length; i++) {
        var coordenada={latitud: "", longitud:""};
        coordenada.latitud = limit[i].position.lat;
        coordenada.longitud = limit[i].position.lng;
        limitesArea.push(coordenada);
      }
      var coordenada={latitud: "", longitud:""};
      coordenada.latitud = limit[0].position.lat;
      coordenada.longitud = limit[0].position.lng;
      limitesArea.push(coordenada);
      console.log(JSON.stringify(limitesArea));
      dataAreaDelimitationAnalytic.area_general = limitesArea;
    });
    //query fields for Area and Project in order to build input data for the many analytics
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
      //Build input data for dataPhotovoltaicAnalytic
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
      var options = {//configure options for query NASA
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
      {//in case that NASA doesn't respond set average values
        radiation = [4.78,5.73,6.55,6.50,6.24,5.60,5.51,5.42,4.95,4.92,4.81,4.49];
        airTemp = [12.8,14.4,16.7,18.8,19.5,18.5,18.0,18.0,17.3,15.9,14.4,13.0];
        dataPhotovoltaicAnalytic.data.resource_data.daily_solar_radiation = radiation;
        dataPhotovoltaicAnalytic.data.resource_data.air_temperature = airTemp;
        next();
        //cb(null,error);
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
      //set values for dataPhotovoltaicAnalytic
      dataPhotovoltaicAnalytic.data.resource_data.daily_solar_radiation = radiation;
      dataPhotovoltaicAnalytic.data.resource_data.air_temperature = airTemp;
      next();
    });
  });
  });

  Result.computeResult = function (id,firstPhoto, lastPhoto, cb) {
    var Material = app.models.Material;
    console.log(id);
    console.log(firstPhoto);
    console.log(lastPhoto);
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
    if(!isNaN(firstPhoto) && !isNaN(lastPhoto)){
      request(options, function(error, response, body) {//request Predix token
        if (error) cb(null,error);
        var UAAresponse = JSON.parse(body);
        // Call image analysis
        options = {
        method: 'POST',
        url: 'http://40.76.89.85/api/analyses/start',
        form: {firstPhotoId: firstPhoto, lastPhotoId: lastPhoto}
        };

        request(options, function(err, response, body) {
          if(err){ cb(null, err); }
          var images = JSON.parse(body);
          console.log(images.results.length);
          var obstaculosImagen = images.results;
          Material.find({"where":{"Type": 1}},function (err,panel){ //find all solar panels
            if (err) {
              throw err;
              cb(null,err);
            }
            if (panel.length > 0) {
                Material.find({"where":{"Type": 2}},function (err, inversor) { //find all inverters
                  if (err) {
                    throw err;
                    cb(null,err);
                  }
                  else if (inversor.length > 0) {
                    dataAreaDelimitationAnalytic.obstaculos = obstaculosImagen;
                    console.log("Puse los obstaculos");
                    //set options for request for Area Delimitation Analytic
                    options = {
                      method: 'POST',
                      url: 'https://predix-analytics-catalog-release.run.aws-usw02-pr.ice.predix.io/api/v1/catalog/analytics/898e8485-bd11-4a6e-a34e-2a4d1b3c1c2d/execution',
                      headers:
                      {
                        'Predix-Zone-Id': '00c30eb0-8b5e-411c-bc3f-9d3a5d70f0d0',
                        'content-type': 'application/json',
                        'authorization': 'Bearer ' + UAAresponse.access_token
                      },
                      json: dataAreaDelimitationAnalytic
                    };
                    areaAnalytic(options);//call analytic
                    function areaAnalytic(options) {//function that makes the request and passes the result to another function
                      request(options,function(error,response,areaDelimitation){
                        if(error) cb(null,error);
                        afterAreaAnalytic(options, areaDelimitation, id);
                      });
                    }
                    function afterAreaAnalytic(options, areaDelimitation,id){//function that sets the values of solar panels, inverters and the ROI Analytics
                      var areaDel = JSON.parse(areaDelimitation.result);
                      console.log(areaDel);
                      dataPhotovoltaicSystemConfiguration.numero_total_paneles = areaDel.numero_paneles;//set number of panels
                      var i = 0;
                      async.whilst(//asynchronous outer loop for solar panels
                        function() {return i < panel.length},//finish when solar panels size is reached
                        function(outer_callback){
                          var j = 0;
                          console.log("outer count:" + i);
                          async.whilst(//asynchronous inner loop for inverters
                            function () { return j < inversor.length; },//finish when inverters size is reached
                            function (callback) {
                              console.log("inner count:" + j);
                              //set values of every panel and inverter both technical specifications and costs
                              dataPhotovoltaicSystemConfiguration.mpp = panel[i].numberOfPhases;
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
                              //set options for Photovoltaic System Configuration Analytic
                              options = {
                                method: 'POST',
                                url: 'https://predix-analytics-catalog-release.run.aws-usw02-pr.ice.predix.io/api/v1/catalog/analytics/07c1c0bf-c97d-4ca0-819c-4e3655d6cfba/execution',
                                headers:
                                {
                                  'Predix-Zone-Id': '00c30eb0-8b5e-411c-bc3f-9d3a5d70f0d0',
                                  'content-type': 'application/json',
                                  'authorization': 'Bearer ' + UAAresponse.access_token
                                },
                                json: dataPhotovoltaicSystemConfiguration
                              };
                              photovoltaicSystemConfigurationAnalytic(options, id, areaDel,panel[i], inversor[j]);//call function to start analytic
                              function photovoltaicSystemConfigurationAnalytic (options,id, areaDel,panel, inversor){
                                request(options, function(error, response, dataPVS){//make request and set options for Photovoltaic Solar Analytics (GE native)
                                  if (error) cb(null,error);
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
                                  photovoltaicSolarAnalytic(options, dataPVS,id, areaDel,panel, inversor);//call function to start analytic
                                });
                              }
                              function photovoltaicSolarAnalytic (secondOptions, dataPVS,id, areaDel,panel, inversor){

                                //Parse values to convert them into inputs for the next analytic
                                var photovoltaicConfiguration = JSON.parse(dataPVS.result);
                                console.log(JSON.stringify(dataPVS.result));
                                dataPhotovoltaicAnalytic.data.plant_data.system_capacity = photovoltaicConfiguration.total_kw_sistema / 1000;
                                dataROI.numInversores =  photovoltaicConfiguration.num_minimo_inversores.toString();
                                dataROI.numPaneles = dataPhotovoltaicSystemConfiguration.numero_total_paneles.toString();
                                console.log(JSON.stringify(dataPhotovoltaicAnalytic));
                                request(secondOptions, function(error, response, dataPSA){
                                  if(error) cb(null,error);
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
                                  roiAnalytic(options, dataPSA, photovoltaicConfiguration,id,areaDel,panel, inversor);
                                });
                              }

                              function roiAnalytic (thirdOptions,dataPSA, photovoltaicConfiguration,id,areaDel,panel, inversor){
                                var photovoltaicAnalytics = JSON.parse(dataPSA.result);

                                console.log(JSON.stringify(photovoltaicAnalytics));
                                var energiaTotal = photovoltaicAnalytics.annual_energy * 1000;
                                dataROI.energiaGenerada = energiaTotal.toString();
                                console.log(JSON.stringify(dataROI));
                                request(thirdOptions, function(error, response, roi){
                                  if(error) cb(null,error);
                                  finalResults(roi, photovoltaicAnalytics, photovoltaicConfiguration, id,areaDel,panel, inversor);
                                  });
                                }
                                function finalResults(roi, photovoltaicAnalytics, photovoltaicConfiguration,id, areaDel,panel, inversor){
                                  var finalROI = JSON.parse(roi.result);
                                  finalROI = JSON.parse(finalROI);
                                  var Area = app.models.Area;
                                  var Result = app.models.Result;
                                  var Alternative = app.models.Alternative;
                                  console.log(JSON.stringify(finalROI));
                                  var energiaTotal = photovoltaicConfiguration.total_kw_sistema / 1000;
                                  Area.find({"fields":{"center":"true", "projectId":"true"},"where":{"id":id}}, function(err, area){
                                    if (err) {
                                      cb(null,err);
                                      //throw err;
                                    }
                                    var saves = [finalROI.anio_0,finalROI.anio_1,finalROI.anio_2,finalROI.anio_3,finalROI.anio_4,finalROI.anio_5,
                                      finalROI.anio_6,finalROI.anio_7,finalROI.anio_8,finalROI.anio_9,finalROI.anio_10,finalROI.anio_11,finalROI.anio_12,finalROI.anio_13,finalROI.anio_14,
                                      finalROI.anio_15,finalROI.anio_16,finalROI.anio_17,finalROI.anio_18,finalROI.anio_19,finalROI.anio_20];
                                      area = JSON.stringify(area[0]);
                                      area = JSON.parse(area);
                                      console.log(finalROI.ROI);
                                      console.log(area.center.lat.toString());
                                      console.log(area.center.lng.toString());
                                      var azimuth = Math.floor(area.center.lat);
                                      Result.create([{
                                        position: {
                                          lat: area.center.lat,
                                          lng: area.center.lng
                                        },
                                        direction: azimuth.toString(),
                                        angle: area.center.lat.toString(),
                                        generatedEnergy: energiaTotal.toString(),
                                        roi: finalROI.ROI,
                                        savings: saves,
                                        payback: finalROI.payback,
                                        costoInstalacion: finalROI.costoTotal,
                                        ganancias: finalROI.ganancias,
                                        numInverter: photovoltaicConfiguration.num_minimo_inversores.toString(),
                                        strings:photovoltaicConfiguration.maximos_strings_paralelo.toString(),
                                        pvmoduleString: photovoltaicConfiguration.nms.toString();
                                        idPanel: panel.id,
                                        idInverter: inversor.id,
                                        areaId: id
                                      }], function(err, resultCreated){
                                        if(err) (null, err);
                                        console.log(resultCreated);
                                        console.log("Result created");
                                        j++;
                                        setTimeout(callback, 0);
                                      });
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
                            var Area = app.models.Area;
                            Area.upsertWithWhere({"where":{"id":id}},{Vuelo:true},function(err, update){
                                cb(null,200);// <--- here
                          }
                        );
                          }
                        );
                      }
                    }
                    else {
                      cb(null, "No hay inversores registrados");
                    }
                  });
                }
                else {
                  cb(null, "No hay paneles solares registrados");
                }
              });
            });
          });
    }
    else{
      request(options, function(error, response, body) {//request Predix token
        if (error) cb(null,error);
        var UAAresponse = JSON.parse(body);
        Material.find({"where":{"Type": 1}},function (err,panel){ //find all solar panels
          if (err) {

            cb(null,err);
          }
          if (panel.length > 0) {
            Material.find({"where":{"Type": 2}},function (err, inversor) { //find all inverters
              if (err) {
                cb(null,err);
              }
              if (inversor.length > 0) {
                dataAreaDelimitationAnalytic.obstaculos = [];
                //set options for request for Area Delimitation Analytic
                options = {
                  method: 'POST',
                  url: 'https://predix-analytics-catalog-release.run.aws-usw02-pr.ice.predix.io/api/v1/catalog/analytics/898e8485-bd11-4a6e-a34e-2a4d1b3c1c2d/execution',
                  headers:
                  {
                    'Predix-Zone-Id': '00c30eb0-8b5e-411c-bc3f-9d3a5d70f0d0',
                    'content-type': 'application/json',
                    'authorization': 'Bearer ' + UAAresponse.access_token
                  },
                  json: dataAreaDelimitationAnalytic
                };
                areaAnalytic(options);//call analytic
                function areaAnalytic(options) {//function that makes the request and passes the result to another function
                  request(options,function(error,response,areaDelimitation){
                    if(error) cb(null,error);
                    afterAreaAnalytic(options, areaDelimitation, id)
                  });
                }
                function afterAreaAnalytic(options, areaDelimitation,id){//function that sets the values of solar panels, inverters and the ROI Analytics
                  var areaDel = JSON.parse(areaDelimitation.result);
                  console.log(areaDel);
                  dataPhotovoltaicSystemConfiguration.numero_total_paneles = areaDel.numero_paneles;//set number of panels
                  var i = 0;
                  async.whilst(//asynchronous outer loop for solar panels
                    function() {return i < panel.length},//finish when solar panels size is reached
                    function(outer_callback){
                      var j = 0;
                      console.log("outer count:" + i);
                      async.whilst(//asynchronous inner loop for inverters
                        function () { return j < inversor.length; },//finish when inverters size is reached
                        function (callback) {
                          console.log("inner count:" + j);
                          //set values of every panel and inverter both technical specifications and costs
                          dataPhotovoltaicSystemConfiguration.mpp = panel[i].numberOfPhases;
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
                          //set options for Photovoltaic System Configuration Analytic
                          options = {
                            method: 'POST',
                            url: 'https://predix-analytics-catalog-release.run.aws-usw02-pr.ice.predix.io/api/v1/catalog/analytics/07c1c0bf-c97d-4ca0-819c-4e3655d6cfba/execution',
                            headers:
                            {
                              'Predix-Zone-Id': '00c30eb0-8b5e-411c-bc3f-9d3a5d70f0d0',
                              'content-type': 'application/json',
                              'authorization': 'Bearer ' + UAAresponse.access_token
                            },
                            json: dataPhotovoltaicSystemConfiguration
                          };
                          photovoltaicSystemConfigurationAnalytic(options, id, areaDel,panel[i], inversor[j]);//call function to start analytic
                          function photovoltaicSystemConfigurationAnalytic (options,id, areaDel,panel, inversor){
                            request(options, function(error, response, dataPVS){//make request and set options for Photovoltaic Solar Analytics (GE native)
                              if (error) cb(null,error);
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
                              photovoltaicSolarAnalytic(options, dataPVS,id, areaDel,panel, inversor);//call function to start analytic
                            });
                          }
                          function photovoltaicSolarAnalytic (secondOptions, dataPVS,id, areaDel,panel, inversor){

                            //Parse values to convert them into inputs for the next analytic
                            var photovoltaicConfiguration = JSON.parse(dataPVS.result);
                            console.log(JSON.stringify(dataPVS.result));
                            dataPhotovoltaicAnalytic.data.plant_data.system_capacity = photovoltaicConfiguration.total_kw_sistema / 1000;
                            dataROI.numInversores =  photovoltaicConfiguration.num_minimo_inversores.toString();
                            dataROI.numPaneles = dataPhotovoltaicSystemConfiguration.numero_total_paneles.toString();
                            console.log(JSON.stringify(dataPhotovoltaicAnalytic));
                            request(secondOptions, function(error, response, dataPSA){
                              if(error) cb(null,error);
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
                              roiAnalytic(options, dataPSA, photovoltaicConfiguration,id,areaDel,panel, inversor);
                            });
                          }

                          function roiAnalytic (thirdOptions,dataPSA, photovoltaicConfiguration,id,areaDel,panel, inversor){
                            var photovoltaicAnalytics = JSON.parse(dataPSA.result);

                            console.log(JSON.stringify(photovoltaicAnalytics));
                            var energiaTotal = photovoltaicAnalytics.annual_energy * 1000;
                            dataROI.energiaGenerada = energiaTotal.toString();
                            console.log(JSON.stringify(dataROI));
                            request(thirdOptions, function(error, response, roi){
                              if(error) cb(null,error);
                              finalResults(roi, photovoltaicAnalytics, photovoltaicConfiguration, id,areaDel,panel, inversor);
                              });
                            }
                            function finalResults(roi, photovoltaicAnalytics, photovoltaicConfiguration,id, areaDel,panel, inversor){
                              var finalROI = JSON.parse(roi.result);
                              finalROI = JSON.parse(finalROI);
                              var Area = app.models.Area;
                              var Result = app.models.Result;
                              var Alternative = app.models.Alternative;
                              console.log(JSON.stringify(finalROI));
                              var energiaTotal = photovoltaicConfiguration.total_kw_sistema / 1000;
                              Area.find({"fields":{"center":"true", "projectId":"true"},"where":{"id":id}}, function(err, area){
                                if (err) {
                                  cb(null,err);
                                  //throw err;
                                }
                                var saves = [finalROI.anio_0,finalROI.anio_1,finalROI.anio_2,finalROI.anio_3,finalROI.anio_4,finalROI.anio_5,
                                  finalROI.anio_6,finalROI.anio_7,finalROI.anio_8,finalROI.anio_9,finalROI.anio_10,finalROI.anio_11,finalROI.anio_12,finalROI.anio_13,finalROI.anio_14,
                                  finalROI.anio_15,finalROI.anio_16,finalROI.anio_17,finalROI.anio_18,finalROI.anio_19,finalROI.anio_20];
                                  area = JSON.stringify(area[0]);
                                  area = JSON.parse(area);
                                  console.log(finalROI.ROI);
                                  console.log(area.center.lat.toString());
                                  console.log(area.center.lng.toString());
                                  var azimuth = Math.floor(area.center.lat);
                                  Result.create([{
                                    position: {
                                      lat: area.center.lat,
                                      lng: area.center.lng
                                    },
                                    direction: azimuth.toString(),
                                    angle: area.center.lat.toString(),
                                    generatedEnergy: energiaTotal.toString(),
                                    roi: finalROI.ROI,
                                    savings: saves,
                                    payback: finalROI.payback,
                                    costoInstalacion: finalROI.costoTotal,
                                    ganancias: finalROI.ganancias,
                                    numInverter: photovoltaicConfiguration.num_minimo_inversores.toString(),
                                    strings:photovoltaicConfiguration.maximos_strings_paralelo.toString(),
                                    pvmoduleString: photovoltaicConfiguration.nms.toString();
                                    idPanel: panel.id,
                                    idInverter: inversor.id,
                                    areaId: id
                                  }], function(err, resultCreated){
                                    if(err) (null, err);
                                    console.log(resultCreated);
                                    console.log("Result created");
                                    j++;
                                    setTimeout(callback, 0);
                                  });
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
                        cb(null, 200);
                      }
                    );
                  }
                }
                else {
                  cb(null, "No hay registrados inversores");
                }
              });
            }
            else {
              cb(null, "No hay registrados paneles solares");
            }
          });
        });
      }
  };
};
