import { DataFrame, FieldType, createDataFrame } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { SecretsSummaryQueryOptions } from 'types';

interface SecretsSummaryApiResponse {
  secrets: SecretsSummarySecret[];
  numItems: number;
}

export interface SecretsSummarySecret {
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

export const processSecretsSummary = async (
  queryOptions: SecretsSummaryQueryOptions,
  request_fn: (endpoint_path: string, params?: Record<string, any>) => Promise<FetchResponse<SecretsSummaryApiResponse>>
): Promise<DataFrame> => {
  const response = await request_fn('secrets/summary', {
    ...(queryOptions.queryParameters.githubRepositoryId
      ? { githubRepositoryId: queryOptions.queryParameters.githubRepositoryId }
      : {}),
    ...(queryOptions.queryParameters.branch ? { branch: queryOptions.queryParameters.branch } : {}),
    ...(queryOptions.queryParameters.type ? { type: queryOptions.queryParameters.type } : {}),
    ...(queryOptions.queryParameters.allowlisted ? { allowlisted: queryOptions.queryParameters.allowlisted } : {}),
  });
  const datapoints: SecretsSummaryApiResponse = response.data as unknown as SecretsSummaryApiResponse;
  if (!datapoints || !('secrets' in datapoints)) {
    throw new Error('Remote endpoint does not contain the required field: secrets');
  }

  return createDataFrame({
    refId: queryOptions.refId,
    fields: [
      { name: 'id', type: FieldType.string, values: datapoints.secrets.map((secret) => secret.id) },
      { name: 'secretType', type: FieldType.string, values: datapoints.secrets.map((secret) => secret.secretType) },
      { name: 'filePath', type: FieldType.string, values: datapoints.secrets.map((secret) => secret.filePath) },
      { name: 'author', type: FieldType.string, values: datapoints.secrets.map((secret) => secret.author) },
      {
        name: 'timeStamp',
        type: FieldType.time,
        values: datapoints.secrets.map((secret) => new Date(secret.timeStamp)),
      },
      { name: 'ruleId', type: FieldType.string, values: datapoints.secrets.map((secret) => secret.ruleId) },
      { name: 'entropy', type: FieldType.number, values: datapoints.secrets.map((secret) => secret.entropy) },
      {
        name: 'isBranchHead',
        type: FieldType.boolean,
        values: datapoints.secrets.map((secret) => secret.isBranchHead),
      },
      {
        name: 'firstCommitTimestamp',
        type: FieldType.time,
        values: datapoints.secrets.map((secret) => new Date(secret.firstCommitTimestamp)),
      },
      {
        name: 'isAllowlisted',
        type: FieldType.boolean,
        values: datapoints.secrets.map((secret) => secret.isAllowlisted),
      },
    ],
  });
};
