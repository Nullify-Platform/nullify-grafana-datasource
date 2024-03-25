import { SelectableValue, TypedVariableModel } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import { MultiSelect } from '@grafana/ui';
import { Repository } from 'api/common';
import React, { useEffect, useRef, useState } from 'react';

export interface RepositoryFieldProps {
  getRepositories: () => Promise<Repository[] | null>;
  selectedRepositoryIdsOrQueries: Array<number | string>;
  setSelectedRepositoryIdsOrQueries: (selectedRepositories: Array<number | string>) => void;
}

export const RepositoryField = (props: RepositoryFieldProps) => {
  const [selectedValues, setSelectedValues] = useState<Array<SelectableValue<number | string>>>(
    props.selectedRepositoryIdsOrQueries.map((selected) => ({ label: selected.toString(), value: selected }))
  );
  const [customOptions, setCustomOptions] = useState<Array<SelectableValue<number>>>([]);
  const [allRepositoryOptions, setAllRepositoryOptions] = useState<Array<SelectableValue<number | string>> | undefined>(
    undefined
  );

  const getRepositoriesRef = useRef(props.getRepositories);
  const selectedRepositoryIdsOrQueriesRef = useRef(props.selectedRepositoryIdsOrQueries);

  const onSelectedValuesChange = (newSelectedValues: Array<SelectableValue<number | string>>) => {
    setSelectedValues(newSelectedValues);
    const selectedRepositories = newSelectedValues
      .map((selectable) => selectable.value)
      .filter((repoIdOrQuery): repoIdOrQuery is string | number => repoIdOrQuery !== undefined);
    props.setSelectedRepositoryIdsOrQueries(selectedRepositories);
  };

  useEffect(() => {
    const formatRepositorySelectableValue = (repo: Repository): SelectableValue<number> => {
      return { label: `${repo.name} (${repo.id})`, value: repo.id };
    };
    const formatVariableSelectableValue = (variableName: string): SelectableValue<string> => {
      return { label: `$${variableName}`, value: `$${variableName}` };
    };

    const variables: TypedVariableModel[] = getTemplateSrv().getVariables();

    getRepositoriesRef
      .current()
      .then((repos) => {
        if (repos) {
          setAllRepositoryOptions([
            ...variables.map((variable) => formatVariableSelectableValue(variable.id)),
            ...repos.map(formatRepositorySelectableValue),
          ]);
          setSelectedValues([
            ...variables
              .map((variable) => formatVariableSelectableValue(variable.id))
              .filter((selectableValue) =>
                selectedRepositoryIdsOrQueriesRef.current.includes(selectableValue.value || '')
              ),
            ...repos
              .map(formatRepositorySelectableValue)
              .filter((selectableValue) =>
                selectedRepositoryIdsOrQueriesRef.current.includes(selectableValue.value || '')
              ),
          ]);
        } else {
          setAllRepositoryOptions([]);
        }
      })
      .catch(() => {
        setAllRepositoryOptions([]);
      });
  }, []);

  return (
    <>
      <MultiSelect
        options={[...(allRepositoryOptions ?? []), ...customOptions]}
        isLoading={allRepositoryOptions === undefined}
        closeMenuOnSelect={false}
        placeholder="Select repositories or enter a repository ID"
        noOptionsMessage="No repositories found. To query a repository not listed, enter the repository ID number."
        allowCustomValue
        value={selectedValues}
        onChange={onSelectedValuesChange}
        isValidNewOption={(inputValue) => {
          return !isNaN(Number(inputValue)) && Number(inputValue) !== 0;
        }}
        onCreateOption={(optionValue) => {
          const optionNumber = Number(optionValue);
          setCustomOptions([...customOptions, { value: optionNumber, label: `${optionNumber}` }]);
          onSelectedValuesChange([...selectedValues, { value: optionNumber, label: `${optionNumber}` }]);
        }}
      />
    </>
  );
};
