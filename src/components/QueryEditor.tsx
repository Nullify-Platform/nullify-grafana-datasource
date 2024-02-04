import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms, HorizontalGroup } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { NullifySastDataSource } from '../datasource';
import { defaultQuery, NullifyDataSourceOptions, MyQuery } from '../types';

const { FormField } = LegacyForms;

type Props = QueryEditorProps<NullifySastDataSource, MyQuery, NullifyDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  onQueryTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, queryText: event.target.value });
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { queryText } = query;

    return (
      <HorizontalGroup>
        <FormField
          labelWidth={8}
          value={queryText || ''}
          onChange={this.onQueryTextChange}
          label="Unused Query Text"
          tooltip="Not used yet"
        />
      </HorizontalGroup>
    );
  }
}
