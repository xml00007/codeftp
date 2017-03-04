var express = require('express');
var router = express.Router();
var eventproxy = require('eventproxy');
var execSync = require('child_process').execSync; // 异步执行容易发生SVN锁库的现象，改为同步执行
var exec = require('child_process').exec;
var config = require('../config');
var fs = require('fs');
var ftp = require('../Common/ftp');
var judge = require('../middlewares/judge').judge;
var iconv = require('iconv-lite');
var processfile = require('../Common/processfile');
var fse = require('fs-extra');
var tool = require('../Common/tools');
var path = require('path');
var cache=require('../Common/cache');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('Index', {title: 'Express', aasd: '11', error: '0'});
});


router.post('/Upload', judge, function (req, res, next) {
    var ep = new eventproxy();
    ep.fail(next);
    ep.on('error1', function (msg) {
        res.status(422);
        res.render('Index', {error: msg, aasd: '33'});
    });
    var data = {
        GMSite: [],
        KMSite: [],
        FMSite: []
    };
    console.log(req.righturl);
    //  获取新添加的文件并放入data
    req.righturl.forEach(function (ele) {
        // 需要先判断本地是否存在该文件
        if (!fs.existsSync(ele)) {
            // 将需要修改的文件放入data
            var key = ele.split('\\');
            data[key[3]].push(key.slice(3).join('\\'));
        }
        execSync('svn update ' + ele, child_p);  // 存在则直接更新
    });
    req.projdata = data;
    //修改.csproj 文件
    processfile.revisecsproj(req, res, function (err, data) {
        if (err) {
            return next(err);
        }
        data = '修改工程文件已完成:' + data.join('\n');
        cache.set('step1',data);
        console.log(data);
        ep.emit('state', data);
        // 检测是否有需要编译的文件  如果有进行编译
        processfile.compileFiles(req, res, function (err, data) {
            if (err) {
                return next(err);
            }
            // ep.emit('state', data);
            cache.set('step2',data);
            console.log(data);

            // 备份文件
            ftp.download(req, res, function (err, data) {
                if (err) {
                    return next(err);
                }
                console.log(data);
                cache.set('step3',data);
                //上传文件
                ftp.upload(req, res, function (err, data) {
                    if (err) {
                        return next(err);
                    }
                    cache.set('step4',data);
                    // res.render('Index', {title: 'Express', aasd: 'success', error: 'success'});
                    res.json( {'a':1,'b':2,'success':100});
                });
            });
        });
    });
});


function child_p(err, data1, data2) {
    if (err) {
        console.log(err)
    }
    console.log(data1 + "----" + data2)
}


//上传编译好的文件
function uploadFiles() {

}
//  备份服务器上的文件到本地
function downloadFiles(urls) {
    // 准备需要下载的文件名
    ftp.download(urls);
}


module.exports = router;
