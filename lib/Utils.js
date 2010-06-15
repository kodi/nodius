var Utils = {
    parsePingResponse:function(outputString) {
        var tmp = outputString.split("\n");
        var lastLine = tmp.length;
        lastLine = tmp[lastLine - 2];
        var values = lastLine.split("/");
        var min = values[3];
        min = min.replace('stddev = ', '');
        min = min.replace('mdev = ', '');
        var output = {"min":parseFloat(min),"avg":parseFloat(values[4]),"max":parseFloat(values[5])};
        return output;
    }
};

exports.Utils = Utils;