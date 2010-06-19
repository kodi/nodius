require.paths.unshift(__dirname );
global.projectPath = __dirname;
var sys = require('sys');
var fs = require('fs');
var logger = sys.log;
var echo = sys.puts;
spawn = require('child_process').spawn;
var CircularBuffer = require('lib/CircularBuffer').CircularBuffer;

try {
    var devicesJSON = fs.readFileSync(__dirname + "/config/devices.json", encoding = 'utf8');
} catch(e) {
    logger("File " + __dirname + "/config/devices.json not found.\nerror" + e);
}

var NODIUS = {};
NODIUS.Collectors = require('lib/Collectors').Collectors;
NODIUS.App = {};
NODIUS.Storage ={};
global.NODIUS ={};
global.NODIUS.Storage = NODIUS.Storage;
NODIUS.Config = {};
NODIUS.Config.devices = JSON.parse(devicesJSON);


NODIUS.App.dispatcher = function(host) {
    //logger("getting data for host: " + host.name);
    NODIUS.App.getResources(host);
};

NODIUS.App.getResources = function(host) {
    // init buffers container if empty
    NODIUS.Storage.buffers = NODIUS.Storage.buffers || {};
    for (var i = 0; i < host.resources.length; i++) {
        var resource = host.resources[i];
        // init new buffer
        var group = (host.group =='')? '' : host.group+'.';
        var bufferName = group+host.name+'.'+resource.method;
        NODIUS.Storage.buffers[bufferName] = NODIUS.Storage.buffers[bufferName] || new CircularBuffer(resource.size,resource.params);
        var buffer = NODIUS.Storage.buffers[bufferName];
        global.NODIUS.Storage.buffers = NODIUS.Storage.buffers;
        NODIUS.App.readValue(resource.method, resource.params,buffer, function(response) {
            // additional response handling here
        });
    }
};


NODIUS.App.readValue = function(method, params, buffer, callback) {
    var methods = method.split(".");
    NODIUS.Collectors[methods[0]][methods[1]].get(params, buffer, callback);
};

NODIUS.App.collect = function(host) {
    setInterval(function() {
        NODIUS.App.dispatcher(host);
    }, host.pollInterval * 1000)
};

for (var i = 0; i < NODIUS.Config.devices.hosts.length; i++) {
    var host = NODIUS.Config.devices.hosts[i];
    NODIUS.App.collect(host);
}

setInterval(function() {

    for(var i in NODIUS.Storage.buffers){
        var buffer = NODIUS.Storage.buffers[i];
        //  echo("BUFFER ::::::"+i);
        buffer.getEach(function(element){
            //echo("element :" +sys.inspect(element));
        });
    }
}, 5 * 1000);

var server = require('server/Server');