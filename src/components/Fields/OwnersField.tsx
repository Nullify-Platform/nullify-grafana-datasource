import { SelectableValue, TypedVariableModel } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import { MultiSelect } from '@grafana/ui';
import { Organization } from 'api/common';
import React, { useEffect, useRef, useState } from 'react';
import { NullifyVariableQuery, NullifyVariableQueryType, OwnerEntity, OwnerEntityType } from 'types';

export interface OwnerFieldProps {
  getOwnerEntities: () => Promise<OwnerEntity[] | null>;
  selectedOwnerNamesOrQueries: string[];
  setSelectedOwnerNamesOrQueries: (selectedOwners: string[]) => void;
}

export const OwnerField = (props: OwnerFieldProps) => {
  const [selectedValues, setSelectedValues] = useState<Array<SelectableValue<string>>>(
    props.selectedOwnerNamesOrQueries.map((selected) => ({ label: selected.toString(), value: selected }))
  );
  const [customOptions, setCustomOptions] = useState<Array<SelectableValue<string>>>([]);
  const [allOwnerOptions, setAllOwnerOptions] = useState<Array<SelectableValue<string>> | undefined>(undefined);

  const getOwnerEntitiesRef = useRef(props.getOwnerEntities);
  const selectedOwnerNamesOrQueriesRef = useRef(props.selectedOwnerNamesOrQueries);

  const onSelectedValuesChange = (newSelectedValues: Array<SelectableValue<string>>) => {
    setSelectedValues(newSelectedValues);
    const selectedOwners = newSelectedValues
      .map((selectable) => selectable.value)
      .filter((ownerNameOrQuery): ownerNameOrQuery is string => ownerNameOrQuery !== undefined);
    props.setSelectedOwnerNamesOrQueries(selectedOwners);
  };

  useEffect(() => {
    const formatOwnerSelectableValue = (owner: OwnerEntity): SelectableValue<string> => {
      return { label: `${owner.name} (${owner.type})`, value: owner.name };
    };
    const formatVariableSelectableValue = (variableName: string): SelectableValue<string> => {
      return { label: `$${variableName}`, value: `$${variableName}` };
    };

    const variables: TypedVariableModel[] = getTemplateSrv()
      .getVariables()
      .filter(
        (variable) =>
          variable.type === 'query' &&
          (variable.query as NullifyVariableQuery).queryType === NullifyVariableQueryType.Owner
      );

    getOwnerEntitiesRef
      .current()
      .then((ownerEntities) => {
        if (ownerEntities) {
          setAllOwnerOptions([
            ...variables.map((variable) => formatVariableSelectableValue(variable.id)),
            ...ownerEntities.map(formatOwnerSelectableValue),
          ]);

          setSelectedValues([
            ...variables
              .map((variable) => formatVariableSelectableValue(variable.id))
              .filter((selectableValue) =>
                selectedOwnerNamesOrQueriesRef.current.includes(selectableValue.value || '')
              ),
            ...ownerEntities
              .map(formatOwnerSelectableValue)
              .filter((selectableValue) =>
                selectedOwnerNamesOrQueriesRef.current.includes(selectableValue.value || '')
              ),
          ]);
        } else {
          setAllOwnerOptions([]);
        }
      })
      .catch(() => {
        setAllOwnerOptions([]);
      });
  }, []);

  return (
    <>
      <MultiSelect
        options={[...(allOwnerOptions ?? []), ...customOptions]}
        isLoading={allOwnerOptions === undefined}
        closeMenuOnSelect={false}
        placeholder="Select owners or enter a team name/username"
        noOptionsMessage="No owners found. To query a owner not listed, enter a team name (e.g. my-org/team-name) or username (e.g. my-user)"
        allowCustomValue
        value={selectedValues}
        onChange={onSelectedValuesChange}
        onCreateOption={(optionValue) => {
          setCustomOptions([...customOptions, { value: optionValue, label: optionValue }]);
          onSelectedValuesChange([...selectedValues, { value: optionValue, label: optionValue }]);
        }}
      />
    </>
  );
};
