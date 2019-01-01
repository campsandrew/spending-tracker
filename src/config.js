const env = process.env.NODE_ENV;

const dev = {
  server: {
    port: 3000,
    gmail_credentials: 'google_credentials.json',
    gmail_scopes: [
      'https://mail.google.com/'
    ],
    gmail_token: 'gmail_token.json',
    emails_from: [
      'no-reply@alertsp.chase.com',
      'alerts@notify.wellsfargo.com'
    ]
  },
  database: {
    host: 'ds145704.mlab.com',
    port: 45704,
    user: 'andrewcamps',
    password: 'Andreini1!',
    dbName: 'spending-app'
  }
};

const config = {
  dev
};

module.exports = config[env];