import { z } from 'zod';
import { DataFrame, FieldType, createDataFrame } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { SecretsSummaryQueryOptions } from 'types';
import { SecretsScannerFindingEvent } from './secretsCommon';

const SecretsSummaryApiResponseSchema = z.object({
  secrets: z.array(SecretsScannerFindingEvent).nullable(),
  numItems: z.number(),
});

export const processSecretsSummary = async (
  queryOptions: SecretsSummaryQueryOptions,
  request_fn: (endpoint_path: string, params?: Record<string, any>) => Promise<FetchResponse<any>>
): Promise<DataFrame> => {
  const response = await request_fn('secrets/summary', {
    ...(queryOptions.queryParameters.githubRepositoryId
      ? { githubRepositoryId: queryOptions.queryParameters.githubRepositoryId }
      : {}),
    ...(queryOptions.queryParameters.branch ? { branch: queryOptions.queryParameters.branch } : {}),
    ...(queryOptions.queryParameters.type ? { type: queryOptions.queryParameters.type } : {}),
    ...(queryOptions.queryParameters.allowlisted ? { allowlisted: queryOptions.queryParameters.allowlisted } : {}),
  });

  const parseResult = SecretsSummaryApiResponseSchema.safeParse(response.data);
  if (!parseResult.success) {
    console.error('Error in data from secrets summary API', parseResult.error);
    console.log('secrets summary response:', response);
    throw new Error(`Data from the API is misformed. See console log for more details.`);
  }

  // console.log('parseResult', parseResult);

  return createDataFrame({
    refId: queryOptions.refId,
    fields: [
      { name: 'id', type: FieldType.string, values: parseResult.data.secrets?.map((secret) => secret.id) },
      {
        name: 'secretType',
        type: FieldType.string,
        values: parseResult.data.secrets?.map((secret) => secret.secretType),
      },
      { name: 'filePath', type: FieldType.string, values: parseResult.data.secrets?.map((secret) => secret.filePath) },
      { name: 'author', type: FieldType.string, values: parseResult.data.secrets?.map((secret) => secret.author) },
      {
        name: 'timeStamp',
        type: FieldType.time,
        values: parseResult.data.secrets?.map((secret) => new Date(secret.timeStamp)),
      },
      { name: 'ruleId', type: FieldType.string, values: parseResult.data.secrets?.map((secret) => secret.ruleId) },
      { name: 'entropy', type: FieldType.number, values: parseResult.data.secrets?.map((secret) => secret.entropy) },
      {
        name: 'isBranchHead',
        type: FieldType.boolean,
        values: parseResult.data.secrets?.map((secret) => secret.isBranchHead),
      },
      {
        name: 'firstCommitTimestamp',
        type: FieldType.time,
        values: parseResult.data.secrets?.map((secret) => new Date(secret.firstCommitTimestamp)),
      },
      {
        name: 'isAllowlisted',
        type: FieldType.boolean,
        values: parseResult.data.secrets?.map((secret) => secret.isAllowlisted),
      },
    ],
  });
};
