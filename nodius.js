require.paths.unshift(__dirname + '/lib/');
var sys = require('sys');
var fs = require('fs');
var logger = sys.log;
var echo = sys.puts;
spawn = require('child_process').spawn;
var CircularBuffer = require('CircularBuffer').CircularBuffer;

try {
    var devicesJSON = fs.readFileSync(__dirname + "/config/devices.json", encoding = 'utf8');
} catch(e) {
    logger("File " + __dirname + "/config/devices.json not found.\nerror" + e);
}

var NODIUS = {};
NODIUS.Config = {};
NODIUS.Config.devices = JSON.parse(devicesJSON);

NODIUS.App = {};
NODIUS.App.dispatcher = function(host) {

    logger("getting data for host: " + host.name);
    NODIUS.App.getResources(host.resources);

}


NODIUS.App.getResources = function(resources) {
    for (var i = 0; i < resources.length; i++) {
        var resource = resources[i];
        NODIUS.App.readValue(resource.method, resource.params, function(response) {

            logger("got response: " + response);

        });

    }
}


NODIUS.App.readValue = function(method, params, callback) {
    var methods = method.split(".");
    NODIUS.Collectors[methods[0]][methods[1]].get(params, callback);

}

NODIUS.App.collect = function(host) {
    setInterval(function() {
        NODIUS.App.dispatcher(host);
    }, host.pollInterval * 1000)
}


NODIUS.Collectors = {
    "network" : {
        "pingRemoteHost" :{
            "get" : function(params, callback){
               var ping    = spawn('ping', ['-c 4', '-q',params.remoteHostAddress,]);
                this.data = '';
                var self = this;
                ping.stdout.addListener('data', function (data) {
                    self.data +=data;
                });

                ping.stdout.addListener('end', function () {
                    var a = self.data;
                    self.data = '';
                    callback(a);

                });
            }
        }
    },
    "system":{

        "getFreeDiskSpace":{
            "get":function(params, callback){
                callback('get getFreeDiskSpace');
            }
        },

        "getTCPConnections":{
            "get":function(params, callback){
                callback('get getTCPConnections');
            }
        },

        "loadAvg":{
            "get":function(params, callback){
                callback('get loadAvg');
            }
        }

    }
};


for (var i = 0; i < NODIUS.Config.devices.hosts.length; i++) {
    var host = NODIUS.Config.devices.hosts[i];
    NODIUS.App.collect(host);
}
