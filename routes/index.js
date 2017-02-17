var express = require('express');
var router = express.Router();
var eventproxy=require('eventproxy');
var exec = require('child_process').exec;
var config = require('../config');
var fs = require('fs');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('Index', { title: 'Express' ,aasd:'11',error:'0'});
});



router.post('/Upload', function(req, res, next) {
    var ep = new eventproxy();
    ep.fail(next);
    ep.on('error1', function (msg) {
        res.status(422);
        res.render('Index', {error: msg,aasd:'33'});
    });
    var url=req.body.conturl.trim();
    if(url==''){
        ep.emit('error1','请补充完整的路径')
    }
    var reg1=/\\(FMSite|GMSite|KMSite)\\(.*?)\.(css|js|cs|cshtml)/ig;
    var reg2=/\\(km|fm|gm)site\\Resource\.(css|js|cs)/ig;
    var urls=url.split('\n')
    var righturl=[];
    var data={
        FMSite:[],
        GMSite:[],
        KMSite:[]
    }
    urls.forEach(function (ele) {
        if(ele.match(reg1)){
            righturl.push(config.address+RegExp.$1+'\\'+RegExp.$2+'.'+RegExp.$3);
        }else{
            ep.emit('error1',ele+'路径不合法')
        }
    })

    righturl.forEach(function (ele) {
        // 需要先判断本地是否存在该文件
        if(!fs.existsSync(ele)){
            // 将需要修改的文件放入data
            var key=ele.split('\\');
            data[key[3]].push(key.slice(3).join('\\'));
        }
        exec('svn update '+ele, child_p);  // 存在则直接更新
        // exec('svn update '+ele, child_p)
        // exec('svn list D:\\测试站\\Ds优惠券\\KMSite',child_p)
    })
    //修改.csproj 文件
    var keys=Object.keys(data);
    keys.forEach(function (ele){
        if(data[ele].length>0){
            data[ele].forEach(function (e) {
                    if(e.indexOf('Resource')>0||e.indexOf('Views')>0){
                        //修改静态文件
                        fs.readFile(e,function (err,d1,d2) {

                        })
                    }else{
                        //修改需要编译的文件
                    }
            })
        }
    }
    )

    res.render('Index', { title: 'Express' ,aasd:'success',error: 'success'});
});


function child_p (err,data1,data2) {
    if(err){
        console.log(err)
    }
    console.log(data1+"----"+data2)
}
module.exports = router;
