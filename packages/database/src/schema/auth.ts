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

export const organizationThemeColorKeys = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "chart-6",
] as const;

export const organizationThemePaletteCountKeys = ["1", "2", "3", "4", "5", "6"] as const;

export type ThemeChartColors = Partial<Record<(typeof organizationThemeColorKeys)[number], string>>;
export type ThemeChartColorPalettes = Partial<
  Record<(typeof organizationThemePaletteCountKeys)[number], ThemeChartColors>
>;

export type ThemeItem = {
  name: string;
  chartColors?: ThemeChartColors;
  chartColorPalettes?: ThemeChartColorPalettes;
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
    banExpires: timestamp("ban_expires"),
  },
  (table) => [uniqueIndex("emailUniqueIndex").on(sql`lower(${table.email})`)]
);

export const session = pgTable("sessions", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  expiresAt: timestamp("expires_at").notNull(),
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
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
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

export const organizationThemeColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, {
    error: "Theme colors must be 6-digit hex values.",
  })
  .transform((value) => value.toLowerCase());

export const themeChartColorsSchema = z
  .object({
    "chart-1": organizationThemeColorSchema.optional(),
    "chart-2": organizationThemeColorSchema.optional(),
    "chart-3": organizationThemeColorSchema.optional(),
    "chart-4": organizationThemeColorSchema.optional(),
    "chart-5": organizationThemeColorSchema.optional(),
    "chart-6": organizationThemeColorSchema.optional(),
  })
  .strict();

export const themeChartColorPalettesSchema = z
  .object({
    "1": themeChartColorsSchema.optional(),
    "2": themeChartColorsSchema.optional(),
    "3": themeChartColorsSchema.optional(),
    "4": themeChartColorsSchema.optional(),
    "5": themeChartColorsSchema.optional(),
    "6": themeChartColorsSchema.optional(),
  })
  .strict();

export const themeItemSchema = z.object({
  name: z.string(),
  chartColors: themeChartColorsSchema.optional(),
  chartColorPalettes: themeChartColorPalettesSchema.optional(),
});

export const organizationSettingsSchema = z
  .object({
    themes: z.array(themeItemSchema).optional(),
  })
  .optional();

export const insertOrganizationSchema = createInsertSchema(organization).extend({
  settings: organizationSettingsSchema.nullable().optional(),
});
export const selectOrganizationSchema = createSelectSchema(organization).extend({
  settings: organizationSettingsSchema.nullable().optional(),
});
export const updateOrganizationSchema = createUpdateSchema(organization).extend({
  settings: organizationSettingsSchema.nullable().optional(),
});

export type CreateOrganizationData = z.infer<typeof insertOrganizationSchema>;
export type Organization = z.infer<typeof selectOrganizationSchema>;
export type UpdateOrganizationData = z.infer<typeof updateOrganizationSchema>;

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
