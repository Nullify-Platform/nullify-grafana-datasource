import { z } from 'zod';

export const FileOwnerSchema = z.object({
  name: z.string(),
  type: z.string(),
});
export type FileOwner = z.infer<typeof FileOwnerSchema>;

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
export type Repository = z.infer<typeof RepositorySchema>;

export const TeamSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  privacy: z.string(),
  numMembers: z.number(),
});
export type Team = z.infer<typeof TeamSchema>;

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const OrganizationSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  teams: z.array(TeamSchema),
  members: z.array(UserSchema),
});
export type Organization = z.infer<typeof OrganizationSchema>;
