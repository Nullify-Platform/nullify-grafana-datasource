import React, { useEffect, useState } from 'react';
import { NullifyVariableQuery, VariableQueryType } from '../types';

interface VariableQueryProps {
  query: NullifyVariableQuery;
  onChange: (query: NullifyVariableQuery, definition: string) => void;
}

export const VariableQueryEditor = ({ onChange, query }: VariableQueryProps) => {
  useEffect(() => {
    onChange({ queryType: VariableQueryType.Repository }, `Nullify ${VariableQueryType.Repository} Query`);
  }, [onChange]);

  return (
    <>
      This query variable enables the creation of a dashboard-wide filter for repositories.
      {/* ADD SELECTOR FOR OTHER QUERY TYPES (e.g. Repo/Branch/Team) */}
    </>
  );
};
