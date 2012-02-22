var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    mime = require("mime"),
    ejs = require("ejs"),
    port = process.env.PORT || 8888;

http.createServer(function(request, response) {

  var uri = url.parse(request.url).pathname,
    filename = path.join(process.cwd(), uri);

  if (/\/$/.test(filename))
        filename += 'index.html';

  path.exists(filename, function(exists) { 
    if (exists) {
        deliver(filename, response, false); 
    } else {
        filename= filename.replace(/\./,'.temp.');
        path.exists(filename, function(exists) {
            if (exists) {
                deliver(filename, response, true);
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

      var contentType = mime.lookup(filename) || "text/plain";
      response.writeHead(200, {"Content-Type": contentType});
      if (isTempl)
        response.write(ejs.render(file, { title: 'My TITLE' }));
      else
        response.write(file, "binary");
      response.end();
    });
}
