import { z } from 'zod';

export const SecretsScannerFindingEvent = z.object({
  id: z.string(),
  secretType: z.string(),
  filePath: z.string(),
  author: z.string(),
  commit: z.string(),
  timeStamp: z.string(),
  ruleId: z.string(),
  entropy: z.number(),
  startLine: z.number(),
  endLine: z.number(),
  startColumn: z.number(),
  endColumn: z.number(),
  secretHash: z.string(),
  hyperlink: z.string(),
  isBranchHead: z.boolean(),
  branches: z.array(z.string()).nullable(),
  firstCommitTimestamp: z.string(),
  isAllowlisted: z.boolean(),
});
