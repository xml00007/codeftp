/**
 * Created by Arthur on 2017/2/27.
 */

var config = require('../config');
var tools=require('../Common/tools')
exports.judge = function (req, res, next) {
    var url = req.body.conturl.trim();
    if (url == '') {
        res.render('Index', {title: 'Express', aasd: 'error', error: '请补充完整参数'});
    }
    var reg1 = /\\(FMSite|GMSite|KMSite|Entity|DataAccess)\\(.*?)\.(css|js|cshtml|cs)/ig;
    var urls = url.split('\n')
    var righturl = [];   // 本项目所有需要更新的文件
    var i=0;
    urls.forEach(function (ele) {
        if (ele.match(reg1)) {
            if (RegExp.$1 == req.body.proj || RegExp.$1 == "Entity" || RegExp.$1 == "DataAccess") {
                righturl.push(config.address + RegExp.$1 + '\\' + RegExp.$2 + '.' + RegExp.$3);
            }
        }
    });
    req.righturl=tools.quchong(righturl);
    var compileurl=[];   //  需要备份和上传的文件
    var proj=req.body.proj.substring(0,2);
    var serverurl=config.serverPath+proj+'.test.mai.fang.com/bin/FangLab.Product.DirectSelling.{0}.dll';
    var reg2=/(DataAccess|Entity|KMSite|GMSite|FMSite)(.*?)\.cs$/i;
    righturl.forEach(function (ele) {
        if (ele.match(reg2)) {
            if (ele.indexOf('DataAccess')>0) {
                compileurl.push(serverurl.replace('{0}','DataAccess'))
            }
            else if (ele.indexOf('Entity')>0) {
                compileurl.push(serverurl.replace('{0}','Entity'))
            }else  {
                compileurl.push(serverurl.replace('{0}',req.body.proj))
            }
        }
    });
    req.compileurls=tools.quchong(compileurl);
    req.staticurl=getstaticurl(req.righturl,proj);
    next();
};


function getstaticurl(urls,proj) {
    var r=[];
    urls.forEach(function (ele) {
        if (ele.split('.')[1].toLowerCase()!='cs') {
            var ad=ele.split('\\').slice(config.address.split('\\').length).join('/');
            //D:\测试站\Ds优惠券\GMSite\Views\CityList.cshtml
            r.push(config.serverPath+proj+'.test.mai.fang.com/'+ad);
        }
    });
    return r;
}