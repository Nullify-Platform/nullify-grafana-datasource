import { z } from 'zod';
import { DataFrame, FieldType, TimeRange, createDataFrame } from '@grafana/data';
import { FetchResponse, isFetchError } from '@grafana/runtime';
import { SastEventType, SastEventsQueryOptions } from 'types';
import { SastFinding } from './sastCommon';
import { unwrapOwnerTemplateVariables, unwrapRepositoryTemplateVariables } from 'utils/utils';

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

const sastEventSchemaMap = {
  [SastEventType.NewBranchSummary]: _BaseEventSchema.extend({
    type: z.literal(SastEventType.NewBranchSummary),
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
  [SastEventType.NewFinding]: _BaseEventSchema.extend({
    type: z.literal(SastEventType.NewFinding),
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
  [SastEventType.NewFindings]: _BaseEventSchema.extend({
    type: z.literal(SastEventType.NewFindings),
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
  [SastEventType.NewFix]: _BaseEventSchema.extend({
    type: z.literal(SastEventType.NewFix),
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
  [SastEventType.NewFixes]: _BaseEventSchema.extend({
    type: z.literal(SastEventType.NewFixes),
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
  [SastEventType.NewAllowlistedFinding]: _BaseEventSchema.extend({
    type: z.literal(SastEventType.NewAllowlistedFinding),
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
  [SastEventType.NewAllowlistedFindings]: _BaseEventSchema.extend({
    type: z.literal(SastEventType.NewAllowlistedFindings),
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
  [SastEventType.NewUnallowlistedFinding]: _BaseEventSchema.extend({
    type: z.literal(SastEventType.NewUnallowlistedFinding),
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
  [SastEventType.NewUnallowlistedFindings]: _BaseEventSchema.extend({
    type: z.literal(SastEventType.NewUnallowlistedFindings),
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
  [SastEventType.NewPullRequestFinding]: _BaseEventSchema.extend({
    type: z.literal(SastEventType.NewPullRequestFinding),
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
  [SastEventType.NewPullRequestFindings]: _BaseEventSchema.extend({
    type: z.literal(SastEventType.NewPullRequestFindings),
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
  [SastEventType.NewPullRequestFix]: _BaseEventSchema.extend({
    type: z.literal(SastEventType.NewPullRequestFix),
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
  [SastEventType.NewPullRequestFixes]: _BaseEventSchema.extend({
    type: z.literal(SastEventType.NewPullRequestFixes),
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
  [SastEventType.NewPullRequestAllowlistedFinding]: _BaseEventSchema.extend({
    type: z.literal(SastEventType.NewPullRequestAllowlistedFinding),
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
  [SastEventType.NewPullRequestAllowlistedFindings]: _BaseEventSchema.extend({
    type: z.literal(SastEventType.NewPullRequestAllowlistedFindings),
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
  [SastEventType.NewPullRequestUnallowlistedFinding]: _BaseEventSchema.extend({
    type: z.literal(SastEventType.NewPullRequestUnallowlistedFinding),
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
  [SastEventType.NewPullRequestUnallowlistedFindings]: _BaseEventSchema.extend({
    type: z.literal(SastEventType.NewPullRequestUnallowlistedFindings),
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
};

const SastEventsEventSchema = z.union([z.never(), z.never(), ...Object.values(sastEventSchemaMap)]);

const SastEventsApiResponseSchema = z.object({
  events: z.array(SastEventsEventSchema).nullable(),
  numItems: z.number(),
  nextEventId: z.string(),
});

type SastEventsEvent = z.infer<typeof SastEventsEventSchema>;

interface SastEventsApiRequest {
  githubRepositoryId?: number[];
  fileOwnerName?: string[];
  branch?: string;
  eventType?: string[];
  fromTime?: string; // ISO string
  fromEvent?: string;
  numItems?: number; //max 100
  sort?: 'asc' | 'desc';
}

export const processSastEvents = async (
  queryOptions: SastEventsQueryOptions,
  range: TimeRange,
  request_fn: (endpoint_path: string, params?: Record<string, any>) => Promise<FetchResponse<any>>
): Promise<DataFrame> => {
  let events: SastEventsEvent[] = [];
  let prevEventId = null;
  for (let i = 0; i < MAX_API_REQUESTS; ++i) {
    const params: SastEventsApiRequest = {
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
        : { eventType: Object.values(SastEventType) }),
      ...(prevEventId ? { fromEvent: prevEventId } : { fromTime: range.from.toISOString() }),
      sort: 'desc',
    };
    const endpointPath = 'sast/events';
    console.log(`[${endpointPath}] starting request with params:`, params);
    const response: any = await request_fn(endpointPath, params);

    const parseResult = SastEventsApiResponseSchema.safeParse(response.data);
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
      {
        name: 'id',
        type: FieldType.string,
        values: events.map((event) => event.id),
      },
      {
        name: 'time',
        type: FieldType.time,
        values: events.map((event) => new Date(event.timestampUnix * 1000)),
      },
      {
        name: 'type',
        type: FieldType.string,
        values: events.map((event) => event.type),
      },
      {
        name: 'numCritical',
        type: FieldType.number,
        values: events.map((event) =>
          event.type === SastEventType.NewBranchSummary ? event.data.numCritical : undefined
        ),
      },
      {
        name: 'numHigh',
        type: FieldType.number,
        values: events.map((event) => (event.type === SastEventType.NewBranchSummary ? event.data.numHigh : undefined)),
      },
      {
        name: 'numMedium',
        type: FieldType.number,
        values: events.map((event) =>
          event.type === SastEventType.NewBranchSummary ? event.data.numMedium : undefined
        ),
      },
      {
        name: 'numLow',
        type: FieldType.number,
        values: events.map((event) => (event.type === SastEventType.NewBranchSummary ? event.data.numLow : undefined)),
      },
      {
        name: 'numUnknown',
        type: FieldType.number,
        values: events.map((event) =>
          event.type === SastEventType.NewBranchSummary ? event.data.numUnknown : undefined
        ),
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
