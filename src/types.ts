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

export enum NullifyVariableQueryType {
  Repository = 'Repository',
  Owner = 'Owner',
}

export interface NullifyVariableQuery {
  queryType: NullifyVariableQueryType;
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
  ownerNamesOrQueries?: string[];
  severity?: string;
}

// SAST EVENTS ENDPOINT

export interface SastEventsQueryOptions extends BaseQueryOptions {
  endpoint: 'sast/events';
  queryParameters: SastEventsQueryParameters;
}

export interface SastEventsQueryParameters {
  githubRepositoryIdsOrQueries?: Array<number | string>;
  ownerNamesOrQueries?: string[];
  branch?: string;
  eventTypes?: string[];
}

export enum SastEventType {
  NewBranchSummary = 'new-branch-summary',
  NewFinding = 'new-finding',
  NewFix = 'new-fix',
  NewAllowlistedFinding = 'new-allowlisted-finding',
  NewUnallowlistedFinding = 'new-unallowlisted-finding',
  NewPullRequestFinding = 'new-pull-request-finding',
  NewPullRequestFix = 'new-pull-request-fix',
  NewPullRequestAllowlistedFinding = 'new-pull-request-allowlisted-finding',
  NewPullRequestUnallowlistedFinding = 'new-pull-request-unallowlisted-finding',
}

export const SastEventTypeDescriptions: Record<SastEventType, string> = {
  [SastEventType.NewBranchSummary]: 'New Branch Summary',
  [SastEventType.NewFinding]: 'New Finding',
  [SastEventType.NewFix]: 'New Fix',
  [SastEventType.NewAllowlistedFinding]: 'New Allowlisted Finding',
  [SastEventType.NewUnallowlistedFinding]: 'New Unallowlisted Finding',
  [SastEventType.NewPullRequestFinding]: 'New Pull Request Finding',
  [SastEventType.NewPullRequestFix]: 'New Pull Request Fix',
  [SastEventType.NewPullRequestAllowlistedFinding]: 'New Pull Request Allowlisted Finding',
  [SastEventType.NewPullRequestUnallowlistedFinding]: 'New Pull Request Unallowlisted Finding',
};

// SCA SUMMARY ENDPOINT

export interface ScaSummaryQueryOptions extends BaseQueryOptions {
  endpoint: 'sca/summary';
  queryParameters: ScaSummaryQueryParameters;
}

export interface ScaSummaryQueryParameters {
  githubRepositoryIdsOrQueries?: Array<number | string>;
  ownerNamesOrQueries?: string[];
  package?: string;
}

// SCA EVENTS ENDPOINT

export interface ScaEventsQueryOptions extends BaseQueryOptions {
  endpoint: 'sca/events';
  queryParameters: ScaEventsQueryParameters;
}

export interface ScaEventsQueryParameters {
  githubRepositoryIdsOrQueries?: Array<number | string>;
  ownerNamesOrQueries?: string[];
  branch?: string;
  eventTypes?: string[];
}

export enum ScaEventType {
  NewBranchSummary = 'new-branch-summary',
  NewFinding = 'new-finding',
  NewAllowlistedFinding = 'new-allowlisted-finding',
  NewFix = 'new-fix',
  NewPullRequestFinding = 'new-pull-request-finding',
  NewPullRequestFix = 'new-pull-request-fix',
}

export const ScaEventTypeDescriptions: Record<ScaEventType, string> = {
  [ScaEventType.NewBranchSummary]: 'New Branch Summary',
  [ScaEventType.NewFinding]: 'New Finding',
  [ScaEventType.NewAllowlistedFinding]: 'New Allowlisted Finding',
  [ScaEventType.NewFix]: 'New Fix',
  [ScaEventType.NewPullRequestFinding]: 'New Pull Request Finding',
  [ScaEventType.NewPullRequestFix]: 'New Pull Request Fix',
};

// SECRETS SUMMARY ENDPOINT

export interface SecretsSummaryQueryOptions extends BaseQueryOptions {
  endpoint: 'secrets/summary';
  queryParameters: SecretsSummaryQueryParameters;
}

export interface SecretsSummaryQueryParameters {
  githubRepositoryIdsOrQueries?: Array<number | string>;
  ownerNamesOrQueries?: string[];
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
  ownerNamesOrQueries?: string[];
  branch?: string;
  eventTypes?: string[];
}

export enum SecretsEventType {
  NewFinding = 'new-finding',
  NewAllowlistedFinding = 'new-allowlisted-finding',
}

export const SecretsEventTypeDescriptions: Record<SecretsEventType, string> = {
  [SecretsEventType.NewFinding]: 'New Finding',
  [SecretsEventType.NewAllowlistedFinding]: 'New Allowlisted Finding',
};

// OWNER ENTITY TYPES

export enum OwnerEntityType {
  Team = 'Team',
  User = 'User',
  Empty = 'No Owners',
  All = 'All Owners',
}

export interface OwnerEntity {
  name: string;
  type: OwnerEntityType;
}

export type NullifyQueryOptions =
  | SastSummaryQueryOptions
  | SastEventsQueryOptions
  | ScaSummaryQueryOptions
  | ScaEventsQueryOptions
  | SecretsSummaryQueryOptions
  | SecretsEventsQueryOptions;
