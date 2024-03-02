import { z } from 'zod';
import { DataFrame, FieldType, TimeRange, createDataFrame } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { SecretsEventsQueryOptions } from 'types';
import { SecretsScannerFindingEvent } from './secretsCommon';

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

const SecretsEventsEventSchema = z.union([
  _BaseEventSchema.extend({
    type: z.literal('new-finding'),
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
  _BaseEventSchema.extend({
    type: z.literal('new-findings'),
    data: z.object({
      id: z.string(),
      part: z.number().optional(),
      branch: z.string(),
      commit: z.string(),
      cloneUrl: z.string(),
      provider: SecretsEventsGitProvider,
      findings: z.array(SecretsScannerFindingEvent).nullable(),
      userId: z.string(),
    }),
  }),
  _BaseEventSchema.extend({
    type: z.literal('new-allowlisted-finding'),
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
  _BaseEventSchema.extend({
    type: z.literal('new-allowlisted-findings'),
    data: z.object({
      id: z.string(),
      part: z.number().optional(),
      branch: z.string(),
      commit: z.string(),
      cloneUrl: z.string(),
      provider: SecretsEventsGitProvider,
      findings: z.array(SecretsScannerFindingEvent).nullable(),
      userId: z.string(),
    }),
  }),
]);

const SecretsEventsApiResponseSchema = z.object({
  events: z.array(SecretsEventsEventSchema).nullable().nullable(),
  numItems: z.number(),
  nextEventId: z.string(),
});

type SecretsEventsEvent = z.infer<typeof SecretsEventsEventSchema>;

interface SecretsEventsApiRequest {
  githubRepositoryId?: number[];
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
      ...(queryOptions.queryParameters.githubRepositoryIds
        ? { githubRepositoryId: queryOptions.queryParameters.githubRepositoryIds }
        : {}),
      ...(queryOptions.queryParameters.branch ? { branch: queryOptions.queryParameters.branch } : {}),
      ...(queryOptions.queryParameters.eventTypes && queryOptions.queryParameters.eventTypes.length > 0
        ? { eventType: queryOptions.queryParameters.eventTypes }
        : {}),
      ...(prevEventId ? { fromEvent: prevEventId } : { fromTime: range.from.toISOString() }),
      sort: 'asc',
    };
    const endpointPath = 'secrets/events';
    console.log(`[${endpointPath}] starting request with params:`, params);
    const response = await request_fn(endpointPath, params);

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
    // console.log('Secrets events', events);
    if (!parseResult.data.events || parseResult.data.events.length === 0 || !parseResult.data.nextEventId) {
      // No more events
      break;
    } else if (parseResult.data.events[0].timestampUnix > range.to.unix()) {
      // No more events required
      break;
    } else {
      prevEventId = parseResult.data.nextEventId;
    }
  }

  const getFindings = (event: SecretsEventsEvent) =>
    event.type === 'new-finding' || event.type === 'new-allowlisted-finding'
      ? [event.data.finding]
      : event.data.findings ?? [];

  return createDataFrame({
    refId: queryOptions.refId,
    fields: [
      {
        name: 'id',
        type: FieldType.string,
        values: events.map((event) => event.id),
      },
      {
        name: 'type',
        type: FieldType.string,
        values: events.map((event) => event.type),
      },
      {
        name: 'branch',
        type: FieldType.string,
        values: events.map((event) => event.data.branch),
      },
      {
        name: 'commit',
        type: FieldType.string,
        values: events.map((event) => event.data.commit),
      },
      {
        name: 'repository_name',
        type: FieldType.string,
        values: events.map((event) => event.data.provider.github?.repositoryName ?? ''),
      },
      {
        name: 'repository_id',
        type: FieldType.number,
        values: events.map((event) => event.data.provider.github?.repositoryId ?? -1),
      },
      {
        name: 'finding_id',
        type: FieldType.string,
        values: events.flatMap((event) => getFindings(event).map((finding) => finding.id) ?? []),
      },
      {
        name: 'finding_secretType',
        type: FieldType.string,
        values: events.flatMap((event) => getFindings(event).map((finding) => finding.secretType) ?? []),
      },
      {
        name: 'finding_filePath',
        type: FieldType.string,
        values: events.flatMap((event) => getFindings(event).map((finding) => finding.filePath) ?? []),
      },
      {
        name: 'finding_author',
        type: FieldType.string,
        values: events.flatMap((event) => getFindings(event).map((finding) => finding.author) ?? []),
      },
      {
        name: 'finding_commit',
        type: FieldType.string,
        values: events.flatMap((event) => getFindings(event).map((finding) => finding.commit) ?? []),
      },
      {
        name: 'finding_timeStamp',
        type: FieldType.time,
        values: events.flatMap((event) => getFindings(event).map((finding) => new Date(finding.timeStamp)) ?? []),
      },
      {
        name: 'finding_ruleId',
        type: FieldType.string,
        values: events.flatMap((event) => getFindings(event).map((finding) => finding.ruleId) ?? []),
      },
      {
        name: 'finding_entropy',
        type: FieldType.number,
        values: events.flatMap((event) => getFindings(event).map((finding) => finding.entropy) ?? []),
      },
      {
        name: 'finding_isBranchHead',
        type: FieldType.boolean,
        values: events.flatMap((event) => getFindings(event).map((finding) => finding.isBranchHead) ?? []),
      },
      {
        name: 'finding_firstCommitTimestamp',
        type: FieldType.time,
        values: events.flatMap(
          (event) => getFindings(event).map((finding) => new Date(finding.firstCommitTimestamp)) ?? []
        ),
      },
      {
        name: 'finding_isAllowlisted',
        type: FieldType.boolean,
        values: events.flatMap((event) => getFindings(event).map((finding) => finding.isAllowlisted) ?? []),
      },
    ],
  });
};
