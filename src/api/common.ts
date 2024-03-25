import { z } from 'zod';

export const FileOwnerSchema = z.object({
  name: z.string(),
  type: z.string(),
});
export type FileOwner = z.infer<typeof FileOwnerSchema>


export const RepositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  fullName: z.string(),
  visibility: z.string(),
  owner: z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    type: z.string(),
  }),
});
export type Repository = z.infer<typeof RepositorySchema>
