module.exports = {
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
};
