
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes
var locmap= {};
var emos = [
    {file: 'wanderer', title: 'Auf dem Weg'},
    {file: 'sleeping', title: 'Muede'},
    {file: 'waving', title: 'Kontaktfreudig'},
    {file: 'sad', title: 'Traurig'},
    {file: 'happy', title: 'Gluecklich'}
  ];
app.get('/', function(req, res){
  res.render('index', {
    title: 'Emogis',
    emos: emos
  });
});

app.get('/showmap', function(request, res){
  var now= new Date().valueOf();
  // create entry for now icon
  var entry= { time: now,
               lat: request.query.lat,
               long: request.query.long,
               icon: request.query.icon };
  locmap[request.query.id]= entry;
  // clear old entries from the map
  for (var key in locmap) {
    var faded= Math.floor((now-locmap[key].time) / 360000);
    if (faded>9)
      delete locmap[key];
    else
      locmap[key].faded= faded;
  }
  res.render('showmap', {
    title: 'Emogis',
    locations: locmap,
    query: entry,
    layout: false
  });
});

var request= require('request');
function geocode(address, callback) {
  var geo='http://maps.googleapis.com/maps/api/geocode/json?sensor=false&output=json&address='+escape(address);
  request(geo, function(error, response, body) { 
    if (!error && body.results.length>0)
      callback(false, body.results[0].geometry.location);
    else
      callback(true);
  });
}

app.get('/geocode',function(request,response) {
    geocode(request.query.address, function(error, loc) {
      if (error) {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.end("{}");
      } else {
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.end("({ lat:"+loc.lat+", lng:"+loc.lng+" })");
      }});
    return;
});


// Only listen on $ node app.js
if (!module.parent) {
  app.listen(process.env.PORT || 8888);
  console.log("Express server listening on port %d", app.address().port);
}
