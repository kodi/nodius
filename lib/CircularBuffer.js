// circular buffer item object
/**
 *
 * @param value
 * @param next
 * @param back
 */
var CircularBufferItem = function (value, next, back) {
    this.next = next;
    this.value = value;
    this.back = back;
    return this;
};
/**
 *
 * @param bufferLength
 * @param metaData
 */
var CircularBuffer = function (bufferLength, metaData) {
    this._len = bufferLength;
    this._it = 0;
    this._meta = metaData;
    this._tmpItem = undefined;
    this._current = new CircularBufferItem(undefined, undefined, undefined);
    var item = this._current;
    for (var i = 0; i < bufferLength - 1; i++) {
        item.next = new CircularBufferItem(undefined, undefined, item);
        item = item.next;
    }
    item.next = this._current;
    this._current.back = item;

    /**
     * push new value into the buffer
     * @param value
     */
    this.push = function (value) {
        this._current.value = {"value":value,"timestamp":new Date().getTime()};
        this._current = this._current.next;
    };
    /**
     *  we use this function on initial load, to save existing timestamps
     * @param entry
     */
    this.loadPush = function (entry) {
        var value = entry.value || undefined;
        var timestamp = entry.timestamp || undefined;

        this._current.value = {"value":value,"timestamp":timestamp};
        this._current = this._current.next;
    };
    this.pop = function () {
        this._current = this._current.back;
        return this._current.value;
    };

    this.read = function() {
        return this._tmpItem.value;
    };
    /**
     *  iterator
     */
    this.next = function() {
        var has = false;
        if (this._it === 0 || this._it < this._len) {
            if (typeof(this._tmpItem) == 'undefined') {
                this._tmpItem = this._current.back;
            } else {
                this._tmpItem = this._tmpItem.back;
            }

            //we break on first undefined element
            if (typeof(this._tmpItem.value) == 'undefined'){
                this._tmpItem = undefined;
                has = false;
                this._it = 0;
            }else{
                this._it += 1;
                has = true;
            }
        } else {
            this._tmpItem = undefined;
            this._it = 0;
            has = false;
        }

        return has;
    };
    /**
     * iterate and get all elements of buffer
     * @param callback
     */
    this.getEach = function(callback) {
        while (this.next()) {
            callback(this.read())
        }
    };

    this.getMetaData = function(){
        return this._meta;
    };
    return this;
};

exports.CircularBuffer = CircularBuffer;