import config from 'config';
import {z} from 'zod';

const configSchema = z.object({
  serverUrl: z.string(),
  indexObjsUrl: z.string().default('/objs/indexObjs'),
  indexObjsApiKey: z.string(),
  indexObjsIntervalMs: z.number(),
  indexObjsApiKeyHeader: z.string().default('x-index-objs-api-key'),
});

export function getConfig() {
  return configSchema.parse(config.util.toObject(config));
}
