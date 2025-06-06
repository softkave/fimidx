import config from 'config';
import {z} from 'zod';

const configSchema = z.object({
  serverUrl: z.string(),
  indexObjsUrl: z.string().default('/objs/indexObjs'),
  indexObjsIntervalMs: z.number(),
  indexObjsApiKeyHeader: z.string().default('x-index-objs-api-key'),
  indexObjsApiKey: z.string(),
  cleanupObjsUrl: z.string().default('/objs/cleanupObjs'),
  cleanupObjsIntervalMs: z.number(),
  cleanupObjsApiKeyHeader: z.string().default('x-cleanup-objs-api-key'),
  cleanupObjsApiKey: z.string(),
});

export function getConfig() {
  return configSchema.parse(config.util.toObject(config));
}
