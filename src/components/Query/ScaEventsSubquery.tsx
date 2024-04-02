import React, { ChangeEvent, FormEvent, useState } from 'react';
import { Checkbox, Field, Input, VerticalGroup } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { NullifyDataSource } from '../../datasource';
import { NullifyDataSourceOptions, NullifyQueryOptions, ScaEventTypeDescriptions } from '../../types';
import { RepositoryField } from 'components/Fields/RepositoryField';
import { OwnerField } from 'components/Fields/OwnersField';

type Props = QueryEditorProps<NullifyDataSource, NullifyQueryOptions, NullifyDataSourceOptions>;

const ScaEventTypeOptions: Array<SelectableValue<string>> = Object.entries(ScaEventTypeDescriptions).map(
  ([value, label]) => ({ value, label })
);

export function ScaEventsSubquery(props: Props) {
  const { query, onChange, onRunQuery } = props;
  const [selectedRepositories, setSelectedRepositories] = useState<Array<number | string>>(
    query.endpoint === 'sca/events' ? query.queryParameters?.githubRepositoryIdsOrQueries || [] : []
  );
  const [selectedOwners, setSelectedOwners] = useState<string[]>(
    query.endpoint === 'sca/events' ? query.queryParameters?.ownerNamesOrQueries || [] : []
  );

  const onRepositoriesChange = (repositories: Array<number | string>) => {
    setSelectedRepositories(repositories);
    onChange({
      ...query,
      endpoint: 'sca/events',
      queryParameters: { ...query.queryParameters, githubRepositoryIdsOrQueries: repositories },
    });
    onRunQuery();
  };

  const onOwnersChange = (owners: string[]) => {
    setSelectedOwners(owners);
    onChange({
      ...query,
      endpoint: 'sca/events',
      queryParameters: { ...query.queryParameters, ownerNamesOrQueries: owners },
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
        label="Owner Filter"
        description="Query to filter for only the vulnerabilities that belong to a specified owner. Select one or more owners or enter a username/team name below."
      >
        <OwnerField
          getOwnerEntities={props.datasource.getOwnerEntities.bind(props.datasource)}
          selectedOwnerNamesOrQueries={selectedOwners}
          setSelectedOwnerNamesOrQueries={onOwnersChange}
        />
      </Field>
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
