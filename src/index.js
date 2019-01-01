const express = require('express');
const {server} = require('./config');
const spending = require('./spending');
const routes = require('./routes');

//////////
// Create express app
const app = express();

//////////
// Express settings
app.use("/", routes);
app.listen(server.port);

//////////
// Initialize spending app
spending.initialize(app);
