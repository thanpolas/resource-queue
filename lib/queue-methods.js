/**
 * @fileOverview Queue methods.
 */

var resource = require('resource');

var methods = module.exports = {};

methods.push = function push (id, job, callback) {
  methods.modify(id, function (_queue) {
    _queue.elements.push(job);
    return _queue;
  }, callback);
};

methods.shift = function shift (id, callback) {
  var shifted;
  methods.modify(id, function (_queue) {
    shifted = _queue.elements.shift();
    return _queue;
  }, function (err, _queue) {
    callback(err, shifted, _queue);
  });
};


methods.unshift = function unshift (id, job, callback) {
  methods.modify(id, function (_queue) {
    _queue.elements.unshift(job);
    return _queue;
  }, callback);
};

methods.take = function take (id, callback) {
  var xs;
  methods.modify(id, function (_queue) {
    var n = _queue.concurrency;
    xs = _queue.elements.slice(0, n);
    _queue.elements = _queue.elements.slice(n);
    return _queue;
  }, function (err, _queue) {
    callback(err, xs, _queue);
  });
};

methods.extend = function extend(id, xs, callback) {
  methods.modify(id, function (_queue) {
    _queue.elements = _queue.elements.concat(xs);
    return _queue;
  }, callback);
};

var modifications = [],
    modifier = null;
methods.modify = function modify(id, fn, callback) {
  modifications.push(function () {
    queue.get(id, function (err, _queue) {
      if (err) {
        return callback(err);
      }
      queue.update(fn(_queue), function (err, _queue) {
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


methods.run = function run(j, callback) {

  var properties = j.method.split('::'),
      method = resource,
      err;

  properties.forEach(function (p) {
    if (typeof method[p] === 'function') {
      method = method[p];
    }
    else if (!err) {
      err = new Error('could not execute method `' + j.method + '`');
    }
  });

  if (typeof method !== 'function' ) {
    err = new Error('could not execute method `' + j.method + '`');
  }

  if (err) {
    return callback(err);
  }

  method(j.with, callback);
};





function processQueue (id, callback) {
  queue.take(id, function (err, elems, _queue) {
    if (err) {
      return callback(err);
    }

    if (!elems.length) {
      return callback();
    }

    methods.modify(id, function (_queue) {
      _queue.inProgress = elems;
      return _queue;
    }, function (err, _queue) {
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

          methods.modify(id, function (_queue) {
            _queue.inProgress[j] = null;
            return _queue;
          }, function (_err, _queue) {
            if (_err) {
              queue.emit('error', _err);
            }

            if (_queue.repeat && !err) {
              queue.push(id, elem, next);
            }
            else {
              next(null, _queue);
            }

            function next(err, _queue) {
              if (err) {
                queue.emit('error', err);
              }

              if (i <= 0) {
                methods.modify(id, function (_queue) {
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
}

methods.start = function start(id, callback) {

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
          queue.unshift(id, elem, function (err, _queue) {
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
            methods.modify(id, function (_queue) {
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

      queue.get(id, function (err, _queue) {
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

          queue.process(id, function (err, result) {
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


methods.stop = function stop(id, callback) {
  methods.modify(id, function (_queue) {
    _queue.started = false;
    return _queue;
  }, callback);
};
