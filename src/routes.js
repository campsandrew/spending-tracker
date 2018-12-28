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
  let init_params = {
    userId: 'me',
    q: 'from:no-reply@alertsp.chase.com'
  }
  let getPage = function(params, result) {
    gmail.users.messages.list(params)
      .then(response => {
        let nextPage = response.data.nextPageToken;
        let msg_promises = [];
        let messages = [];

        // Get contents of all messages
        response.data.messages.forEach(function(msg) {
          msg_promises.push(
             spending.getMessage(msg.id)
               .then(msg_body => {
                 messages.push(msg_body);
               })
               .catch(err => {
                 res.send(err);
               })
          );
        });

        // Wait until list of promises are resolved
        Promise.all(msg_promises).then(() => {
          let all_messages  = result.concat(messages);

          if(nextPage) {
             let next_params = {
               userId: 'me',
               pageToken: nextPage,
               q: 'from:no-reply@alertsp.chase.com Your Daily Account Summary Alert From Chase'
             }

             getPage(next_params, all_messages);
          } else {
            res.json(all_messages);
          }
        });
      })
      .catch(err => {
        res.send(err);
      });
  }

  // Get all pages of messages recursively
  getPage(init_params, []);
}

module.exports = router;