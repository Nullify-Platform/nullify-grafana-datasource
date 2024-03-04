import { getTemplateSrv } from '@grafana/runtime';

export const prepend_severity_idx = (severity: string) => {
  severity = severity.toUpperCase();
  switch (severity) {
    case 'CRITICAL':
      return `S1 - ${severity}`;
    case 'HIGH':
      return `S2 - ${severity}`;
    case 'MEDIUM':
      return `S3 - ${severity}`;
    case 'LOW':
      return `S4 - ${severity}`;
    default:
      return severity;
  }
};

export const unwrapRepositoryTemplateVariables = (githubRepositoryIdsOrQueries: Array<number | string>) => {
  const repoIds = githubRepositoryIdsOrQueries
    ?.map((idOrQuery) => {
      if (typeof idOrQuery === 'number') {
        return idOrQuery;
      } else {
        return getTemplateSrv()
          .replace(idOrQuery, undefined, 'csv')
          .split(',')
          .map((repoId) => parseInt(repoId, 10))
          .filter((id) => {
            if (Number.isNaN(id)) {
              console.error(`Selection for ${idOrQuery} variable is invalid: ${id}`);
            }
            return !Number.isNaN(id);
          });
      }
    })
    .flat();

  return [...new Set(repoIds)];
};
