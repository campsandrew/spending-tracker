const router = require('express').Router();
const {google} = require('googleapis');
const path = require('path');
const fs = require('fs');
const {server} = require('./config');

router.use('/gmail/code', gmailCode);

/**
 *
 */
function gmailCode(req, res) {
  let tok_path = path.resolve('keys', server.gmail_token);

  oAuth2Client.getToken(req.query.code, (err, token) => {
    if (err) return res.send(err);

    oAuth2Client.setCredentials(token);
    global.gmail = google.gmail({version: 'v1', auth: oAuth2Client});
    fs.writeFile(tok_path, JSON.stringify(token), (err) => {
      if (err) return res.send(err);
      res.send('Token stored to: ' + tok_path);
    });
  });
}

module.exports = router;