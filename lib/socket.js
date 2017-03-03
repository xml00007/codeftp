/**
 * Created by Arthur on 2017/3/2.
 */
var socketio=require('socket.io');
var config=require('../config');
var io;

exports.listen=function(server){
    io=socketio.listen(server);
    io.set('log level',1);
    io.sockets.on('connection',function(socket){
        console.log("socket had connected " +config.port);

        socket.on('change',function(){
            console.log('change');
            socket.emit('state','1231231231231231');

            // socket.emit('room',io.sockets.manager.rooms);
        });
    })
}
exports.socket=function (io) {

};