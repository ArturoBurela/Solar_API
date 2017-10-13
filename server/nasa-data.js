var app = require('../../server/server');
var nasaData = app.datasources.NASA;
var nasaConnector = nasaData.connector;

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
nasaConnector.observe('before execute',function(ctx, next) {
  // console.log(ctx);
  next();
});
nasaConnector.observe('after execute', function getNASAData(ctx, next) {
  nasaData.getNASAData(latitude, longitude).then(function(body){

    var Materiales = app.models.Material;
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
    tilt = convertToArray(tilt,2);
    airTemp = convertToArray(airTemp,1);
    //create object to convert to JSON for analytics, fill it with analytics fields
    var data = {
      data:{
        plant_data: {
          tilt: tilt,
          system_capacity: 1000,
          array_azimuth: azimuth
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
          latitude: 19.49,
          air_temperature: airTemp,
          daily_solar_radiation: radiation
        }
      },
      config:{}
    };
    //make it a string and parse it
    //data = JSON.stringify(data);
    //data = JSON.parse(data);
    //complete analytics JSON with values of the Database for inverters
    Materiales.find({"fields":{"InverterEfficiency":"true","InverterLosses":"true"},"where":{"Type":2}}, function (err,material) {
      if (err) {
        cb(err);
      }
      //console.log(material[0].InverterEfficiency);
      data.data.system_data.inverter_data.inverter_efficiency = material[0].InverterEfficiency;
      data.data.system_data.inverter_data.inverter_losses = material[0].InverterLosses;
    });
    //complete analytics JSON with values of the Database for solar panels
    Materiales.find({"fields":{"ModuleEfficiency":"true","TemperatureCoefficientIsc":"true","NOCT":"true", "ArrayLosses":"true"},"where":{"Type":1}}, function (err,material) {
      if (err) {
        cb(err);
      }
      data.data.system_data.pv_module_data.pv_module_efficiency = material[0].ModuleEfficiency;
      data.data.system_data.pv_module_data.temperature_coefficient = material[0].TemperatureCoefficientIsc;
      data.data.system_data.pv_module_data.noct = material[0].NOCT;
      data.data.system_data.pv_module_data.array_losses = material[0].ArrayLosses;
    });
    next();
  });

},
function (reason) {
  console.log(reason);
  next();
});
