const express = require('express');
const {server} = require('./config');
const spending = require('./spending');
const routes = require('./routes');

//////////
// Constant created variables
const app = express();

//////////
// Express routes
app.use("/", routes);
app.use(routeError);

//////////
// Start app using config port
app.listen(server.port);

//////////
// Initialize spending app
spending.initialize();

/**
 * ROUTING ERROR
 */
function routeError(req, res, next) {
  let payload = {
    message: '404 ERROR'
  };

  res.json(payload)
}
