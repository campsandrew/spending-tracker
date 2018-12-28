const {google} = require('googleapis');
const path = require('path');
const opn = require('opn');
const fs = require('fs');
const {server} = require('./config');

/**
 *
 */
function init() {
  let cred_path = path.resolve('keys', server.gmail_credentials);
  let tok_path = path.resolve('keys', server.gmail_token);

  // Read google credential file
  try {
    let {
      client_secret, 
      client_id, 
      redirect_uris
    } = JSON.parse(fs.readFileSync(cred_path));

    global.oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
  } catch(err) {
    return console.log('Error loading google credentials: ', err);
  }

  // Read get auth token for google api
  try {
    let token = fs.readFileSync(tok_path);

    oAuth2Client.setCredentials(JSON.parse(token));
    global.gmail = google.gmail({version: 'v1', auth: oAuth2Client});
  } catch(err) {
    let authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: server.gmail_scopes
    });

    // Open browser to authorize account
    opn(authUrl)
      .catch(err => {
        console.log('Error opening browser: ', err);
      });
  }
}

/**
 *
 */
function getMessage(messageId) {
  let params = {
    userId: 'me',
    id: messageId
  }

  return new Promise(function(resolve, reject) {
    gmail.users.messages.get(params)
      .then(res => {
        let buff = new Buffer.from(res.data.payload.body.data, 'base64');
        
        resolve({
          date: Date(res.data.internalDate),
          body: buff.toString('ascii')
        });
      })
      .catch(err => {
        reject(err);
      });
  });
}

module.exports = {
  initialize: init,
  getMessage: getMessage
};