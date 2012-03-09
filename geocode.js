var mongodb = require('mongodb');
var request= require('request');

var server = new mongodb.Server("ds029317.mongolab.com", 29317, {});
var emogisdb = new mongodb.Db('emogis', server, {});
var geocodes= null;

function getCollection(callback) {
  if (geocodes) {
    callback(geocodes);
  } else {
    emogisdb.open(function(error, client) {
      client.authenticate('emogis', '', function(error) {
        if (error) throw error;
        console.log('connected');
        geocodes = new mongodb.Collection(client, 'geocodes');
        callback(geocodes);
      });
    });
  }
}

function removeEntry(key) {
  getCollection( function(collection){
    collection.remove({
        "_id": key.toLowerCase()
    });
  });
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
  if (!entry.name) {
    console.log('invalid name ""');
    throw "false name";
  }
  getCollection(function(collection) {
    collection.insert(entry, {
      safe: true
    }, callback)
  })
}

function updateEntry(key, values, callback) {
  getCollection(function(collection) {
    collection.update( { _id : key.toLowerCase() }, 
    { $set : values },
    { safe: true },
    callback); 
  });
}

function getAll(callback) {
  getCollection(function(collection) {
    collection.find().toArray(callback);
  });
}

function resolve(key, options, callback) {
  key= key.replace(/^ *| *$/,'');
  if (!key || key==='') {
    callback("empty key");
    return;
  }
  getEntry(key, function(err, obj) {
    if (err)  {
      callback(err);
    }
    else if (obj) {
      applyRoutes(obj, options, callback);
    }
    else {
      resolveGoogle(key, function(err, location) {
        if (err) {
          callback(err);
        } else {
          var value= {
            name: key,
            location: location,
            _id: key.toLowerCase()
          };
          if (options && options.persist)
            saveEntry(value, function(err) {
              applyRoutes(value, options, callback);
            });
          else
            applyRoutes(value, options, callback);
        }
      });
    }
  });
}

function applyRoutes(entry, options, callback) {
  if (!options || !options.routes || !options.name || !options.routes[options.name])
    callback(false, entry.location);
  else
    callback(false, entry.routs[options.name]);
}

// Use Google to Resolve
function resolveGoogle(address, callback) {
  console.log('GOOOOOGLE: "'+address+'"');
  var geo='http://maps.googleapis.com/maps/api/geocode/json?sensor=false&output=json&address='+encodeURI(address);
  request(geo, function(error, response, body) { 
    if (error) {
      console.warn('Google error: '+error);
      callback(error);
    } else {
      var result= eval("("+body+")");
      if (result.status=="ZERO_RESULTS") {
        callback(false, undefined);      
        return;
      }
      if (result.status!="OK") {
        console.log('Google geocode error: '+result.status);
        callback('Google error: '+result.status);
        return;
      }
      var loc= result.results[0].geometry.location;
      setTimeout(function(){ callback(false, loc); }, 100);
    }
  });
}

exports.getAll= getAll;
exports.getEntry= getEntry;
exports.removeEntry= removeEntry;
exports.updateEntry= updateEntry;
exports.resolve= resolve;



