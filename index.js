var resource = require('resource');

var queueSchema = require('./queue.mschema');
var queueController = require('./lib');

var queue = module.exports = resource.define('queue', {
  controller: queueController,
  schema: queueSchema,
});

queue.persist('memory');

process.nextTick(function () {
  if (!queue.listeners('error').length) {
    queue.on('error', function (err) {
      resource.logger.error('Error while processing queue:');
      resource.logger.error(err);
    });
  }
});
