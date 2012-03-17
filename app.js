
/**
 * Module dependencies.
 */

var express = require('express');
var geocode= require('./geocode');
var ical= require('./ical');

var app = module.exports = express.createServer();

// Configuration
var ADMIN= true;

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
    {file: 'shock', title: 'Schockiert'},
    {file: 'atwork', title: 'Bei der Arbeit'},
    {file: 'wanderer', title: 'Auf dem Weg'},
    {file: 'sick', title: 'Krank'},
    {file: 'sleeping', title: 'Muede'},
    {file: 'waving', title: 'Kontaktfreudig'},
    {file: 'sad', title: 'Traurig'},
    {file: 'happy', title: 'Gluecklich'}
  ];


app.get('/admin/update', function(req, res) {
  if (!ADMIN) {
    return;
  }
  if (req.query.submit=='Delete') {
    geocode.removeEntry(req.query.id);
    res.writeHead(303, {"Location": "/admin/locations" });
    res.end();
  }
  else {
    var routes={};
    var hasRoutes= false;
    for (var i in req.query) {
      if (i.match(/^route-/)) {
        routes[i.substring(6)]= req.query[i];
        hasRoutes= hasRoutes || !!req.query[i];
      }
    }
    var code= !!req.query.virtual ? "virtual" : req.query.geocode;
    if (code.match(/^[0-9., ]+$/)) {
      var value= eval("(["+code+"])");
      code={ lat: value[0], lng: value[1] };
    }
    var values= {
      location : code,
      verified : !!req.query.verified,
      routes : hasRoutes ? routes : undefined
    }
    geocode.updateEntry(req.query.id, values, function(err) {
      if (!err) {
        res.writeHead(303, { "Location": "/admin/locations" });
        res.end();
      }
    });
  }
});

app.get(/(\/admin)?\/locations/, function(req, res) {
  geocode.getAll(function(err, values) {
    if (req.query.unverified) {
      values= values.filter(function(x) { 
        return !x.verified; });
    }
    res.render('locations', {
      title: 'Emogis',
      codes: values
    });
  });
});

app.get(/(\/admin)?\/details\//, function(req, res) {
  var match= req.url.match(/(\/admin)?\/details\/(.*)/);
  var loc= decodeURI(match[2]);
  var events= ical.getByLocation(loc);
  geocode.getEntry(loc, function(err, entry) {
    if (err) throw err;
    if (!entry) throw "entry does not exist : "+loc;
    var routes={};
    for (var i in events) {
      var ev= events[i];
      if (!routes[ev._src]) {
        if (entry.routes && entry.routes[ev._src])
          routes[ev._src]= entry.routes[ev._src];
        else
          routes[ev._src]= '';
      }
    }
    res.render('details', {
      title: 'Emogis',
      address: loc,
      events: events,
      admin: match[1]=='/admin' && ADMIN,
      geocode: entry.location,
      routes: routes
    });
  });
});

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
    var faded= Math.floor((now-locmap[key].time) / 720000);
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


// geocoding API
app.get('/geocode',function(request,response) {
    geocode.resolve(request.query.address, false, function(error, loc) {
      if (error || !loc) {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.end("{}");
      } else {
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.end("(["+loc.lat+","+loc.lng+"])");
      }});
    return;
});

// get Calendar placemarks
app.get('/placemarks.kml', function(req, res) {
  res.header('Content-Type','application/vnd.google-earch.kml+xml');
  res.render('placemarks', {
    marks: ical.getPlaceMarks(),
    expiry: ical.expiry(),
    layout: false
  });
});

app.get('/placemarks.html', function(req, res) {
  res.render('placemarks', {
    marks: ical.getPlaceMarks(),
    expiry: ical.expiry(),
    layout: false
  });
});

// Only listen on $ node app.js
if (!module.parent) {
  app.listen(process.env.PORT || 8888);
  console.log("Express server listening on port %d", app.address().port);
}
