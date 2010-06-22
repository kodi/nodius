require.paths.unshift(__dirname);

var sys = require('sys'),
    http = require('http'),
    requestModule = require('lib/Request').Request,
    frontController = require('lib/FrontController').FrontController;

var config = global.NODIUS.Config.appConfig;

http.createServer(function (request, response) {

  // parse request
  var req = new requestModule();  
  var requestObject = req.parseRequest(request);

  // pass the response
  var fc = new frontController();
  fc.setResponse(response);

  // execute
  fc.execute(requestObject);

}).listen(config.appSettings.port);

sys.puts('Server running at http://127.0.0.1:'+config.appSettings.port+'/');

exports.Server = {};