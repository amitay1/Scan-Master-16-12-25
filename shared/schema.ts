import { pgTable, text, uuid, timestamp, boolean, decimal, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Organizations table (multi-tenant support)
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  domain: text("domain").unique(),
  plan: text("plan").default("free"),
  isActive: boolean("is_active").default(true),
  maxUsers: integer("max_users").default(5),
  maxSheets: integer("max_sheets").default(100),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrganization = typeof organizations.$inferInsert;
export type Organization = typeof organizations.$inferSelect;

// Organization members junction table
export const orgMembers = pgTable("org_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  role: text("role").default("member"),
  invitedBy: uuid("invited_by").references(() => profiles.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const insertOrgMemberSchema = createInsertSchema(orgMembers).omit({
  id: true,
  joinedAt: true,
});
export type InsertOrgMember = typeof orgMembers.$inferInsert;
export type OrgMember = typeof orgMembers.$inferSelect;

// Inspector Profiles table - Enhanced schema for full inspector profile support
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(), // Links to user/session (could be auth user ID or device ID)
  name: text("name").notNull(),
  initials: text("initials").notNull(),
  certificationLevel: text("certification_level").notNull(),
  certificationNumber: text("certification_number").notNull(),
  certifyingOrganization: text("certifying_organization").notNull(),
  employeeId: text("employee_id"),
  department: text("department"),
  email: text("email"),
  phone: text("phone"),
  signature: text("signature"), // Base64 encoded signature image
  isDefault: boolean("is_default").default(false),
  orgId: uuid("org_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProfileSchema = createInsertSchema(profiles, {
  // Allow orgId to be null or undefined for local development
  orgId: (schema) => schema.nullish(),
}).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertProfile = typeof profiles.$inferInsert;
export type Profile = typeof profiles.$inferSelect;

// Technique sheets table
export const techniqueSheets = pgTable("technique_sheets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  orgId: uuid("org_id").references(() => organizations.id),
  sheetName: text("sheet_name").notNull(),
  standard: text("standard"),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: text("created_by"),
  modifiedBy: text("modified_by"),
  status: text("status").default("draft"),
});

// Simple validation schema that allows null orgId for local development
export const insertTechniqueSheetSchema = z.object({
  userId: z.string().uuid(),
  orgId: z.string().uuid().nullable().optional(),
  sheetName: z.string(),
  standard: z.string().nullable().optional(),
  data: z.any(),
  createdBy: z.string().nullable().optional(),
  modifiedBy: z.string().nullable().optional(),
  status: z.string().optional().default("draft"),
});
export type InsertTechniqueSheet = typeof techniqueSheets.$inferInsert;
export type TechniqueSheet = typeof techniqueSheets.$inferSelect;

// Standards table
export const standards = pgTable("standards", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  version: text("version"),
  category: text("category"),
  isFree: boolean("is_free").default(false),
  priceOneTime: decimal("price_one_time", { precision: 10, scale: 2 }),
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }),
  priceAnnual: decimal("price_annual", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  stripeProductId: text("stripe_product_id"),
  stripePriceIdOnetime: text("stripe_price_id_onetime"),
  stripePriceIdMonthly: text("stripe_price_id_monthly"),
  stripePriceIdAnnual: text("stripe_price_id_annual"),
  lemonSqueezyVariantIdOnetime: text("lemon_squeezy_variant_id_onetime"),
  lemonSqueezyVariantIdMonthly: text("lemon_squeezy_variant_id_monthly"),
  lemonSqueezyVariantIdAnnual: text("lemon_squeezy_variant_id_annual"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStandardSchema = createInsertSchema(standards).omit({
  id: true,
  createdAt: true,
});
export type InsertStandard = typeof standards.$inferInsert;
export type Standard = typeof standards.$inferSelect;

// User standard access table
export const userStandardAccess = pgTable("user_standard_access", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  orgId: uuid("org_id").references(() => organizations.id),
  standardId: uuid("standard_id").notNull(),
  accessType: text("access_type").notNull(),
  purchaseDate: timestamp("purchase_date").defaultNow(),
  expiryDate: timestamp("expiry_date"),
  isActive: boolean("is_active").default(true),
  stripePaymentId: text("stripe_payment_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  lemonSqueezyOrderId: text("lemon_squeezy_order_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserStandardAccessSchema = createInsertSchema(userStandardAccess).omit({
  id: true,
  createdAt: true,
});
export type InsertUserStandardAccess = typeof userStandardAccess.$inferInsert;
export type UserStandardAccess = typeof userStandardAccess.$inferSelect;

// Standard bundles table
export const standardBundles = pgTable("standard_bundles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }),
  isActive: boolean("is_active").default(true),
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStandardBundleSchema = createInsertSchema(standardBundles).omit({
  id: true,
  createdAt: true,
});
export type InsertStandardBundle = typeof standardBundles.$inferInsert;
export type StandardBundle = typeof standardBundles.$inferSelect;

// Purchase history table
export const purchaseHistory = pgTable("purchase_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  orgId: uuid("org_id").references(() => organizations.id),
  standardId: uuid("standard_id"),
  bundleId: uuid("bundle_id"),
  purchaseType: text("purchase_type"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPurchaseHistorySchema = createInsertSchema(purchaseHistory).omit({
  id: true,
  createdAt: true,
});
export type InsertPurchaseHistory = typeof purchaseHistory.$inferInsert;
export type PurchaseHistory = typeof purchaseHistory.$inferSelect;

// Desktop Licenses table - Track all generated licenses
export const desktopLicenses = pgTable("desktop_licenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  licenseKey: text("license_key").unique().notNull(),
  factoryId: text("factory_id").notNull(),
  factoryName: text("factory_name").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  purchasedStandards: jsonb("purchased_standards").$type<string[]>().default([]),
  maxActivations: integer("max_activations").default(3),
  isLifetime: boolean("is_lifetime").default(false),
  expiryDate: timestamp("expiry_date"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  notes: text("notes"),
  status: text("status").default("active"), // active, revoked, expired
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDesktopLicenseSchema = createInsertSchema(desktopLicenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDesktopLicense = typeof desktopLicenses.$inferInsert;
export type DesktopLicense = typeof desktopLicenses.$inferSelect;

// License Activations table - Track each time a license is activated
export const licenseActivations = pgTable("license_activations", {
  id: uuid("id").primaryKey().defaultRandom(),
  licenseId: uuid("license_id").notNull().references(() => desktopLicenses.id),
  licenseKey: text("license_key").notNull(),
  machineId: text("machine_id").notNull(),
  machineName: text("machine_name"),
  osVersion: text("os_version"),
  appVersion: text("app_version"),
  ipAddress: text("ip_address"),
  country: text("country"),
  isActive: boolean("is_active").default(true),
  activatedAt: timestamp("activated_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  deactivatedAt: timestamp("deactivated_at"),
});

export const insertLicenseActivationSchema = createInsertSchema(licenseActivations).omit({
  id: true,
  activatedAt: true,
  lastSeenAt: true,
});
export type InsertLicenseActivation = typeof licenseActivations.$inferInsert;
export type LicenseActivation = typeof licenseActivations.$inferSelect;
