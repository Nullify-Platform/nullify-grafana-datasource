import { z } from 'zod';
import { DataFrame, FieldType, TimeRange, createDataFrame } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { SecretsEventType, SecretsEventsQueryOptions } from 'types';
import { SecretsScannerFindingEvent } from './secretsCommon';
import { unwrapOwnerTemplateVariables, unwrapRepositoryTemplateVariables } from 'utils/utils';

const MAX_API_REQUESTS = 10;

const _BaseEventSchema = z.object({
  id: z.string(),
  time: z.string(),
  timestampUnix: z.number(),
});

const SecretsEventsGitProvider = z.object({
  id: z.string(),
  github: z
    .object({
      installationId: z.number(),
      ownerId: z.number(),
      owner: z.string(),
      ownerType: z.string(),
      repositoryName: z.string(),
      repositoryId: z.number(),
      hasIssue: z.boolean(),
    })
    .optional(),
  bitbucket: z.any().optional(),
});

const secretsEventSchemaMap = {
  [SecretsEventType.NewFinding]: _BaseEventSchema.extend({
    type: z.literal(SecretsEventType.NewFinding),
    data: z.object({
      id: z.string(),
      branch: z.string(),
      commit: z.string(),
      cloneUrl: z.string(),
      provider: SecretsEventsGitProvider,
      finding: SecretsScannerFindingEvent,
      userId: z.string(),
    }),
  }),
  [SecretsEventType.NewAllowlistedFinding]: _BaseEventSchema.extend({
    type: z.literal(SecretsEventType.NewAllowlistedFinding),
    data: z.object({
      id: z.string(),
      branch: z.string(),
      commit: z.string(),
      cloneUrl: z.string(),
      provider: SecretsEventsGitProvider,
      finding: SecretsScannerFindingEvent,
      userId: z.string(),
    }),
  }),
};

const SecretsEventsEventSchema = z.union([z.never(), z.never(), ...Object.values(secretsEventSchemaMap)]);

const SecretsEventsApiResponseSchema = z.object({
  events: z.array(SecretsEventsEventSchema).nullable(),
  numItems: z.number(),
  nextEventId: z.string(),
});

type SecretsEventsEvent = z.infer<typeof SecretsEventsEventSchema>;

interface SecretsEventsApiRequest {
  githubRepositoryId?: number[];
  fileOwnerName?: string[];
  branch?: string;
  eventType?: string[];
  fromTime?: string; // ISO string
  fromEvent?: string;
  numItems?: number; //max 100
  sort?: 'asc' | 'desc';
}

export const processSecretsEvents = async (
  queryOptions: SecretsEventsQueryOptions,
  range: TimeRange,
  request_fn: (endpoint_path: string, params?: Record<string, any>) => Promise<FetchResponse<any>>
): Promise<DataFrame> => {
  let events: SecretsEventsEvent[] = [];
  let prevEventId = null;
  for (let i = 0; i < MAX_API_REQUESTS; ++i) {
    const params: SecretsEventsApiRequest = {
      ...(queryOptions.queryParameters.githubRepositoryIdsOrQueries
        ? {
            githubRepositoryId: unwrapRepositoryTemplateVariables(
              queryOptions.queryParameters.githubRepositoryIdsOrQueries
            ),
          }
        : {}),
      ...(queryOptions.queryParameters.ownerNamesOrQueries
        ? {
            fileOwnerName: unwrapOwnerTemplateVariables(queryOptions.queryParameters.ownerNamesOrQueries),
          }
        : {}),
      ...(queryOptions.queryParameters.branch ? { branch: queryOptions.queryParameters.branch } : {}),
      ...(queryOptions.queryParameters.eventTypes && queryOptions.queryParameters.eventTypes.length > 0
        ? { eventType: queryOptions.queryParameters.eventTypes }
        : { eventType: Object.values(SecretsEventType) }),
      ...(prevEventId ? { fromEvent: prevEventId } : { fromTime: range.from.toISOString() }),
      sort: 'desc',
    };
    const endpointPath = 'secrets/events';
    console.log(`[${endpointPath}] starting request with params:`, params);
    const response = await request_fn(endpointPath, params);

    console.log(`[${endpointPath}] response:`, response);

    const parseResult = SecretsEventsApiResponseSchema.safeParse(response.data);
    if (!parseResult.success) {
      throw {
        message: `Data from the API is misformed. Contact Nullify with the data below for help`,
        data: {
          endpoint: endpointPath,
          request_params: params,
          response: response,
          data_validation_error: parseResult.error,
        },
      };
    }

    if (parseResult.data.events) {
      events.push(...parseResult.data.events);
    }

    if (!parseResult.data.nextEventId) {
      // No more events
      break;
    } else if (
      parseResult.data.events &&
      parseResult.data.events.length > 0 &&
      parseResult.data.events[0].timestampUnix < range.from.unix()
    ) {
      // No more events required
      break;
    } else {
      prevEventId = parseResult.data.nextEventId;
    }
  }

  return createDataFrame({
    refId: queryOptions.refId,
    fields: [
      {
        name: 'id',
        type: FieldType.string,
        values: events.map((event) => event.id),
      },
      {
        name: 'timestamp',
        type: FieldType.time,
        values: events.map((event) => new Date(event.time) ?? undefined),
      },
      {
        name: 'type',
        type: FieldType.string,
        values: events.map((event) => event.type),
      },
      {
        name: 'commit',
        type: FieldType.string,
        values: events.map((event) => event.data.commit),
      },
      {
        name: 'repository',
        type: FieldType.string,
        values: events.map((event) => event.data.finding.repository ?? ''),
      },
      {
        name: 'branch',
        type: FieldType.string,
        values: events.map((event) => event.data.finding.branch ?? ''),
      },
      {
        name: 'finding_id',
        type: FieldType.string,
        values: events.map((event) => event.data.finding.id ?? ''),
      },
      {
        name: 'finding_secretType',
        type: FieldType.string,
        values: events.map((event) => event.data.finding.secretType ?? ''),
      },
      {
        name: 'finding_filePath',
        type: FieldType.string,
        values: events.map((event) => event.data.finding.filePath ?? ''),
      },
      {
        name: 'finding_author',
        type: FieldType.string,
        values: events.map((event) => event.data.finding.author ?? ''),
      },
      {
        name: 'finding_commit',
        type: FieldType.string,
        values: events.map((event) => event.data.finding.commit ?? ''),
      },
      {
        name: 'finding_ruleId',
        type: FieldType.string,
        values: events.map((event) => event.data.finding.ruleId ?? ''),
      },
      {
        name: 'finding_entropy',
        type: FieldType.number,
        values: events.map((event) => event.data.finding.entropy ?? ''),
      },
      {
        name: 'finding_isBranchHead',
        type: FieldType.boolean,
        values: events.map((event) => event.data.finding.isBranchHead ?? ''),
      },
      {
        name: 'finding_isAllowlisted',
        type: FieldType.boolean,
        values: events.map((event) => event.data.finding.isAllowlisted ?? ''),
      },
    ],
  });
};
