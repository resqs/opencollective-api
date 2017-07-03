import './lib/load-dot-env'; // important to load first for environment config
import express from 'express';
import fs from 'fs';
import https from 'https';
import routes from './routes';
import os from 'os';
import expressLib from './lib/express';

const app = express();

expressLib(app);

/**
 * Routes.
 */

routes(app);

/**
 * Start server
 */
const port = process.env.PORT || 3060;
const server = app.listen(port, () => {
  const host = os.hostname();
  console.log('OpenCollective API listening at http://%s:%s in %s environment.\n', host, server.address().port, app.set('env'));
});

server.timeout = 15000; // sets timeout to 15 seconds

// https server needed for testing apple pay
const privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
const certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
const credentials = {key: privateKey, cert: certificate};

https.createServer(credentials, app).listen(8460);

export default app;
