import { DataFrame, FieldType, TimeRange, createDataFrame } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { SastEventsQueryOptions } from 'types';

const MAX_API_REQUESTS = 10;

interface SastEventsApiResponse {
  events: SastEventsEvent[];
  numItems: number;
  nextEventId: string;
}

interface SastEventsEvent {
  id: string;
  time: string;
  timestampUnix: number;
  type: SastEventType;
  data: SastEventsData;
}

interface SastEventsData {
  id: string;
  provider: SastEventsProvider;
  branch: string;
  commitHash: string;
  numFindings: number;
  numCritical: number;
  numHigh: number;
  numMedium: number;
  numLow: number;
  numUnknown: number;
}

interface SastEventsProvider {
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
  bitbucket: any;
}

type SastEventType =
  | 'new-branch-summary'
  | 'new-finding'
  | 'new-findings'
  | 'new-fix'
  | 'new-fixes'
  | 'new-allowlisted-finding'
  | 'new-allowlisted-findings'
  | 'new-unallowlisted-finding'
  | 'new-unallowlisted-findings'
  | 'new-pull-request-finding'
  | 'new-pull-request-findings'
  | 'new-pull-request-fix'
  | 'new-pull-request-fixes'
  | 'new-pull-request-allowlisted-finding'
  | 'new-pull-request-allowlisted-findings'
  | 'new-pull-request-unallowlisted-finding'
  | 'new-pull-request-unallowlisted-findings';

interface SastEventsApiRequest {
  githubRepositoryId?: string;
  branch?: string;
  fromTime?: string; // ISO string
  fromEvent?: string;
  numItems?: number; //max 100
  sort?: string; // asc | desc
  eventTypes?: string; //comma separated types
}

export const processSastEvents = async (
  queryOptions: SastEventsQueryOptions,
  range: TimeRange,
  request_fn: (endpoint_path: string, params?: Record<string, any>) => Promise<FetchResponse<SastEventsApiResponse>>
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
    const datapoints: SastEventsApiResponse = response.data as unknown as SastEventsApiResponse;
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
    } else if (response.data.events[0].timestampUnix > range.to.unix()) {
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
        values: events.map((event) => new Date(event.timestampUnix * 1000)),
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
