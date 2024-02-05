import React, { ChangeEvent, useState } from 'react';
import { Button, Field, InlineField, Input, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { NullifySastSummaryDataSource } from '../datasource';
import { NullifyDataSourceOptions, NullifySastSummaryQueryOptions } from '../types';

type Props = QueryEditorProps<NullifySastSummaryDataSource, NullifySastSummaryQueryOptions, NullifyDataSourceOptions>;

export function QueryEditor({ query, onChange, onRunQuery }: Props) {
  const onRepoIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, githubRepositoryId: event.target.value });
  };
  const onSeverityChange = (new_severity: string) => {
    onChange({ ...query, severity: new_severity });
    onRunQuery();
  };

  const severity_options: Array<SelectableValue<string>> = [
    { value: '', label: 'ALL' },
    { value: 'LOW', label: 'LOW' },
    { value: 'MEDIUM', label: 'MEDIUM' },
    { value: 'HIGH', label: 'HIGH' },
    { value: 'CRITICAL', label: 'CRITICAL' },
  ];

  return (
    <div style={{ paddingTop: '20px' }}>
      <Field
        label="Repository ID Filter"
        description="Query to filter for only the vulnerabilities from the specified GitHub repository ID. Leave blank to query for all repositories."
      >
        <Input
          onChange={onRepoIdChange}
          placeholder="1234"
          onBlur={onRunQuery}
          value={query.githubRepositoryId || ''}
        />
      </Field>
      <Field
        label="Severity Filter"
        description="Query to filter for only the vulnerabilities with the selected severity"
      >
        <Select
          options={severity_options}
          value={query.severity ?? ''}
          onChange={(v) => onSeverityChange(v.value ?? '')}
        />
      </Field>
    </div>
  );
}
