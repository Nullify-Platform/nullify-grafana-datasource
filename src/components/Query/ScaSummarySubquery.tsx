import React, { ChangeEvent, useState } from 'react';
import { Field, Input } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { NullifyDataSource } from '../../datasource';
import { NullifyDataSourceOptions, NullifyQueryOptions } from '../../types';
import { RepositoryField } from 'components/Fields/RepositoryField';

type Props = QueryEditorProps<NullifyDataSource, NullifyQueryOptions, NullifyDataSourceOptions>;

export function ScaSummarySubquery(props: Props) {
  const { query, onChange, onRunQuery } = props;
  const [selectedRepositoryIds, setSelectedRepositoryIds] = useState<number[]>([]);

  const onRepoIdsChange = (respositoryIds: number[]) => {
    setSelectedRepositoryIds(respositoryIds);
    onChange({
      ...query,
      endpoint: 'sca/summary',
      queryParameters: { ...query.queryParameters, githubRepositoryIds: respositoryIds },
    });
    onRunQuery();
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
        label="Repository Filter"
        description="Query to filter for only the vulnerabilities from the specified repositories. Select one or more repositories or enter your repository ID(s) below."
      >
        <RepositoryField
          getRepositories={props.datasource.getRepositories.bind(props.datasource)}
          selectedRepositoryIds={selectedRepositoryIds}
          setSelectedRepositoryIds={onRepoIdsChange}
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
