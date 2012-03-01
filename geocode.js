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
      if (result.status=="ZEROS_RESULTS") {
        callback(true, "unknown");      
      }
      if (result.status!="OK") {
        console.log("Google geocode error: "+result.status);
        callback(true);
      }
      var loc= result.results[0].geometry.location;
      loc= loc.lat+','+loc.lng+',0';
      callback(false, loc);
    }
  });
}

function resolve(address, callback) {
  var cached= locations[address.toLowerCase()];
  if (cached) {
    callback(cached=="unknown", cached);
  } else {
    callback(true);
    return;
    resolveGoogle(address, function(error, location) {
      if (location)
        codeToCache(address, location);
      callback(error, location);
    });
  }
}

exports.resolve= resolve;
exports.resolveGoogle= resolveGoogle;



