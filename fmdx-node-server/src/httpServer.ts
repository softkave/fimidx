import express from 'express';
import {addCallbackEndpoint} from './httpEndpoints/cbs/addCallbackEndpoint.js';
import {deleteCallbacksEndpoint} from './httpEndpoints/cbs/deleteCallbacksEndpoint.js';
import {cleanupDeletedObjsEndpoint} from './httpEndpoints/objs/cleanupDeletedObjsEndpoint.js';
import {indexObjsEndpoint} from './httpEndpoints/objs/indexObjsEndpoint.js';

export const kInternalAccessKeyHeader = 'x-internal-access-key';

export function startHttpServer(params: {
  port: number;
  internalAccessKey: string;
}) {
  const {port, internalAccessKey} = params;
  const app = express();

  app.use(express.json());
  app.use((req, res, next) => {
    console.log(
      'Internal access key',
      req.headers[kInternalAccessKeyHeader],
      internalAccessKey,
    );
    if (req.headers[kInternalAccessKeyHeader] === internalAccessKey) {
      next();
    } else {
      res.status(401).send('Unauthorized');
    }
  });

  app.post('/cb/addCallback', (req, res) => {
    addCallbackEndpoint(req, res);
  });
  app.post('/cb/deleteCallbacks', (req, res) => {
    deleteCallbacksEndpoint(req, res);
  });

  app.post('/objs/indexObjs', (req, res) => {
    indexObjsEndpoint(req, res);
  });
  app.post('/objs/cleanupDeletedObjs', (req, res) => {
    cleanupDeletedObjsEndpoint(req, res);
  });

  app.listen(port, () => {
    console.log(`HTTP server is running on port ${port}`);
  });
}
