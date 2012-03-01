var request= require('request');
var fs= require('fs');

// location cache
var locations= {};

// load cache from disk
fs.readFile('locations', function(err, data) {
  if (err) {
    console.log('Could not read location cache.');
  } else {
    var cacheFile= data.toString();
    var lines= cacheFile.split('\n');
    for (var i in lines) {
      var match= lines[i].match(/(unknown|[0-9.,]+):(.*)/);
      if (match) {
        locations[match[2].toLowerCase()]= match[1];
      }
    }
  }
});

// cache an address
function codeToCache(address, location) {
  if (locations[address.toLowerCase()]==location)
    return;
  locations[address.toLowerCase()]= location;
  fs.readFile('locations', function(err, data) {
    if (!err) {
      var cacheFile= data.toString();
      cacheFile+= '\n'+location+':'+address;
      fs.writeFile('locations', cacheFile);
    }
  });
}

// Use Google to Resolve
function resolveGoogle(address, callback) {
  var geo='http://maps.googleapis.com/maps/api/geocode?sensor=false&output=json&address='+encodeURI(address);
  console.log(address);
  console.log(geo);
  request(geo, function(error, response, body) { 
    if (error) {
      callback(true);
    } else {
      var result= eval("("+body+")");
      if (result.status!="OK") {
        console.log("Google geocode error: "+result.status);
        callback(true);
      }
      if (result.results.length>0) {
        var loc= result.results[0].geometry.location;
        callback(false, loc.lat+','+loc.lng+',0');
      } else
        callback(true);
    }
  });
}

function resolve(address, callback) {
  var cached= locations[address.toLowerCase()];
  if (cached) {
    callback(false, cached);
  } else {
    resolveGoogle(address, function(error, location) {
      if (error) {
        console.log('noaddress: '+address);
      } else {
        callback(error, location);
      }
    });
  }
}

exports.resolve= resolve;



