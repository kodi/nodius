var Utils = {
    parsePingResponse:function(outputString) {
        var tmp = outputString.split("\n");
        var lastLine = tmp.length;
        lastLine = tmp[lastLine - 2];

        var output ={};
        
        if(typeof(lastLine !='undefined')){
            var values = lastLine.split("/");
            var min = values[3];
            min = min.replace('stddev = ', '');
            min = min.replace('mdev = ', '');
            output = {"min":parseFloat(min),"avg":parseFloat(values[4]),"max":parseFloat(values[5])};
        }else{
            output = {"min":-1,"avg":-1,"max":-1};    
        }
        return output;
    }
};

exports.Utils = Utils;