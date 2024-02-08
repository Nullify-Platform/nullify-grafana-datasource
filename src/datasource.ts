import { DataQueryRequest, DataQueryResponse, DataSourceApi, DataSourceInstanceSettings } from '@grafana/data';

import _ from 'lodash';
import { getBackendSrv, isFetchError } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

import { NullifyDataSourceOptions, NullifyQueryOptions } from './types';
import { processSastSummary } from 'api/sastSummary';
import { processSastEvents } from 'api/sastEvents';

export class NullifyDataSource extends DataSourceApi<NullifyQueryOptions, NullifyDataSourceOptions> {
  instanceUrl?: string;
  githubOwnerId: number;
  // apiHostUrl: string;

  constructor(instanceSettings: DataSourceInstanceSettings<NullifyDataSourceOptions>) {
    super(instanceSettings);
    this.instanceUrl = instanceSettings.url;
    this.githubOwnerId = instanceSettings.jsonData.githubOwnerId!;
    // this.apiHostUrl = instanceSettings.jsonData.apiHostUrl;
  }

  async query(options: DataQueryRequest<NullifyQueryOptions>): Promise<DataQueryResponse> {
    const promises = options.targets.map(async (target) => {
      if (target.endpoint === 'sast/summary') {
        return processSastSummary(target, this._request.bind(this));
      } else if (target.endpoint === 'sast/events') {
        return processSastEvents(target, options.range, this._request.bind(this));
      }
      return;
    });

    return Promise.all(promises).then((data) => ({ data }));
  }

  async _request<T>(endpoint_path: string, params: Record<string, any> = {}) {
    const response = getBackendSrv().fetch<T>({
      url: `${this.instanceUrl}/grafana_proxy/${endpoint_path}`,
      params: {
        githubOwnerId: this.githubOwnerId,
        ...params,
      },
    });

    return await lastValueFrom(response);
  }

  /**
   * Checks whether we can connect to the API.
   */
  async testDatasource() {
    const defaultErrorMessage = 'Cannot connect to API';
    console.log('Starting test');

    try {
      const response = await this._request('sast/summary');
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
