var http = require("http"),
    url = require("url"),
    querystring = require('querystring'),
    path = require("path"),
    fs = require("fs"),
    mime = require("mime"),
    jade = require("jade"),
    port = process.env.PORT || 8888;

var locmap= {};
var emos= [];

fs.readdir('icons', function(err, files) {
  if (!err)
    for (var i=0; i<files.length; ++i) {
      emos.push(files[i]);
    }
});

http.createServer(function(request, response) {

  var url_parts= url.parse(request.url),
    uri = url_parts.pathname,
    query= querystring.parse(url_parts.query),
    filename = path.join(process.cwd(), uri);

  var data={ located : false, emos : emos, locations : locmap };
  if (query && query.id && query.lat && query.long) {
      var entry= { time: new Date().valueOf,
                   lat: query.lat,
                   long: query.long,
                   icon: query.icon };
      locmap[query.id]= entry;
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
