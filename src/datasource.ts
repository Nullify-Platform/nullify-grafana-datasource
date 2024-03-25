import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  TimeRange,
  dateTime,
} from '@grafana/data';

import { z } from 'zod';
import _ from 'lodash';
import { getBackendSrv, getTemplateSrv, isFetchError } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

import {
  NullifyVariableQuery,
  NullifyDataSourceOptions,
  NullifyQueryOptions,
  OwnerEntity,
  OwnerEntityType,
  NullifyVariableQueryType,
} from './types';
import { processSastSummary } from 'api/sastSummary';
import { processSastEvents } from 'api/sastEvents';
import { processScaSummary } from 'api/scaSummary';
import { processScaEvents } from 'api/scaEvents';
import { processSecretsSummary } from 'api/secretsSummary';
import { processSecretsEvents } from 'api/secretsEvents';
import { Organization, OrganizationSchema, Repository, RepositorySchema } from 'api/common';

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

  async metricFindQuery(query: NullifyVariableQuery, options?: any) {
    if (query.queryType === NullifyVariableQueryType.Repository) {
      const repos = await this.getRepositories();
      return repos?.map((repo) => ({ text: repo.name, value: repo.id })) || [];
    } else if (query.queryType === NullifyVariableQueryType.Owner) {
      const ownerEntities = await this.getOwnerEntities();
      return ownerEntities?.map((owner) => ({ text: `${owner.name} (${owner.type})`, value: owner.name })) || [];
    } else {
      console.error(`Cannot handle query type ${query.queryType}`, query);
      return [];
    }
  }

  async getRepositories(): Promise<Repository[] | null> {
    const response = await this._request('admin/repositories');
    const AdminRepositoriesSchema = z.object({
      repositories: z.array(RepositorySchema),
    });

    let result = AdminRepositoriesSchema.safeParse(response.data);
    if (!result.success) {
      console.error('Error in data from admin repositories API', result.error);
      console.log('admin repositories response:', response);
      return null;
    }
    return result.data.repositories;
  }

  async getOrganization(): Promise<Organization | null> {
    const response = await this._request('admin/organization');
    const AdminOrganizationSchema = z.object({
      organization: OrganizationSchema,
    });

    let result = AdminOrganizationSchema.safeParse(response.data);
    if (!result.success) {
      console.error('Error in data from admin organization API', result.error);
      console.log('admin organization response:', response);
      return null;
    }
    return result.data.organization;
  }

  async getOwnerEntities(): Promise<OwnerEntity[] | null> {
    const organization = await this.getOrganization();
    if (organization) {
      return [
        { name: '', type: OwnerEntityType.Empty },
        { name: '*', type: OwnerEntityType.All },
        ...organization.teams.map((team) => ({
          name: `${organization.slug}/${team.slug}`,
          type: OwnerEntityType.Team,
        })),
        ...organization.members.map((user) => ({ name: user.slug, type: OwnerEntityType.User })),
      ];
    }
    return null;
  }

  async query(options: DataQueryRequest<NullifyQueryOptions>): Promise<DataQueryResponse> {
    const promises = options.targets.map(async (target) => {
      if (target.endpoint === 'sast/summary') {
        return processSastSummary(target, this._request.bind(this));
      } else if (target.endpoint === 'sast/events') {
        return processSastEvents(target, options.range, this._request.bind(this));
      } else if (target.endpoint === 'sca/summary') {
        return processScaSummary(target, this._request.bind(this));
      } else if (target.endpoint === 'sca/events') {
        return processScaEvents(target, options.range, this._request.bind(this));
      } else if (target.endpoint === 'secrets/summary') {
        return processSecretsSummary(target, this._request.bind(this));
      } else if (target.endpoint === 'secrets/events') {
        return processSecretsEvents(target, options.range, this._request.bind(this));
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
      retry: 3,
    });
    const output = await lastValueFrom(response);

    return output;
  }

  /**
   * Checks whether we can connect to the API.
   */
  async testDatasource() {
    console.log('Starting test');

    let testFromDate = dateTime(new Date()).subtract(30, 'day');
    let testToDate = dateTime(new Date());
    let testTimeRange: TimeRange = { from: testFromDate, to: testToDate, raw: { from: testFromDate, to: testToDate } };

    const promises = [
      processSastSummary(
        { refId: 'test', endpoint: 'sast/summary', queryParameters: {} },
        this._request.bind(this)
      ).catch((err) => ({ status: 'error', message: `Error in SAST Summary: ${JSON.stringify(err.message ?? err)}` })),
      processSastEvents(
        { refId: 'test', endpoint: 'sast/events', queryParameters: {} },
        testTimeRange,
        this._request.bind(this)
      ).catch((err) => ({ status: 'error', message: `Error in SAST Events: ${JSON.stringify(err.message ?? err)}` })),
      processScaSummary(
        { refId: 'test', endpoint: 'sca/summary', queryParameters: {} },
        this._request.bind(this)
      ).catch((err) => ({ status: 'error', message: `Error in SCA Summary: ${JSON.stringify(err.message ?? err)}` })),
      processScaEvents(
        { refId: 'test', endpoint: 'sca/events', queryParameters: {} },
        testTimeRange,
        this._request.bind(this)
      ).catch((err) => ({ status: 'error', message: `Error in SCA Events: ${JSON.stringify(err.message ?? err)}` })),
      processSecretsSummary(
        { refId: 'test', endpoint: 'secrets/summary', queryParameters: {} },
        this._request.bind(this)
      ).catch((err) => ({
        status: 'error',
        message: `Error in Secrets Summary: ${JSON.stringify(err.message ?? err)}`,
      })),
      processSecretsEvents(
        { refId: 'test', endpoint: 'secrets/events', queryParameters: {} },
        testTimeRange,
        this._request.bind(this)
      ).catch((err) => ({
        status: 'error',
        message: `Error in Secrets Events: ${JSON.stringify(err.message ?? err)}`,
      })),
    ];

    const results = await Promise.allSettled(promises);
    const err: string[] = [];

    results.forEach((result) => {
      if (result.status === 'rejected') {
        if (isFetchError(result.reason)) {
          err.push(`Fetch error: ${result.reason.statusText}`);
        } else {
          err.push(result.reason);
        }
      } else if (result.status === 'fulfilled' && 'status' in result.value && result.value.status === 'error') {
        err.push(result.value.message);
      }
    });

    if (err.length > 0) {
      console.error('Test failed', err.join('\n'));
      return {
        status: 'error',
        message: err.join('\n'),
      };
    }

    console.log('Tests completed - all tests passed');

    return {
      status: 'success',
      message: 'All tests passed',
    };
  }
}
