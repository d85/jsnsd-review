const express = require('express')
const data = require('./data')
const app = express()
const port = 3000

app.get('/', async (req, res) => {
  const payload = await data()
  res.setHeader('Content-Type', 'text/plain')
  res.send(payload)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})