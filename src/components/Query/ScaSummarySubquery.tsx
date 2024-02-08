import React, { ChangeEvent } from 'react';
import { Field, Input } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { NullifyDataSource } from '../../datasource';
import { NullifyDataSourceOptions, NullifyQueryOptions } from '../../types';

type Props = QueryEditorProps<NullifyDataSource, NullifyQueryOptions, NullifyDataSourceOptions>;

export function ScaSummarySubquery(props: Props) {
  const { query, onChange, onRunQuery } = props;

  const onRepoIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...query,
      endpoint: 'sca/summary',
      queryParameters: { ...query.queryParameters, githubRepositoryId: event.target.value },
    });
  };

  const onPackageChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...query,
      endpoint: 'sca/summary',
      queryParameters: { ...query.queryParameters, package: event.target.value },
    });
  };

  return query.endpoint === 'sca/summary' ? (
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
      <Field label="Package Filter" description="Query to filter for only the specified package.">
        <Input
          onChange={onPackageChange}
          placeholder="react"
          onBlur={onRunQuery}
          value={query.queryParameters?.package || ''}
        />
      </Field>
    </>
  ) : (
    <></>
  );
}
