import React, { ChangeEvent, useState } from 'react';
import { Field, Input, Switch } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { NullifyDataSource } from '../../datasource';
import { NullifyDataSourceOptions, NullifyQueryOptions } from '../../types';
import { RepositoryField } from 'components/Fields/RepositoryField';

type Props = QueryEditorProps<NullifyDataSource, NullifyQueryOptions, NullifyDataSourceOptions>;

export function SecretsSummarySubquery(props: Props) {
  const { query, onChange, onRunQuery } = props;
  const [selectedRepositoryIds, setSelectedRepositoryIds] = useState<number[]>([]);

  const onRepoIdsChange = (respositoryIds: number[]) => {
    setSelectedRepositoryIds(respositoryIds);
    onChange({
      ...query,
      endpoint: 'secrets/summary',
      queryParameters: { ...query.queryParameters, githubRepositoryIds: respositoryIds },
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

  const onTypeChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...query,
      endpoint: 'secrets/summary',
      queryParameters: { ...query.queryParameters, type: event.target.value },
    });
  };

  const onAllowlistedChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...query,
      endpoint: 'secrets/summary',
      queryParameters: { ...query.queryParameters, allowlisted: event.target.checked },
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
          selectedRepositoryIds={selectedRepositoryIds}
          setSelectedRepositoryIds={onRepoIdsChange}
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
      <Field label="Type Filter" description="Query to filter for only the specified type.">
        <Input
          onChange={onTypeChange}
          placeholder="new-finding"
          onBlur={onRunQuery}
          value={query.queryParameters?.type || ''}
        />
      </Field>

      <Field label="Include allowlisted secrets?" description="Query to filter include/exclude allowlisted secrets. Default: enabled">
        <Switch value={query.queryParameters.allowlisted ?? true} onChange={onAllowlistedChange} />
      </Field>
    </>
  ) : (
    <></>
  );
}
