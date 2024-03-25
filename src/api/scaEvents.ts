import { z } from 'zod';
import { DataFrame, FieldType, TimeRange, createDataFrame } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { ScaEventType, ScaEventsQueryOptions } from 'types';
import { ScaEventsDependencyFinding } from './scaCommon';
import { unwrapOwnerTemplateVariables, unwrapRepositoryTemplateVariables } from 'utils/utils';

const MAX_API_REQUESTS = 10;

const _BaseEventSchema = z.object({
  id: z.string(),
  time: z.string(),
  timestampUnix: z.number(),
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

const scaEventSchemaMap = {
  [ScaEventType.NewBranchSummary]: _BaseEventSchema.extend({
    type: z.literal(ScaEventType.NewBranchSummary),
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
  [ScaEventType.NewFinding]: _BaseEventSchema.extend({
    type: z.literal(ScaEventType.NewFinding),
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
  [ScaEventType.NewFindings]: _BaseEventSchema.extend({
    type: z.literal(ScaEventType.NewFindings),
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
  [ScaEventType.NewAllowlistedFinding]: _BaseEventSchema.extend({
    type: z.literal(ScaEventType.NewAllowlistedFinding),
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
  [ScaEventType.NewAllowlistedFindings]: _BaseEventSchema.extend({
    type: z.literal(ScaEventType.NewAllowlistedFindings),
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
  [ScaEventType.NewFix]: _BaseEventSchema.extend({
    type: z.literal(ScaEventType.NewFix),
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
  [ScaEventType.NewFixes]: _BaseEventSchema.extend({
    type: z.literal(ScaEventType.NewFixes),
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
  [ScaEventType.NewPullRequestFinding]: _BaseEventSchema.extend({
    type: z.literal(ScaEventType.NewPullRequestFinding),
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
  [ScaEventType.NewPullRequestFindings]: _BaseEventSchema.extend({
    type: z.literal(ScaEventType.NewPullRequestFindings),
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
  [ScaEventType.NewPullRequestFix]: _BaseEventSchema.extend({
    type: z.literal(ScaEventType.NewPullRequestFix),
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
  [ScaEventType.NewPullRequestFixes]: _BaseEventSchema.extend({
    type: z.literal(ScaEventType.NewPullRequestFixes),
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
  [ScaEventType.BotInteractionPR]: _BaseEventSchema.extend({
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
  [ScaEventType.BotInteractionIssue]: _BaseEventSchema.extend({
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
};

const ScaEventsEventSchema = z.union([z.never(), z.never(), ...Object.values(scaEventSchemaMap)]);

const ScaEventsApiResponseSchema = z.object({
  events: z.array(ScaEventsEventSchema).nullable(),
  numItems: z.number(),
  nextEventId: z.string(),
});

type ScaEventsEvent = z.infer<typeof ScaEventsEventSchema>;

interface ScaEventsApiRequest {
  githubRepositoryId?: number[];
  fileOwnerName?: string[];
  branch?: string;
  eventType?: string[];
  fromTime?: string; // ISO string
  fromEvent?: string;
  numItems?: number; //max 100
  sort?: 'asc' | 'desc';
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
        : { eventType: Object.values(ScaEventType) }),
      ...(prevEventId ? { fromEvent: prevEventId } : { fromTime: range.from.toISOString() }),
      sort: 'desc',
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
          event.type === ScaEventType.NewBranchSummary ? event.data.numCritical : undefined
        ),
      },
      {
        name: 'numHigh',
        type: FieldType.number,
        values: events.map((event) => (event.type === ScaEventType.NewBranchSummary ? event.data.numHigh : undefined)),
      },
      {
        name: 'numMedium',
        type: FieldType.number,
        values: events.map((event) =>
          event.type === ScaEventType.NewBranchSummary ? event.data.numMedium : undefined
        ),
      },
      {
        name: 'numLow',
        type: FieldType.number,
        values: events.map((event) => (event.type === ScaEventType.NewBranchSummary ? event.data.numLow : undefined)),
      },
      {
        name: 'numUnknown',
        type: FieldType.number,
        values: events.map((event) =>
          event.type === ScaEventType.NewBranchSummary ? event.data.numUnknown : undefined
        ),
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
