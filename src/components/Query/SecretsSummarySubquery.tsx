import React, { ChangeEvent, useState } from 'react';
import { Field, Input, Switch } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { NullifyDataSource } from '../../datasource';
import { NullifyDataSourceOptions, NullifyQueryOptions } from '../../types';
import { RepositoryField } from 'components/Fields/RepositoryField';

type Props = QueryEditorProps<NullifyDataSource, NullifyQueryOptions, NullifyDataSourceOptions>;

export function SecretsSummarySubquery(props: Props) {
  const { query, onChange, onRunQuery } = props;
  const [selectedRepositories, setSelectedRepositories] = useState<Array<(number | string)>>(query.queryParameters?.githubRepositoryIdsOrQueries || []);

  const onRepositoriesChange = (repositories: Array<(number | string)>) => {
    setSelectedRepositories(repositories);
    onChange({
      ...query,
      endpoint: 'secrets/summary',
      queryParameters: { ...query.queryParameters, githubRepositoryIdsOrQueries: repositories },
    });
    onRunQuery();
  };

  const onBranchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...query,
      endpoint: 'secrets/summary',
      queryParameters: { ...query.queryParameters, branch: event.target.value },
    });
  };

  const onSecretTypeChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...query,
      endpoint: 'secrets/summary',
      queryParameters: { ...query.queryParameters, secretType: event.target.value },
    });
  };

  const onAllowlistedChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...query,
      endpoint: 'secrets/summary',
      queryParameters: { ...query.queryParameters, isAllowlisted: event.target.checked },
    });
  };

  return query.endpoint === 'secrets/summary' ? (
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
      <Field label="Branch Filter" description="Query to filter for only the specified branch.">
        <Input
          onChange={onBranchChange}
          placeholder="main"
          onBlur={onRunQuery}
          value={query.queryParameters?.branch || ''}
        />
      </Field>
      <Field label="Secret Type Filter" description="Query to filter for only the specified type.">
        <Input
          onChange={onSecretTypeChange}
          placeholder="generic-api-key"
          onBlur={onRunQuery}
          value={query.queryParameters?.secretType || ''}
        />
      </Field>

      <Field label="Include allowlisted secrets?" description="Query to filter include/exclude allowlisted secrets. Default: enabled">
        <Switch value={query.queryParameters.isAllowlisted ?? true} onChange={onAllowlistedChange} />
      </Field>
    </>
  ) : (
    <></>
  );
}
