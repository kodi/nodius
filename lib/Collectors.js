var NODIUS ={};
NODIUS.Utils = require('lib/Utils').Utils;
var sys = require('sys');
var childProcess = require('child_process');

var Collectors = {
    //
    // NETWORK
    // ---------------
    "network" : {
        /**
         * ping remote host from localhost
         */
        "pingRemoteHost" :{
            "get" : function(params, buffer, callback){

                childProcess.exec("ping -c 4 -q "+params.remoteHostAddress,function(error, stdout, stderr){
                    //sys.puts(error);
                    //parse ping response to numbers
                    var output = NODIUS.Utils.parsePingResponse(stdout);
                    buffer.push(output);
                    callback(output);

                });
            }
        }
    },
    //
    // SYSTEM
    // ---------------
    "system":{
        "getFreeDiskSpace":{
            "get":function(params, buffer,callback){
                buffer.push(undefined)
                callback('get getFreeDiskSpace');
            }
        },

        "getTCPConnections":{
            "get":function(params, buffer, callback){
                childProcess.exec("netstat -n | grep -c tcp",function(error, stdout, stderr){
                    var value = parseInt(stdout.replace("\n",''));
                    buffer.push(value);
                    callback(value);
                });
            }
        },

        "loadAvg":{
            "get":function(params, buffer, callback){
                //callback('get loadAvg');
                childProcess.exec("uptime",function(error, stdout, stderr){
                    var output = stdout.split("\n");
                    var re = new RegExp(/load average?s\:\s?([0-9]\.[0-9]+),?\s?([0-9]\.[0-9]+),?\s?([0-9]\.[0-9]+)/gmi);
                    var matches = re.exec(output[0]);
                    buffer.push({'load1':parseFloat(matches[1]),'load5':parseFloat(matches[2]),'load15':parseFloat(matches[3])});
                });    
            }
        }
    }
};

exports.Collectors = Collectors; 