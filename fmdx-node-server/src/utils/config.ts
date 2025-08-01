import config from 'config';
import {z} from 'zod';

const configSchema = z.object({
  serverUrl: z.string(),
  internalAccessKey: z.string(),
  indexObjsUrl: z.string(),
  indexObjsIntervalMs: z.number(),
  cleanupObjsUrl: z.string(),
  cleanupObjsIntervalMs: z.number(),
});

export function getConfig() {
  return configSchema.parse(config.util.toObject(config));
}
