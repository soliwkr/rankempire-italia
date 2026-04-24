import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const renters = sqliteTable('renters', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  balance: real('balance').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  niche: text('niche').notNull(),
  location: text('location').notNull(),
  domain: text('domain'),
  status: text('status').default('pending').notNull(),
  renterId: text('renter_id').references(() => renters.id),
  configJson: text('config_json'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const leads = sqliteTable('leads', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  name: text('name'),
  email: text('email'),
  phone: text('phone'),
  message: text('message'),
  status: text('status').default('new').notNull(),
  doiStatus: text('doi_status').default('pending').notNull(),
  verificationToken: text('verification_token'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const factorySettings = sqliteTable('factory_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  masterTemplateRepo: text('master_template_repo').notNull(),
  githubTokenSecret: text('github_token_secret').notNull(),
  version: text('version').notNull(),
});
