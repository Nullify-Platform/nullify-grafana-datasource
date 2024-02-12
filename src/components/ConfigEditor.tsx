import React from 'react';
import { Field, FieldSet, Input, SecretTextArea } from '@grafana/ui';
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
          description="URL endpoint host name for the Nullify API. E.g. https://api.YOUR_NULLIFY_ID.nullify.ai"
        >
          <Input
            onChange={onUrlChange}
            placeholder="https://api.YOUR_NULLIFY_ID.nullify.ai"
            value={jsonData?.apiHostUrl ?? ''}
          />
        </Field>
        <Field
          label="GitHub Owner ID"
          description="Globally unique numerical GitHub ID for individual/organization accounts. This is not your username nor your organization name. ID available at: https://api.github.com/users/YOUR_GITHUB_USERNAME_OR_ORGANIZATION_NAME"
        >
          <Input onChange={onGithubOwnerIdChange} placeholder="123456789" value={jsonData?.githubOwnerId ?? ''} />
        </Field>
        <Field
          label="Nullify API Key"
          description="API key to access Nullify API endpoints. You can create an API key at: https://app.YOUR_NULLIFY_ID.nullify.ai/. This key is a securely stored secret and used by the backend only. API Docs: https://docs.nullify.ai/api-reference/nullify-api"
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
