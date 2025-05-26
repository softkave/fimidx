import {AddLogsEndpointArgs} from 'fmdx-core/definitions/log';
import {mfdocConstruct, MfdocHttpEndpointMethod} from 'mfdoc';
import {kTags} from '../tags.js';
import {kAppId} from '../utils.js';

export const ingestLogsSchema = mfdocConstruct.constructHttpEndpointDefinition({
  method: MfdocHttpEndpointMethod.Post,
  name: 'fmdx/logs/ingestLogs',
  description: 'Ingest logs',
  tags: [kTags.public],
  basePathname: '/logs/ingest',
  requestBody: mfdocConstruct.constructObject<AddLogsEndpointArgs>({
    name: 'IngestLogsArgs',
    description: 'The schema for ingesting logs',
    fields: {
      appId: mfdocConstruct.constructObjectField({
        required: true,
        data: kAppId,
      }),
      logs: mfdocConstruct.constructObjectField({
        required: true,
        data: mfdocConstruct.constructArray({
          type: mfdocConstruct.constructObject({
            name: 'InputLogRecord',
          }),
        }),
      }),
    },
  }),
});
