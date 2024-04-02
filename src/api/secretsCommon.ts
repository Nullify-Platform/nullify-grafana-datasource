import { z } from 'zod';
import { FileOwnerSchema } from './common';

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
  repository: z.string(),
  branch: z.string(),
  firstCommitTimestamp: z.string(),
  isAllowlisted: z.boolean(),
  fileOwners: z.array(FileOwnerSchema).nullable(),
});
