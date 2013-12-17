module.exports = {
  description: 'a queue for resource events',
  properties: {
    concurrency: {
      description: 'how many jobs to run at once',
      type: 'number',
      default: 1,

    },
    interval: {
      description: 'time interval between processing items (ms)',
      type: 'number',
      default: 5000,

    },
    wait: {
      description: 'wait until all running jobs are completed before executing next set',
      type: 'boolean',
      default: true,

    },
    repeat: {
      description: 'automatically push completed elements back onto the queue',
      type: 'boolean',
      default: false,

    },
    elements: {
      description: 'the elements currently inside the queue',
      type: 'array',
      default: [],

    },
    started: {
      description: 'whether or not the queue has been started',
      type: 'boolean',
      default: false,

    },
    inProgress: {
      description: 'the elements currently being processed',
      type: 'array',
      default: [],
    },
  },

  methods: {
    push: {
      description: 'push an element onto the queue',
      input: {
        id: { type: 'any' },
        job: {
          method: {
            type: 'string'
          },
          with: {
            type: 'any',
            default: {}
          }
        },
      }
    },
    shift: {
      description: 'shift an element off the queue',
      properties: {
        id: { type: 'any' },
      }
    },

    unshift: {
      description: 'unshift an element onto the front of the queue',
      properties: {
        id: { type: 'any' },
        job: {
          method: {
            type: 'string'
          },
          with: {
            type: 'any',
            default: {}
          }
        },
      }
    },

    //
    // TODO: Should this take argument 'n' ?
    //
    take: {
      description: 'take `queue.concurrency` elements off the queue',
      properties: {
        id: { type: 'any' },
      }
    },

    //
    // Lists in python have an analogous method of the same name
    // http://docs.python.org/2/library/stdtypes.html#typesseq-mutable
    //
    extend: {
      description: 'extend the queue with an array of elements',
      properties: {
        id: { type: 'any' },
        elems: {
          type: 'any'
        },
      }
    },

    //
    // Run a single job by executing the specified method with the specified
    // metadata
    //
    run: {
      description: 'run a job',
      type: 'object',
      properties: {
        job: {
          method: {
            type: 'string',
            required: true
          },
          with: {
            type: 'any',
            default: {}
          }
        },
      }
    },

    //
    // This method takes q.concurrency elements off the front of the queue and
    // `queue.run`s them.
    //
    process: {
      description: 'process elements off the queue',
      properties: {
        id: { type: 'any' },
      }
    },

    start: {
      description: 'start processing a queue',
      properties: {
        id: { type: 'any' },
      }
    },

    stop: {
      description: 'start processing a queue',
      properties: {
        id: { type: 'any' },
      }
    },
  }
};
