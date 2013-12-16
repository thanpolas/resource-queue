
var methods = require('./queue-methods');

var controller = module.exports = {};

/**
 * Initialize all methods.
 *
 * @param {Resource} queue [description]
 */
controller.init = function(queue) {
  //
  // Basic push/shift methods for queue
  //
  queue.method('push', methods.push, {
    description: 'push an element onto the queue',
    properties: {
      id: { type: 'any' },
      job: {
        properties: {
          method: {
            type: 'string'
          },
          with: {
            type: 'any',
            default: {}
          }
        }
      },
      callback: {
        type: 'function',
        default: function (err, _queue) {
          if (err) {
            queue.emit('error', err, _queue);
          }
        }
      }
    }
  });


  queue.method('shift', methods.shift, {
    description: 'shift an element off the queue',
    properties: {
      id: { type: 'any' },
      callback: {
        type: 'function',
        default: function (err) {
          if (err) {
            queue.emit('error', err);
          }
        }
      }
    }
  });


  queue.method('unshift', methods.unshift, {
    description: 'unshift an element onto the front of the queue',
    properties: {
      id: { type: 'any' },
      job: {
        properties: {
          method: {
            type: 'string'
          },
          with: {
            type: 'any',
            default: {}
          }
        }
      },
      callback: {
        type: 'function',
        default: function (err) {
          if (err) {
            queue.emit('error', err);
          }
        }
      }
    }
  });

  //
  // TODO: Should this take argument 'n' ?
  //
  queue.method('take', methods.take, {
    description: 'take `queue.concurrency` elements off the queue',
    properties: {
      id: { type: 'any' },
      callback: {
        type: 'function',
        default: function (err) {
          if (err) {
            queue.emit('error', err);
          }
        }
      }
    }
  });


  //
  // Lists in python have an analogous method of the same name
  // http://docs.python.org/2/library/stdtypes.html#typesseq-mutable
  //
  queue.method('extend', methods.extend, {
    description: 'extend the queue with an array of elements',
    properties: {
      id: { type: 'any' },
      elems: {
        type: 'any'
      },
      callback: {
        type: 'function',
        default: function (err) {
          if (err) {
            queue.emit('error', err);
          }
        }
      }
    }
  });


  //
  // Run a single job by executing the specified method with the specified
  // metadata
  //
  queue.method('run', methods.run, {
    description: 'run a job',
    type: 'object',
    properties: {
      job: {
        properties: {
          method: {
            type: 'string',
            required: true
          },
          with: {
            type: 'any',
            default: {}
          }
        }
      },
      callback: {
        type: 'function'
      }
    }
  });


  //
  // This method takes q.concurrency elements off the front of the queue and
  // `queue.run`s them.
  //
  queue.method('process', methods.processQueue, {
    description: 'process elements off the queue',
    properties: {
      id: { type: 'any' },
      callback: {
        type: 'function',
        required: true
      }
    }
  });


  queue.method('start', methods.start, {
    description: 'start processing a queue',
    properties: {
      id: { type: 'any' },
      callback: {
        type: 'function',
        default: function (err) {
          if (err) {
            queue.emit('error', err);
          }
        }
      }
    }
  });

  queue.method('stop', methods.stop, {
    description: 'start processing a queue',
    properties: {
      id: { type: 'any' },
      callback: {
        type: 'function',
        default: function (err) {
          if (err) {
            queue.emit('error', err);
          }
        }
      }
    }
  });
};
