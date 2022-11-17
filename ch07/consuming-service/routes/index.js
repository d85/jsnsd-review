'use strict'
var createError = require('http-errors');
var express = require('express')
var router = express.Router()
const got = require('got')

const {
  BICYCLE_SERVICE_PORT = 4000, BRAND_SERVICE_PORT = 5000
} = process.env

const bicycleSrv = `http://localhost:${BICYCLE_SERVICE_PORT}`
const brandSrv = `http://localhost:${BRAND_SERVICE_PORT}`

router.get('/:id', function (req, res, next) {
  const { id } = req.params

  Promise.all([
    got(`${bicycleSrv}/${id}`).json(), 
    got(`${brandSrv}/${id}`).json()
  ])
  .then(([ bicycle, brand ]) => {
    res.send({
      id: bicycle.id,
      color: bicycle.color,
      brand: brand.name,
    })
  })
  .catch((err) => {
    if (!err.response) next(err)
    if (err.response.statusCode === 404) next()
    if (err.response.statusCode === 400) next(createError(400))
    else next(err)
  })
});

module.exports = router
