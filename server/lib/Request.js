var sys = require('sys');

var Request = function() {
    this.defaultAction = 'index';
    this.defaultController = 'home';

    this.parseRequest = function(request) {
        var parts = request.url.split("/");
        this.controller = parts[1] || this.defaultController;
        this.action = parts [2] || this.defaultAction;
        this.request = request;

        this.parsedRequest = require('url').parse(request.url, true);
        return this;

    }
}

exports.Request = new Request();