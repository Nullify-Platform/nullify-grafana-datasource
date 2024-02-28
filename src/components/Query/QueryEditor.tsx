import React from 'react';
import { Field, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { NullifyDataSource } from '../../datasource';
import { NullifyDataSourceOptions, NullifyEndpointPaths, NullifyQueryOptions } from '../../types';
import { SastSummarySubquery } from './SastSummarySubquery';
import { SastEventsSubquery } from './SastEventsSubquery';
import { ScaEventsSubquery } from './ScaEventsSubquery';
import { ScaSummarySubquery } from './ScaSummarySubquery';
import { SecretsSummarySubquery } from './SecretsSummarySubquery';
import { SecretsEventsSubquery } from './SecretsEventsSubquery';

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
    { value: 'sca/summary', label: 'SCA Summary' },
    { value: 'sca/events', label: 'SCA Events' },
    { value: 'secrets/summary', label: 'Secrets Summary' },
    { value: 'secrets/events', label: 'Secrets Events' },
  ];

  return (
    <div style={{ paddingTop: '20px' }}>
      <Field label="Data Type" description="Category of Nullify data to query for">
        <Select
          options={endpoint_options}
          value={query.endpoint ?? ""}
          placeholder='Select a data type'
          onChange={(v) => onEndpointChange(v.value ?? 'sast/summary')}
        />
      </Field>
      <div style={{ height: '15px' }}></div>
      <SastSummarySubquery {...props} />
      <SastEventsSubquery {...props} />
      <ScaSummarySubquery {...props} />
      <ScaEventsSubquery {...props} />
      <SecretsSummarySubquery {...props} />
      <SecretsEventsSubquery {...props} />
    </div>
  );
}
