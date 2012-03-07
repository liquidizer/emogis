var mongodb = require('mongodb');
var request= require('request');

var server = new mongodb.Server("ds029317.mongolab.com", 29317, {});
var geocodes= null;
function getCollection(callback) {
  if (geocodes) {
    callback(geocodes);
  } else {
    var emogisdb = new mongodb.Db('emogis', server, {});
    emogisdb.open(function(error, client) {
      client.authenticate('emogis', '', function(error) {
        console.log('connected');
        if (error) throw error;
        geocodes = new mongodb.Collection(client, 'geocodes');
        callback(geocodes);
      });
    });
  }
}

function getEntry(key, callback) {
  getCollection(function(collection) {
    collection.find({_id : key.toLowerCase() }, function(err, cursor) {
      if (err) callback(err, null);
      else
        cursor.nextObject(callback);
    });
  });
}

function saveEntry(entry, callback) {
  getCollection(function(collection) {
    collection.insert(entry, {
      safe: true
    }, callback)
  })
}

function resolve(key, path, callback) {
  getEntry(key, function(err, obj) {
    if (err) callback(err);
    if (obj) {
      callback(false, obj.location);
    } else {
      resolveGoogle(key, function(err, location) {
        if (err) {
          callback(err);
        } else {
          var value= {
            name: key,
            location: location,
            _id: key.toLowerCase()
          };
          saveEntry(value, function(err) {
            callback(err, value.location);
          });
        }
      });
    }
  });
}

// Use Google to Resolve
function resolveGoogle(address, callback) {
  var geo='http://maps.googleapis.com/maps/api/geocode/json?sensor=false&output=json&address='+encodeURI(address);
  request(geo, function(error, response, body) { 
    if (error) {
      callback(error);
    } else {
      var result= eval("("+body+")");
      if (result.status=="ZERO_RESULTS") {
        callback(false, undefined);      
        return;
      }
      if (result.status!="OK") {
        console.log("Google geocode error: "+result.status);
        callback(true);
        return;
      }
      var loc= result.results[0].geometry.location;
      setTimeout(function(){ callback(false, loc); }, 100);
    }
  });
}

exports.resolve= resolve;
exports.resolveGoogle= resolveGoogle;



