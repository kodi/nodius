var fs = require('fs');
var buffer = function() {

    this.index = function() {

    }

    this.get = function(p) {
        var bufferName = p.query.name;

        if (typeof(global.NODIUS.Storage.buffers)!='undefined'  && typeof(global.NODIUS.Storage.buffers[bufferName]) != 'undefined' ) {

            var buffer = global.NODIUS.Storage.buffers[bufferName] ;

            var output = {};
            output.metaData = buffer.getMetaData();
            output.values=[];
            buffer.getEach(function(element) {
                output.values.push(element);
            });

            var bufferJSON = JSON.stringify(output);


        }else{
            bufferJSON = '[]';
       }

       return this.render(bufferJSON);

    }


    this.render=function(json){
        var self = this;        
        headers = [
            [ "Content-Type"   , "application/json" ],
            [ "Content-Length" , json.length]
        ];

        self.response.writeHead(200, headers);
        self.response.write(json);
        self.response.end();
    }

    this.list = function(){
        var self = this;
        //generate list of hosts and resources to export

        //start by reading config file
        fs.readFile(__dirname + "/../../../config/devices.json", encoding='utf8',function(err, data){
            if(!err){
                var devices = JSON.parse(data);
                var output = [];

                for(var i = 0; i < devices.hosts.length; i++) {
                    var host = devices.hosts[i];
                    var resources = host.resources;
                    var entry = {};
                    entry.name = host.name;
                    entry.group = host.group;
                    entry.poolInterval = host.poolInterval;
                    entry.resources = [];

                    for(var j = 0; j < resources.length; j ++){
                        var resource = resources[j];
                        var bufferName = entry.group+'.'+entry.name+'.'+resource.method;
                        if(typeof(global.NODIUS.Storage.buffers[bufferName]) != 'undefined'){
                            entry.resources.push({"name":resource.method,"fullName": bufferName,"size":resource.size})
                        }
                    }

                    output.push(entry);
                }

                return self.render(JSON.stringify(output));

            }

        });


    }
};

exports.controller_buffer = buffer;
