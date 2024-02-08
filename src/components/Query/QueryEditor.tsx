import React from 'react';
import { Field, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { NullifyDataSource } from '../../datasource';
import { NullifyDataSourceOptions, NullifyEndpointPaths, NullifyQueryOptions } from '../../types';
import { SastSummarySubquery } from './SastSummarySubquery';
import { SastEventsSubquery } from './SastEventsSubquery';

type Props = QueryEditorProps<NullifyDataSource, NullifyQueryOptions, NullifyDataSourceOptions>;

export function QueryEditor(props: Props) {
  const { query, onChange, onRunQuery } = props;

  const onEndpointChange = (newEndpoint: NullifyEndpointPaths) => {
    onChange({
      ...query,
      endpoint: newEndpoint,
      queryParameters: {},
    });
    onRunQuery();
  };

  const endpoint_options: Array<SelectableValue<NullifyEndpointPaths>> = [
    { value: 'sast/summary', label: 'SAST Summary' },
    { value: 'sast/events', label: 'SAST Events' },
  ];

  return (
    <div style={{ paddingTop: '20px' }}>
      <Field label="Data Type" description="Category of Nullify data to query for">
        <Select
          options={endpoint_options}
          value={query.endpoint ?? endpoint_options[0].value}
          onChange={(v) => onEndpointChange(v.value ?? 'sast/summary')}
        />
      </Field>
      <div style={{ height: '15px' }}></div>
      <SastSummarySubquery {...props} />
      <SastEventsSubquery {...props} />
    </div>
  );
}
