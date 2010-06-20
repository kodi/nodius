var sys = require('sys');
var Logger = {
    log:function(request){

        var response = '';
        response += request.socket.remoteAddress;
        response +="\t"+request.method;
        response +="\t"+request.url;


        sys.log(response);
    }

}

exports.Logger = Logger;