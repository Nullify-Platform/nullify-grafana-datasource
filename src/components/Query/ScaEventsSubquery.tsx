import React, { ChangeEvent, FormEvent, useState } from 'react';
import { Checkbox, Field, Input, Select, VerticalGroup } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { NullifyDataSource } from '../../datasource';
import { NullifyDataSourceOptions, NullifyEndpointPaths, NullifyQueryOptions } from '../../types';
import { RepositoryField } from 'components/Fields/RepositoryField';

type Props = QueryEditorProps<NullifyDataSource, NullifyQueryOptions, NullifyDataSourceOptions>;

const ScaEventTypeOptions: Array<SelectableValue<string>> = [
  { value: 'new-branch-summary', label: 'New Branch Summary' },
  { value: 'new-finding', label: 'New Finding' },
  { value: 'new-findings', label: 'New Findings' },
  { value: 'new-fix', label: 'New Fix' },
  { value: 'new-fixes', label: 'New Fixes' },
  { value: 'new-allowlisted-finding', label: 'New Allowlisted Finding' },
  { value: 'new-allowlisted-findings', label: 'New Allowlisted Findings' },
  { value: 'new-pull-request-finding', label: 'New Pull Request Finding' },
  { value: 'new-pull-request-findings', label: 'New Pull Request Findings' },
  { value: 'new-pull-request-fix', label: 'New Pull Request Fix' },
  { value: 'new-pull-request-fixes', label: 'New Pull Request Fixes' },
];

export function ScaEventsSubquery(props: Props) {
  const { query, onChange, onRunQuery } = props;
  const [selectedRepositoryIds, setSelectedRepositoryIds] = useState<number[]>([]);

  const onRepoIdsChange = (respositoryIds: number[]) => {
    setSelectedRepositoryIds(respositoryIds);
    onChange({
      ...query,
      endpoint: 'sca/events',
      queryParameters: { ...query.queryParameters, githubRepositoryIds: respositoryIds },
    });
    onRunQuery();
  };

  const onBranchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...query,
      endpoint: 'sca/events',
      queryParameters: { ...query.queryParameters, branch: event.target.value },
    });
    onRunQuery();
  };

  return query.endpoint === 'sca/events' ? (
    <>
      <Field
        label="Repository Filter"
        description="Query to filter for only the vulnerabilities from the specified repositories. Select one or more repositories or enter your repository ID(s) below."
      >
        <RepositoryField
          getRepositories={props.datasource.getRepositories.bind(props.datasource)}
          selectedRepositoryIds={selectedRepositoryIds}
          setSelectedRepositoryIds={onRepoIdsChange}
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
          {ScaEventTypeOptions.map(({ value, label }) => {
            const onEventTypeChange = (event: FormEvent<HTMLInputElement>) => {
              const target = event.target as HTMLInputElement;
              const isChecked = target.checked;

              if (value) {
                onChange({
                  ...query,
                  endpoint: 'sca/events',
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
