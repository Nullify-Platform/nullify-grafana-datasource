import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  FieldType,
  MutableDataFrame,
} from '@grafana/data';
import { getBackendSrv, isFetchError } from '@grafana/runtime';
import _ from 'lodash';
import defaults from 'lodash/defaults';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';
import { lastValueFrom } from 'rxjs';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  baseUrl: string;
  githubOwnerId: number;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);

    this.githubOwnerId = instanceSettings.jsonData.githubOwnerId!;
    this.baseUrl = instanceSettings.url!;
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const promises = options.targets.map(async (target) => {
      const query = defaults(target, defaultQuery);
      const response = await this.request();

      /**
       * In this example, the request endpoint returns:
       *
       * events: [{
       *    "id": "01HETSAHEAWD5442HBF94PCZDQ",
       *    "time": "2023-11-09 11:35:15 -0800 -0800",
       *    "timeUnix": 1699558515,
       *    "type": "new-branch-summary",
       *    "data": {
       *        "id": "",
       *        "provider": {
       *            "id": "GitHub",
       *            "github": {
       *                "installationId": 41049139,
       *                "ownerId": 110400336,
       *                "owner": "Nullify-Platform",
       *                "ownerType": "Organization",
       *                "repositoryName": "rag-dataset",
       *                "repositoryId": 688263196,
       *                "hasIssue": true
       *            }
       *        },
       *        "branch": "main",
       *        "commit": "b1f1c2c3d0babc5978039e9d9986c034891de920",
       *        "numFindings": 9,
       *        "numVulnerabilities": 9,
       *        "numCritical": 0,
       *        "numHigh": 0,
       *        "numMedium": 0,
       *        "numLow": 0,
       *        "numUnknown": 0
       *    }
       *  }, ...]  
       */
      const datapoints = response.data.events;
      if (datapoints === undefined) {
        throw new Error('Remote endpoint reponse does not contain "events" property.');
      }

      const timestamps: number[] = [];
      const numCritical: number[] = [];
      const numHigh: number[] = [];
      const numMedium: number[] = [];
      const numLow: number[] = [];
      const numUnknown: number[] = [];
      const commitHash: string[] = [];

      for (const item of datapoints) {
        timestamps.push(item.time);
        numCritical.push(item.data.numCritical);
        numHigh.push(item.data.numHigh);
        numMedium.push(item.data.numMedium);
        numLow.push(item.data.numLow);
        numUnknown.push(item.data.numUnknown);
        commitHash.push(item.data.commit);
      }

      return new MutableDataFrame({
        refId: query.refId,
        fields: [
          { name: 'Time', type: FieldType.time, values: timestamps },
          { name: 'Critical Findings', type: FieldType.number, values: numCritical },
          { name: 'High Findings', type: FieldType.number, values: numHigh },
          { name: 'Medium Findings', type: FieldType.number, values: numMedium },
          { name: 'Low Findings', type: FieldType.number, values: numLow },
          { name: 'Unknown Findings', type: FieldType.number, values: numUnknown },
          { name: 'Commit Hash', type: FieldType.number, values: commitHash },
        ],
      });
    });

    return Promise.all(promises).then((data) => ({ data }));
  }

  // TODO(jqphu): only one path is supported now, sca/events
  async request() {
    const response = getBackendSrv().fetch<any>({
      url: `${this.baseUrl}/sca/events?githubOwnerId=${this.githubOwnerId}`,
    });
    
    return lastValueFrom(response);
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
