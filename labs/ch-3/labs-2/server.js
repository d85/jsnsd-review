const express = require('express')
const createError = require('http-errors')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.status(200)
  res.send('ok')
})

app.use((req, res, next) => {
  if (req.type !== 'GET') {
    next(createError(405))
    return
  }
  next(createError(404))
})

app.use((err, req, res, next) => {
  res.status(err.status)
  res.send(err.message)
})

app.listen(port, () => {
  console.log(`Server listening on ${port}`)
})