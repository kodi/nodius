var sys = require('sys');
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
        var output ={};
        output.values = [];
        for(var i in global.NODIUS.Storage.buffers){
            output.values.push({"value":i});        
        }

        return this.render(JSON.stringify(output));
    }
};

exports.controller_buffer = buffer;