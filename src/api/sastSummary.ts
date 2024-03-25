import { z } from 'zod';
import { DataFrame, FieldType, createDataFrame } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { SastSummaryQueryOptions } from 'types';
import { prepend_severity_idx, unwrapRepositoryTemplateVariables } from 'utils/utils';
import { SastFinding } from './sastCommon';

const SastSummaryApiResponseSchema = z.object({
  vulnerabilities: z.array(SastFinding),
  numItems: z.number(),
});

interface SastSummaryApiRequest {
  githubRepositoryId?: number[];
  fileOwnerName?: string[];
  severity?: string;
}

export const processSastSummary = async (
  queryOptions: SastSummaryQueryOptions,
  request_fn: (endpoint_path: string, params?: Record<string, any>) => Promise<FetchResponse<any>>
): Promise<DataFrame> => {
  const params: SastSummaryApiRequest = {
    ...(queryOptions.queryParameters.githubRepositoryIdsOrQueries
      ? {
          githubRepositoryId: unwrapRepositoryTemplateVariables(
            queryOptions.queryParameters.githubRepositoryIdsOrQueries
          ),
        }
      : {}),
    ...(queryOptions.queryParameters.ownerNamesOrQueries
      ? {
          fileOwnerName: queryOptions.queryParameters.ownerNamesOrQueries,
        }
      : {}),
    ...(queryOptions.queryParameters.severity ? { severity: queryOptions.queryParameters.severity } : {}),
  };
  const endpointPath = 'sast/summary';
  console.log(`[${endpointPath}] starting request with params:`, params);
  const response = await request_fn(endpointPath, params);

  const parseResult = SastSummaryApiResponseSchema.safeParse(response.data);
  if (!parseResult.success) {
    throw {
      message: `Data from the API is misformed. Contact Nullify with the data below for help`,
      data: {
        endpoint: endpointPath,
        request_params: params,
        response: response,
        data_validation_error: parseResult.error,
      },
    };
  }

  return createDataFrame({
    refId: queryOptions.refId,
    fields: [
      {
        name: 'id',
        type: FieldType.string,
        values: parseResult.data.vulnerabilities.map((vuln) => vuln.id),
      },
      {
        name: 'formatted_severity',
        type: FieldType.string,
        values: parseResult.data.vulnerabilities.map((vuln) => prepend_severity_idx(vuln.severity)),
      },
      {
        name: 'severity',
        type: FieldType.string,
        values: parseResult.data.vulnerabilities.map((vuln) => vuln.severity),
      },
      {
        name: 'cwe',
        type: FieldType.string,
        values: parseResult.data.vulnerabilities.map((vuln) => `CWE-${vuln.cwe.toString().padStart(3, '0')}`),
      },
      {
        name: 'language',
        type: FieldType.string,
        values: parseResult.data.vulnerabilities.map((vuln) => vuln.language),
      },
      {
        name: 'filePath',
        type: FieldType.string,
        values: parseResult.data.vulnerabilities.map((vuln) => vuln.filePath),
      },
      {
        name: 'isAllowlisted',
        type: FieldType.boolean,
        values: parseResult.data.vulnerabilities.map((vuln) => vuln.isAllowlisted),
      },
      {
        name: 'repository',
        type: FieldType.string,
        values: parseResult.data.vulnerabilities.map((vuln) => vuln.repository),
      },
      {
        name: 'branch',
        type: FieldType.string,
        values: parseResult.data.vulnerabilities.map((vuln) => vuln.branch),
      },
      {
        name: 'owners',
        type: FieldType.string,
        values: parseResult.data.vulnerabilities.map((vuln) => vuln.fileOwners?.map((owner) => owner.name).join(', ')),
      },
    ],
  });
};
