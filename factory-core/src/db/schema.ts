import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';
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
  githubRepoUrl: text('github_repo_url'),
  pagesProjectName: text('pages_project_name'),
  pagesUrl: text('pages_url'),
  ga4MeasurementId: text('ga4_measurement_id'),
  gscSiteUrl: text('gsc_site_url'),
  proofSentAt: text('proof_sent_at'),
  // Bot pipeline metadata
  createdVia: text('created_via').default('dashboard'), // 'bot' | 'dashboard' | 'api'
  buildMode: text('build_mode').default('speculative'), // 'speculative' | 'demo'
  sourcePhotoR2Key: text('source_photo_r2_key'),
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
  avatar: text('avatar'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const factorySettings = sqliteTable('factory_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  masterTemplateRepo: text('master_template_repo').notNull(),
  githubTokenSecret: text('github_token_secret').notNull(),
  version: text('version').notNull(),
});

// Tabella pages: contenuto pre-generato da Phase 3 per ogni sito rank-rent
// body è HTML generato esclusivamente da Phase 3 (Gemini via factory-core) — non da input utente
// NOTA SICUREZZA: body non deve contenere <script> tag — sanitizzazione applicata in Phase 3 prima della scrittura
export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  slug: text('slug').notNull(),
  type: text('type').notNull(), // 'homepage'|'service'|'zone'|'service_zone'|'blog'
  title: text('title').notNull(),
  body: text('body').notNull(),
  faq: text('faq').notNull().default('[]'),   // JSON string: [{ question, answer }]
  meta: text('meta').notNull().default('{}'), // JSON string: { description, canonical }
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  projectSlugUniq: uniqueIndex('pages_project_slug_uniq').on(table.projectId, table.slug),
}));

export const media = sqliteTable('media', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  renterId: text('renter_id').notNull().references(() => renters.id),
  filename: text('filename').notNull(),
  contentType: text('content_type').notNull(),
  size: integer('size').notNull(),
  url: text('url').notNull(),
  r2Key: text('r2_key').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});
