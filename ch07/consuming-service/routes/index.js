'use strict'
var express = require('express')
var router = express.Router()
const got = require('got')

const {
  BICYCLE_SERVICE_PORT = 4000
} = process.env

const bicycleSrv = `http://localhost:${BICYCLE_SERVICE_PORT}`

router.get('/:id', function (req, res, next) {
  const { id } = req.params

  got(`${bicycleSrv}/${id}`).json()
    .then(bicycle => res.send(bicycle))
});

module.exports = router
