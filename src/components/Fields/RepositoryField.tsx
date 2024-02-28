import { SelectableValue } from '@grafana/data';
import { MultiSelect } from '@grafana/ui';
import React, { useEffect, useState } from 'react';

export interface Repository {
  id: string;
  name: string;
}

export interface RepositoryFieldProps {
  getRepositories: () => Promise<Repository[] | null>;
  selectedRepositoryIds: number[];
  setSelectedRepositoryIds: (selectedRepositories: number[]) => void;
}

export const RepositoryField = (props: RepositoryFieldProps) => {
  const [selectedValues, setSelectedValues] = useState<Array<SelectableValue<number>>>([]);
  const [customOptions, setCustomOptions] = useState<Array<SelectableValue<number>>>([]);
  const [allRepositoryOptions, setAllRepositoryOptions] = useState<Array<SelectableValue<number>> | undefined>(
    undefined
  );

  useEffect(() => {
    props.getRepositories().then((repos) => {
      if (repos) {
        setAllRepositoryOptions(
          repos.map((repo) => {
            return { label: `${repo.name} (${repo.id})`, value: parseInt(repo.id, 10) };
          })
        );
      } else {
        setAllRepositoryOptions([]);
      }
    });
  });

  return (
    <>
      <MultiSelect
        options={[...(allRepositoryOptions ?? []), ...customOptions]}
        isLoading={allRepositoryOptions === undefined}
        closeMenuOnSelect={false}
        placeholder="Select repositories or enter a repository ID"
        noOptionsMessage="No repositories found. To query a repository not listed, enter the repository ID."
        allowCustomValue
        value={selectedValues}
        onChange={(values) => {
          setSelectedValues(values);
          props.setSelectedRepositoryIds(values.map((value) => value.value ?? -1));
        }}
        isValidNewOption={(inputValue) => {
          return !isNaN(Number(inputValue));
        }}
        onCreateOption={(optionValue) => {
          const optionNumber = Number(optionValue);
          setCustomOptions([...customOptions, { value: optionNumber, label: `${optionNumber}` }]);
          setSelectedValues([...selectedValues, { value: optionNumber, label: `${optionNumber}` }]);
        }}
      />
    </>
  );
};
