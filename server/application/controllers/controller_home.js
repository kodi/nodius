var sys = require('sys');
var mysql = require('lib/mysql');
var home = function() {

    this.index = function() {
		this.template.assign('firstName', 'Kodi');

        var HTML = '';
        for(var i in global.NODIUS.Storage.buffers){
            sys.puts(i);
            var buffer = global.NODIUS.Storage.buffers[i];
            HTML += '<h3>' + i +'</h3>';
            HTML += '<ul>';
            buffer.getEach(function(element){
                HTML +='<li>' +sys.inspect(element)+'</li>';
            });
            HTML +='</ul>';
        }

        this.template.assign('debug', HTML);

        this.template.show('index.html');
    }


    this.database_test = function () {

        var self = this;

        var conn = new mysql.Connection('localhost', 'root', 'borabora', 'test');
        conn.connect();
        conn.query("select * from users", function(result) {

            self.response.writeHead(200, {'Content-Type': 'text/plain'});

            for (var i = 0; i < result.records.length; ++i) {
                self.response.write("Result: " + sys.inspect(result.toHash(result.records[i])));
            };

            self.response.end();
        },
        function(error) {
            sys.puts("Error: " + sys.inspect(error));
        });

    }
}

exports.controller_home = home;