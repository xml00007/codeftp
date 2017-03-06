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
var cache=require('../Common/cache');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('Index', {title: 'Express', aasd: '11', error: '0'});
});


router.post('/Upload', judge, function (req, res, next) {
    var ep=new eventproxy();
    ep.fail(next);
    ep.after('update',req.righturl.length,function (list) {
        cache.set('step0',{state:list.join('<br/>')});
        ep.emit('goon');
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
        exec('svn update ' + ele,{ encoding: 'binary'},ep.done('update',function (data) {
            var data = iconv.decode(data, 'GBK')
            return data;
        }));  // 存在则直接更新
    });
    req.projdata = data;
    ep.on('goon',function () {
        //修改.csproj 文件
        processfile.revisecsproj(req, res, function (err, data1) {
            if (err) {
                return next(err);
            }
            data = '修改工程文件已完成:' + data1.join('\n');
            cache.set('step1',{state:data1});
            //检测是否有需要编译的文件  如果有进行编译
            processfile.compileFiles(req, res, function (err, data2) {
                if (err) {
                    return next(err);
                }
                cache.set('step2',{state:data2});
                // 备份文件
                ftp.download(req, res, function (err, data3) {
                    if (err) {
                        return next(err);
                    }
                    cache.set('step3',{state:data3});
                    //上传文件
                    ftp.upload(req, res, function (err, data4) {
                        if (err) {
                            return next(err);
                        }
                        cache.set('step4',{state:data4});
                        res.json( {'a':1,'b':2,'success':100});
                    });
                });
            });
        });
    });
    //修改.csproj 文件
    // processfile.revisecsproj(req, res, function (err, data1) {
    //     if (err) {
    //         return next(err);
    //     }
    //     data = '修改工程文件已完成:' + data1.join('\n');
    //     cache.set('step1',{state:data1});
    //     console.log(data1);
    //     //检测是否有需要编译的文件  如果有进行编译
    //     processfile.compileFiles(req, res, function (err, data2) {
    //         if (err) {
    //             return next(err);
    //         }
    //         cache.set('step2',{state:data2});
    //         console.log(data2);
    //
    //         // 备份文件
    //         ftp.download(req, res, function (err, data3) {
    //             if (err) {
    //                 return next(err);
    //             }
    //             console.log(data3);
    //             cache.set('step3',{state:data3});
    //             //上传文件
    //             ftp.upload(req, res, function (err, data4) {
    //                 if (err) {
    //                     return next(err);
    //                 }
    //                 cache.set('step4',{state:data4});
    //                 res.json( {'a':1,'b':2,'success':100});
    //             });
    //         });
    //     });
    // });
});

module.exports = router;
