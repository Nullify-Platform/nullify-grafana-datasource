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
  NewFindings = 'new-findings',
  NewFix = 'new-fix',
  NewFixes = 'new-fixes',
  NewAllowlistedFinding = 'new-allowlisted-finding',
  NewAllowlistedFindings = 'new-allowlisted-findings',
  NewUnallowlistedFinding = 'new-unallowlisted-finding',
  NewUnallowlistedFindings = 'new-unallowlisted-findings',
  NewPullRequestFinding = 'new-pull-request-finding',
  NewPullRequestFindings = 'new-pull-request-findings',
  NewPullRequestFix = 'new-pull-request-fix',
  NewPullRequestFixes = 'new-pull-request-fixes',
  NewPullRequestAllowlistedFinding = 'new-pull-request-allowlisted-finding',
  NewPullRequestAllowlistedFindings = 'new-pull-request-allowlisted-findings',
  NewPullRequestUnallowlistedFinding = 'new-pull-request-unallowlisted-finding',
  NewPullRequestUnallowlistedFindings = 'new-pull-request-unallowlisted-findings',
}

export const SastEventTypeDescriptions: Record<SastEventType, string> = {
  [SastEventType.NewBranchSummary]: 'New Branch Summary',
  [SastEventType.NewFinding]: 'New Finding',
  [SastEventType.NewFindings]: 'New Findings',
  [SastEventType.NewFix]: 'New Fix',
  [SastEventType.NewFixes]: 'New Fixes',
  [SastEventType.NewAllowlistedFinding]: 'New Allowlisted Finding',
  [SastEventType.NewAllowlistedFindings]: 'New Allowlisted Findings',
  [SastEventType.NewUnallowlistedFinding]: 'New Unallowlisted Finding',
  [SastEventType.NewUnallowlistedFindings]: 'New Unallowlisted Findings',
  [SastEventType.NewPullRequestFinding]: 'New Pull Request Finding',
  [SastEventType.NewPullRequestFindings]: 'New Pull Request Findings',
  [SastEventType.NewPullRequestFix]: 'New Pull Request Fix',
  [SastEventType.NewPullRequestFixes]: 'New Pull Request Fixes',
  [SastEventType.NewPullRequestAllowlistedFinding]: 'New Pull Request Allowlisted Finding',
  [SastEventType.NewPullRequestAllowlistedFindings]: 'New Pull Request Allowlisted Findings',
  [SastEventType.NewPullRequestUnallowlistedFinding]: 'New Pull Request Unallowlisted Finding',
  [SastEventType.NewPullRequestUnallowlistedFindings]: 'New Pull Request Unallowlisted Findings',
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
  NewFindings = 'new-findings',
  NewAllowlistedFinding = 'new-allowlisted-finding',
  NewAllowlistedFindings = 'new-allowlisted-findings',
  NewFix = 'new-fix',
  NewFixes = 'new-fixes',
  NewPullRequestFinding = 'new-pull-request-finding',
  NewPullRequestFindings = 'new-pull-request-findings',
  NewPullRequestFix = 'new-pull-request-fix',
  NewPullRequestFixes = 'new-pull-request-fixes',
  BotInteractionPR = 'bot-interaction-pr',
  BotInteractionIssue = 'bot-interaction-issue',
}

export const ScaEventTypeDescriptions: Record<ScaEventType, string> = {
  [ScaEventType.NewBranchSummary]: 'New Branch Summary',
  [ScaEventType.NewFinding]: 'New Finding',
  [ScaEventType.NewFindings]: 'New Findings',
  [ScaEventType.NewAllowlistedFinding]: 'New Allowlisted Finding',
  [ScaEventType.NewAllowlistedFindings]: 'New Allowlisted Findings',
  [ScaEventType.NewFix]: 'New Fix',
  [ScaEventType.NewFixes]: 'New Fixes',
  [ScaEventType.NewPullRequestFinding]: 'New Pull Request Finding',
  [ScaEventType.NewPullRequestFindings]: 'New Pull Request Findings',
  [ScaEventType.NewPullRequestFix]: 'New Pull Request Fix',
  [ScaEventType.NewPullRequestFixes]: 'New Pull Request Fixes',
  [ScaEventType.BotInteractionPR]: 'Bot Interaction PR',
  [ScaEventType.BotInteractionIssue]: 'Bot Interaction Issue',
};

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

export enum SecretsEventType {
  NewFinding = 'new-finding',
  NewFindings = 'new-findings',
  NewAllowlistedFinding = 'new-allowlisted-finding',
  NewAllowlistedFindings = 'new-allowlisted-findings',
}

export const SecretsEventTypeDescriptions: Record<SecretsEventType, string> = {
  [SecretsEventType.NewFinding]: 'New Finding',
  [SecretsEventType.NewFindings]: 'New Findings',
  [SecretsEventType.NewAllowlistedFinding]: 'New Allowlisted Finding',
  [SecretsEventType.NewAllowlistedFindings]: 'New Allowlisted Findings',
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
