var CircularBufferItem = function (value, next, back) {
    this.next = next;
    this.value = value;
    this.back = back;
    return this;
};

var CircularBuffer = function (bufferLength) {
    this._len = bufferLength;
    this._it = 0;
    this._tmpItem = undefined;
    this._current = new CircularBufferItem(undefined, undefined, undefined);
    var item = this._current;
    for (var i = 0; i < bufferLength - 1; i++) {
        item.next = new CircularBufferItem(undefined, undefined, item);
        item = item.next;
    }
    item.next = this._current;
    this._current.back = item;

    this.push = function (value) {
        this._current.value = value;
        this._current = this._current.next;
    };
    this.pop = function () {
        this._current = this._current.back;
        return this._current.value;
    };

    this.read = function() {
        return this._tmpItem.value;
    };
    this.next = function() {
        var has = false;
        if (this._it === 0 || this._it < this._len) {
            if (typeof(this._tmpItem) == 'undefined') {
                this._tmpItem = this._current.back;
            } else {
                this._tmpItem = this._tmpItem.back;
            }
            this._it += 1;
            has = true;
        } else {
            this._tmpItem = undefined;
            this._it = 0;
            has = false;
        }

        return has;
    };

    this.getEach = function(callback) {
        while (this.next()) {
            callback(this.read())
        }
    };
    return this;
};

exports.CircularBuffer = CircularBuffer;