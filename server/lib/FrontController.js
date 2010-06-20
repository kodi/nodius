var sys = require('sys');
var fs = require('fs');
var error = require('lib/ErrorHandler');
var template = require('lib/Template');
var path = require('path');

var FrontController = function() {
    this.fr = {};
    this.execute = function(requestObject) {
        var self = this;
        var url = requestObject.request.url;
        var fileName = global.projectPath + requestObject.request.url;
        try {
            path.exists(fileName, function(exists) {
                if (exists && url !== '/') {
                    self.serveStaticFile(fileName);
                } else {
                    //sys.puts("executing action " + fileName);
                    // pass the request object to the main controller
                    // so all other controllers can have access to it
                    self.mainController.request = requestObject;

                    // initialize controller
                    var cont = self.initializeController(requestObject);

                    //execute action
                    self.executeAction(cont, requestObject);
                }
            });
        } catch(e) {
            error.ErrorHandler.displayError('Invalid Path');
        }
    };

    this.setResponse = function(response) {
        this.response = response;
        this.mainController = new Controller(response);
    };

    this.executeAction = function(controller, requestObject) {
        try {
            controller[requestObject.action](requestObject.parsedRequest);
        } catch(e) {
            error.ErrorHandler.displayError('Invalid Action: ' + requestObject.action + "\n ERROR: " + e, this.mainController.response);
        }
    };

    this.initializeController = function(requestObject) {
        try {
            sys.puts(requestObject.request.url);
            var c = require('application/controllers/controller_' + requestObject.controller);
            var controller = c['controller_' + requestObject.controller];
            controller.prototype = this.mainController;
            var cont = new controller();
            return cont;
        } catch(e) {
            this.mainController.response.writeHead(200, {'Content-Type': 'text/plain'});
            this.mainController.response.end('Error occured!\n' + error + ' \n');
            return false;
        }
    };


    this.serveStaticFile = function(filename) {
        var self = this;
        var content_type = self.mime.getMime(filename);
        var encoding = (content_type.slice(0, 4) === "text" ? "utf8" : "binary");

        headers = [
            [ "Content-Type"   , content_type ]
            //,[ "Content-Length" , body.length]
        ];
        sys.log("serving static file: "+filename);
        self.response.writeHead(200, headers);
        var file = fs.createReadStream(filename, {'flags': 'r', 'encoding':encoding, 'mode': 0666, 'bufferSize': 4 * 1024})


        file.addListener('data', function(data) {
            //sys.puts("chunk received "+filename);
            try {
                self.response.write(data, encoding);
            } catch(e) {
                self.response.end();
                sys.puts("ERROR @ filename:" + filename + "\n" + e);

            }
        });

        file.addListener('end', function(data) {
            //sys.puts('finished sending '+filename)
            self.response.end();
        });
    };


    this.DEFAULT_MIME = 'application/octet-stream';

    this.mime = {
        self:this,
        getMime: function getMime(path) {
            var index = path.lastIndexOf(".");
            if (index < 0) {
                return this.self.DEFAULT_MIME;
            }
            return this.TYPES[path.substring(index).toLowerCase()] || this.self.DEFAULT_MIME;
        },

        TYPES : { ".3gp"   : "video/3gpp",
            ".a"     : "application/octet-stream",
            ".ai"    : "application/postscript",
            ".aif"   : "audio/x-aiff",
            ".aiff"  : "audio/x-aiff",
            ".asc"   : "application/pgp-signature",
            ".asf"   : "video/x-ms-asf",
            ".asm"   : "text/x-asm",
            ".asx"   : "video/x-ms-asf",
            ".atom"  : "application/atom+xml",
            ".au"    : "audio/basic",
            ".avi"   : "video/x-msvideo",
            ".bat"   : "application/x-msdownload",
            ".bin"   : "application/octet-stream",
            ".bmp"   : "image/bmp",
            ".bz2"   : "application/x-bzip2",
            ".c"     : "text/x-c",
            ".cab"   : "application/vnd.ms-cab-compressed",
            ".cc"    : "text/x-c",
            ".chm"   : "application/vnd.ms-htmlhelp",
            ".class"   : "application/octet-stream",
            ".com"   : "application/x-msdownload",
            ".conf"  : "text/plain",
            ".cpp"   : "text/x-c",
            ".crt"   : "application/x-x509-ca-cert",
            ".css"   : "text/css",
            ".csv"   : "text/csv",
            ".cxx"   : "text/x-c",
            ".deb"   : "application/x-debian-package",
            ".der"   : "application/x-x509-ca-cert",
            ".diff"  : "text/x-diff",
            ".djv"   : "image/vnd.djvu",
            ".djvu"  : "image/vnd.djvu",
            ".dll"   : "application/x-msdownload",
            ".dmg"   : "application/octet-stream",
            ".doc"   : "application/msword",
            ".dot"   : "application/msword",
            ".dtd"   : "application/xml-dtd",
            ".dvi"   : "application/x-dvi",
            ".ear"   : "application/java-archive",
            ".eml"   : "message/rfc822",
            ".eps"   : "application/postscript",
            ".exe"   : "application/x-msdownload",
            ".f"     : "text/x-fortran",
            ".f77"   : "text/x-fortran",
            ".f90"   : "text/x-fortran",
            ".flv"   : "video/x-flv",
            ".for"   : "text/x-fortran",
            ".gem"   : "application/octet-stream",
            ".gemspec" : "text/x-script.ruby",
            ".gif"   : "image/gif",
            ".gz"    : "application/x-gzip",
            ".h"     : "text/x-c",
            ".hh"    : "text/x-c",
            ".htm"   : "text/html",
            ".html"  : "text/html",
            ".ico"   : "image/vnd.microsoft.icon",
            ".ics"   : "text/calendar",
            ".ifb"   : "text/calendar",
            ".iso"   : "application/octet-stream",
            ".jar"   : "application/java-archive",
            ".java"  : "text/x-java-source",
            ".jnlp"  : "application/x-java-jnlp-file",
            ".jpeg"  : "image/jpeg",
            ".jpg"   : "image/jpeg",
            ".js"    : "application/javascript",
            ".json"  : "application/json",
            ".log"   : "text/plain",
            ".m3u"   : "audio/x-mpegurl",
            ".m4v"   : "video/mp4",
            ".man"   : "text/troff",
            ".mathml"  : "application/mathml+xml",
            ".mbox"  : "application/mbox",
            ".mdoc"  : "text/troff",
            ".me"    : "text/troff",
            ".mid"   : "audio/midi",
            ".midi"  : "audio/midi",
            ".mime"  : "message/rfc822",
            ".mml"   : "application/mathml+xml",
            ".mng"   : "video/x-mng",
            ".mov"   : "video/quicktime",
            ".mp3"   : "audio/mpeg",
            ".mp4"   : "video/mp4",
            ".mp4v"  : "video/mp4",
            ".mpeg"  : "video/mpeg",
            ".mpg"   : "video/mpeg",
            ".ms"    : "text/troff",
            ".msi"   : "application/x-msdownload",
            ".odp"   : "application/vnd.oasis.opendocument.presentation",
            ".ods"   : "application/vnd.oasis.opendocument.spreadsheet",
            ".odt"   : "application/vnd.oasis.opendocument.text",
            ".ogg"   : "application/ogg",
            ".p"     : "text/x-pascal",
            ".pas"   : "text/x-pascal",
            ".pbm"   : "image/x-portable-bitmap",
            ".pdf"   : "application/pdf",
            ".pem"   : "application/x-x509-ca-cert",
            ".pgm"   : "image/x-portable-graymap",
            ".pgp"   : "application/pgp-encrypted",
            ".pkg"   : "application/octet-stream",
            ".pl"    : "text/x-script.perl",
            ".pm"    : "text/x-script.perl-module",
            ".png"   : "image/png",
            ".pnm"   : "image/x-portable-anymap",
            ".ppm"   : "image/x-portable-pixmap",
            ".pps"   : "application/vnd.ms-powerpoint",
            ".ppt"   : "application/vnd.ms-powerpoint",
            ".ps"    : "application/postscript",
            ".psd"   : "image/vnd.adobe.photoshop",
            ".py"    : "text/x-script.python",
            ".qt"    : "video/quicktime",
            ".ra"    : "audio/x-pn-realaudio",
            ".rake"  : "text/x-script.ruby",
            ".ram"   : "audio/x-pn-realaudio",
            ".rar"   : "application/x-rar-compressed",
            ".rb"    : "text/x-script.ruby",
            ".rdf"   : "application/rdf+xml",
            ".roff"  : "text/troff",
            ".rpm"   : "application/x-redhat-package-manager",
            ".rss"   : "application/rss+xml",
            ".rtf"   : "application/rtf",
            ".ru"    : "text/x-script.ruby",
            ".s"     : "text/x-asm",
            ".sgm"   : "text/sgml",
            ".sgml"  : "text/sgml",
            ".sh"    : "application/x-sh",
            ".sig"   : "application/pgp-signature",
            ".snd"   : "audio/basic",
            ".so"    : "application/octet-stream",
            ".svg"   : "image/svg+xml",
            ".svgz"  : "image/svg+xml",
            ".swf"   : "application/x-shockwave-flash",
            ".t"     : "text/troff",
            ".tar"   : "application/x-tar",
            ".tbz"   : "application/x-bzip-compressed-tar",
            ".tci"   : "application/x-topcloud",
            ".tcl"   : "application/x-tcl",
            ".tex"   : "application/x-tex",
            ".texi"  : "application/x-texinfo",
            ".texinfo" : "application/x-texinfo",
            ".text"  : "text/plain",
            ".tif"   : "image/tiff",
            ".tiff"  : "image/tiff",
            ".torrent" : "application/x-bittorrent",
            ".tr"    : "text/troff",
            ".ttf"   : "application/x-font-ttf",
            ".txt"   : "text/plain",
            ".vcf"   : "text/x-vcard",
            ".vcs"   : "text/x-vcalendar",
            ".vrml"  : "model/vrml",
            ".war"   : "application/java-archive",
            ".wav"   : "audio/x-wav",
            ".wma"   : "audio/x-ms-wma",
            ".wmv"   : "video/x-ms-wmv",
            ".wmx"   : "video/x-ms-wmx",
            ".wrl"   : "model/vrml",
            ".wsdl"  : "application/wsdl+xml",
            ".xbm"   : "image/x-xbitmap",
            ".xhtml"   : "application/xhtml+xml",
            ".xls"   : "application/vnd.ms-excel",
            ".xml"   : "application/xml",
            ".xpm"   : "image/x-xpixmap",
            ".xsl"   : "application/xml",
            ".xslt"  : "application/xslt+xml",
            ".yaml"  : "text/yaml",
            ".yml"   : "text/yaml",
            ".zip"   : "application/zip"
        }

    }
};


var Controller = function(response) {
    this.response = response;
    this.template = template.Template;
    this.template.response = response;
};

Controller.prototype.getResponse = function() {
    return this.response;
};

exports.FrontController = FrontController; 