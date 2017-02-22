var express = require('express');
var router = express.Router();
var eventproxy=require('eventproxy');
var exec = require('child_process').exec;
var config = require('../config');
var fs = require('fs');
var ftp = require('../Common/ftp');
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
    var reg1=/\\(FMSite|GMSite|KMSite|Entity|DataAccess)\\(.*?)\.(css|js|cs|cshtml)/ig;
    var urls=url.split('\n')
    var righturl=[];
    var data={
        FMSite:[],
        GMSite:[],
        KMSite:[]
    }
    urls.forEach(function (ele) {
        if(ele.match(reg1)){
            if(ele.toLowerCase().indexOf('contro'))
            righturl.push(config.address+RegExp.$1+'\\'+RegExp.$2+'.'+RegExp.$3);
        }else{
            ep.emit('error1',ele+'路径不合法')
        }
    })
    console.log(righturl);
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
            var content=[];var compile=[];
            data[ele].forEach(function (e) {
                     //修改静态文件
                    if(e.indexOf('Resource')>0||e.indexOf('Views')>0){
                        //获取静态文件地址
                        content.push("<Content Include=\""+e.substring(ele.length+1)+"\" />");
                    }else{
                        //修改需要编译的文件
                        compile.push("<Compile Include=\""+e.substring(ele.length+1)+"\" />");
                    }
            });

            var dress=config.address+ele+"\\"+ele+".csproj";
            fs.readFile(dress,'utf8',function (err,proj) {
                if(err) {
                    ep.emit('error1',dress+'读取该文件出错')
                }
                var newproj='';
                if(content.length>0){
                    newproj=proj.replace(/<ItemGroup>(\s)*<Content/,'<ItemGroup>\n\r\r\r\r'+content.join('\n\r\r\r\r')+'<Content');
                }
                if(compile.length>0) {
                    newproj = newproj.replace(/<ItemGroup>(\s)*<Compile/, '<ItemGroup>\n\r\r\r\r' + content.join('\n\r\r\r\r') + '<Compile');
                }

                fs.writeFile('./22.csproj',newproj,function(err){
                    if(err) throw err;
                    console.log('22.csproj has finished');
                });
            })
        }
    });
    //  检测是否有需要编译的文件  如果有进行编译
    compileFiles();


    // 备份文件
    downloadFiles(righturl);
    // ftp.download()


    // 上传文件
    res.render('Index', { title: 'Express' ,aasd:'success',error: 'success'});
});


function child_p (err,data1,data2) {
    if(err){
        console.log(err)
    }
    console.log(data1+"----"+data2)
}


function compileFiles() {
    // 重新生成解决方案
var order=' devnev '+config.address+config.projname+' /rebuild Release'
    exec(order,function (err,d1,d2) {
        if(err) emit('error1','重新生成解决方案失败，失败原因'+d1+'----'+d2)
    });
}

//上传编译好的文件
function uploadFiles() {

}
//  备份服务器上的文件到本地
function downloadFiles(urls) {
    // 准备需要下载的文件名
}


function ready(urls) {
    if(urls.length==0)  return;
    var obj={}; var returnurl=[];
    var reg=/\\(FMSite|GMSite|KMSite|Entity|DataAccess)\\(.*?)\.cs/ig;
    urls.forEach(function (url) {
        if(url.match(reg)){
            obj[RegExp.$1]=true;
        }else{
            returnurl.push(url);
        }
    });
    Object.keys(obj).forEach(function (key) {
        returnurl.push()
    })

}
module.exports = router;
