/**
 * @fileOverview Queue methods.
 */

var resource = require('resource');

var methods = module.exports = {};

methods.push = function push (options, callback) {
  methods.modify(options.id, function (_queue) {
    _queue.elements.push(options.job);
    return _queue;
  }, callback);
};

methods.shift = function shift (options, callback) {
  var shifted;
  methods.modify(options.id, function (_queue) {
    shifted = _queue.elements.shift();
    return _queue;
  }, function (err, _queue) {
    callback(err, shifted, _queue);
  });
};


methods.unshift = function unshift (options, callback) {
  methods.modify(options.id, function (_queue) {
    _queue.elements.unshift(options.job);
    return _queue;
  }, callback);
};

methods.take = function take (options, callback) {
  var xs;
  methods.modify(options.id, function (_queue) {
    var n = _queue.concurrency;
    xs = _queue.elements.slice(0, n);
    _queue.elements = _queue.elements.slice(n);
    return _queue;
  }, function (err, _queue) {
    callback(err, xs, _queue);
  });
};

methods.extend = function extend(options, callback) {
  methods.modify(options.id, function (_queue) {
    _queue.elements = _queue.elements.concat(options.xs);
    return _queue;
  }, callback);
};

var modifications = [],
    modifier = null;
methods.modify = function modify(options, callback) {
  var queue = require('../');
  modifications.push(function () {
    queue.get(options.id, function (err, _queue) {
      if (err) {
        return callback(err);
      }
      queue.update(options.fn(_queue), function (err, _queue) {
        if (modifier) {
          modifier();
        }
        callback(err, _queue);
      });
    });
  });

  if (!modifier) {
    modifier = function () {
      if (modifications.length) {
        modifications.shift()();
      }
      else {
        modifier = null;
      }
    };
    modifier();
  }
};


methods.run = function run(options, callback) {
  var properties = options.j.method.split('::');
  var method = resource;
  var err;

  properties.forEach(function (p) {
    if (typeof method[p] === 'function') {
      method = method[p];
    }
    else if (!err) {
      err = new Error('could not execute method `' + options.j.method + '`');
    }
  });

  if (typeof method !== 'function' ) {
    err = new Error('could not execute method `' + options.j.method + '`');
  }

  if (err) {
    return callback(err);
  }

  method(options.j.with, callback);
};

methods.processQueue = function processQueue (options, callback) {
  var queue = require('../');
  methods.take(options.id, function (err, elems, _queue) {
    if (err) {
      return callback(err);
    }

    if (!elems.length) {
      return callback();
    }

    methods.modify(options.id, function (_queue) {
      _queue.inProgress = elems;
      return _queue;
    }, function (err /*, _queue */) {
      if (err) {
        queue.emit('error', err);
      }

      var i = elems.length;

      elems.forEach(function (elem, j) {
        queue.run(elem, function (err) {
          i--;

          if (err) {
            queue.emit('error', err);
          }

          methods.modify(options.id, function (_queue) {
            _queue.inProgress[j] = null;
            return _queue;
          }, function (_err, _queue) {
            if (_err) {
              queue.emit('error', _err);
            }

            if (_queue.repeat && !err) {
              queue.push(options.id, elem, next);
            }
            else {
              next(null, _queue);
            }

            function next(err, _queue) {
              if (err) {
                queue.emit('error', err);
              }

              if (i <= 0) {
                methods.modify(options.id, function (_queue) {
                  _queue.inProgress = [];
                  return _queue;
                }, callback);
              }
              else {
                callback(null, _queue);
              }
            }

          });
        });
      });
    });
  });
};

methods.start = function start(options, callback) {
  var queue = require('../');

  methods.modify(id, function (_queue) {
    _queue.started = true;
    return _queue;
  }, function (err, _queue) {
    if (err) {
      queue.emit('error', err);
    }

    if (_queue.inProgress.length) {
      var i = _queue.inProgress.length;

      _queue.inProgress.forEach(function (elem) {
        if (elem !== null) {
          queue.unshift(options.id, elem, function (err, _queue) {
            if (err) {
              queue.emit('error', err);
            }
            complete();
          });
        }
        else {
          complete();
        }

        function complete() {
          i--;
          if (i === 0) {
            methods.modify(options.id, function (_queue) {
              _queue.inProgress = [];
              return _queue;
            }, function (err, _queue) {
              if (err) {
                queue.emit('error', err);
              }
              _process();
            });
          }
          else {
            _process();
          }
        }
      });
    }
    else {
      _process();
    }

    callback(null, _queue);

    function _process() {
      var completed = false,
          timedOut = false;

      queue.get(options.id, function (err, _queue) {
        if (_queue.started) {
          //
          // Process again at the end of the timeout *if* the last process step
          // completed
          //
          setTimeout(function () {
            //
            // If waiting is turned off, always process the next set of elements
            //
            if (_queue.started && (completed || !_queue.wait)) {
              _process();
            }
            else {
              timedOut = true;
            }
          }, _queue.interval);

          queue.process(options.id, function (err, result) {
            if (err) {
              queue.emit('error', err);
            }

            completed = true;

            //
            // If the timeout occurred while the process step was still running,
            // execute it late
            //
            if (timedOut && _queue.started) {
              _process();
            }
          });
        }
      });
    }
  });
};

methods.stop = function stop(options, callback) {
  methods.modify(options.id, function (_queue) {
    _queue.started = false;
    return _queue;
  }, callback);
};
