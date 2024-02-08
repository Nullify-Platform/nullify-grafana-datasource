import React, { ChangeEvent } from 'react';
import { Field, Input, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { NullifyDataSource } from '../../datasource';
import { NullifyDataSourceOptions, NullifyEndpointPaths, NullifyQueryOptions } from '../../types';

type Props = QueryEditorProps<NullifyDataSource, NullifyQueryOptions, NullifyDataSourceOptions>;

export function SecretsEventsSubquery(props: Props) {
  const { query, onChange, onRunQuery } = props;

  const onRepoIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...query,
      endpoint: 'secrets/events',
      queryParameters: { ...query.queryParameters, githubRepositoryId: event.target.value },
    });
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
        label="Repository ID Filter"
        description="Query to filter for only the secrets from the specified GitHub repository ID. Leave blank to query for all repositories."
      >
        <Input
          onChange={onRepoIdChange}
          placeholder="1234"
          onBlur={onRunQuery}
          value={query.queryParameters?.githubRepositoryId || ''}
        />
      </Field>
      <Field
        label="Branch Filter"
        description="Query to filter for only the secrets in a selected branch."
      >
        <Input
          onChange={onBranchChange}
          placeholder="main"
          onBlur={onRunQuery}
          value={query.queryParameters?.branch || ''}
        />
      </Field>
        {/* Add event type filter? */}
    </>
  ) : (
    <></>
  );
}
