import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const assessments = sqliteTable('assessments', {
  id: text('id').primaryKey(),
  firstName: text('first_name').notNull(),
  email: text('email').notNull(),
  ivoreyContactId: text('ivorey_contact_id'),
  answersJson: text('answers_json').notNull(),
  scoresJson: text('scores_json').notNull(),
  primaryStyle: text('primary_style').notNull(),
  secondaryStyle: text('secondary_style').notNull(),
  isBlend: integer('is_blend', { mode: 'boolean' }).notNull(),
  reportKey: text('report_key').notNull(),
  downloadTokenHash: text('download_token_hash').notNull(),
  downloadExpiresAt: integer('download_expires_at', { mode: 'timestamp_ms' }).notNull(),
  emailStatus: text('email_status').notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [index('idx_assessments_email_created_at').on(table.email, table.createdAt)]);

export const purchases = sqliteTable('purchases', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().unique(),
  firstName: text('first_name').notNull(),
  email: text('email').notNull(),
  ivoreyContactId: text('ivorey_contact_id'),
  productName: text('product_name').notNull(),
  amountCents: integer('amount_cents').notNull(),
  status: text('status').notNull().default('paid'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [index('idx_purchases_email_status').on(table.email, table.status)]);
