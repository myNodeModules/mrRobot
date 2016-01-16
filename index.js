var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
        process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';

var authCli = "";

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
          console.log('Error loading client secret file: ' + err);
              return;
                }
      // Authorize a client with the loaded credentials, then call the
      // Gmail API.
      authorize(JSON.parse(content), listMessages);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client, 'has:attachment', writeIt);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client, 'has:attachment', writeIt);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

/**
 * Retrieve Messages in user's mailbox matching query.
 *
 * @param  {String} userId User's email address. The special value 'me'
 * can be used to indicate the authenticated user.
 * @param  {String} query String used to filter the Messages listed.
 * @param  {Function} callback Function to call when the request is complete.
 */
/*
function listMessages(auth) {
  var list = [];
  var gmail = google.gmail('v1');
  gmail.users.messages.list({
    auth: auth,
    userId: 'me',
    q: "has:attachment",
  }, function (err, response) {
    var messages = response.messages;
    console.log("Messages: %s", messages.length);
    for (i = 0; i < messages.length; i++) {
      var message = messages[i];
      console.log('- %s', message.id);
    }
    console.log("Size: %s", response.nextPageToken);
    allPages(auth, response.nextPageToken);
  });
}

function allPages(auth, token) {
  var gmail = google.gmail('v1');
  gmail.users.messages.list({
    auth: auth,
    userId: 'me',
    q: "has:attachment",
    pageToken: token,
  }, function (err, response) {
    var messages = response.messages;
    console.log("Messages: %s", messages.length);
    for (i = 0; i < messages.length; i++) {
      var message = messages[i];
      console.log('- %s', message.id);
    }
    console.log("Size: %s", response.nextPageToken);
    allPages(response.nextPageTocken);
    });
    }
/*
/**
 * Retrieve Messages in user's mailbox matching query.
 *
 * @param  {String} userId User's email address. The special value 'me'
 * can be used to indicate the authenticated user.
 * @param  {String} query String used to filter the Messages listed.
 * @param  {Function} callback Function to call when the request is complete.
 */

function callWithParams(method, params, callback) {
  var gmail = google.gmail('v1');
  if (method == 'messages.list') {
    
    gmail.users.messages.list(params, callback);
  }
  else if (method == 'message.get') {
    gmail.users.messages.get(params, callback);
  }
  else if (method == 'attachment.get') {
    gmail.users.messages.attachments.get(params, callback);
  }
}

function listMessages(auth, query, callback) {
  autCli = auth;
  var getPageOfMessages = function(params, result) {
      callWithParams('messages.list', params, function(err, resp) {
      result = result.concat(resp.messages);
      var nextPageToken = resp.nextPageToken;
      if (nextPageToken) {
        params = {
          auth: auth,
          userId: 'me',
          pageToken: nextPageToken,
          q: query
        };
        getPageOfMessages(params, result);
      } else {
        callback(result);
      }
      });
  };
  var params = {
    auth: auth,
    userId: 'me',
    q: query
  };
  getPageOfMessages(params, []);
}

function writeIt(result) {
  console.log("Number of messages: %s", result.length);
  for (var i = 0; i < result.length; i++) {
    var params = {
      auth: authCli,
      id: result[0].id,
      userId: 'me',
    };
    callWithParams('message.get', params, addCallback);
  }
  console.log("END");
}

function getAttachments (message, callback) {
  parts = message.payload.parts;
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    if (part.filename && part.filename.length > 0) {
      var attachId = part.body.attachmentId;
      var params = {
        auth: authCli,
        userId: 'me',
        id: attachId,
        messageId: message.id
      }
      callWithParams('attachment.get', params, callback); 
    }
  }
}

function addCallback(err, res) {
  getAttachments(res, writeOnDisk);
}

function writeOnDisk (filename, mimeType, attachment) {
  console.log("filename: %s", filename);
}
