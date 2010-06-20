require.paths.unshift(__dirname);
global.projectPath = __dirname;
var sys = require('sys');
var fs = require('fs');
var logger = sys.log;
var echo = sys.puts;
spawn = require('child_process').spawn;
var CircularBuffer = require('lib/CircularBuffer').CircularBuffer;

//load config
try {
    var devicesJSON = fs.readFileSync(__dirname + "/config/devices.json", encoding = 'utf8');
} catch(e) {
    logger("File " + __dirname + "/config/devices.json not found.\nerror" + e);
}

//init objects and NODIUS namespace
var NODIUS = {};
NODIUS.Collectors = require('lib/Collectors').Collectors;
NODIUS.App = {};
NODIUS.Storage = {};
global.NODIUS = {};
global.NODIUS.Storage = NODIUS.Storage;
NODIUS.Config = {};
NODIUS.Config.devices = JSON.parse(devicesJSON);


NODIUS.App.dispatcher = function(host) {
    //@todo add validation in dispatcher
    NODIUS.App.getResources(host);
};

//
// get single resource
// @param host JSON object
NODIUS.App.getResources = function(host) {
    // init buffers container if empty
    NODIUS.Storage.buffers = NODIUS.Storage.buffers || {};
    for (var i = 0; i < host.resources.length; i++) {

        var resource = host.resources[i];
        var group = (host.group == '') ? '' : host.group + '.';
        var bufferName = group + host.name + '.' + resource.method;

        // fetch buffer of init new
        NODIUS.Storage.buffers[bufferName] = NODIUS.Storage.buffers[bufferName] || new CircularBuffer(resource.size, resource.params);
        var buffer = NODIUS.Storage.buffers[bufferName];
        global.NODIUS.Storage.buffers = NODIUS.Storage.buffers;
        NODIUS.App.readValue(resource.method, resource.params, buffer, function(response) {
            // additional response handling here
        });
    }
};

NODIUS.Storage.persist = function() {
    for (var i in NODIUS.Storage.buffers) {
        var bufferName = i;
        var buffer = NODIUS.Storage.buffers[i];
        var meta = buffer.getMetaData();
        var elements = [];
        buffer.getEach(function(element) {
            elements.push(element);
        });

        elements = elements.reverse(false);
        var diskObject = {"len":buffer._len,"meta":meta, "values":elements };

        fs.writeFile(__dirname + '/data/buffers/' + bufferName+'.json', JSON.stringify(diskObject), function(err) {
            if(err){
                sys.log("EROOR SAVING BUFFER "+ bufferName);
            }else{
                    
            }
        });
    }
};

NODIUS.Storage.load = function(){
    var files = fs.readDirSync(__dirname + '/data/buffers');
    for(var i = 0; i < files.length; i++){
        var file = files[i];
        var fileContent = fs.readFileSync(__dirname + '/data/buffers/'+file, encoding = 'utf8');
        var json = JSON.parse(fileContent);
        var bufferName = file.replace('.json','');
        NODIUS.Storage.buffers[bufferName] = new CircularBuffer(json.len,json.meta);
        for(var j = 0; i < json.values.length; j ++ ){
            NODIUS.Storage.buffers[bufferName].push(json.values[j]);
        }
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





// Load existing buffers from disk
NODIUS.Storage.load();

//start collecting for all defined hosts
for (var i = 0; i < NODIUS.Config.devices.hosts.length; i++) {
    var host = NODIUS.Config.devices.hosts[i];
    NODIUS.App.collect(host);
}

// start web interface
var server = require('server/Server');

setInterval(function() {
    //NODIUS.Storage.persist();
}, (10 * 1000));