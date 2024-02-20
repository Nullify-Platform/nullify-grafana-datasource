import { z } from 'zod';
import { DataFrame, FieldType, TimeRange, createDataFrame } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { SastEventsQueryOptions } from 'types';
import { SastFinding } from './sastCommon';

const MAX_API_REQUESTS = 10;

const _BaseEventSchema = z.object({
  id: z.string(),
  time: z.string(),
  timestampUnix: z.number(),
});

const SastEventsGitProvider = z.object({
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

const SastEventsEventSchema = z.union([
  _BaseEventSchema.extend({
    type: z.literal('new-branch-summary'),
    data: z.object({
      id: z.string(),
      provider: SastEventsGitProvider,
      branch: z.string(),
      commitHash: z.string(),
      numFindings: z.number(),
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
      provider: SastEventsGitProvider,
      finding: SastFinding,
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
      provider: SastEventsGitProvider,
      findings: z.array(SastFinding).nullable(),
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
      provider: SastEventsGitProvider,
      finding: SastFinding,
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
      provider: SastEventsGitProvider,
      findings: z.array(SastFinding).nullable(),
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
      provider: SastEventsGitProvider,
      finding: SastFinding,
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
      provider: SastEventsGitProvider,
      findings: z.array(SastFinding).nullable(),
      userId: z.string(),
    }),
  }),
  _BaseEventSchema.extend({
    type: z.literal('new-unallowlisted-finding'),
    data: z.object({
      id: z.string(),
      branch: z.string(),
      commit: z.string(),
      cloneUrl: z.string(),
      provider: SastEventsGitProvider,
      finding: SastFinding,
      userId: z.string(),
    }),
  }),
  _BaseEventSchema.extend({
    type: z.literal('new-unallowlisted-findings'),
    data: z.object({
      id: z.string(),
      part: z.number().optional(),
      branch: z.string(),
      commit: z.string(),
      cloneUrl: z.string(),
      provider: SastEventsGitProvider,
      findings: z.array(SastFinding).nullable(),
      userId: z.string(),
    }),
  }),
  _BaseEventSchema.extend({
    type: z.literal('new-pull-request-finding'),
    data: z.object({
      id: z.string(),
      provider: SastEventsGitProvider,
      pullRequestId: z.string(),
      branch: z.string(),
      commit: z.string(),
      cloneUrl: z.string(),
      finding: SastFinding,
      userId: z.string(),
    }),
  }),
  _BaseEventSchema.extend({
    type: z.literal('new-pull-request-findings'),
    data: z.object({
      id: z.string(),
      provider: SastEventsGitProvider,
      pullRequestId: z.string(),
      branch: z.string(),
      commit: z.string(),
      cloneUrl: z.string(),
      findings: z.array(SastFinding).nullable(),
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
      provider: SastEventsGitProvider,
      finding: SastFinding,
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
      provider: SastEventsGitProvider,
      findings: z.array(SastFinding).nullable(),
      userId: z.string(),
    }),
  }),
  _BaseEventSchema.extend({
    type: z.literal('new-pull-request-allowlisted-finding'),
    data: z.object({
      id: z.string(),
      branch: z.string(),
      commit: z.string(),
      cloneUrl: z.string(),
      provider: SastEventsGitProvider,
      finding: SastFinding,
      userId: z.string(),
    }),
  }),
  _BaseEventSchema.extend({
    type: z.literal('new-pull-request-allowlisted-findings'),
    data: z.object({
      id: z.string(),
      part: z.number().optional(),
      branch: z.string(),
      commit: z.string(),
      cloneUrl: z.string(),
      provider: SastEventsGitProvider,
      findings: z.array(SastFinding).nullable(),
      userId: z.string(),
    }),
  }),
  _BaseEventSchema.extend({
    type: z.literal('new-pull-request-unallowlisted-finding'),
    data: z.object({
      id: z.string(),
      branch: z.string(),
      commit: z.string(),
      cloneUrl: z.string(),
      provider: SastEventsGitProvider,
      finding: SastFinding,
      userId: z.string(),
    }),
  }),
  _BaseEventSchema.extend({
    type: z.literal('new-pull-request-unallowlisted-findings'),
    data: z.object({
      id: z.string(),
      part: z.number().optional(),
      branch: z.string(),
      commit: z.string(),
      cloneUrl: z.string(),
      provider: SastEventsGitProvider,
      findings: z.array(SastFinding).nullable(),
      userId: z.string(),
    }),
  }),
]);

const SastEventsApiResponseSchema = z.object({
  events: z.array(SastEventsEventSchema).nullable().nullable(),
  numItems: z.number(),
  nextEventId: z.string(),
});

type SastEventsEvent = z.infer<typeof SastEventsEventSchema>;

export const processSastEvents = async (
  queryOptions: SastEventsQueryOptions,
  range: TimeRange,
  request_fn: (endpoint_path: string, params?: Record<string, any>) => Promise<FetchResponse<any>>
): Promise<DataFrame> => {
  let events: SastEventsEvent[] = [];
  let prevEventId = null;
  for (let i = 0; i < MAX_API_REQUESTS; ++i) {
    const params = {
      ...(queryOptions.queryParameters.githubRepositoryId
        ? { githubRepositoryId: queryOptions.queryParameters.githubRepositoryId }
        : {}),
      ...(queryOptions.queryParameters.branch ? { severity: queryOptions.queryParameters.branch } : {}),
      ...(queryOptions.queryParameters.eventTypes && queryOptions.queryParameters.eventTypes.length > 0
        ? { eventTypes: queryOptions.queryParameters.eventTypes.join(',') }
        : {}),
      ...(prevEventId ? { fromEvent: prevEventId } : { fromTime: range.from.toISOString() }),
      sort: 'asc',
    };

    console.log('sast event request:', params);
    const response: any = await request_fn('sast/events', params);
    console.log('sast event response:', response);

    const parseResult = SastEventsApiResponseSchema.safeParse(response.data);
    if (!parseResult.success) {
      throw new Error(`Data from the API is misformed. Error:${parseResult.error}`);
    }

    if (parseResult.data.events) {
      events.push(...parseResult.data.events);
    }
    console.log('parseResult', parseResult);
    console.log('events', events);

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

  return createDataFrame({
    refId: queryOptions.refId,
    fields: [
      { name: 'id', type: FieldType.string, values: events.map((event) => event.id) },
      {
        name: 'time',
        type: FieldType.time,
        values: events.map((event) => new Date(event.timestampUnix * 1000)),
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
        values: events.map((event) => event.data.provider.github?.repositoryId),
      },
      {
        name: 'repositoryName',
        type: FieldType.string,
        values: events.map((event) => event.data.provider.github?.repositoryName),
      },
    ],
  });
};
