/**
 * Created by Arthur on 2017/3/2.
 */

var config = require('../config');
var Redis = require('redis');

var client = Redis.createClient({
    port: config.redis_port,
    host: config.redis_host,
    db: config.redis_db,
    password: config.redis_password,
});

client.on('error', function (err) {
    if (err) {
        // logger.error('connect to redis error, check your redis config', err);
        process.exit(1);
    }
});

exports = module.exports = client;