import { ChangeEvent, useCallback } from 'react';
import type { MySecureJsonData } from 'types';
import type { DataSourcePluginOptionsEditorProps } from '@grafana/data';

type OnChangeType = (event: ChangeEvent<HTMLInputElement>) => void;

export function useChangeSecureOptions(props: DataSourcePluginOptionsEditorProps, propertyName: keyof MySecureJsonData): OnChangeType {
  const { onOptionsChange, options } = props;

  return useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onOptionsChange({
        ...options,
        secureJsonData: {
          ...options.secureJsonData,
          [propertyName]: event.target.value,
        },
      });
    },
    [onOptionsChange, options, propertyName]
  );
}
