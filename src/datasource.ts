import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  FieldType,
  MutableDataFrame,
} from '@grafana/data';

import _ from 'lodash';
import defaults from 'lodash/defaults';
import { getBackendSrv, isFetchError } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

import { defaultQuery, MyQuery, NullifyDataSourceOptions, NullifySastSummaryApiResponse } from './types';


const prepend_severity_idx = (severity: string) => {
  severity = severity.toUpperCase();
  switch (severity) {
    case 'CRITICAL':
      return `S1 - ${severity}`;
    case 'HIGH':
      return `S2 - ${severity}`;
    case 'MEDIUM':
      return `S3 - ${severity}`;
    case 'LOW':
      return `S4 - ${severity}`;
    default:
      return severity;
  }
};

export class NullifySastDataSource extends DataSourceApi<MyQuery, NullifyDataSourceOptions> {
  instanceUrl?: string;
  apiHostUrl: string;
  githubOwnerId: number;

  constructor(instanceSettings: DataSourceInstanceSettings<NullifyDataSourceOptions>) {
    super(instanceSettings);
    this.instanceUrl = instanceSettings.url;
    this.githubOwnerId = instanceSettings.jsonData.githubOwnerId!;
    this.apiHostUrl = instanceSettings.jsonData.apiHostUrl;
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const promises = options.targets.map(async (target) => {
      const query = defaults(target, defaultQuery);
      const response = await this.request();

      const datapoints: NullifySastSummaryApiResponse = response.data as unknown as NullifySastSummaryApiResponse;
      if (datapoints === undefined || !('vulnerabilities' in datapoints)) {
        throw new Error('Remote endpoint reponse does not contain "events" property.');
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

      return new MutableDataFrame({
        refId: query.refId,
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
    });

    return Promise.all(promises).then((data) => ({ data }));
  }

  // TODO(jqphu): only one path is supported now, sca/events
  async request() {
    const response = getBackendSrv().fetch<NullifySastSummaryApiResponse>({
      url: `${this.instanceUrl}/grafana_proxy/sast/summary?githubOwnerId=${this.githubOwnerId}`,
    });

    return await lastValueFrom(response);
  }

  filterQuery(query: MyQuery): boolean {
    if (query.hide) {
      return false;
    }
    return true;
  }

  /**
   * Checks whether we can connect to the API.
   */
  async testDatasource() {
    const defaultErrorMessage = 'Cannot connect to API';
    console.log('Starting test');

    try {
      const response = await this.request();
      if (response.status === 200) {
        return {
          status: 'success',
          message: 'Success',
        };
      } else {
        return {
          status: 'error',
          message: response.statusText ? response.statusText : defaultErrorMessage,
        };
      }
    } catch (err) {
      let message = '';
      if (_.isString(err)) {
        message = err;
      } else if (isFetchError(err)) {
        message = 'Fetch error: ' + (err.statusText ? err.statusText : defaultErrorMessage);
        if (err.data && err.data.error && err.data.error.code) {
          message += ': ' + err.data.error.code + '. ' + err.data.error.message;
        }
      }
      return {
        status: 'error',
        message,
      };
    }
  }
}
