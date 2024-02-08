import { DataFrame, FieldType, createDataFrame } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { SastSummaryQueryOptions } from 'types';
import { prepend_severity_idx } from 'utils/utils';

interface SastSummaryVulnerability {
  id: string;
  title: string;
  severity: string;
  language: string;
  message: string;
  filePath: string;
  cwe: number;
  ruleId: string;
  ruleUrl: string;
  startLine: number;
  endLine: number;
  isAutoFixable: boolean;
  suggestions?: any[];
  exampleFixes?: any[];
  isAllowlisted: boolean;
  latest: boolean;
}

interface SastSummaryApiResponse {
  vulnerabilities: SastSummaryVulnerability[];
  numItems: number;
}

export const processSastSummary = async (
  queryOptions: SastSummaryQueryOptions,
  request_fn: (
    endpoint_path: string,
    params?: Record<string, any>
  ) => Promise<FetchResponse<SastSummaryApiResponse>>
): Promise<DataFrame> => {
  const response = await request_fn('sast/summary', {
    ...(queryOptions.queryParameters.githubRepositoryId
      ? { githubRepositoryId: queryOptions.queryParameters.githubRepositoryId }
      : {}),
    ...(queryOptions.queryParameters.severity ? { severity: queryOptions.queryParameters.severity } : {}),
  });
  const datapoints: SastSummaryApiResponse = response.data as unknown as SastSummaryApiResponse;
  if (!datapoints || !('vulnerabilities' in datapoints)) {
    throw new Error('Remote endpoint does not contain the required field: vulnerabilities');
  }

  let ids: string[] = [];
  let formatted_severities: string[] = [];
  let severities: string[] = [];
  let languages: string[] = [];
  let filePaths: string[] = [];
  let isAutoFixables: boolean[] = [];
  let isAllowlisteds: boolean[] = [];
  let latests: boolean[] = [];
  for (const vuln of datapoints.vulnerabilities) {
    ids.push(vuln.id);
    formatted_severities.push(prepend_severity_idx(vuln.severity));
    severities.push(vuln.severity);
    languages.push(vuln.language);
    filePaths.push(vuln.filePath);
    isAutoFixables.push(vuln.isAutoFixable);
    isAllowlisteds.push(vuln.isAllowlisted);
    latests.push(vuln.latest);
  }

  return createDataFrame({
    refId: queryOptions.refId,
    fields: [
      { name: 'id', type: FieldType.string, values: ids },
      { name: 'formatted_severity', type: FieldType.string, values: formatted_severities },
      { name: 'severity', type: FieldType.string, values: severities },
      { name: 'language', type: FieldType.string, values: languages },
      { name: 'filePath', type: FieldType.string, values: filePaths },
      { name: 'isAutoFixable', type: FieldType.boolean, values: isAutoFixables },
      { name: 'isAllowlisted', type: FieldType.boolean, values: isAllowlisteds },
      { name: 'latest', type: FieldType.boolean, values: latests },
    ],
  });
};
