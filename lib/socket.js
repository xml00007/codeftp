/**
 * Created by Arthur on 2017/3/2.
 */
var socketio = require('socket.io');
var config = require('../config');
var cache = require('../Common/cache');
var redis=require('../Common/redis');
var io;

exports.listen = function (server) {
    io = socketio.listen(server);
    io.set('log level', 1);
    io.sockets.on('connection', function (socket) {
        console.log("socket had connected " + config.port);

        socket.on('upload', function (err,data) {
            var i = 0;
            var time=setInterval(function () {
                var name = 'step' + i;
                cache.get(name, function (err, data) {
                    if (err || i == 4) {
                        clearInterval(time);
                    }
                    if (data&&Object.prototype.hasOwnProperty.call(data, 'state')) {
                        socket.emit('state', data.state);
                        i++;
                    }
                });

            }, 10);
        });
        socket.on('delkey', function () {
            redis.flushdb()
        });
    })
};
