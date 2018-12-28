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

    oAuth2Client.setCredentials(JSON.parse(token))
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

// function listLabels() {
//   gmail.users.labels.list({
//     userId: 'me',
//   }, (err, res) => {
//     if (err) return console.log('The API returned an error: ' + err);
//     const labels = res.data.labels;

//     //console.log(res.data);
//     if (labels.length) {
//       console.log('Labels:');
//       labels.forEach((label) => {
//         console.log(`- ${label.name}`);
//       });
//     } else {
//       console.log('No labels found.');
//     }
//   });
// }

/**
 * Get Message with given ID.
 *
 * @param  {String} userId User's email address. The special value 'me'
 * can be used to indicate the authenticated user.
 * @param  {String} messageId ID of Message to get.
 * @param  {Function} callback Function to call when the request is complete.
 */
// function getMessage(auth, messageId) {
//   const gmail = google.gmail({version: "v1", auth});

//   gmail.users.messages.get({
//     userId: "me",
//     id: messageId,
//     format: "raw"
//   }, (err, res) => {
//     if (err) return console.log("The API returned an error: " + err);

//     let buff = new Buffer(res.data.raw, "base64");  
//     let text = buff.toString("ascii");

//     console.log(text);
//   });
// }

// /**
//  * Retrieve Messages in user's mailbox matching query.
//  *
//  * @param  {String} userId User's email address. The special value 'me'
//  * can be used to indicate the authenticated user.
//  * @param  {String} query String used to filter the Messages listed.
//  * @param  {Function} callback Function to call when the request is complete.
//  */
// function listMessages(auth, callback) {
//   const gmail = google.gmail({version: "v1", auth});

//   gmail.users.messages.list({
//     userId: "me"
//   }, (err, res) => {
//     if (err) return console.log("The API returned an error: " + err);

//     callback(auth, res.data.messages[0].id);
//   });
// }

// /**
//  * Lists the labels in the user's account.
//  *
//  * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
//  */
// function listLabels(auth) {
//   const gmail = google.gmail({version: 'v1', auth});

//   gmail.users.labels.list({
//     userId: 'me',
//   }, (err, res) => {
//     if (err) return console.log('The API returned an error: ' + err);
//     const labels = res.data.labels;

//     //console.log(res.data);
//     if (labels.length) {
//       console.log('Labels:');
//       labels.forEach((label) => {
//         console.log(`- ${label.name}`);
//       });
//     } else {
//       console.log('No labels found.');
//     }
//   });
// }

module.exports = {
  initialize: init
};