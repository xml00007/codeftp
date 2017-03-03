/**
 * Created by Arthur on 2017/3/1.
 */
'use strict';

var debug = require('debug')('ftp-stream');
var deferred = require('deferred-stream');
var FtpClient = require('ftp');
var File = require('vinyl');
var async = require('async');
var config = require('../config');

function _streamFtpGet(ftpConnectOptions, files, deferredStream) {
    var c = new FtpClient();
    c.on('error', function(e) {
        debug('Connection Error: %s', e);
        deferredStream.emit('error', e);
    });

    c.on('ready', function() {
        debug('ready to download %s', files);

        var getCalls = files.map(function(filePath){
            return function(callback) {
                debug('GETting `%s`', filePath);

                c.get(filePath, function(err, stream) {
                    if (err) {
                        if(err.code === 550) {
                            debug('File not found: %s', filePath);
                            err = new Error("File Not Found: " + filePath);
                        }
                        deferredStream.emit('error', err);
                        return callback(err);
                    }
                    debug('got `%s`', filePath);

                    stream.on('error',function(e){
                        debug('Error transfering `%s`: %s', filePath, e);
                        callback(e);
                    });
                    stream.on('end',function(){
                        callback();
                    });

                    deferredStream.write(new File({
                        path: filePath,
                        contents: stream
                    }));
                });
            };
        });

        //NOTE: as far as I can tell, FTP only supports on GET at a time
        // on a single connection, so this enforces that.
        async.series(getCalls, function(err){
            if(!err) {
                deferredStream.end();
            }
            c.end();
        });

    });

    c.connect(ftpConnectOptions);
}

function ftpStream(req, res,next) {
    var ftpConnectOptions=conn;
    var files= req.compileurls.concat(req.staticurl).reverse();
    return deferred({objectMode: true},function(deferredStream) {
        _streamFtpGet(ftpConnectOptions, files, deferredStream);
    });
}
var conn = {
    host: config.ftpIp,
    user: config.ftpUser,
    password: config.ftpPwd,
    port: config.ftpPort
};
module.exports = ftpStream;