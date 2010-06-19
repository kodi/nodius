var sys = require('sys');
var buffer = function() {

    this.index = function() {

    }

    this.get = function(p) {
        var self = this;
        var bufferName = p.query.name;

        if (typeof(global.NODIUS.Storage.buffers)!='undefined'  && typeof(global.NODIUS.Storage.buffers[bufferName]) != 'undefined' ) {

            var buffer = global.NODIUS.Storage.buffers[bufferName] ;

            var output = [];
            buffer.getEach(function(element) {
                output.push(element);
            });

            var bufferJSON = JSON.stringify(output);


        }else{
            bufferJSON = '[]';
       }

        headers = [
            [ "Content-Type"   , "application/json" ],
            [ "Content-Length" , bufferJSON.length]
        ];

        self.response.writeHead(200, headers);
        self.response.write(bufferJSON);
        self.response.end();
        sys.puts(bufferName);
    }
};

exports.controller_buffer = buffer;