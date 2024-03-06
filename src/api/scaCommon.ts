import { z } from 'zod';

const ScaEventsCve = z.object({
  id: z.string().optional(),
  epss: z.number().optional(),
  epssPercentile: z.number().optional(),
  cisaKev: z.boolean().optional(),
  cvss: z.number().optional(),
  priority: z.string().optional(),
  severity: z.string().optional(),
});

const ScaEventsVulnerability = z.object({
  hasFix: z.boolean().optional(),
  title: z.string().optional(),
  details: z.string().optional(),
  severity: z.string().optional(),
  cves: z.array(ScaEventsCve).optional().nullable(),
  cwes: z.array(z.string()).optional().nullable(),
  introduced: z.string().optional(),
  fixed: z.string().optional(),
  version: z.string().optional(),
  references: z.array(z.string()).optional().nullable(),
});

export const ScaEventsDependencyFinding = z.object({
  id: z.string().optional(),
  isDirect: z.boolean().optional(),
  package: z.string().optional(),
  packageFilePath: z.string().optional(),
  version: z.string().optional(),
  filePath: z.string().optional(),
  line: z.number().optional(),
  numCritical: z.number().default(0),
  numHigh: z.number().default(0),
  numMedium: z.number().default(0),
  numLow: z.number().default(0),
  numUnknown: z.number().default(0),
  vulnerabilities: z.array(ScaEventsVulnerability).optional().nullable(),
});
