#!/usr/bin/env node

import {startLogFilesConsumer} from './build/index.js';

async function main() {
  try {
    console.log('Starting log files consumer...');

    const consumer = await startLogFilesConsumer('./example-config.json');

    console.log('Log files consumer started successfully!');
    console.log('Press Ctrl+C to stop...');

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('\nShutting down...');
      await consumer.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start log files consumer:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
