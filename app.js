// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Load environment variables from .env file
require('dotenv').config();

// Load third party dependencies
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Load our custom classes
const CustomerStore = require('./customerStore.js');
const MessageRouter = require('./messageRouter.js');

// Determine environment and credential path
const environment = process.env.ENVIRONMENT || 'development'; // Default to development
let dialogflowClientConfig = { apiEndpoint: 'global-dialogflow.googleapis.com' };

if (environment === 'production') {
  console.log('Running in production environment, using default service account.');
  // In production (Cloud Run), the default service account attached to the service
  // will be used automatically by the client library, so no keyFilename is needed.
} else {
  console.log('Running in development environment, using local credentials.');
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if(!keyPath) {
    console.log('You need to specify GOOGLE_APPLICATION_CREDENTIALS  in your .env file for development.');
    process.exit(1);
  }
  dialogflowClientConfig.keyFilename = keyPath;
}

// Load and instantiate the Dialogflow client library
const dialogflow = require('@google-cloud/dialogflow-cx');
const dialogflowClient = new dialogflow.SessionsClient(dialogflowClientConfig);

// Grab the Dialogflow project ID, location ID, and agent ID from environment variables
const projectId = process.env.DF_PROJECT_ID;
const locationId = process.env.DF_LOCATION_ID || 'global'; // Default to 'global' if not specified
const agentId = process.env.DF_AGENT_ID;

if(!projectId) {
  console.log('You need to specify DF_PROJECT_ID in your .env file. See README.md for details.');
  process.exit(1);
}
if(!agentId) {
  console.log('You need to specify DF_AGENT_ID in your .env file. See README.md for details.');
  process.exit(1);
}

// Instantiate our app
const customerStore = new CustomerStore();
const messageRouter = new MessageRouter({
  customerStore: customerStore,
  dialogflowClient: dialogflowClient,
  projectId: projectId,
  locationId: locationId,
  agentId: agentId,
  customerRoom: io.of('/customer'),
  operatorRoom: io.of('/operator')
});

// Serve static html files for the customer and operator clients
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/static/customer.html`);
});

app.get('/agent', (req, res) => {
  res.sendFile(`${__dirname}/static/operator.html`);
});

// Begin responding to websocket and http requests
messageRouter.handleConnections();
http.listen(3000, () => {
  console.log('Listening on *:3000');
});
