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
function getMessageList(userId, query) {
  let promise = new Promise(function(resolve, reject) {
    let params = {
      userId: userId,
      q: query
    }

    // Get a back of email ids
    let getPage = function(params, result) {

      // Use google api to get a list of emails
      gmail.users.messages.list(params)
        .then(response => {
          let nextPage = response.data.nextPageToken;
          let msg_promises = [];
          let messages = [];

          // Get contents of all messages
          if(response.data.messages) {
            response.data.messages.forEach(function(msg) {
              msg_promises.push(
                getMessage(msg.id)
                  .then(msg_body => {
                    messages.push(msg_body);
                  })
                  .catch(err => {
                    message.push(err);
                  })
              );
            });
          }

          // // Wait until list of promises are resolved
          Promise.all(msg_promises).then(() => {
            all_messages  = result.concat(messages);

            if(nextPage) {
                let next_params = {
                  userId: userId,
                  pageToken: nextPage,
                  q: query
                }

               getPage(next_params, all_messages);
            } else {
              resolve(all_messages);
            }
          });
        })
        .catch(err => {
          reject(err);
        });
    }

    // Get all pages of messages recursively
    getPage(params, []);
  });

  return promise;
}

/**
 *
 */
function getMessage(messageId) {
  let params = {
    userId: 'me',
    id: messageId
  }

  let promise = new Promise(function(resolve, reject) {
    gmail.users.messages.get(params)
      .then(res => {
        let msgHeaders = getMessageHeaders(res.data.payload);
        let msgBody = getMessageBody(res.data.payload);
        let payload = {
          date: msgHeaders.date,
          subject: msgHeaders.subject,
          body: msgBody
        }
        
        resolve(payload);
      })
      .catch(err => {
        reject(err);
      });
  });

  return promise;
}

/**
 *
 */
function getMessageHeaders(payload) {
  let headers = {}

  // Get needed headers from each email
  for(let header of payload.headers) {
    if(header.name.toLowerCase() === 'subject') {
      headers['subject'] = header.value;
    }
    if(header.name.toLowerCase() === 'date') {
      headers['date'] = header.value;
    }
  }

  return headers;
}

/**
 *
 */
function getMessageBody(payload) {
  let body = [];

  // Checks if body message exists
  if(payload.body.size) {
    let buff = new Buffer.from(payload.body.data, 'base64');
    body.push(buff.toString('ascii'));
  }

  // Checks if there are more parts to the body
  if(payload.hasOwnProperty('parts')) {
    for(let part of payload.parts) {
      body = body.concat(getMessageBody(part));
    }
  }

  return body
}

module.exports = {
  initialize: init,
  getMessage: getMessage,
  getMessageList: getMessageList
};