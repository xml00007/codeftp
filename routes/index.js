var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('Index', { title: 'Express' ,aasd:'11'});
});



router.post('/Upload', function(req, res, next) {
    res.render('Index', { title: 'Express' ,aasd:'123'});
});
module.exports = router;
