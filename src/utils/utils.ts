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
