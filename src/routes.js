const router = require('express').Router();
const {google} = require('googleapis');
const path = require('path');
const fs = require('fs');
const {server} = require('./config');
const spending = require('./spending');

//////////
// Server routes
router.use('/gmail/code', gmailCodeRoute);
router.use('/gmail/messages', messagesRoute);

/**
 *
 */
function gmailCodeRoute(req, res) {
  if(!req.query.code) return res.send('Invalid request');

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

/**
 *
 */
function messagesRoute(req, res) {
  //let query = 'from:alerts@notify.wellsfargo.com';
  let query = 'from:no-reply@alertsp.chase.com';

  // Get all message based on query
  spending.getMessageList('me', query)
    .then(msg_list => {
      msg_list.sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
      });

      //fs.writeFileSync('wells_fargo.json', JSON.stringify(msg_list, null, 2));
      //fs.writeFileSync('chase.json', JSON.stringify(msg_list, null, 2));
      res.json(msg_list);
    })
    .catch(err => {
      res.json(err);
    });
}

module.exports = router;