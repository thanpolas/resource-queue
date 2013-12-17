var resource = require('resource');

var queueSchema = require('./queue.mschema');
var queueController = require('./lib');

var queue = resource.define('queue', {
  controller: queueController,
  schema: queueSchema,
});

// queue.schema.description = "a queue for resource events";

queue.persist('memory');

process.nextTick(function () {
  if (!queue.listeners('error').length) {
    queue.on('error', function (err) {
      resource.logger.error('Error while processing queue:');
      resource.logger.error(err);
    });
  }
});
exports.queue = queue;
