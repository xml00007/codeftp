var Client = require('ftp');
var config = require('../config');
var c = new Client();
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
    port: config.ftpPort
};
// c.on('ready', function() {
//     c.list(function(err, list) {
//         if (err) throw err;
//         console.dir(list);
//         c.end();
//     });
// });
// connect to localhost:21 as anonymous

//  备份文件
function download(serverpath) {
    if (serverpath.length == 0) return false;
    var isexist = {};
    c.on('ready', function () {
        serverpath.forEach(function (spath) {
            var filename = path.basename(spath);
            var pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
            filename = path.dirname(spath).split('/').join('_').concat('_', filename).replace(pattern, "_");
            var projname = spath.match(/(km|gm|fm)/i)[0];
            var dirname = path.join(config.copyPath, projname, tool.format("YYYY-MM-DD"), tool.format("hh-mm"), '\\');
            console.log(filename);
            if (!isexist.hasOwnProperty(projname) || isexist[projname] == false) {
                console.log(1);
                fse.ensureDir(dirname, function (err) {
                    if (err) console.log(err); // => null
                    isexist[projname] = true;
                })
            }
            console.log(dirname);
            c.get(spath, function (err, stream) {
                if (err) throw err;
                stream.once('close', function () {
                    c.end();
                });
                //之前的代码
                // 建立要备份的当天目录
                // if(!fs.existsSync(dirname)){
                //     fs.mkdir(dirname,function (err) {
                //         if(err) console.log('创建目录错误'+'-----'+err);
                //         // 由于一天可以上传多次 建立时分目录
                //         stream.pipe(fs.createWriteStream(path.join(dirname,filename)));
                //     })
                // }else  {
                //     stream.pipe(fs.createWriteStream(path.join(dirname,filename)));
                // }
                stream.pipe(fs.createWriteStream(path.join(dirname, filename)));
                console.log('done:' + dirname);
            });
        });
    })

    c.connect(conn);
}

function upload(localpath, next) {
    if (localpath.length == 0) return false;
    var ep = new EventProxy();
    ep.fail(next);
    ep.after('upfile', localpath.length, function (list) {
        // 在所有文件的异步执行结束后将被执行
        // 所有文件的内容都存在list数组中



        next();
    });
    op.on('uperror', function () {

    })
    c.on('ready', function () {
        localpath.forEach(function (lpath) {
            var serverpath = getServerPath(lpath);
            console.log(serverpath);
            c.put(lpath, serverpath, function (err) {
                if (err) {
                    console.log(err)
                    return next()
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
var ftp = {
    download: download,
    upload: upload
};
// module.exports = ftp;
// download(['/shaoshuai/KM.test.mai.fang.com/Views/AskAddBase.cshtml','/shaoshuai/KM.test.mai.fang.com/Views/AskAddMore.cshtml'], 'Km');
upload(['D:\\测试站\\Ds优惠券\\GMSite\\Views\\123123123.cshtml', 'D:\\测试站\\Ds优惠券\\KMSite\\Views\\123123123.cshtml'])
