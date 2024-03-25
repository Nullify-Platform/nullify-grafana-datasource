import React, { useEffect, useState } from 'react';
import { NullifyVariableQuery, NullifyVariableQueryType } from '../types';
import { SelectableValue } from '@grafana/data';
import { Field, Select } from '@grafana/ui';

interface VariableQueryProps {
  query: NullifyVariableQuery;
  onChange: (query: NullifyVariableQuery, definition: string) => void;
}

export const VariableQueryEditor = ({ onChange, query }: VariableQueryProps) => {
  const queryTypeToSelectableValue = (
    queryType: NullifyVariableQueryType
  ): SelectableValue<NullifyVariableQueryType> => {
    return { label: queryType, value: queryType };
  };

  const variableOptions: Array<SelectableValue<NullifyVariableQueryType>> =
    Object.values(NullifyVariableQueryType).map(queryTypeToSelectableValue);

  const [variableSelection, setVariableSelection] = useState<SelectableValue<NullifyVariableQueryType> | null>(
    queryTypeToSelectableValue(query.queryType)
  );

  return (
    <>
      <Field label="Query Type" description="Select which type of data this variable should query for">
        <Select
          options={variableOptions}
          value={variableSelection}
          onChange={(selection) => {
            setVariableSelection(selection);
            if (selection.value) {
              onChange({ queryType: selection.value }, `Nullify ${selection.value} Query`);
            }
          }}
        />
      </Field>
    </>
  );
};
