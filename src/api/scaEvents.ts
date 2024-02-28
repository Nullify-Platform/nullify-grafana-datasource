import { z } from 'zod';
import { DataFrame, FieldType, TimeRange, createDataFrame } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { ScaEventsQueryOptions } from 'types';
import { ScaEventsDependencyFinding } from './scaCommon';

const MAX_API_REQUESTS = 10;

const _BaseEventSchema = z.object({
  id: z.string(),
  time: z.string(),
  timeUnix: z.number(),
});

const ScaEventsGitProvider = z.object({
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

const ScaEventsEventSchema = z.union([
  _BaseEventSchema.extend({
    type: z.literal('new-branch-summary'),
    data: z.object({
      id: z.string(),
      provider: ScaEventsGitProvider,
      branch: z.string(),
      commit: z.string(),
      numFindings: z.number(),
      numVulnerabilities: z.number(),
      numCritical: z.number(),
      numHigh: z.number(),
      numMedium: z.number(),
      numLow: z.number(),
      numUnknown: z.number(),
    }),
  }),
  _BaseEventSchema.extend({
    type: z.literal('new-finding'),
    data: z.object({
      id: z.string(),
      branch: z.string(),
      commit: z.string(),
      cloneUrl: z.string(),
      provider: ScaEventsGitProvider,
      finding: ScaEventsDependencyFinding,
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
      provider: ScaEventsGitProvider,
      findings: z.array(ScaEventsDependencyFinding).nullable(),
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
      provider: ScaEventsGitProvider,
      finding: ScaEventsDependencyFinding,
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
      provider: ScaEventsGitProvider,
      findings: z.array(ScaEventsDependencyFinding).nullable(),
      userId: z.string(),
    }),
  }),
  _BaseEventSchema.extend({
    type: z.literal('new-fix'),
    data: z.object({
      id: z.string(),
      branch: z.string(),
      commit: z.string(),
      cloneUrl: z.string(),
      provider: ScaEventsGitProvider,
      finding: ScaEventsDependencyFinding,
      userId: z.string(),
    }),
  }),
  _BaseEventSchema.extend({
    type: z.literal('new-fixes'),
    data: z.object({
      id: z.string(),
      part: z.number().optional(),
      branch: z.string(),
      commit: z.string(),
      cloneUrl: z.string(),
      provider: ScaEventsGitProvider,
      findings: z.array(ScaEventsDependencyFinding).nullable(),
      userId: z.string(),
    }),
  }),
  _BaseEventSchema.extend({
    type: z.literal('new-pull-request-finding'),
    data: z.object({
      id: z.string(),
      provider: ScaEventsGitProvider,
      pullRequestId: z.string(),
      branch: z.string(),
      commit: z.string(),
      cloneUrl: z.string(),
      finding: ScaEventsDependencyFinding,
      userId: z.string(),
    }),
  }),
  _BaseEventSchema.extend({
    type: z.literal('new-pull-request-findings'),
    data: z.object({
      id: z.string(),
      provider: ScaEventsGitProvider,
      pullRequestId: z.string(),
      branch: z.string(),
      commit: z.string(),
      cloneUrl: z.string(),
      findings: z.array(ScaEventsDependencyFinding).nullable(),
      userId: z.string(),
    }),
  }),
  _BaseEventSchema.extend({
    type: z.literal('new-pull-request-fix'),
    data: z.object({
      id: z.string(),
      branch: z.string(),
      commit: z.string(),
      cloneUrl: z.string(),
      provider: ScaEventsGitProvider,
      finding: ScaEventsDependencyFinding,
      userId: z.string(),
    }),
  }),
  _BaseEventSchema.extend({
    type: z.literal('new-pull-request-fixes'),
    data: z.object({
      id: z.string(),
      branch: z.string(),
      commit: z.string(),
      cloneUrl: z.string(),
      provider: ScaEventsGitProvider,
      findings: z.array(ScaEventsDependencyFinding).nullable(),
      userId: z.string(),
    }),
  }),
  _BaseEventSchema.extend({
    type: z.literal('bot-interaction'), // bot interaction pr
    data: z.object({
      id: z.string(),
      userId: z.string(),
      repositoryId: z.string(),
      pullRequestNumber: z.string(),
      botRequestType: z.string(),
      botRequest: z.string(),
    }),
  }),
  _BaseEventSchema.extend({
    type: z.literal('bot-interaction'), // bot interaction issue
    data: z.object({
      id: z.string(),
      userId: z.string(),
      repositoryId: z.string(),
      issueNumber: z.string(),
      issueTitle: z.string(),
      botRequestType: z.string(),
      botRequest: z.string(),
    }),
  }),
]);

const ScaEventsApiResponseSchema = z.object({
  events: z.array(ScaEventsEventSchema).nullable().nullable(),
  numItems: z.number(),
  nextEventId: z.string(),
});

type ScaEventsEvent = z.infer<typeof ScaEventsEventSchema>;

interface ScaEventsApiRequest {
  branch?: string;
  githubRepositoryIds?: string;
  eventTypes?: string;
  fromTime?: string; // ISO string
  fromEvent?: string;
  numItems?: number; //max 100
  sort?: "asc" | "desc";
}

export const processScaEvents = async (
  queryOptions: ScaEventsQueryOptions,
  range: TimeRange,
  request_fn: (endpoint_path: string, params?: Record<string, any>) => Promise<FetchResponse<any>>
): Promise<DataFrame> => {
  let events: ScaEventsEvent[] = [];
  let prevEventId = null;
  for (let i = 0; i < MAX_API_REQUESTS; ++i) {
    const params: ScaEventsApiRequest = {
      ...(queryOptions.queryParameters.githubRepositoryIds
        ? { githubRepositoryIds: queryOptions.queryParameters.githubRepositoryIds.join(',') }
        : {}),
      ...(queryOptions.queryParameters.branch ? { branch: queryOptions.queryParameters.branch } : {}),
      ...(queryOptions.queryParameters.eventTypes && queryOptions.queryParameters.eventTypes.length > 0
        ? { eventTypes: queryOptions.queryParameters.eventTypes.join(',') }
        : {}),
      ...(prevEventId ? { fromEvent: prevEventId } : { fromTime: range.from.toISOString() }),
      sort: 'asc',
    };
    const endpointPath = 'sca/events';
    console.log(`[${endpointPath}] starting request with params:`, params);
    const response = await request_fn(endpointPath, params);

    const parseResult = ScaEventsApiResponseSchema.safeParse(response.data);
    if (!parseResult.success) {
      throw {
        message: `Data from the API is misformed. Contact Nullify with the data below for help`,
        data: {
          endpoint: endpointPath,
          request_params: params,
          response: response,
          data_validation_error: parseResult.error,
        }
      };
    }

    if (parseResult.data.events) {
      events.push(...parseResult.data.events);
    }
    // console.log('parseResult', parseResult);
    // console.log('events', events);
    if (!parseResult.data.events || parseResult.data.events.length === 0 || !parseResult.data.nextEventId) {
      // No more events
      break;
    } else if (parseResult.data.events[0].timeUnix > range.to.unix()) {
      // No more events required
      break;
    } else {
      prevEventId = parseResult.data.nextEventId;
    }
  }

  return createDataFrame({
    refId: queryOptions.refId,
    fields: [
      { name: 'id', type: FieldType.string, values: events.map((event) => event.id) },
      {
        name: 'time',
        type: FieldType.time,
        values: events.map((event) => new Date(event.timeUnix * 1000)),
      },
      { name: 'type', type: FieldType.string, values: events.map((event) => event.type) },
      {
        name: 'numFindings',
        type: FieldType.number,
        values: events.map((event) => (event.type === 'new-branch-summary' ? event.data.numFindings : undefined)),
      },
      {
        name: 'numCritical',
        type: FieldType.number,
        values: events.map((event) => (event.type === 'new-branch-summary' ? event.data.numCritical : undefined)),
      },
      {
        name: 'numHigh',
        type: FieldType.number,
        values: events.map((event) => (event.type === 'new-branch-summary' ? event.data.numHigh : undefined)),
      },
      {
        name: 'numMedium',
        type: FieldType.number,
        values: events.map((event) => (event.type === 'new-branch-summary' ? event.data.numMedium : undefined)),
      },
      {
        name: 'numLow',
        type: FieldType.number,
        values: events.map((event) => (event.type === 'new-branch-summary' ? event.data.numLow : undefined)),
      },
      {
        name: 'numUnknown',
        type: FieldType.number,
        values: events.map((event) => (event.type === 'new-branch-summary' ? event.data.numUnknown : undefined)),
      },
      {
        name: 'repositoryId',
        type: FieldType.string,
        values: events.map((event) =>
          event.type !== 'bot-interaction' ? event.data.provider.github?.repositoryId : undefined
        ),
      },
      {
        name: 'repositoryName',
        type: FieldType.string,
        values: events.map((event) =>
          event.type !== 'bot-interaction' ? event.data.provider.github?.repositoryName : undefined
        ),
      },
    ],
  });
};
