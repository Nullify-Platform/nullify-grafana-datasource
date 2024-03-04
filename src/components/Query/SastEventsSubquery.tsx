import React, { ChangeEvent, FormEvent, useState } from 'react';
import { Checkbox, Field, Input, VerticalGroup } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { NullifyDataSource } from '../../datasource';
import { NullifyDataSourceOptions, NullifyQueryOptions } from '../../types';
import { RepositoryField } from 'components/Fields/RepositoryField';

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
  const [selectedRepositories, setSelectedRepositories] = useState<Array<(number | string)>>(query.queryParameters?.githubRepositoryIdsOrQueries || []);

  const onRepositoriesChange = (repositories: Array<(number | string)>) => {
    setSelectedRepositories(repositories);
    onChange({
      ...query,
      endpoint: 'sast/events',
      queryParameters: { ...query.queryParameters, githubRepositoryIdsOrQueries: repositories },
    });
    onRunQuery();
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
        label="Repository Filter"
        description="Query to filter for only the vulnerabilities from the specified repositories. Select one or more repositories or enter your repository ID(s) below."
      >
        <RepositoryField
          getRepositories={props.datasource.getRepositories.bind(props.datasource)}
          selectedRepositoryIdsOrQueries={selectedRepositories}
          setSelectedRepositoryIdsOrQueries={onRepositoriesChange}
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
