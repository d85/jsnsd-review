var express = require('express')
var router = express.Router()
var model = require('../model')

router.get('/:id', function(req, res, next) {
  model.boat.read(req.params.id, (err, result) => {
    if (err) {
      if (err.message === 'not found') next()
        else next(err)
    } else {
      res.send(result)
    }
  })
});

router.post('/', function(req, res, next) {
  const id = model.boat.uid()
  model.boat.create(id, req.body.data, (err) => {
    if (err) next(err)
    else res.status(201).send({ id })
  })
})

router.delete('/:id', function(req, res, next) {
  model.boat.del(req.params.id, (err) => {
    if (err) {
      if (err.message === 'not found') next()
      else next(err)
    } else {
      res.status(204).send()
    }
  })
})

module.exports = router;