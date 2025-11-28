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
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
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
export type InsertOrgMember = z.infer<typeof insertOrgMemberSchema>;
export type OrgMember = typeof orgMembers.$inferSelect;

// Profiles table
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name"),
  certificationLevel: text("certification_level"),
  orgId: uuid("org_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

// Technique sheets table
export const techniqueSheets = pgTable("technique_sheets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  orgId: uuid("org_id").references(() => organizations.id),
  sheetName: text("sheet_name").notNull(),
  standard: text("standard"),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: text("created_by"),
  modifiedBy: text("modified_by"),
  status: text("status").default("draft"),
});

export const insertTechniqueSheetSchema = createInsertSchema(techniqueSheets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTechniqueSheet = z.infer<typeof insertTechniqueSheetSchema>;
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
export type InsertStandard = z.infer<typeof insertStandardSchema>;
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
export type InsertUserStandardAccess = z.infer<typeof insertUserStandardAccessSchema>;
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
export type InsertStandardBundle = z.infer<typeof insertStandardBundleSchema>;
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
export type InsertPurchaseHistory = z.infer<typeof insertPurchaseHistorySchema>;
export type PurchaseHistory = typeof purchaseHistory.$inferSelect;
