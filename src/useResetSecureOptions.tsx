import { useCallback } from 'react';
import type { NullifySecureJsonData } from 'types';
import type { DataSourcePluginOptionsEditorProps } from '@grafana/data';

type OnChangeType = () => void;

export function useResetSecureOptions(props: DataSourcePluginOptionsEditorProps, propertyName: keyof NullifySecureJsonData): OnChangeType {
  const { onOptionsChange, options } = props;

  return useCallback(() => {
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        [propertyName]: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        [propertyName]: '',
      },
    });
  }, [onOptionsChange, options, propertyName]);
}
