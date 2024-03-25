import React, { useState } from 'react';
import { Field, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { NullifyDataSource } from '../../datasource';
import { NullifyDataSourceOptions, NullifyQueryOptions } from '../../types';
import { RepositoryField } from 'components/Fields/RepositoryField';
import { OwnerField } from 'components/Fields/OwnersField';

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
  const [selectedRepositories, setSelectedRepositories] = useState<Array<number | string>>(
    query.endpoint === 'sast/summary' ? query.queryParameters?.githubRepositoryIdsOrQueries || [] : []
  );
  const [selectedOwners, setSelectedOwners] = useState<string[]>(
    query.endpoint === 'sast/summary' ? query.queryParameters?.ownerNamesOrQueries || [] : []
  );

  const onRepositoriesChange = (repositories: Array<number | string>) => {
    setSelectedRepositories(repositories);
    onChange({
      ...query,
      endpoint: 'sast/summary',
      queryParameters: { ...query.queryParameters, githubRepositoryIdsOrQueries: repositories },
    });
    onRunQuery();
  };

  const onOwnersChange = (owners: string[]) => {
    setSelectedOwners(owners);
    onChange({
      ...query,
      endpoint: 'sast/summary',
      queryParameters: { ...query.queryParameters, ownerNamesOrQueries: owners },
    });
    onRunQuery();
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
        label="Repository Filter"
        description="Query to filter for only the vulnerabilities from the specified repositories. Select one or more repositories or enter your repository ID(s) below."
      >
        <RepositoryField
          getRepositories={props.datasource.getRepositories.bind(props.datasource)}
          selectedRepositoryIdsOrQueries={selectedRepositories}
          setSelectedRepositoryIdsOrQueries={onRepositoriesChange}
        />
      </Field>
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
