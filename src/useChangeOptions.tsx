import { ChangeEvent, useCallback } from 'react';
import type { NullifyDataSourceOptions } from 'types';
import type { DataSourcePluginOptionsEditorProps } from '@grafana/data';

type OnChangeType = (event: ChangeEvent<HTMLInputElement>) => void;

export function useChangeOptions(props: DataSourcePluginOptionsEditorProps, propertyName: keyof NullifyDataSourceOptions): OnChangeType {
  const { onOptionsChange, options } = props;

  return useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onOptionsChange({
        ...options,
        jsonData: {
          ...options.jsonData,
          [propertyName]: event.target.value,
        },
      });
    },
    [onOptionsChange, options, propertyName]
  );
}
