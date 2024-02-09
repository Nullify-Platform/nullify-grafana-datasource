import React, { ChangeEvent } from 'react';
import { Field, Input, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { NullifyDataSource } from '../../datasource';
import { NullifyDataSourceOptions, NullifyEndpointPaths, NullifyQueryOptions } from '../../types';

type Props = QueryEditorProps<NullifyDataSource, NullifyQueryOptions, NullifyDataSourceOptions>;

const severity_options: Array<SelectableValue<string>> = [
  { value: '', label: 'ALL' },
  { value: 'LOW', label: 'LOW' },
  { value: 'MEDIUM', label: 'MEDIUM' },
  { value: 'HIGH', label: 'HIGH' },
  { value: 'CRITICAL', label: 'CRITICAL' },
];

export function SastSummarySubquery(props: Props) {
  const { query, onChange, onRunQuery } = props;

  const onRepoIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...query,
      endpoint: 'sast/summary',
      queryParameters: { ...query.queryParameters, githubRepositoryId: event.target.value },
    });
  };

  const onSeverityChange = (new_severity: string) => {
    onChange({
      ...query,
      endpoint: 'sast/summary',
      queryParameters: { ...query.queryParameters, severity: new_severity },
    });
    onRunQuery();
  };

  return query.endpoint === 'sast/summary' ? (
    <>
      <Field
        label="Repository ID Filter"
        description="Query to filter for only the vulnerabilities from the specified GitHub repository ID. Leave blank to query for all repositories."
      >
        <Input
          onChange={onRepoIdChange}
          placeholder="1234"
          onBlur={onRunQuery}
          value={query.queryParameters?.githubRepositoryId || ''}
        />
      </Field>
      <Field
        label="Severity Filter"
        description="Query to filter for only the vulnerabilities with the selected severity"
      >
        <Select
          options={severity_options}
          value={query.queryParameters?.severity ?? ''}
          onChange={(v) => onSeverityChange(v.value ?? '')}
        />
      </Field>
    </>
  ) : (
    <></>
  );
}
