const {google} = require('googleapis');
const mongoose = require('mongoose');
const path = require('path');
const opn = require('opn');
const fs = require('fs');
const {server} = require('./config');
const {database} = require('./config');

/**
 *
 */
function init(app) {
  let cred_path = path.resolve('keys', server.gmail_credentials);
  let tok_path = path.resolve('keys', server.gmail_token);
  let dbUri = `mongodb://${database.user}:${database.password}@${database.host}:${database.port}/${database.dbName}`;
  let dbOptions  = {
    useNewUrlParser: true
  }

  // Connect to database
  mongoose.connect(dbUri, dbOptions)
    .catch(err => {
      console.log(err);
    });

  // Read google credential file
  try {
    let {
      client_secret, 
      client_id, 
      redirect_uris
    } = JSON.parse(fs.readFileSync(cred_path));

    app.locals.oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
  } catch(err) {
    return console.log('Error loading google credentials: ', err);
  }

  // Read get auth token for google api
  try {
    let token = fs.readFileSync(tok_path);

    app.locals.oAuth2Client.setCredentials(JSON.parse(token));
    app.locals.gmail = google.gmail({version: 'v1', auth: app.locals.oAuth2Client});
  } catch(err) {
    let authUrl = app.locals.oAuth2Client.generateAuthUrl({
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
function getMessageList(gmail, userId, query) {
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
                getMessage(gmail, msg.id)
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
function getMessage(gmail, messageId) {
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