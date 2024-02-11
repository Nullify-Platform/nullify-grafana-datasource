import { DataFrame, FieldType, TimeRange, createDataFrame } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { ScaEventsQueryOptions } from 'types';

const MAX_API_REQUESTS = 10;

interface ScaEventsApiResponse {
  events: ScaEventsEvent[];
  numItems: number;
  nextEventId: string;
}

interface ScaEventsEvent {
  id: string;
  time: string;
  timeUnix: number;
  type: ScaEventType;
  data: ScaEventsData;
}

interface ScaEventsData {
  id: string;
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
  };
  pullRequestId?: string;
  branch: string;
  commit: string;
  cloneUrl?: string;
  finding?: ScaEventsFinding;
  userId?: string;
  findings?: ScaEventsFinding[];
  numFindings?: number;
  numVulnerabilities?: number;
  numCritical?: number;
  numHigh?: number;
  numMedium?: number;
  numLow?: number;
  numUnknown?: number;
}

interface ScaEventsFinding {
  id: string;
  isDirect?: boolean;
  package: string;
  packageFilePath: string;
  version: string;
  filePath: string;
  line?: number;
  numHigh?: number;
  vulnerabilities: ScaEventsVulnerability[];
  numMedium?: number;
  numCritical?: number;
  numLow?: number;
  numUnknown?: number;
}

export interface ScaEventsVulnerability {
  hasFix?: boolean;
  title: string;
  details?: string;
  severity: string;
  introduced: string;
  fixed: string;
  references?: string[];
  cwes?: string[];
  cves?: Array<{
    id: string;
    epss?: number;
    epssPercentile?: number;
    priority: string;
  }>;
}

type ScaEventType =
  | 'new-branch-summary'
  | 'new-finding'
  | 'new-findings'
  | 'new-fix'
  | 'new-fixes'
  | 'new-allowlisted-finding'
  | 'new-allowlisted-findings'
  | 'new-pull-request-finding'
  | 'new-pull-request-findings'
  | 'new-pull-request-fix'
  | 'new-pull-request-fixes';

interface ScaEventsApiRequest {
  branch?: string;
  githubRepositoryId?: string;
  fromTime?: string; // ISO string
  fromEvent?: string;
  numItems?: number; //max 100
  sort?: string; // asc | desc
}

export const processScaEvents = async (
  queryOptions: ScaEventsQueryOptions,
  range: TimeRange,
  request_fn: (endpoint_path: string, params?: Record<string, any>) => Promise<FetchResponse<ScaEventsApiResponse>>
): Promise<DataFrame> => {
  let events: ScaEventsEvent[] = [];
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
    console.log('sca event request:', params);
    const response = await request_fn('sca/events', params);
    const datapoints: ScaEventsApiResponse = response.data as unknown as ScaEventsApiResponse;
    if (datapoints === undefined || !('events' in datapoints)) {
      throw new Error('Remote endpoint reponse does not contain "events" property.');
    }
    if (response?.data?.events) {
      events.push(...response.data.events);
    }
    console.log('response', response);
    console.log('events', events);
    if (!response.data.events || response.data.events.length === 0 || !response.data.nextEventId) {
      // No more events
      break;
    } else if (response.data.events[0].timeUnix > range.to.unix()) {
      // No more events required
      break;
    } else {
      prevEventId = response.data.nextEventId;
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
      { name: 'numFindings', type: FieldType.number, values: events.map((event) => event.data.numFindings) },
      { name: 'numCritical', type: FieldType.number, values: events.map((event) => event.data.numCritical) },
      { name: 'numHigh', type: FieldType.number, values: events.map((event) => event.data.numHigh) },
      { name: 'numMedium', type: FieldType.number, values: events.map((event) => event.data.numMedium) },
      { name: 'numLow', type: FieldType.number, values: events.map((event) => event.data.numLow) },
      { name: 'numUnknown', type: FieldType.number, values: events.map((event) => event.data.numUnknown) },
      {
        name: 'repositoryId',
        type: FieldType.string,
        values: events.map((event) => event.data.provider.github.repositoryId),
      },
      {
        name: 'repositoryName',
        type: FieldType.string,
        values: events.map((event) => event.data.provider.github.repositoryName),
      },
    ],
  });
};
