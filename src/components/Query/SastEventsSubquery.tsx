import React, { ChangeEvent, FormEvent } from 'react';
import { Checkbox, Field, Input, Select, VerticalGroup } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { NullifyDataSource } from '../../datasource';
import { NullifyDataSourceOptions, NullifyEndpointPaths, NullifyQueryOptions } from '../../types';

type Props = QueryEditorProps<NullifyDataSource, NullifyQueryOptions, NullifyDataSourceOptions>;

const SastEventTypeOptions: Array<SelectableValue<string>> = [
  { value: 'new-branch-summary', label: 'New Branch Summary' },
  { value: 'new-finding', label: 'New Finding' },
  { value: 'new-findings', label: 'New Findings' },
  { value: 'new-fix', label: 'New Fix' },
  { value: 'new-fixes', label: 'New Fixes' },
  { value: 'new-allowlisted-finding', label: 'New Allowlisted Finding' },
  { value: 'new-allowlisted-findings', label: 'New Allowlisted Findings' },
  { value: 'new-unallowlisted-finding', label: 'New Unallowlisted Finding' },
  { value: 'new-unallowlisted-findings', label: 'New Unallowlisted Findings' },
  { value: 'new-pull-request-finding', label: 'New Pull Request Finding' },
  { value: 'new-pull-request-findings', label: 'New Pull Request Findings' },
  { value: 'new-pull-request-fix', label: 'New Pull Request Fix' },
  { value: 'new-pull-request-fixes', label: 'New Pull Request Fixes' },
  { value: 'new-pull-request-allowlisted-finding', label: 'New Pull Request Allowlisted Finding' },
  { value: 'new-pull-request-allowlisted-findings', label: 'New Pull Request Allowlisted Findings' },
  { value: 'new-pull-request-unallowlisted-finding', label: 'New Pull Request Unallowlisted Finding' },
  { value: 'new-pull-request-unallowlisted-findings', label: 'New Pull Request Unallowlisted Findings' },
];

export function SastEventsSubquery(props: Props) {
  const { query, onChange, onRunQuery } = props;

  const onRepoIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...query,
      endpoint: 'sast/events',
      queryParameters: { ...query.queryParameters, githubRepositoryId: event.target.value },
    });
  };

  const onBranchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...query,
      endpoint: 'sast/events',
      queryParameters: { ...query.queryParameters, branch: event.target.value },
    });
    onRunQuery();
  };

  return query.endpoint === 'sast/events' ? (
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
      <Field label="Branch Filter" description="Query to filter for only the vulnerabilities in a selected branch.">
        <Input
          onChange={onBranchChange}
          placeholder="main"
          onBlur={onRunQuery}
          value={query.queryParameters?.branch || ''}
        />
      </Field>
      <Field
        label="Event Type Filter"
        description="Filter for event types. If none are selected, all event types will be returned."
      >
        <VerticalGroup>
          {SastEventTypeOptions.map(({ value, label }) => {
            const onEventTypeChange = (event: FormEvent<HTMLInputElement>) => {
              const target = event.target as HTMLInputElement;
              const isChecked = target.checked;

              if (value) {
                onChange({
                  ...query,
                  endpoint: 'sast/events',
                  queryParameters: {
                    ...query.queryParameters,
                    eventTypes: isChecked
                      ? [...(query.queryParameters.eventTypes || []), value]
                      : (query.queryParameters.eventTypes || []).filter((type) => type !== value),
                  },
                });
                onRunQuery();
              }
            };

            return (
              <Checkbox
                key={value}
                value={query.queryParameters.eventTypes?.includes(value ?? '')}
                onChange={(event) => onEventTypeChange(event)}
                description={undefined}
                label={label}
              />
            );
          })}
        </VerticalGroup>
      </Field>
    </>
  ) : (
    <></>
  );
}
