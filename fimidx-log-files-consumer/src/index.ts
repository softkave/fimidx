import {ILogFilesConsumer, LogFilesConsumer} from './LogFilesConsumer.js';

// Main function to start the consumer
export async function startLogFilesConsumer(
  configFilepath: string,
): Promise<ILogFilesConsumer> {
  const consumer = new LogFilesConsumer(configFilepath);
  await consumer.start();
  return consumer;
}

// CLI entry point
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node index.js <config-filepath>');
    process.exit(1);
  }

  const configFilepath = args[0];

  if (!configFilepath) {
    console.error('Config filepath is required');
    process.exit(1);
  }

  try {
    const consumer = await startLogFilesConsumer(configFilepath);

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down...');
      await consumer.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    console.log('Log files consumer is running. Press Ctrl+C to stop.');
  } catch (error) {
    console.error('Failed to start log files consumer:', error);
    process.exit(1);
  }
}

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
