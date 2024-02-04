import { ChangeEvent, useCallback } from 'react';
import type { NullifySecureJsonData } from 'types';
import type { DataSourcePluginOptionsEditorProps } from '@grafana/data';

type OnChangeType = (event: ChangeEvent<HTMLTextAreaElement>) => void;

export function useChangeSecureOptions(props: DataSourcePluginOptionsEditorProps, propertyName: keyof NullifySecureJsonData): OnChangeType {
  const { onOptionsChange, options } = props;

  return useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
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
