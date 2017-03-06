/**
 * Created by Arthur on 2017/3/2.
 */
var socketio = require('socket.io');
var config = require('../config');
var cache = require('../Common/cache');
var io;

exports.listen = function (server) {
    io = socketio.listen(server);
    io.set('log level', 1);
    io.sockets.on('connection', function (socket) {
        console.log("socket had connected " + config.port);

        socket.on('upload', function (err,data) {
            console.log('change');
            socket.emit('state', '1231231231231231');
            var i = 1;
            var time=setInterval(function () {
                var name = 'step' + i;
                cache.get(name, function (err, data) {
                    if (err || i == 4) {
                        clearInterval(time);
                    }
                    if (data) {
                        i++;
                        socket.emit('state', data.data);
                    }
                });

            }, 10);
        });
        socket.on('change', function () {
            console.log('change');
            socket.emit('state', '1231231231231231');

            // socket.emit('room',io.sockets.manager.rooms);
        });
    })
};
