var request= require('request');

function resolve(address, callback) {
  var geo='http://maps.googleapis.com/maps/api/geocode/json?sensor=false&output=json&address='+escape(address);
  request(geo, function(error, response, body) { 
    if (error) {
      callback(true);
    } else {
      var result= eval("("+body+")");
      if (result.results.length>0)
        callback(false, result.results[0].geometry.location);
      else
        callback(true);
    }
  });
}

exports.resolve= resolve;