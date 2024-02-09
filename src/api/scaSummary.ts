import { DataFrame, FieldType, createDataFrame } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { ScaSummaryQueryOptions } from 'types';
import { prepend_severity_idx } from 'utils/utils';

interface ScaSummaryApiResponse {
  vulnerabilities: ScaSummaryPackage[];
  numItems: number;
}

interface ScaSummaryPackage {
  id: string;
  isDirect?: boolean;
  package: string;
  packageFilePath: string;
  version?: string;
  filePath: string;
  line?: number;
  numHigh?: number;
  numMedium?: number;
  vulnerabilities: ScaSummaryPackageVulnerability[];
  numCritical?: number;
  numLow?: number;
}

interface ScaSummaryPackageVulnerability {
  hasFix?: boolean;
  title: string;
  details: string;
  severity: string;
  cves?: Array<{
    id: string;
  }>;
  cwes?: string[];
  introduced?: string;
  fixed?: string;
  references: string[];
  version?: string;
}

export const processScaSummary = async (
  queryOptions: ScaSummaryQueryOptions,
  request_fn: (endpoint_path: string, params?: Record<string, any>) => Promise<FetchResponse<ScaSummaryApiResponse>>
): Promise<DataFrame> => {
  const response = await request_fn('sca/summary', {
    ...(queryOptions.queryParameters.githubRepositoryId
      ? { githubRepositoryId: queryOptions.queryParameters.githubRepositoryId }
      : {}),
    ...(queryOptions.queryParameters.package ? { package: queryOptions.queryParameters.package } : {}),
  });
  const datapoints: ScaSummaryApiResponse = response.data as unknown as ScaSummaryApiResponse;
  if (!datapoints || !('vulnerabilities' in datapoints)) {
    throw new Error('Remote endpoint does not contain the required field: vulnerabilities');
  }


  return createDataFrame({
    refId: queryOptions.refId,
    fields: [
      { name: 'id', type: FieldType.string, values: datapoints.vulnerabilities.map((vuln) => vuln.id) },
      { name: 'isDirect', type: FieldType.string, values: datapoints.vulnerabilities.map((vuln) => vuln.isDirect) },
      { name: 'package', type: FieldType.string, values: datapoints.vulnerabilities.map((vuln) => vuln.package) },
      { name: 'packageFilePath', type: FieldType.string, values: datapoints.vulnerabilities.map((vuln) => vuln.packageFilePath) },
      { name: 'version', type: FieldType.string, values: datapoints.vulnerabilities.map((vuln) => vuln.version) },
      { name: 'filePath', type: FieldType.string, values: datapoints.vulnerabilities.map((vuln) => vuln.filePath) },
      { name: 'numCritical', type: FieldType.number, values: datapoints.vulnerabilities.map((vuln) => vuln.numCritical ?? 0) },
      { name: 'numHigh', type: FieldType.number, values: datapoints.vulnerabilities.map((vuln) => vuln.numHigh ?? 0) },
      { name: 'numMedium', type: FieldType.number, values: datapoints.vulnerabilities.map((vuln) => vuln.numMedium ?? 0) },
      { name: 'numLow', type: FieldType.number, values: datapoints.vulnerabilities.map((vuln) => vuln.numLow ?? 0) },
      { name: 'numVulnerabilities', type: FieldType.number, values: datapoints.vulnerabilities.map((vuln) => vuln.vulnerabilities?.length ?? 0) },
    ],
  });
};
