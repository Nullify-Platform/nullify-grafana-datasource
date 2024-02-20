import { z } from 'zod';

export const SastFinding = z.object({
  tenantId: z.string(),
  repositoryId: z.string(),
  repository: z.string(),
  branch: z.string(),
  id: z.string(),
  title: z.string(),
  severity: z.string(),
  language: z.string(),
  message: z.string(),
  filePath: z.string(),
  cwe: z.number(),
  ruleId: z.string(),
  ruleUrl: z.string(),
  startLine: z.number(),
  endLine: z.number(),
  isAllowlisted: z.boolean(),
});
