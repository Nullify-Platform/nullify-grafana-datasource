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

export enum VariableQueryType {
  Repository = 'Repository',
}

export interface NullifyVariableQuery {
  queryType: VariableQueryType;
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
  githubRepositoryIdsOrQueries?: Array<number | string>;
  severity?: string;
}

// SAST EVENTS ENDPOINT

export interface SastEventsQueryOptions extends BaseQueryOptions {
  endpoint: 'sast/events';
  queryParameters: SastEventsQueryParameters;
}

export interface SastEventsQueryParameters {
  githubRepositoryIdsOrQueries?: Array<number | string>;
  branch?: string;
  eventTypes?: string[];
}

// SCA SUMMARY ENDPOINT

export interface ScaSummaryQueryOptions extends BaseQueryOptions {
  endpoint: 'sca/summary';
  queryParameters: ScaSummaryQueryParameters;
}

export interface ScaSummaryQueryParameters {
  githubRepositoryIdsOrQueries?: Array<number | string>;
  package?: string;
}

// SCA EVENTS ENDPOINT

export interface ScaEventsQueryOptions extends BaseQueryOptions {
  endpoint: 'sca/events';
  queryParameters: ScaEventsQueryParameters;
}

export interface ScaEventsQueryParameters {
  githubRepositoryIdsOrQueries?: Array<number | string>;
  branch?: string;
  eventTypes?: string[];
}

// SECRETS SUMMARY ENDPOINT

export interface SecretsSummaryQueryOptions extends BaseQueryOptions {
  endpoint: 'secrets/summary';
  queryParameters: SecretsSummaryQueryParameters;
}

export interface SecretsSummaryQueryParameters {
  githubRepositoryIdsOrQueries?: Array<number | string>;
  branch?: string;
  secretType?: string;
  isAllowlisted?: boolean;
}

// SECRETS EVENTS ENDPOINT

export interface SecretsEventsQueryOptions extends BaseQueryOptions {
  endpoint: 'secrets/events';
  queryParameters: SecretsEventsQueryParameters;
}

export interface SecretsEventsQueryParameters {
  githubRepositoryIdsOrQueries?: Array<number | string>;
  branch?: string;
  eventTypes?: string[];
}

export type NullifyQueryOptions =
  | SastSummaryQueryOptions
  | SastEventsQueryOptions
  | ScaSummaryQueryOptions
  | ScaEventsQueryOptions
  | SecretsSummaryQueryOptions
  | SecretsEventsQueryOptions;
