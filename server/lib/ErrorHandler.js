var ErrorHandler = function() {

    this.displayError = function(error, response) {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end('Error occured!\n' + error + ' \n');
    }

}

exports.ErrorHandler = new ErrorHandler();