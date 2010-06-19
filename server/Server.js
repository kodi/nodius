require.paths.unshift(__dirname);

var sys = require('sys'),
    http = require('http'),
    requestModule = require('lib/Request').Request,
    frontController = require('lib/FrontController').FrontController;

http.createServer(function (request, response) {

  // parse request
  var req = new requestModule();  
  var requestObject = req.parseRequest(request);

  // pass the response
  var fc = new frontController();
  fc.setResponse(response);

  // execute
  fc.execute(requestObject);

}).listen(8000);

sys.puts('Server running at http://127.0.0.1:8000/');

exports.Server = {};