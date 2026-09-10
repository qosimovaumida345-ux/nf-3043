import { pgTable, text, timestamp, boolean, varchar } from "drizzle-orm/pg-core";

export const groups = pgTable("groups", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("STUDENT"), // 'ADMIN' | 'STUDENT'
  fullName: varchar("full_name", { length: 150 }).notNull(),
  groupId: text("group_id").references(() => groups.id, { onDelete: "set null" }),
  initialPassword: text("initial_password"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const homeworks = pgTable("homeworks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").default(""),
  sampleImageUrl: text("sample_image_url"),
  groupId: text("group_id").references(() => groups.id, { onDelete: "cascade" }), // null bo'lsa barcha guruhlar uchun
  adminId: text("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deadline: timestamp("deadline", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const submissions = pgTable("submissions", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  homeworkId: text("homework_id").references(() => homeworks.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  storageKey: text("storage_key"),
  taskTitle: text("task_title").default("Kundalik kod topshirig'i"),
  status: varchar("status", { length: 20 }).notNull().default("PENDING"), // 'PENDING' | 'CORRECT' | 'INCORRECT' | 'RETRY'
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviewComments = pgTable("review_comments", {
  id: text("id").primaryKey(),
  submissionId: text("submission_id").notNull().references(() => submissions.id, { onDelete: "cascade" }),
  adminId: text("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  feedbackText: text("feedback_text").default(""),
  verdict: varchar("verdict", { length: 20 }).notNull().default("CORRECT"), // 'CORRECT' | 'INCORRECT' | 'RETRY'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  recipientId: text("recipient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  submissionId: text("submission_id").references(() => submissions.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const groupMessages = pgTable("group_messages", {
  id: text("id").primaryKey(),
  groupId: text("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Homework = typeof homeworks.$inferSelect;
export type NewHomework = typeof homeworks.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type ReviewComment = typeof reviewComments.$inferSelect;
export type NewReviewComment = typeof reviewComments.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type GroupMessage = typeof groupMessages.$inferSelect;
export type NewGroupMessage = typeof groupMessages.$inferInsert;
