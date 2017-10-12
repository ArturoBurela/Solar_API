var app = require('../../server/server');
var nasaData = app.datasources.NASA;


//delete tags that aren't needed
function deleteTags($,number){
  if (number === 2) {
    $('table').eq(number).find('tr').eq(1).find('td').eq(0).remove();
    $('table').eq(number).find('tr').eq(0).find('td').eq(0).remove();
    $('table').eq(number).find('tr').eq(0).find('td').eq(-1).remove();
    $('table').eq(number).find('tr').eq(1).find('td').eq(-1).remove();
  }
  else {
    $('table').eq(number).find('caption').remove();
    $('table').eq(number).find('br').remove();
    $('table').eq(number).find('tr').eq(0).find('td').eq(0).remove();
    $('table').eq(number).find('tr').eq(1).find('td').eq(0).remove();
    $('table').eq(number).find('tr').eq(0).find('td').eq(-1).remove();
    $('table').eq(number).find('tr').eq(1).find('td').eq(-1).remove();
  }
}

function array2DToJSON(a, p, nl) {
      var i, j, s = '[{"' + p + '":{';
      nl = nl || '';
      for (i = 0; i < a.length; ++i) {
        s += nl + arrayToJSON(a[i]);
        if (i < a.length - 1)
          s += ',';
      }
      s += nl + '}}]';
      return s;
    }
    function arrayToJSON(a, p) {
      var i, s = '';
      for (i = 0; i < a.length; ++i) {
        if (typeof a[i] == 'string')
          s += '"' + a[i] + '"';
        else  // assume number type
          s += a[i];
        if (i < a.length - 1)
          s += ':';
      }
      s += '';
      if (p)
        return '{"' + p + '":' + s + '}';
      return s;
    }
Model.observe('before save', function getNASAData(ctx, next) {
nasaData.getNASAData("19.49", "-99.157").then(function(body){

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
    $('table').eq(3).find('tr').eq(2).remove();
  }
  console.log("terminado");
  var airTemp = $('table').eq(3).parsetable();
  console.log(radiation);
  console.log(tilt);
  console.log(airTemp);
  console.log(max);
  console.log(min);
  console.log(azimuth);
  next();
});

},
function (reason) {
  console.log(reason);
  next();
});
