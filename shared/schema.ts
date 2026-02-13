import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, date, real, pgEnum, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const eventCategoryEnum = pgEnum("event_category", [
  "vet_visit",
  "medication",
  "vaccination",
  "appointment",
]);

export const pets = pgTable("pets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  breed: text("breed").notNull(),
  species: text("species").notNull().default("dog"),
  dateOfBirth: date("date_of_birth"),
  avatarUrl: text("avatar_url"),
  color: text("color"),
  gender: text("gender"),
});

export const petRelations = relations(pets, ({ many }) => ({
  weightEntries: many(weightEntries),
  petEvents: many(petEvents),
}));

export const weightEntries = pgTable("weight_entries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  petId: integer("pet_id").notNull().references(() => pets.id, { onDelete: "cascade" }),
  weight: real("weight").notNull(),
  unit: text("unit").notNull().default("lbs"),
  recordedAt: date("recorded_at").notNull(),
});

export const weightEntryRelations = relations(weightEntries, ({ one }) => ({
  pet: one(pets, { fields: [weightEntries.petId], references: [pets.id] }),
}));

export const events = pgTable("events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  category: eventCategoryEnum("category").notNull(),
  notes: text("notes"),
  eventDate: date("event_date").notNull(),
  reminderDate: date("reminder_date"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventRelations = relations(events, ({ many }) => ({
  petEvents: many(petEvents),
}));

export const petEvents = pgTable("pet_events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  petId: integer("pet_id").notNull().references(() => pets.id, { onDelete: "cascade" }),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
});

export const petEventRelations = relations(petEvents, ({ one }) => ({
  pet: one(pets, { fields: [petEvents.petId], references: [pets.id] }),
  event: one(events, { fields: [petEvents.eventId], references: [events.id] }),
}));

export const vaccinations = pgTable("vaccinations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  petId: integer("pet_id").notNull().references(() => pets.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dateAdministered: date("date_administered").notNull(),
  nextDueDate: date("next_due_date"),
  veterinarian: text("veterinarian"),
  notes: text("notes"),
  sourceEventId: integer("source_event_id").references(() => events.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vaccinationRelations = relations(vaccinations, ({ one }) => ({
  pet: one(pets, { fields: [vaccinations.petId], references: [pets.id] }),
  sourceEvent: one(events, { fields: [vaccinations.sourceEventId], references: [events.id] }),
}));

export const medications = pgTable("medications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  petId: integer("pet_id").notNull().references(() => pets.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dosage: text("dosage"),
  frequency: text("frequency"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  prescribedBy: text("prescribed_by"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  sourceEventId: integer("source_event_id").references(() => events.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const medicationRelations = relations(medications, ({ one }) => ({
  pet: one(pets, { fields: [medications.petId], references: [pets.id] }),
  sourceEvent: one(events, { fields: [medications.sourceEventId], references: [events.id] }),
}));

export const insertPetSchema = createInsertSchema(pets).omit({ id: true });
export const insertWeightEntrySchema = createInsertSchema(weightEntries).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertPetEventSchema = createInsertSchema(petEvents).omit({ id: true });
export const insertVaccinationSchema = createInsertSchema(vaccinations).omit({ id: true, createdAt: true });
export const insertMedicationSchema = createInsertSchema(medications).omit({ id: true, createdAt: true });

export type Pet = typeof pets.$inferSelect;
export type InsertPet = z.infer<typeof insertPetSchema>;
export type WeightEntry = typeof weightEntries.$inferSelect;
export type InsertWeightEntry = z.infer<typeof insertWeightEntrySchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type PetEvent = typeof petEvents.$inferSelect;
export type InsertPetEvent = z.infer<typeof insertPetEventSchema>;
export type Vaccination = typeof vaccinations.$inferSelect;
export type InsertVaccination = z.infer<typeof insertVaccinationSchema>;
export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;

export type EventWithPets = Event & { pets: Pet[] };
