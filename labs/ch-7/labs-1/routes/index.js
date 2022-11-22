'use strict'
var createError = require('http-errors');
var express = require('express')
var router = express.Router()
const got = require('got')

const {
  BOAT_SERVICE_PORT = 3333, BRAND_SERVICE_PORT = 3334
} = process.env

const boatSrv = `http://localhost:${BOAT_SERVICE_PORT}`
const brandSrv = `http://localhost:${BRAND_SERVICE_PORT}`

router.get('/:id', function (req, res, next) {
  const { id } = req.params
  const combinedResult = {}

  got(`${boatSrv}/${id}`, { timeout: 1250, retry: 0 }).json()
    .then((boat) => {
      combinedResult.id = boat.id
      combinedResult.color = boat.color
      return got(`${brandSrv}/${boat.brand}`, { timeout: 1250, retry: 0 }).json()
    })
    .then((brand) => {
      combinedResult.brand = brand.name
      res.send(combinedResult)
    })
    .catch((err) => {
      if (err.response) {
        const { statusCode } = err.response
        if (statusCode === 404) next()
        else if (statusCode === 400) next(createError(400))
      } else {
        next(createError(500))
      }
    })
});

module.exports = router