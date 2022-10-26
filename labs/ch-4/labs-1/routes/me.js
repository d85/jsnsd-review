var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('me', { title: 'Profile' });
});

module.exports = router;
