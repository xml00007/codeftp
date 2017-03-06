var Client = require('ftp');
var FTPClient = require('ftps');
var config = require('../config');
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var tool = require('./tools');
var fse = require('fs-extra');
var EventProxy = require('eventproxy');
var conn = {
    host: config.ftpIp,
    user: config.ftpUser,
    password: config.ftpPwd,
    port: config.ftpPort,
    pasvTimeout: 1000000,
    keepalive: 100000,
    connTimeout: 150000
};
// c.on('ready', function() {
//     c.list(function(err, list) {
//         if (err) throw err;
//         console.dir(list);
//         c.end();
//     });
// });
// connect to localhost:21 as anonymous

//  备份文件  一次链接下载所有文件 不稳定
function downloadall(req, res, next) {
    var c = new Client();
    var serverpath = req.compileurls.concat(req.staticurl);
    var proj = req.body.proj;
    if (serverpath.length == 0)  return next();
    var ep = new EventProxy();
    ep.fail(next);
    c.on('error', function (e) {
        console.log(e.toString())
        ep.emit('error', e);
    });
    ep.after('got_files', serverpath.length, function (list) {

        next(null, list);
    });
    var g = 0;

    ep.on('downsingle', function (dirname, filename, spath) {
        g++;
        console.log(g);
        try {
            c.get(spath, function (err, stream) {
                console.log(g);
                if (err) {
                    console.log(err.toString());
                    // return next(err);
                }
                stream.once('close', function () {
                    c.end();
                    console.log('close :' + filename);
                    ep.emit('got_files', filename);
                });

                // stream.on('end', function () {
                //
                //     console.log('end');
                // });

                stream.pipe(fs.createWriteStream(path.join(dirname, filename)));
                console.log('done:' + filename);
            })
        }
        catch (ex) {
            console.log(ex.toString())
        }
    });

    var dirname = path.join(config.copyPath, proj, tool.format("YYYY-MM-DD"), tool.format("hh-mm"), '\\');
    fse.ensureDir(dirname, function (err) {
        if (err) return next(err); // => null
        c.on('ready', function () {
            var i = 0;
            serverpath.forEach(function (spath) {
                i++;
                var filename = path.basename(spath);
                var pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
                filename = path.dirname(spath).split('/').join('_').concat('_', filename).replace(pattern, "_");
                console.log("begin :" + filename);
                setTimeout(function () {
                    console.log(i);
                    ep.emit('downsingle', dirname, filename, spath);
                }, i == 1 ? 0 : 200);
            });
        });
        c.connect(conn);
    });
}


//  备份文件   每次都是一个新的链接 下载稳定
function downsingle(dirname, spath, next) {
    var c = new Client();
    c.on('error', function (e) {
        console.log(e.toString())
        next(e);
    });
    c.get(spath, function (err, stream) {
        if (err) {
            console.log(err.toString());
            next(err);
            // return next(err);
        }
        var filename = path.basename(spath);
        var pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
        filename = path.dirname(spath).split('/').join('_').concat('_', filename).replace(pattern, "_");
        stream.once('close', function () {
            c.end();
            var msg='close :' + filename;
            next(null,msg);
        });
        stream.pipe(fs.createWriteStream(path.join(dirname, filename)));
        console.log('done:' + filename);
    });
    c.connect(conn);
}


function download(req, res, next) {
    var dirname = path.join(config.copyPath, req.body.proj, tool.format("YYYY-MM-DD"), tool.format("hh-mm"), '\\');
    var serverpath = req.compileurls.concat(req.staticurl);
    var ep = new EventProxy();
    ep.fail(next);
    ep.after('singelfile',serverpath.length,function (list) {
        var msg='文件:\n\r'+list.join('\n')+'下载完毕';
        console.log(msg);
        next(null,msg)
    });
    fse.ensureDir(dirname, function (err) {
        if (err) {
            return next(err);
        }
        if (serverpath.length == 0)  return next();
        serverpath.forEach(function (spath) {
            downsingle(dirname, spath, function (err, data) {
                if (err) {
                    return next(err);
                }
                ep.emit('singelfile',spath);
            });
        });
    });
}

function upload(req,res, next) {
    var serverpath = req.compileurls.concat(req.staticurl);
    if (serverpath.length == 0) return next(null);
    var c = new Client();
    var ep = new EventProxy();
    ep.fail(next);
    ep.after('upfile', serverpath.length, function (list) {
        // 在所有文件的异步执行结束后将被执行
        // 所有文件的内容都存在list数组中
        console.log('all files up loaded');
        next(null);
    });
    c.on('ready', function () {
        serverpath.forEach(function (spath) {
            var lpath = getLocalPath(spath);
            if (!lpath) {
                c.end();
                return next('未找到本地文件');
            }
            console.log(lpath);
            c.put(lpath, spath, function (err) {
                if (err) {
                    console.log(err);
                     return next(err);S
                }
                c.end();
                ep.emit('upfile', lpath);
            });
        })

    });
    c.connect(conn);
}

// 判断是哪个项目的
function getServerPath(str) {
    var match = str.match(/(kmsite|gmsite|fmsite)/i);
    console.log(match);
    var projname = '';
    switch (match[0].toLowerCase()) {
        case "kmsite":
            projname = "KM.test.mai.fang.com";
            break;
        case "gmsite":
            projname = "GM.test.mai.fang.com";
            break;
        case "fmsite":
            projname = "FM.test.mai.fang.com";
            break;
    }
    return config.serverPath + projname + str.substring(parseInt(match.index) + 6).replace(/\\/g, '/');
}


function getLocalPath(str) {
    var match = str.match(/(km|gm|fm)\.(test)?\.mai\.fang\.com/i);
    if (!match) {
        return false;
    }
    console.log(match);
    var projname = '';
    switch (match[1].toLowerCase()) {
        case "km":
            projname = "KMSite";
            break;
        case "gm":
            projname = "GMSite";
            break;
        case "fm":
            projname = "FMSite";
            break;
    }
    return config.address + projname + str.substring(str.indexOf('.com') + 4).replace(/\//g, '\\');
}
var ftp = {
    download: download,
    upload: upload
};
module.exports = ftp;
// download(['/shaoshuai/KM.test.mai.fang.com/Views/AskAddBase.cshtml','/shaoshuai/KM.test.mai.fang.com/Views/AskAddMore.cshtml'], 'Km');
// upload(['D:\\测试站\\Ds优惠券\\GMSite\\Views\\123123123.cshtml', 'D:\\测试站\\Ds优惠券\\KMSite\\Views\\123123123.cshtml'])
