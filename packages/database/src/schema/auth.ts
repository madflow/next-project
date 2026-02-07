import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

export type ThemeItem = {
  name: string;
  chartColors?: Record<string, string>;
};

export type OrganizationSettings = {
  themes?: ThemeItem[];
};

export const user = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    role: varchar("role", { length: 50 }),
    locale: varchar("locale", { length: 2 }),
    banned: boolean("banned"),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires", { withTimezone: true }),
  },
  (table) => [uniqueIndex("emailUniqueIndex").on(sql`lower(${table.email})`)]
);

export const session = pgTable("sessions", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
  activeOrganizationId: text("active_organization_id"),
});

export const account = pgTable("accounts", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  accountId: uuid("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const organization = pgTable(
  "organizations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    logo: text("logo"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    metadata: text("metadata"),
    settings: jsonb("settings").$type<OrganizationSettings>(),
  },
  (table) => [
    check("organization_slug_check", sql`${table.slug} ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'`),
    check(
      "organization_slug_reserved",
      sql`${table.slug} NOT IN ('admin', 'api', 'auth', 'landing', 'goodbye', '_next', 'public', 'user')`
    ),
  ]
);

export const member = pgTable(
  "members",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [unique().on(table.organizationId, table.userId, table.role)]
);

export const invitation = pgTable("invitations", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  inviterId: uuid("inviter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const verification = pgTable("verifications", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const rateLimit = pgTable("rate_limits", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  key: text("key"),
  count: integer("count"),
  lastRequest: bigint("last_request", { mode: "number" }),
});

export const authSchema = {
  account,
  invitation,
  member,
  organization,
  rateLimit,
  session,
  user,
  verification,
};

export type AuthUser = typeof user.$inferSelect;

export const insertOrganizationSchema = createInsertSchema(organization);
export const selectOrganizationSchema = createSelectSchema(organization);
export const updateOrganizationSchema = createUpdateSchema(organization);

export type CreateOrganizationData = z.infer<typeof insertOrganizationSchema>;
export type Organization = z.infer<typeof selectOrganizationSchema>;
export type UpdateOrganizationData = z.infer<typeof updateOrganizationSchema>;

// Organization settings schemas
export const themeItemSchema = z.object({
  name: z.string(),
  chartColors: z.record(z.string(), z.string()).optional(),
});

export const organizationSettingsSchema = z
  .object({
    themes: z.array(themeItemSchema).optional(),
  })
  .optional();

export const insertMemberSchema = createInsertSchema(member);
export const selectMemberSchema = createSelectSchema(member);
export const updateMemberSchema = createUpdateSchema(member);

export type Member = z.infer<typeof selectMemberSchema>;
export type CreateMemberData = z.infer<typeof insertMemberSchema>;
export type UpdateMemberData = z.infer<typeof updateMemberSchema>;

export const insertUserSchema = createInsertSchema(user);
export const selectUserSchema = createSelectSchema(user);
export const updateUserSchema = createUpdateSchema(user);

export type CreateUserData = z.infer<typeof insertUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
export type User = z.infer<typeof selectUserSchema>;
