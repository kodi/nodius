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
// take a snapshot of existing buffers to disk
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

        fs.writeFile(__dirname + '/data/buffers/' + bufferName + '.json', JSON.stringify(diskObject), function(err) {
            if (err) {
                sys.log("EROOR SAVING BUFFER " + bufferName);
            } else {

            }
        });
    }
};
// load existing queues from disk
NODIUS.Storage.load = function() {
    NODIUS.Storage.buffers = NODIUS.Storage.buffers || {};
    //read existing queues from disk
    var files = fs.readdirSync(__dirname + '/data/buffers');
    try {
        for (var i = 0; i < files.length; i++) {
            //read file
            var file = files[i];
            var fileName = __dirname + '/data/buffers/' + file;
            var stats = fs.statSync(fileName);
            var fileContent = fs.readFileSync(fileName, encoding = 'utf8');
            //parse JSON
            var fileJsonString = JSON.parse(fileContent);
            //generate buffer name
            var bufferName = file.replace('.json', '');

            NODIUS.Storage.buffers[bufferName] = new CircularBuffer(fileJsonString.len, fileJsonString.meta);
            for (var j = 0; j < fileJsonString.values.length; j ++) {
                var value = fileJsonString.values[j];
                NODIUS.Storage.buffers[bufferName].loadPush(value);
            }
            sys.log(" LOADING::: buffer :"+ bufferName +" loaded");
        }
    } catch(e) {
        sys.log("ERROR OCCURED: " + e.stack);
    }
};
/**
 * 
 * @param method    - collect method   
 * @param params    - additional parms
 * @param buffer    - which buffer to use
 * @param callback  - callback function
 */

NODIUS.App.readValue = function(method, params, buffer, callback) {
    var methods = method.split(".");
    NODIUS.Collectors[methods[0]][methods[1]].get(params, buffer, callback);
};
/**
 *  collect params for given host
 * @param host - host object from config
 */
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
/**
 * start job that takes snapshots of existing buffers and saves
 * them to disk
 */
setInterval(function() {
    NODIUS.Storage.persist();
}, (10 * 1000));