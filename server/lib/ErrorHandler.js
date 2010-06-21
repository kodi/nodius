var ErrorHandler = function() {
    /**
     * handle error and display in browser
     * @param error error
     * @param response http.response
     */
    this.displayError = function(error, response) {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end('Error occured!\n' + error + ' \n');
    }

}

exports.ErrorHandler = new ErrorHandler();