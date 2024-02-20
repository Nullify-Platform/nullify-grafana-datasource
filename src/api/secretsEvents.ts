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
  branch?: string;
  githubRepositoryId?: string;
  fromTime?: string; // ISO string
  fromEvent?: string;
  numItems?: number; //max 100
  sort?: string; // asc | desc
}

export const processSecretsEvents = async (
  queryOptions: SecretsEventsQueryOptions,
  range: TimeRange,
  request_fn: (endpoint_path: string, params?: Record<string, any>) => Promise<FetchResponse<any>>
): Promise<DataFrame> => {
  let events: SecretsEventsEvent[] = [];
  let prevEventId = null;
  for (let i = 0; i < MAX_API_REQUESTS; ++i) {
    const params: any = {
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

    const response = await request_fn('secrets/events', params);

    const parseResult = SecretsEventsApiResponseSchema.safeParse(response.data);
    if (!parseResult.success) {
      console.error('Error in data from secrets event API', parseResult.error);
      console.log('Secrets event request:', params);
      console.log('Secrets event response:', response);
      throw new Error(`Data from the API is misformed. See console log for more details.`);
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

  let ids: string[] = [];
  let types: string[] = [];
  let branchs: string[] = [];
  let commits: string[] = [];
  let repository_names: string[] = [];
  let repository_ids: number[] = [];
  let finding_ids: string[] = [];
  let finding_secretTypes: string[] = [];
  let finding_filePaths: string[] = [];
  let finding_authors: string[] = [];
  let finding_commits: string[] = [];
  let finding_timeStamps: Date[] = [];
  let finding_ruleIds: string[] = [];
  let finding_entropys: number[] = [];
  let finding_isBranchHeads: Array<boolean | undefined> = [];
  let finding_firstCommitTimestamps: Date[] = [];
  let finding_isAllowlisteds: Array<boolean | undefined> = [];

  for (const event of events) {
    let findings =
      event.type === 'new-finding' || event.type === 'new-allowlisted-finding'
        ? [event.data.finding]
        : event.data.findings ?? [];

    for (const finding of findings) {
      ids.push(event.id);
      types.push(event.type);
      branchs.push(event.data.branch);
      commits.push(event.data.commit);
      repository_names.push(event.data.provider.github?.repositoryName ?? '');
      repository_ids.push(event.data.provider.github?.repositoryId ?? -1);
      finding_ids.push(finding.id);
      finding_secretTypes.push(finding.secretType);
      finding_filePaths.push(finding.filePath);
      finding_authors.push(finding.author);
      finding_commits.push(finding.commit);
      finding_timeStamps.push(new Date(finding.timeStamp));
      finding_ruleIds.push(finding.ruleId);
      finding_entropys.push(finding.entropy);
      finding_isBranchHeads.push(finding.isBranchHead);
      finding_firstCommitTimestamps.push(new Date(finding.firstCommitTimestamp));
      finding_isAllowlisteds.push(finding.isAllowlisted);
    }
  }

  return createDataFrame({
    refId: queryOptions.refId,
    fields: [
      { name: 'id', type: FieldType.string, values: ids },
      { name: 'type', type: FieldType.string, values: types },
      { name: 'branch', type: FieldType.string, values: branchs },
      { name: 'commit', type: FieldType.string, values: commits },
      { name: 'repository_name', type: FieldType.string, values: repository_names },
      { name: 'repository_id', type: FieldType.number, values: repository_ids },
      { name: 'finding_id', type: FieldType.string, values: finding_ids },
      { name: 'finding_secretType', type: FieldType.string, values: finding_secretTypes },
      { name: 'finding_filePath', type: FieldType.string, values: finding_filePaths },
      { name: 'finding_author', type: FieldType.string, values: finding_authors },
      { name: 'finding_commit', type: FieldType.string, values: finding_commits },
      { name: 'finding_timeStamp', type: FieldType.time, values: finding_timeStamps },
      { name: 'finding_ruleId', type: FieldType.string, values: finding_ruleIds },
      { name: 'finding_entropy', type: FieldType.number, values: finding_entropys },
      { name: 'finding_isBranchHead', type: FieldType.boolean, values: finding_isBranchHeads },
      { name: 'finding_firstCommitTimestamp', type: FieldType.time, values: finding_firstCommitTimestamps },
      { name: 'finding_isAllowlisted', type: FieldType.boolean, values: finding_isAllowlisteds },
    ],
  });
};
