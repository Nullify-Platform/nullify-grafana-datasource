import React from 'react';
import { DataSourceHttpSettings, Field, FieldSet, InlineField, Input, SecretInput, SecretTextArea } from '@grafana/ui';
import type { NullifyDataSourceOptions } from '../types';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { useChangeOptions } from '../useChangeOptions';
import { useChangeSecureOptions } from '../useChangeSecureOptions';
import { useResetSecureOptions } from '../useResetSecureOptions';

interface Props extends DataSourcePluginOptionsEditorProps<NullifyDataSourceOptions> {}

export const ConfigEditor: React.FC<Props> = (props: any) => {
  const { jsonData, secureJsonData, secureJsonFields } = props.options;
  const onUrlChange = useChangeOptions(props, 'apiHostUrl');
  const onGithubOwnerIdChange = useChangeOptions(props, 'githubOwnerId');
  const onApiKeyChange = useChangeSecureOptions(props, 'apiKey');
  const onResetApiKey = useResetSecureOptions(props, 'apiKey');

  return (
    <>
      <FieldSet label="Nullify API Settings">
        <Field
          label="Nullify API Host URL"
          description="URL endpoint host name for the Nullify API. E.g. https://api.YOUR_COMPANY_NAME.nullify.ai"
        >
          <Input
            onChange={onUrlChange}
            placeholder="https://api.YOUR_COMPANY_NAME.nullify.ai"
            value={jsonData?.apiHostUrl ?? ''}
          />
        </Field>
        <Field
          label="GitHub Owner ID"
          description="Globally unique GitHub ID for individual/organization accounts. ID available at: https://api.github.com/users/YOUR_GITHUB_USERNAME"
        >
          <Input onChange={onGithubOwnerIdChange} placeholder="1234" value={jsonData?.githubOwnerId ?? ''} />
        </Field>
        <Field
          label="Nullify API Key"
          description="API key to access Nullify API endpoints. This key is a securely stored secret and used by the backend only. API Docs: https://docs.nullify.ai/api-reference/nullify-api"
        >
          <SecretTextArea
            isConfigured={Boolean(secureJsonFields.apiKey)}
            value={secureJsonData?.apiKey || ''}
            placeholder="eyJ..."
            cols={200}
            rows={10}
            onReset={onResetApiKey}
            onChange={onApiKeyChange}
          />
        </Field>
      </FieldSet>
    </>
  );
};
