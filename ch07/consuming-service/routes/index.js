'use strict'
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

  const bicylePromise = got(`${bicycleSrv}/${id}`).json()
  const brandPromise = got(`${brandSrv}/${id}`).json()

  Promise.all([bicylePromise, brandPromise])
    .then(([ bicycle, brand ]) => {
      res.send({
        id: bicycle.id,
        color: bicycle.color,
        brand: brand.name,
      })
    })
});

module.exports = router
