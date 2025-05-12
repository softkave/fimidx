import {startServer} from './server.js';

startServer()
  .then(() => {
    console.log('Server started');
  })
  .catch(err => {
    console.error(err);
  });
