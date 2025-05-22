import {z} from 'zod';

export const inputLogRecordSchema = z.record(z.string(), z.any());
export const inputLogRecordArraySchema = z.array(inputLogRecordSchema);
export const ingestLogsSchema = z.object({
  appId: z.string(),
  logs: inputLogRecordArraySchema,
});

export type IngestLogsEndpointParams = z.infer<typeof ingestLogsSchema>;
