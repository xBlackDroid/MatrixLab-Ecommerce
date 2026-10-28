import { z } from "zod";

export const usernameSchema = z.string().trim().toLowerCase().min(3).max(64).regex(/^[a-z0-9][a-z0-9._-]*$/);
export const passwordSchema = z.string().min(8).max(128);
const identity = { distributorId: z.uuid(), username: usernameSchema };
export const AccessSchema = z.discriminatedUnion("action", [
  z.object({ ...identity, action: z.literal("create"), password: passwordSchema }).strict(),
  z.object({ ...identity, action: z.literal("reset"), password: passwordSchema }).strict(),
  z.object({ ...identity, action: z.literal("disable") }).strict(),
  z.object({ ...identity, action: z.literal("enable") }).strict(),
]);
export type AccessCommand = z.infer<typeof AccessSchema>;
export interface DistributorAccess { username: string; membership_id: string; is_active: boolean; updated_at: string }
