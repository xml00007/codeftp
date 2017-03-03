var moment = require('moment');

moment.locale('zh-cn'); // 使用中文

// 格式化时间
exports.format= function (formate, date) {
    date = date || Date.now();
    date = moment(date);
    return date.format(formate);
};
// 数组去重

exports.quchong= function (arry) {
    var r=[];
    arry.forEach(function (ele) {
        if (r.indexOf(ele)==-1) {
            r.push(ele)
        }
    });
    return r;
};