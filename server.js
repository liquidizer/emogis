var http = require("http"),
    url = require("url"),
    querystring = require('querystring'),
    path = require("path"),
    fs = require("fs"),
    request= require('request'),
    mime = require("mime"),
    jade = require("jade"),
    port = process.env.PORT || 8888;

var locmap= {};
var emos= [];

function geocode(address, callback) {
var geo='http://maps.googleapis.com/maps/api/geocode/json?sensor=false&output=json&address='+escape(address);
request(geo, function(error, response, body) { 
  if (!error && body.results.length>0)
    callback(false, body.results[0].geometry.location);
  else
    callback(true);
});
}

emos = [
    {file: 'wanderer', title: 'Auf dem Weg'},
    {file: 'sleeping', title: 'Muede'},
    {file: 'waving', title: 'Kontaktfreudig'},
    {file: 'sad', title: 'Traurig'},
    {file: 'happy', title: 'Gluecklich'}
  ];
  
http.createServer(function(request, response) {

  var url_parts= url.parse(request.url),
    uri = url_parts.pathname,
    query= querystring.parse(url_parts.query),
    filename = path.join(process.cwd(), uri);

  if (/^\/geocode/.test(uri)) {
    geocode(query.address, function(error, loc) {
      if (error) {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.end("{}");
      } else {
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.end("({ lat:"+loc.lat+", lng:"+loc.lng+" })");
      }});
    return;
  }

  var data={ located : false, emos : emos, locations : locmap };
  if (query && query.id && query.lat && query.long) {
    var now= new Date().valueOf();
    // create entry for now icon
    var entry= { time: now,
                 lat: query.lat,
                 long: query.long,
                 icon: query.icon };
    locmap[query.id]= entry;
    // clear old entries from the map
    for (var key in locmap) {
      var faded= Math.floor((now-locmap[key].time) / 10000);
      if (faded>9)
        delete locmap[key];
      else
        locmap[key].faded= faded;
    }
    data.located= true;
    data.query= entry;
  }

  if (/\/$/.test(filename))
        filename += 'index.html';

  path.exists(filename, function(exists) { 
    if (exists) {
        deliver(filename, response, undefined); 
    } else {
        filename= filename.replace(/\.html/,'.jade');
        path.exists(filename, function(exists) {
            if (exists) {
                deliver(filename, response, data);
            } else
                errorNotFound(response);
        });
    }});
    
}).listen(port, "0.0.0.0");

function errorNotFound(response) {
    response.writeHead(404, {"Content-Type": "text/plain"});
    response.write("404 Not Found\n");
    response.end();
}

function deliver(filename, response, isTempl) {

    fs.readFile(filename, "binary", function(err, file) {
      if(err) {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }

      if (isTempl) {
        response.writeHead(200, {"Content-Type": "text/html"});
        var fn= jade.compile(file);
        response.write(fn(isTempl));
      } else {
        var contentType = mime.lookup(filename) || "text/plain";
        response.writeHead(200, {"Content-Type": contentType});
        response.write(file, "binary");
      }
      response.end();
    });
}
