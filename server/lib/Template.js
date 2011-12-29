var fs = require('fs');
var TEMPLATE = require("./normal-template");
var Template = function() {

    this.data = {};

    // RENDER TEMPLATE!
    this.show = function(templateName) {
        var self = this;
        src = fs.readFile('server/application/views/index.html', function(err, fileContent) {
            if (err) throw err;
            self.template = TEMPLATE.compile(fileContent.toString());
            self.response.writeHead(200, {'Content-Type': 'text/html'});
            self.response.end(self.template(self.data));
        })
    }

    // Assign data to the template
    this.assign = function(key, value) {
        this.data[key] = value;
    }

    //get template data
    this.getData = function(key) {
        return this.data[key]
    }

}

exports.Template = new Template();
