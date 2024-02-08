import { DataFrame, FieldType, TimeRange, createDataFrame } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { SecretsEventsQueryOptions } from 'types';

const MAX_API_REQUESTS = 10;

interface SecretsEventsApiResponse {
  events: SecretsEventsEvent[];
  numItems: number;
  nextEventId: string;
}

export interface SecretsEventsEvent {
  id: string;
  time: string;
  timestampUnix: number;
  type: SecretsEventType;
  data: SecretsEventData;
}

type SecretsEventType = 'new-finding' | 'new-findings' | 'new-allowlisted-finding' | 'new-allowlisted-findings';

export interface SecretsEventData {
  id: string;
  branch: string;
  commit: string;
  cloneUrl: string;
  provider: {
    id: string;
    github: {
      installationId: number;
      ownerId: number;
      owner: string;
      ownerType: string;
      repositoryName: string;
      repositoryId: number;
      hasIssue: boolean;
    };
    bitbucket: null;
  };
  finding?: SecretsEventFinding;
  userId: string;
  part?: number;
  findings?: SecretsEventFinding[];
}

export interface SecretsEventFinding {
  id: string;
  secretType: string;
  value: string;
  filePath: string;
  author: string;
  commit: string;
  timeStamp: string;
  ruleId: string;
  entropy: number;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  secret: string;
  secretHash: string;
  match: string;
  hyperlink: string;
  isBranchHead: boolean;
  branches: null;
  firstCommitTimestamp: string;
  isAllowlisted: boolean;
}

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
  request_fn: (endpoint_path: string, params?: Record<string, any>) => Promise<FetchResponse<SecretsEventsApiResponse>>
): Promise<DataFrame> => {
  let events: SecretsEventsEvent[] = [];
  let prevEventId = null;
  for (let i = 0; i < MAX_API_REQUESTS; ++i) {
    const params: any = {
      ...(queryOptions.queryParameters.githubRepositoryId
        ? { githubRepositoryId: queryOptions.queryParameters.githubRepositoryId }
        : {}),
      ...(queryOptions.queryParameters.branch ? { severity: queryOptions.queryParameters.branch } : {}),
      ...(prevEventId ? { fromEvent: prevEventId } : { fromTime: range.from.toISOString() }),
      sort: 'asc',
    };
    console.log('secrets event request:', params);
    const response = await request_fn('secrets/events', params);
    const datapoints: SecretsEventsApiResponse = response.data as unknown as SecretsEventsApiResponse;
    if (datapoints === undefined || !('events' in datapoints)) {
      throw new Error('Remote endpoint reponse does not contain "events" property.');
    }
    events.push(...response.data.events);
    console.log('response', response);
    console.log('events', events);
    if (!response.data.events || response.data.events.length === 0 || !response.data.nextEventId) {
      // No more events
      break;
    } else if (response.data.events[0].timestampUnix > range.to.unix()) {
      // No more events required
      break;
    } else {
      prevEventId = response.data.nextEventId;
    }
  }

  let ids: string[] = [];
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
    for (const finding of event.data.findings ?? [event.data.finding]) {
      ids.push(event.id);
      branchs.push(event.data.branch);
      commits.push(event.data.commit);
      repository_names.push(event.data.provider.github.repositoryName);
      repository_ids.push(event.data.provider.github.repositoryId);
      finding_ids.push(finding?.id ?? '');
      finding_secretTypes.push(finding?.secretType ?? '');
      finding_filePaths.push(finding?.filePath ?? '');
      finding_authors.push(finding?.author ?? '');
      finding_commits.push(finding?.commit ?? '');
      finding_timeStamps.push(new Date(finding?.timeStamp ?? 0));
      finding_ruleIds.push(finding?.ruleId ?? '');
      finding_entropys.push(finding?.entropy ?? -1);
      finding_isBranchHeads.push(finding?.isBranchHead);
      finding_firstCommitTimestamps.push(new Date(finding?.firstCommitTimestamp ?? 0));
      finding_isAllowlisteds.push(finding?.isAllowlisted);
    }
  }

  return createDataFrame({
    refId: queryOptions.refId,
    fields: [
      { name: 'id', type: FieldType.string, values: ids },
      { name: 'branch', type: FieldType.string, values: branchs },
      { name: 'commit', type: FieldType.string, values: commits },
      { name: 'repository_name', type: FieldType.string, values: repository_names },
      { name: 'repository_id', type: FieldType.number, values: repository_ids },
      { name: 'finding_id', type: FieldType.string, values: finding_ids },
      { name: 'finding_secretType', type: FieldType.string, values: finding_secretTypes },
      { name: 'finding_filePath', type: FieldType.string, values: finding_filePaths },
      { name: 'finding_author', type: FieldType.string, values: finding_authors },
      { name: 'finding_commit', type: FieldType.string, values: finding_commits },
      { name: 'finding_timeStamp', type: FieldType.string, values: finding_timeStamps },
      { name: 'finding_ruleId', type: FieldType.string, values: finding_ruleIds },
      { name: 'finding_entropy', type: FieldType.number, values: finding_entropys },
      { name: 'finding_isBranchHead', type: FieldType.boolean, values: finding_isBranchHeads },
      { name: 'finding_firstCommitTimestamp', type: FieldType.time, values: finding_firstCommitTimestamps },
      { name: 'finding_isAllowlisted', type: FieldType.boolean, values: finding_isAllowlisteds },
    ],
  });
};
