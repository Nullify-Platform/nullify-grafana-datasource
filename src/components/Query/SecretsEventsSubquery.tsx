import React, { ChangeEvent, FormEvent, useState } from 'react';
import { Checkbox, Field, Input, VerticalGroup } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { NullifyDataSource } from '../../datasource';
import { NullifyDataSourceOptions, NullifyQueryOptions } from '../../types';
import { RepositoryField } from 'components/Fields/RepositoryField';

type Props = QueryEditorProps<NullifyDataSource, NullifyQueryOptions, NullifyDataSourceOptions>;

const SecretsEventTypeOptions: Array<SelectableValue<string>> = [
  { value: 'new-finding', label: 'New Finding' },
  { value: 'new-findings', label: 'New Findings' },
  { value: 'new-allowlisted-finding', label: 'New Allowlisted Finding' },
  { value: 'new-allowlisted-findings', label: 'New Allowlisted Findings' },
];

export function SecretsEventsSubquery(props: Props) {
  const { query, onChange, onRunQuery } = props;
  const [selectedRepositories, setSelectedRepositories] = useState<Array<(number | string)>>(query.queryParameters?.githubRepositoryIdsOrQueries || []);

  const onRepositoriesChange = (repositories: Array<(number | string)>) => {
    setSelectedRepositories(repositories);
    onChange({
      ...query,
      endpoint: 'secrets/events',
      queryParameters: { ...query.queryParameters, githubRepositoryIdsOrQueries: repositories },
    });
    onRunQuery();
  };

  const onBranchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...query,
      endpoint: 'secrets/events',
      queryParameters: { ...query.queryParameters, branch: event.target.value },
    });
    onRunQuery();
  };

  return query.endpoint === 'secrets/events' ? (
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
      <Field label="Branch Filter" description="Query to filter for only the secrets in a selected branch.">
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
          {SecretsEventTypeOptions.map(({ value, label }) => {
            const onEventTypeChange = (event: FormEvent<HTMLInputElement>) => {
              const target = event.target as HTMLInputElement;
              const isChecked = target.checked;

              if (value) {
                onChange({
                  ...query,
                  endpoint: 'secrets/events',
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
