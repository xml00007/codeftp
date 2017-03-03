/**
 * Created by Arthur on 2017/3/1.
 */
var config = require('../config');
var eventproxy = require('eventproxy');
var fs = require('fs');
var iconv = require('iconv-lite');
var execSync = require('child_process').execSync; // 异步执行容易发生SVN锁库的现象，改为同步执行

function revisecsproj(req, res, next) {
    var data = req.projdata;
    var keys = Object.keys(data);
    var ep = new eventproxy();
    ep.fail(next);
    ep.after('readover', 3, function (list) {
        next(null, list);
    });
    keys.forEach(function (ele) {
        if (data[ele].length > 0) {
            var content = [];
            var compile = [];
            data[ele].forEach(function (e) {
                //修改静态文件
                if (e.indexOf('Resource') > 0 || e.indexOf('Views') > 0) {
                    //获取静态文件地址
                    content.push("<Content Include=\"" + e.substring(ele.length + 1) + "\" />");
                } else {
                    //修改需要编译的文件
                    compile.push("<Compile Include=\"" + e.substring(ele.length + 1) + "\" />");
                }
            });

            var dress = config.address + ele + "\\1" + ele + ".csproj";
            fs.readFile(dress, 'utf8', function (err, proj) {
                if (err) {
                    ep.emit('error', dress + '读取该文件出错');
                }
                var newproj = '';
                if (content.length > 0) {
                    newproj = proj.replace(/<ItemGroup>(\s)*<Content/, '<ItemGroup>\n\r\r\r\r' + content.join('\n\r\r\r\r') + '<Content');
                }
                if (compile.length > 0) {
                    newproj = newproj.replace(/<ItemGroup>(\s)*<Compile/, '<ItemGroup>\n\r\r\r\r' + content.join('\n\r\r\r\r') + '<Compile');
                }
                fs.writeFile('./22.csproj', newproj, ep.done('readover', function () {
                    console.log('22.csproj has finished');
                    return ele + '已修改'
                }));
            })
        } else {
            ep.emit('readover', ele + '无文件');
        }
    });
}

function compileFiles(req, res, next) {
    // 重新生成解决方案
    if (req.compileurls.length == 0) {
       return next(null, '没有需要编译的文件')
    }
    var order = 'devenv ' + config.address + config.projName + ' /rebuild Release';
    var msg = '';
    try {
        var a = execSync(order, {
            encoding: 'binary'
        }, function (err, out, outerr) {
            if (err) {
                console.log(err);
            }
            console.log(out)
        });
        // var b = iconv.decode(a, 'GBK');
        msg = '编译成功';
    }
    catch (ex) {
        var message = iconv.decode(ex.stdout, 'GBK');
        var reg = /\s(.*?error.*?)\r/gm;
        var errArray = [], myArray;
        while ((myArray = reg.exec(message)) !== null) {
            errArray.push(myArray[1]);
        }
        // console.log(errArray.join('\n'));
        msg = '编译失败，错误如下：' + errArray.join('\n');
    }
    next(null, msg);
}
module.exports = {
    revisecsproj: revisecsproj,
    compileFiles: compileFiles
};