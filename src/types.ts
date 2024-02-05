import { DataSourceJsonData } from '@grafana/data';
import { DataQuery } from '@grafana/schema';

export interface NullifySastSummaryQueryOptions extends DataQuery {
  githubRepositoryId?: string;
  severity?: string;
}

export const NullifySastSummaryDefaultQuery: Partial<NullifySastSummaryQueryOptions> = {
};

export interface Vulnerability {
  // "id": "01HNJ8W4AVFS53A61HSPZDB9CS",
  // "title": "Ensure S3 bucket has block public policy enabled",
  // "severity": "MEDIUM",
  // "language": "CloudFormation",
  // "message": "",
  // "filePath": "cloudformation/insecure.yaml",
  // "cwe": 0,
  // "ruleId": "CKV_AWS_54",
  // "ruleUrl": "",
  // "startLine": 5,
  // "endLine": 19,
  // "isAutoFixable": false,
  // "suggestions": null,
  // "exampleFixes": null,
  // "isAllowlisted": false,
  // "latest": true
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

export interface NullifySastSummaryApiResponse {
  vulnerabilities: Vulnerability[];
  numItems: number;
}

/**
 * These are options configured for each DataSource instance
 */
export interface NullifyDataSourceOptions extends DataSourceJsonData {
  apiHostUrl: string;
  githubOwnerId: number;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface NullifySecureJsonData {
  apiKey?: string;
}
