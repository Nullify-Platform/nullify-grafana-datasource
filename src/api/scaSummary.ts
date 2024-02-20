import { z } from 'zod';
import { DataFrame, FieldType, createDataFrame } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { ScaSummaryQueryOptions } from 'types';
import { ScaEventsDependencyFinding } from './scaCommon';

const ScaSummaryApiResponseSchema = z.object({
  vulnerabilities: z.array(ScaEventsDependencyFinding).nullable(),
  numItems: z.number(),
});

export const processScaSummary = async (
  queryOptions: ScaSummaryQueryOptions,
  request_fn: (endpoint_path: string, params?: Record<string, any>) => Promise<FetchResponse<any>>
): Promise<DataFrame> => {
  const response = await request_fn('sca/summary', {
    ...(queryOptions.queryParameters.githubRepositoryId
      ? { githubRepositoryId: queryOptions.queryParameters.githubRepositoryId }
      : {}),
    ...(queryOptions.queryParameters.package ? { package: queryOptions.queryParameters.package } : {}),
  });

  const parseResult = ScaSummaryApiResponseSchema.safeParse(response.data);
  if (!parseResult.success) {
    console.error('Error in data from sca summary API', parseResult.error);
    console.log('sca summary response:', response);
    throw new Error(`Data from the API is misformed. See console log for more details.`);
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
