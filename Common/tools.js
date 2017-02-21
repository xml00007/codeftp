var moment = require('moment');

moment.locale('zh-cn'); // 使用中文

// 格式化时间
exports.format= function (formate, date) {
    date = date || Date.now();
    date = moment(date);
    return date.format(formate);
};