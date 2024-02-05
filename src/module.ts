import { DataSourcePlugin } from '@grafana/data';
import { NullifySastDataSource } from './datasource';
import { ConfigEditor } from './components/ConfigEditor';
import { QueryEditor } from './components/QueryEditor';
import { MyQuery, NullifyDataSourceOptions } from './types';

export const plugin = new DataSourcePlugin<NullifySastDataSource, MyQuery, NullifyDataSourceOptions>(NullifySastDataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
