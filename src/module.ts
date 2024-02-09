import { DataSourcePlugin } from '@grafana/data';
import { NullifyDataSource } from './datasource';
import { ConfigEditor } from './components/ConfigEditor';
import { QueryEditor } from './components/Query/QueryEditor';
import { NullifyDataSourceOptions, NullifyQueryOptions } from './types';

export const plugin = new DataSourcePlugin<
  NullifyDataSource,
  NullifyQueryOptions,
  NullifyDataSourceOptions
>(NullifyDataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
