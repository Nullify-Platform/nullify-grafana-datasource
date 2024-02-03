import React from 'react';
import { FieldSet, InlineField, Input, LegacyForms } from '@grafana/ui';
import type { MyDataSourceOptions } from './types';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { useChangeOptions } from './useChangeOptions';
import { useChangeSecureOptions } from './useChangeSecureOptions';
import { useResetSecureOptions } from './useResetSecureOptions';

const { SecretFormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

export const ConfigEditor: React.FC<Props> = (props: any) => {
  const { jsonData, secureJsonData, secureJsonFields } = props.options;
  const onUrlChanged = useChangeOptions(props, 'url');
  const onGithubOwnerIdChanged = useChangeOptions(props, 'githubOwnerId');
  const onApiKeyChange = useChangeSecureOptions(props, 'apiKey');
  const onResetApiKey = useResetSecureOptions(props, 'apiKey');

  return (
    <>
      <FieldSet label="General">
        <InlineField label="Url" tooltip="Url endpoint">
          <Input
            onChange={onUrlChanged}
            placeholder="url"
            value={jsonData?.url ?? ''}
          />
        </InlineField>
        <InlineField label="Github Owner Id" tooltip="Github owner id">
          <Input
            onChange={onGithubOwnerIdChanged}
            placeholder="1234"
            value={jsonData?.githubOwnerId ?? ''}
          />
        </InlineField>
      </FieldSet>
      <FieldSet label="API Settings">
        <SecretFormField
          tooltip="API Key used to make calls to your data source"
          isConfigured={Boolean(secureJsonFields.apiKey)}
          value={secureJsonData?.apiKey || ''}
          label="API Key"
          placeholder="secure json field (backend only)"
          labelWidth={6}
          inputWidth={20}
          onReset={onResetApiKey}
          onChange={onApiKeyChange}
        />
      </FieldSet>
    </>
  );};
