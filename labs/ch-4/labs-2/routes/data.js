var express = require('express');
var router = express.Router();
var dataStream = require('../stream')
var finished = require('stream').finished

router.get('/', function(req, res, next) {
  const stream = dataStream()

  res.setHeader('Content-Type', 'text/html')
  stream.pipe(res, {end: false})

  finished(stream, (err) => {
    if (err) {
      next(err)
      return
    }
    res.end()
  })
});

module.exports = router;
