import { z } from 'zod';
import { DataFrame, FieldType, createDataFrame } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { ScaSummaryQueryOptions } from 'types';
import { ScaEventsDependencyFinding } from './scaCommon';

const ScaSummaryApiResponseSchema = z.object({
  vulnerabilities: z.array(ScaEventsDependencyFinding).nullable(),
  numItems: z.number(),
});

interface ScaSummaryApiRequest {
  githubRepositoryIds?: string;
  severity?: string;
}

export const processScaSummary = async (
  queryOptions: ScaSummaryQueryOptions,
  request_fn: (endpoint_path: string, params?: Record<string, any>) => Promise<FetchResponse<any>>
): Promise<DataFrame> => {
  const params: ScaSummaryApiRequest = {
    ...(queryOptions.queryParameters.githubRepositoryIds
      ? { githubRepositoryIds: queryOptions.queryParameters.githubRepositoryIds.join(',') }
      : {}),
    ...(queryOptions.queryParameters.package ? { package: queryOptions.queryParameters.package } : {}),
  };
  const endpointPath = 'sca/summary';
  console.log(`[${endpointPath}] starting request with params:`, params);
  const response = await request_fn(endpointPath, params);

  const parseResult = ScaSummaryApiResponseSchema.safeParse(response.data);
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

  return createDataFrame({
    refId: queryOptions.refId,
    fields: [
      { name: 'id', type: FieldType.string, values: parseResult.data.vulnerabilities?.map((vuln) => vuln.id) },
      {
        name: 'isDirect',
        type: FieldType.string,
        values: parseResult.data.vulnerabilities?.map((vuln) => vuln.isDirect),
      },
      {
        name: 'package',
        type: FieldType.string,
        values: parseResult.data.vulnerabilities?.map((vuln) => vuln.package),
      },
      {
        name: 'packageFilePath',
        type: FieldType.string,
        values: parseResult.data.vulnerabilities?.map((vuln) => vuln.packageFilePath),
      },
      {
        name: 'version',
        type: FieldType.string,
        values: parseResult.data.vulnerabilities?.map((vuln) => vuln.version),
      },
      {
        name: 'filePath',
        type: FieldType.string,
        values: parseResult.data.vulnerabilities?.map((vuln) => vuln.filePath),
      },
      {
        name: 'numCritical',
        type: FieldType.number,
        values: parseResult.data.vulnerabilities?.map((vuln) => vuln.numCritical ?? 0),
      },
      {
        name: 'numHigh',
        type: FieldType.number,
        values: parseResult.data.vulnerabilities?.map((vuln) => vuln.numHigh ?? 0),
      },
      {
        name: 'numMedium',
        type: FieldType.number,
        values: parseResult.data.vulnerabilities?.map((vuln) => vuln.numMedium ?? 0),
      },
      {
        name: 'numLow',
        type: FieldType.number,
        values: parseResult.data.vulnerabilities?.map((vuln) => vuln.numLow ?? 0),
      },
      {
        name: 'numVulnerabilities',
        type: FieldType.number,
        values: parseResult.data.vulnerabilities?.map((vuln) => vuln.vulnerabilities?.length ?? 0),
      },
    ],
  });
};
