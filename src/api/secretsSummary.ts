import { z } from 'zod';
import { DataFrame, FieldType, createDataFrame } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { SecretsSummaryQueryOptions } from 'types';
import { SecretsScannerFindingEvent } from './secretsCommon';

const SecretsSummaryApiResponseSchema = z.object({
  secrets: z.array(SecretsScannerFindingEvent).nullable(),
  numItems: z.number(),
});

interface SecretsSummaryApiRequest {
  githubRepositoryId?: number[];
  branch?: string;
  secretType?: string;
  isAllowlisted?: boolean;
}

export const processSecretsSummary = async (
  queryOptions: SecretsSummaryQueryOptions,
  request_fn: (endpoint_path: string, params?: Record<string, any>) => Promise<FetchResponse<any>>
): Promise<DataFrame> => {
  const params: SecretsSummaryApiRequest = {
    ...(queryOptions.queryParameters.githubRepositoryIds
      ? { githubRepositoryId: queryOptions.queryParameters.githubRepositoryIds }
      : {}),
    ...(queryOptions.queryParameters.branch ? { branch: queryOptions.queryParameters.branch } : {}),
    ...(queryOptions.queryParameters.secretType ? { secretType: queryOptions.queryParameters.secretType } : {}),
    ...(queryOptions.queryParameters.isAllowlisted ? { isAllowlisted: queryOptions.queryParameters.isAllowlisted } : {}),
  };
  const endpointPath = 'secrets/summary';
  console.log(`[${endpointPath}] starting request with params:`, params);
  const response = await request_fn(endpointPath, params);

  const parseResult = SecretsSummaryApiResponseSchema.safeParse(response.data);
  if (!parseResult.success) {
    throw {
      message: `Data from the API is misformed. Contact Nullify with the data below for help`,
      data: {
        endpoint: endpointPath,
        request_params: params,
        response: response,
        data_validation_error: parseResult.error,
      }
    };
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
