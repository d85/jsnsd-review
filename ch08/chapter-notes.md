# Chapter Overview
By the end of this chapter, we should be able to:

- Proxy HTTP requests for a single route
- Modify data during proxying
- Create a full proxying server

# Single-Route, Multi-Origin Proxy

There may be some circumstances where we need to send data from another service via our service. In these cases, we could actually use an HTTP request library like got as explored in the prior chapter. However, using a proxying library is a viable alternative that provides a more configuration-based approach vs the procedural approach of using a request library.

Let's start by defining a route that will take a querystring parameter called url and then respond from whatever URL is specified in that parameter.

Let's initialize a new Fastify project:

```sh
node -e "fs.mkdirSync('my-route-proxy-fastify')"
cd my-route-proxy-fastify
npm init fastify
```

Now let's install the `fastify-reply-from`:

```
npm install fastify-reply-from
```

Then create a plugins/reply-from.js file with the following contents:

```js
'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (fastify, opts) {
  fastify.register(require('fastify-reply-from'), {
    errorHandler: false
  })
})
```

This code is very similar to plugins/sensible.js. The fastify-plugin library is used to apply the exported plugin application-wide.

Now, we'll modify the routes/root.js file to the following:

```js
'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    const { url } = request.query
    try {
      new URL(url)
    } catch (err) {
      throw fastify.httpErrors.badRequest()
    }
    return reply.from(url)
  })
}
```

We take the `url` parameter from the query string by destructuring the `url` property from the `request.query` object provided by Fastify. Then we pass the `url` value into the global URL constructor in order to validate it.

The `URL` constructor can be used in a similar fashion to Node core's url.parse method. The main difference is that the protocol (e.g. `http://`) and origin (the domain) portions of a URL must be present. If the `URL` constructor throws, then the value of `url` is an invalid URL. In that case we rethrow `fastify.httpErrors.badRequest` (as provided by `fastify-sensible`) to create a 400 status code response. Otherwise we return the result of `reply.from(url)`.

The `reply.from` method is supplied by the `fastify-reply-from` plugin and returns a promise that resolves once the response from the upstream URL has been sent as a response to the client. We return it so that the route handler knows when the request has finished being handled by `reply.from`.

Let's test out our implementation by starting a simple HTTP server that we can specify as the `url` parameter.

Now let's start our Fastify server with `npm run dev`, this will start a server that listens on port 3000.

In another terminal window run the following command:

```sh
node -e "http.createServer((_, res) => (res.setHeader('Content-Type', 'text/plain'), res.end('hello world'))).listen(5000)"
```

This will start an HTTP server on port 5000 that responds with "hello world" to all requests.

Now if we navigate to `htt‌p://localhost:3000/?url=http://localhost:5000` in a browser we should see `hello world` displayed. Most sites will trigger a redirect if they detect that a proxy server is being used (and the `url` query string parameter tends to give it away). For instance, if we navigate to `http://localhost:3000/?url=http://google.com` the browser will receive a 301 Moved response which will cause the browser to redirect to `http://google.com` directly. Therefore this approach is better suited when using URLs that are only accessible internally and this exposed route is a proxy to accessing them.

The `fastify-reply-from` plugin can also be configured so that it can only proxy to a specific upstream server using the `base` option. In this case `reply.from` would be passed a path instead of a full URL and then make a request to the `base` URL concatenated with the path passed to `reply.from`. This can be useful for mapping different endpoints to a specific upstream service.

More advanced proxying scenarios involve rewriting some aspect of the response from the upstream service while it's replying to the client. To finish off this section let's make our proxy server uppercase all content that arrives from the upstream service before sending it on to the client.

Let's update the `routes/root.js` file to the following:

```js
'use strict'
const { Readable } = require('stream')
async function * upper (res) {
  for await (const chunk of res) {
    yield chunk.toString().toUpperCase()
  }
}
module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    const { url } = request.query
    try {
      new URL(url)
    } catch (err) {
      throw fastify.httpErrors.badRequest()
    }
    return reply.from(url, {
      onResponse (request, reply, res) {
        reply.send(Readable.from(upper(res)))
      }
    })
  })
}
```

The second argument passed to `reply.from` is the options object. It contains an `onResponse` function. If the `onResponse` function is provided in the options object, the `fastify-reply-from` plugin will call it and will not end the response, it becomes up to us to manually end the response (with `reply.send`) in this case. The `onResponse` function is passed the `request` and `reply` objects for the route handler and a third argument: `res`, which represents the response from the upstream service. This is the same core `http.IncomingMessage` object that's passed to the callback of an `http.request` call.

The other pieces of the implementation are Node core and JavaScript language related. We pass the `res` object to an `upper` function that we created at the top of the file. The `upper` function is an async generator function - notice the asterisk (`*`) in the function signature. See Mozilla Documentation for more information on async function generators.

The `res` object is an async iterable, which means it can be used with `for await of` syntax. This allows us to grab each chunk from the upstream services response, convert it to a string and then uppercase it. We `yield` the result from the `upper` function. The `upper` function in turn returns an async iterable object which can be passed to the Node core `streams.Readable.from` method which will convert the async iterable into a stream. The result is passed into `reply.send` which will take the data from the stream and send it to the response.

We could have instead buffered all content into memory, uppercased it, and then sent the entire contents to `reply.send` instead but this would not be ideal in a proxying situation: we don't necessarily know how much content we may be fetching. Instead our approach incrementally processes each chunk of data from the upstream service, sending it immediately to the client.

Let's ensure our command that starts the tiny "hello world" server is running from earlier, if it isn't we can run the following command to start it:

```sh
node -e "http.createServer((_, res) => (res.setHeader('Content-Type', 'text/plain'), res.end('hello world'))).listen(5000)"
```

Now, if we navigate to `http://localhost:3000/?url=http://localhost:5000` in a browser the output should be `HELLO WORLD`.