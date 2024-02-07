import { DataSourcePlugin } from '@grafana/data';
import { NullifySastSummaryDataSource } from './datasource';
import { ConfigEditor } from './components/ConfigEditor';
import { QueryEditor } from './components/QueryEditor';
import { NullifySastSummaryQueryOptions, NullifyDataSourceOptions } from './types';

export const plugin = new DataSourcePlugin<
  NullifySastSummaryDataSource,
  NullifySastSummaryQueryOptions,
  NullifyDataSourceOptions
>(NullifySastSummaryDataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
