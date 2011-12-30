var home = function() {

    this.index = function() {
        this.template.show('index.html');
    }
};

exports.controller_home = home;
