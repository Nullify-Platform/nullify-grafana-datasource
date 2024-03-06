import { z } from 'zod';
import { DataFrame, FieldType, createDataFrame } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { ScaSummaryQueryOptions } from 'types';
import { ScaEventsDependencyFinding } from './scaCommon';
import { unwrapRepositoryTemplateVariables } from 'utils/utils';

const ScaSummaryApiResponseSchema = z.object({
  vulnerabilities: z.array(ScaEventsDependencyFinding).nullable(),
  numItems: z.number(),
});

interface ScaSummaryApiRequest {
  githubRepositoryId?: number[];
  severity?: string;
}

export interface UnwoundScaEventsDependencyFinding {
  id: string | undefined;
  isDirect: boolean | undefined;
  package: string | undefined;
  packageFilePath: string | undefined;
  version: string | undefined;
  filePath: string | undefined;
  line: number | undefined;
  numCritical: number | undefined;
  numHigh: number | undefined;
  numMedium: number | undefined;
  numLow: number | undefined;
  numUnknown: number | undefined;
  vulnerabilityHasFix: boolean | undefined;
  vulnerabilityTitle: string | undefined;
  vulnerabilitySeverity: string | undefined;
  vulnerabilityCveId: string | undefined;
  vulnerabilityCwe: string[] | undefined;
  vulnerabilityIntroduced: string | undefined;
  vulnerabilityFixed: string | undefined;
  vulnerabilityVersion: string | undefined;
}

export const processScaSummary = async (
  queryOptions: ScaSummaryQueryOptions,
  request_fn: (endpoint_path: string, params?: Record<string, any>) => Promise<FetchResponse<any>>
): Promise<DataFrame> => {
  const params: ScaSummaryApiRequest = {
    ...(queryOptions.queryParameters.githubRepositoryIdsOrQueries
      ? {
          githubRepositoryId: unwrapRepositoryTemplateVariables(
            queryOptions.queryParameters.githubRepositoryIdsOrQueries
          ),
        }
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
      },
    };
  }

  const unwoundFindings = parseResult.data.vulnerabilities?.flatMap(finding => {
    let result: UnwoundScaEventsDependencyFinding[] = [];
    for (const vuln of finding.vulnerabilities ?? []) {
      result.push({
        id: finding.id,
        isDirect: finding.isDirect,
        package: finding.package,
        packageFilePath: finding.packageFilePath,
        version: finding.version,
        filePath: finding.filePath,
        line: finding.line,
        numCritical: finding.numCritical,
        numHigh: finding.numHigh,
        numMedium: finding.numMedium,
        numLow: finding.numLow,
        numUnknown: finding.numUnknown,
        vulnerabilityHasFix: vuln.hasFix,
        vulnerabilityTitle: vuln.title,
        vulnerabilitySeverity: vuln.severity,
        vulnerabilityCveId: vuln.cves?.find((cve) => cve.id?.startsWith('CVE'))?.id,
        vulnerabilityCwe: vuln.cwes ?? undefined,
        vulnerabilityIntroduced: vuln.introduced,
        vulnerabilityFixed: vuln.fixed,
        vulnerabilityVersion: vuln.version,
      });
    }
    return result
  });

  return createDataFrame({
    refId: queryOptions.refId,
    fields: [
      {
        name: 'id',
        type: FieldType.string,
        values: unwoundFindings?.map((vuln) => vuln.id),
      },
      {
        name: 'isDirect',
        type: FieldType.boolean,
        values: unwoundFindings?.map((vuln) => vuln.isDirect),
      },
      {
        name: 'package',
        type: FieldType.string,
        values: unwoundFindings?.map((vuln) => vuln.package),
      },
      {
        name: 'packageFilePath',
        type: FieldType.string,
        values: unwoundFindings?.map((vuln) => vuln.packageFilePath),
      },
      {
        name: 'version',
        type: FieldType.string,
        values: unwoundFindings?.map((vuln) => vuln.version),
      },
      {
        name: 'filePath',
        type: FieldType.string,
        values: unwoundFindings?.map((vuln) => vuln.filePath),
      },
      {
        name: 'numCritical',
        type: FieldType.number,
        values: unwoundFindings?.map((vuln) => vuln.numCritical),
      },
      {
        name: 'numHigh',
        type: FieldType.number,
        values: unwoundFindings?.map((vuln) => vuln.numHigh),
      },
      {
        name: 'numMedium',
        type: FieldType.number,
        values: unwoundFindings?.map((vuln) => vuln.numMedium),
      },
      {
        name: 'numLow',
        type: FieldType.number,
        values: unwoundFindings?.map((vuln) => vuln.numLow),
      },
      {
        name: 'vulnerabilityHasFix',
        type: FieldType.boolean,
        values: unwoundFindings?.map((vuln) => vuln.vulnerabilityHasFix),
      },
      {
        name: 'vulnerabilityTitle',
        type: FieldType.string,
        values: unwoundFindings?.map((vuln) => vuln.vulnerabilityTitle),
      },
      {
        name: 'vulnerabilitySeverity',
        type: FieldType.string,
        values: unwoundFindings?.map((vuln) => vuln.vulnerabilitySeverity),
      },
      {
        name: 'vulnerabilityCveId',
        type: FieldType.string,
        values: unwoundFindings?.map((vuln) => vuln.vulnerabilityCveId ?? null),
      },
      {
        name: 'vulnerabilityCwe',
        type: FieldType.string,
        values: unwoundFindings?.map((vuln) => vuln.vulnerabilityCwe ?? null),
      },
      {
        name: 'vulnerabilityIntroduced',
        type: FieldType.string,
        values: unwoundFindings?.map((vuln) => vuln.vulnerabilityIntroduced),
      },
      {
        name: 'vulnerabilityFixed',
        type: FieldType.string,
        values: unwoundFindings?.map((vuln) => vuln.vulnerabilityFixed),
      },
      {
        name: 'vulnerabilityVersion',
        type: FieldType.string,
        values: unwoundFindings?.map((vuln) => vuln.vulnerabilityVersion),
      },
    ],
  });
};
