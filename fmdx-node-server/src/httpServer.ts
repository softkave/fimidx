import express from 'express';
import {addCallbackEndpoint} from './httpEndpoints/cb/addCallbackEndpoint.js';
import {removeCallbackEndpoint} from './httpEndpoints/cb/removeCallbackEndpoint.js';
import {sendMessageEndpoint} from './httpEndpoints/ws/sendMessageEndpoint.js';

export const kInternalAccessKeyHeader = 'x-internal-access-key';

export function startHttpServer(params: {
  port: number;
  internalAccessKey: string;
}) {
  const {port, internalAccessKey} = params;
  const app = express();

  app.use(express.json());
  app.use((req, res, next) => {
    if (req.headers[kInternalAccessKeyHeader] === internalAccessKey) {
      next();
    } else {
      res.status(401).send('Unauthorized');
    }
  });

  app.post('/cb/addCallback', (req, res) => {
    addCallbackEndpoint(req, res);
  });

  app.post('/cb/removeCallback', (req, res) => {
    removeCallbackEndpoint(req, res);
  });

  app.post('/ws/sendMessage', (req, res) => {
    sendMessageEndpoint(req, res);
  });

  app.listen(port, () => {
    console.log(`HTTP server is running on port ${port}`);
  });
}
