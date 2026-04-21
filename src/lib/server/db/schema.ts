import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  jsonb,
  index,
  unique
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-valibot';

// --- ENUMS ---
export const roleEnum = pgEnum('role', ['user', 'merchant', 'admin']);
export const promotionStatusEnum = pgEnum('promotion_status', [
  'active',
  'expired',
  'banned'
]);
export const paymentMethodEnum = pgEnum('payment_method', [
  'CASH',
  'M-PESA',
  'E-MOLA',
  'M-KESH',
  'VISA',
  'MASTERCARD',
  'EFT',
  'OTHER'
]);

// --- BETTER AUTH CORE TABLES ---

export const users = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  phoneNumber: text('phone_number').unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  role: roleEnum('role').notNull().default('user'),
  banned: boolean('banned').notNull().default(false),
  bannedReason: text('banned_reason')
});

export const sessions = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
});

export const accounts = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const verifications = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

// --- APP SPECIFIC TABLES ---

export const merchants = pgTable('merchant', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  businessName: text('business_name').notNull(),
  logo: text('logo'),
  description: text('description'),
  address: text('address'),
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  email: text('email'),
  openHours: jsonb('open_hours'),
  verified: boolean('verified').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const promotions = pgTable(
  'promotion',
  {
    id: serial('id').primaryKey(),
    merchantId: integer('merchant_id')
      .notNull()
      .references(() => merchants.id, { onDelete: 'cascade' }),

    // ── Trust & ranking signals ───────────────────────────────────────────
    // verified: true  → posted by a merchant account (trusted, ranked higher)
    // verified: false → posted by a regular user (unverified, ranked lower)
    verified: boolean('verified').notNull().default(false),

    // authorRole: records the role at post time so ranking is stable even if
    // the user later upgrades to merchant
    authorRole: roleEnum('author_role').notNull().default('user'),

    sponsored: boolean('sponsored').notNull().default(false),
    featured: boolean('featured').notNull().default(false),
    title: text('title').notNull(),
    description: text('description'),
    discountPercentage: integer('discount_percentage'),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    openHours: jsonb('open_hours'),
    location: jsonb('location').$type<{
      lat: number;
      lng: number;
      address: string;
    }>(),
    imageUrls: jsonb('image_urls').$type<string[]>().default([]),
    videoUrl: text('video_url'),
    contact: jsonb('contact').$type<{
      phone?: string;
      whatsapp?: string;
      email?: string;
    }>(),
    paymentMethods: jsonb('payment_methods').$type<string[]>().default([]),
    terms: text('terms'),
    status: promotionStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  (t) => [
    // verified is added to the cursor index so the DB can efficiently
    // sort verified-first within the same featured/endDate/createdAt bucket
    index('promotion_verified_idx').on(t.verified),
    index('promotion_featured_idx').on(t.featured),
    index('promotion_end_date_idx').on(t.endDate),
    index('promotion_created_at_idx').on(t.createdAt),
    // Composite cursor: featured → verified → endDate → createdAt → id
    // This is the ranking order: sponsored merchants float to top,
    // then verified merchants, then regular users
    index('promotion_cursor_idx').on(
      t.featured,
      t.verified,
      t.endDate,
      t.createdAt,
      t.id
    )
  ]
);

export const likes = pgTable(
  'like',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    promotionId: integer('promotion_id')
      .notNull()
      .references(() => promotions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  (t) => [
    index('like_user_idx').on(t.userId),
    index('like_promotion_idx').on(t.promotionId),
    unique('unique_user_promo_like').on(t.userId, t.promotionId)
  ]
);

export const comments = pgTable('comment', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  promotionId: integer('promotion_id')
    .notNull()
    .references(() => promotions.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const sources = pgTable('source', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  config: jsonb('config'),
  active: boolean('active').notNull().default(true),
  lastRun: timestamp('last_run')
});

export const userPreferences = pgTable('user_preference', {
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .primaryKey(),
  language: text('language').notNull().default('pt'),
  favoriteCategories: jsonb('favorite_categories')
    .$type<number[]>()
    .default([]),
  notifications: boolean('notifications').notNull().default(true)
});

// --- RELATIONS ---

export const usersRelations = relations(users, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [users.id],
    references: [merchants.userId]
  }),
  likes: many(likes),
  comments: many(comments),
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId]
  })
}));

export const merchantsRelations = relations(merchants, ({ one, many }) => ({
  user: one(users, { fields: [merchants.userId], references: [users.id] }),
  promotions: many(promotions)
}));

export const promotionsRelations = relations(promotions, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [promotions.merchantId],
    references: [merchants.id]
  }),
  likes: many(likes),
  comments: many(comments)
}));

// --- VALIBOT SCHEMAS ---
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertPromotionSchema = createInsertSchema(promotions);
export const selectPromotionSchema = createSelectSchema(promotions);

// import {
//   pgTable,
//   serial,
//   text,
//   timestamp,
//   boolean,
//   integer,
//   pgEnum,
//   jsonb,
//   index,
//   unique,
// } from 'drizzle-orm/pg-core'; // Import index and unique for creating indexes and unique constraints
// import { relations } from 'drizzle-orm';
// import { createInsertSchema, createSelectSchema } from 'drizzle-valibot';

// // --- ENUMS ---
// export const roleEnum = pgEnum('role', ['user', 'merchant', 'admin']);
// export const promotionStatusEnum = pgEnum('promotion_status', [
//   'active',
//   'expired',
//   'banned',
// ]);
// export const paymentMethodEnum = pgEnum('payment_method', [
//   'CASH',
//   'M-PESA',
//   'E-MOLA',
//   'M-KESH',
//   'VISA',
//   'MASTERCARD',
//   'EFT',
//   'OTHER',
// ]);

// // --- BETTER AUTH CORE TABLES ---

// export const users = pgTable('user', {
//   id: text('id').primaryKey(),
//   name: text('name').notNull(), // Required by Better Auth
//   email: text('email').notNull().unique(),
//   emailVerified: boolean('email_verified').notNull().default(false), // Required
//   image: text('image'), // Required
//   phoneNumber: text('phone_number').unique(),
//   // passwordHash: text('password_hash'), // Better Auth handles passwords in the 'account' table by default
//   createdAt: timestamp('created_at').notNull().defaultNow(),
//   updatedAt: timestamp('updated_at').notNull().defaultNow(),
//   role: roleEnum('role').notNull().default('user'),
//   banned: boolean('banned').notNull().default(false),
//   bannedReason: text('banned_reason'),
// });

// export const sessions = pgTable('session', {
//   id: text('id').primaryKey(),
//   expiresAt: timestamp('expires_at').notNull(),
//   token: text('token').notNull().unique(),
//   createdAt: timestamp('created_at').notNull().defaultNow(),
//   updatedAt: timestamp('updated_at').notNull().defaultNow(),
//   ipAddress: text('ip_address'),
//   userAgent: text('user_agent'),
//   userId: text('user_id')
//     .notNull()
//     .references(() => users.id, { onDelete: 'cascade' }),
// });

// export const accounts = pgTable('account', {
//   id: text('id').primaryKey(),
//   accountId: text('account_id').notNull(),
//   providerId: text('provider_id').notNull(),
//   userId: text('user_id')
//     .notNull()
//     .references(() => users.id, { onDelete: 'cascade' }),
//   accessToken: text('access_token'),
//   refreshToken: text('refresh_token'),
//   idToken: text('id_token'),
//   accessTokenExpiresAt: timestamp('access_token_expires_at'),
//   refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
//   scope: text('scope'),
//   password: text('password'), // This is where the hashed password actually lives
//   createdAt: timestamp('created_at').notNull().defaultNow(),
//   updatedAt: timestamp('updated_at').notNull().defaultNow(),
// });

// export const verifications = pgTable('verification', {
//   id: text('id').primaryKey(),
//   identifier: text('identifier').notNull(),
//   value: text('value').notNull(),
//   expiresAt: timestamp('expires_at').notNull(),
//   createdAt: timestamp('created_at').notNull(),
//   updatedAt: timestamp('updated_at').notNull(),
// });

// // --- APP SPECIFIC TABLES ---

// export const merchants = pgTable('merchant', {
//   id: serial('id').primaryKey(),
//   userId: text('user_id')
//     .notNull()
//     .references(() => users.id, { onDelete: 'cascade' })
//     .unique(),
//   businessName: text('business_name').notNull(),
//   logo: text('logo'),
//   description: text('description'),
//   address: text('address'),
//   phone: text('phone'),
//   whatsapp: text('whatsapp'),
//   email: text('email'),
//   openHours: jsonb('open_hours'),
//   verified: boolean('verified').notNull().default(false),
//   createdAt: timestamp('created_at').notNull().defaultNow(),
//   updatedAt: timestamp('updated_at').notNull().defaultNow(),
// });

// export const promotions = pgTable(
//   'promotion',
//   {
//     id: serial('id').primaryKey(),
//     merchantId: integer('merchant_id')
//       .notNull()
//       .references(() => merchants.id, { onDelete: 'cascade' }),
//     sponsored: boolean('sponsored').notNull().default(false),
//     featured: boolean('featured').notNull().default(false),
//     title: text('title').notNull(),
//     description: text('description'),
//     discountPercentage: integer('discount_percentage'),
//     startDate: timestamp('start_date').notNull(),
//     endDate: timestamp('end_date').notNull(),
//     openHours: jsonb('open_hours'),
//     location: jsonb('location').$type<{
//       lat: number;
//       lng: number;
//       address: string;
//     }>(),
//     imageUrls: jsonb('image_urls').$type<string[]>().default([]),
//     videoUrl: text('video_url'),
//     contact: jsonb('contact').$type<{
//       phone?: string;
//       whatsapp?: string;
//       email?: string;
//     }>(),
//     paymentMethods: jsonb('payment_methods').$type<string[]>().default([]), // Refined for simplicity
//     terms: text('terms'),
//     status: promotionStatusEnum('status').notNull().default('active'),
//     createdAt: timestamp('created_at').notNull().defaultNow(),
//     updatedAt: timestamp('updated_at').notNull().defaultNow(),
//   },
//   (t) => [
//     index('promotion_featured_idx').on(t.featured),
//     index('promotion_end_date_idx').on(t.endDate),
//     index('promotion_created_at_idx').on(t.createdAt),
//     index('promotion_cursor_idx').on(t.featured, t.endDate, t.createdAt, t.id),
//   ],
//   // (table) => ({
//   //   featuredIdx: index('promotion_featured_idx').on(table.featured),
//   //   endDateIdx: index('promotion_end_date_idx').on(table.endDate),
//   //   createdAtIdx: index('promotion_created_at_idx').on(table.createdAt),
//   //   cursorIdx: index('promotion_cursor_idx').on(
//   //     table.featured,
//   //     table.endDate,
//   //     table.createdAt,
//   //     table.id,
//   //   ),
//   // }),
// );

// // ... (likes, comments, sources, userPreferences remain largely the same, just ensure they reference users.id)

// export const likes = pgTable(
//   'like',
//   {
//     id: serial('id').primaryKey(),
//     userId: text('user_id')
//       .notNull()
//       .references(() => users.id, { onDelete: 'cascade' }),
//     promotionId: integer('promotion_id')
//       .notNull()
//       .references(() => promotions.id, { onDelete: 'cascade' }),
//     createdAt: timestamp('created_at').notNull().defaultNow(),
//   },
//   (t) => [
//     // NEW SYNTAX: Use an array of objects instead of a single object
//     index('like_user_idx').on(t.userId),
//     index('like_promotion_idx').on(t.promotionId),
//     // This ensures a user can only like a specific promotion once
//     unique('unique_user_promo_like').on(t.userId, t.promotionId),
//   ],
// );
// // export const likes = pgTable(
// //   'like',
// //   {
// //     id: serial('id').primaryKey(),
// //     userId: text('user_id')
// //       .notNull()
// //       .references(() => users.id, { onDelete: 'cascade' }),
// //     promotionId: integer('promotion_id')
// //       .notNull()
// //       .references(() => promotions.id, { onDelete: 'cascade' }),
// //     createdAt: timestamp('created_at').notNull().defaultNow(),
// //   },
// //   (table) => ({
// //     unique: index('like_user_promotion_unique').on(
// //       table.userId,
// //       table.promotionId,
// //     ),
// //   }),
// // );

// export const comments = pgTable('comment', {
//   id: serial('id').primaryKey(),
//   userId: text('user_id')
//     .notNull()
//     .references(() => users.id, { onDelete: 'cascade' }),
//   promotionId: integer('promotion_id')
//     .notNull()
//     .references(() => promotions.id, { onDelete: 'cascade' }),
//   content: text('content').notNull(),
//   createdAt: timestamp('created_at').notNull().defaultNow(),
//   updatedAt: timestamp('updated_at').notNull().defaultNow(),
// });

// export const sources = pgTable('source', {
//   id: serial('id').primaryKey(),
//   name: text('name').notNull(),
//   type: text('type').notNull(),
//   config: jsonb('config'),
//   active: boolean('active').notNull().default(true),
//   lastRun: timestamp('last_run'),
// });

// export const userPreferences = pgTable('user_preference', {
//   userId: text('user_id')
//     .notNull()
//     .references(() => users.id, { onDelete: 'cascade' })
//     .primaryKey(),
//   language: text('language').notNull().default('pt'),
//   favoriteCategories: jsonb('favorite_categories')
//     .$type<number[]>()
//     .default([]),
//   notifications: boolean('notifications').notNull().default(true),
// });

// export const usersRelations = relations(users, ({ one, many }) => ({
//   merchant: one(merchants, {
//     fields: [users.id],
//     references: [merchants.userId],
//   }),
//   likes: many(likes),
//   comments: many(comments),
//   preferences: one(userPreferences, {
//     fields: [users.id],
//     references: [userPreferences.userId],
//   }),
// }));

// export const promotionsRelations = relations(promotions, ({ one, many }) => ({
//   merchant: one(merchants, {
//     fields: [promotions.merchantId],
//     references: [merchants.id],
//   }),
//   likes: many(likes),
//   comments: many(comments),
// }));

// export const insertUserSchema = createInsertSchema(users);
// export const selectUserSchema = createSelectSchema(users);
// export const insertPromotionSchema = createInsertSchema(promotions);
// export const selectPromotionSchema = createSelectSchema(promotions);
