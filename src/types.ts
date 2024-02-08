import { DataSourceJsonData } from '@grafana/data';
import { DataQuery } from '@grafana/schema';

/**
 * These are options configured for each DataSource instance
 */
export interface NullifyDataSourceOptions extends DataSourceJsonData {
  apiHostUrl: string;
  githubOwnerId: number;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface NullifySecureJsonData {
  apiKey?: string;
}

export type NullifyEndpointPaths =
  | 'sast/summary'
  | 'sast/events'
  | 'sca/summary'
  | 'sca/events'
  | 'secrets/summary'
  | 'secrets/events';

export interface BaseQueryOptions extends DataQuery {
  endpoint: NullifyEndpointPaths;
}

// SAST SUMMARY ENDPOINT
export interface SastSummaryQueryOptions extends BaseQueryOptions {
  endpoint: 'sast/summary';
  queryParameters: SastSummaryQueryParameters;
}

export interface SastSummaryQueryParameters {
  githubRepositoryId?: string;
  severity?: string;
}

// SAST EVENTS ENDPOINT

export interface SastEventsQueryOptions extends BaseQueryOptions {
  endpoint: 'sast/events';
  queryParameters: SastEventsQueryParameters;
}

export interface SastEventsQueryParameters {
  githubRepositoryId?: string;
  branch?: string;
}

// SCA EVENTS ENDPOINT

export interface ScaSummaryQueryOptions extends BaseQueryOptions {
  endpoint: 'sca/summary';
  queryParameters: {}; // NullifyScaSummaryQueryParameters;
}

export interface ScaEventsQueryOptions extends BaseQueryOptions {
  endpoint: 'sca/events';
  queryParameters: {}; // NullifyScaEventsQueryParameters;
}

export interface SecretsSummaryQueryOptions extends BaseQueryOptions {
  endpoint: 'secrets/summary';
  queryParameters: {}; // NullifySecretsSummaryQueryParameters;
}

export interface SecretsEventsQueryOptions extends BaseQueryOptions {
  endpoint: 'secrets/events';
  queryParameters: {}; // NullifySecretsEventsQueryParameters;
}

export type NullifyQueryOptions =
  | SastSummaryQueryOptions
  | SastEventsQueryOptions
  | ScaSummaryQueryOptions
  | ScaEventsQueryOptions
  | SecretsSummaryQueryOptions
  | SecretsEventsQueryOptions;

// export const NullifyDefaultQuery: Partial<NullifyQueryOptions> = {
// };
