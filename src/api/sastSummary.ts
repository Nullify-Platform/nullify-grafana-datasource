import { z } from 'zod';
import { DataFrame, FieldType, createDataFrame } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { SastSummaryQueryOptions } from 'types';
import { prepend_severity_idx } from 'utils/utils';
import { SastFinding } from './sastCommon';

const SastSummaryApiResponseSchema = z.object({
  vulnerabilities: z.array(SastFinding),
  numItems: z.number(),
});

export const processSastSummary = async (
  queryOptions: SastSummaryQueryOptions,
  request_fn: (endpoint_path: string, params?: Record<string, any>) => Promise<FetchResponse<any>>
): Promise<DataFrame> => {
  const response = await request_fn('sast/summary', {
    ...(queryOptions.queryParameters.githubRepositoryId
      ? { githubRepositoryId: queryOptions.queryParameters.githubRepositoryId }
      : {}),
    ...(queryOptions.queryParameters.severity ? { severity: queryOptions.queryParameters.severity } : {}),
  });
  console.log('sast summary response:', response);

  const parseResult = SastSummaryApiResponseSchema.safeParse(response.data);
  if (!parseResult.success) {
    console.error('Error in data from sast summary API', parseResult.error);
    console.log('SAST summary response:', response);
    throw new Error(`Data from the API is misformed. See console log for more details.`);
  }

  return createDataFrame({
    refId: queryOptions.refId,
    fields: [
      { name: 'id', type: FieldType.string, values: parseResult.data.vulnerabilities.map((vuln) => vuln.id) },
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
      { name: 'cwe', type: FieldType.number, values: parseResult.data.vulnerabilities.map((vuln) => vuln.cwe) },
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
    ],
  });
};
