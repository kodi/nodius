var CircularQueueItem = function (value, next, back) {
      this.next = next;
      this.value = value;
      this.back = back;
      return this;
  };

  var CircularQueue = function (queueLength) {
      this._current = new CircularQueueItem(undefined, undefined, undefined);
      var item = this._current;
      for (var i = 0; i < queueLength - 1; i++) {
          item.next = new CircularQueueItem(undefined, undefined, item);
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
      return this;
  }