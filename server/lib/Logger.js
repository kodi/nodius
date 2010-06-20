var sys = require('sys');
var Logger = {
    log:function(request, stats){

        var response = '';
        response += request.socket.remoteAddress;
        response +="\t"+request.method;
        response +="\t"+request.url;
        if(typeof(stats) != 'undefined'){
            response +="\t"+stats.responseCode;
            response +="\t"+stats.size;    
        }
        sys.log(response);
    }
}
exports.Logger = Logger;