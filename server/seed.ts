import { db } from "./db";
import { pets, weightEntries, events, petEvents } from "@shared/schema";
import { sql } from "drizzle-orm";
import { log } from "./index";

export async function seedDatabase() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(pets);

  if (Number(count) > 0) {
    log("Database already has data, skipping seed", "seed");
    return;
  }

  log("Seeding database with sample data...", "seed");

  const [buddy, luna, max] = await db
    .insert(pets)
    .values([
      {
        name: "Buddy",
        breed: "Pug",
        species: "dog",
        dateOfBirth: "2020-03-15",
        gender: "male",
        color: "Fawn",
      },
      {
        name: "Luna",
        breed: "Puggle",
        species: "dog",
        dateOfBirth: "2021-07-22",
        gender: "female",
        color: "Black & Tan",
      },
      {
        name: "Max",
        breed: "French Bulldog",
        species: "dog",
        dateOfBirth: "2019-11-08",
        gender: "male",
        color: "Brindle",
      },
    ])
    .returning();

  await db.insert(weightEntries).values([
    { petId: buddy.id, weight: 14.2, unit: "lbs", recordedAt: "2025-08-01" },
    { petId: buddy.id, weight: 14.5, unit: "lbs", recordedAt: "2025-09-01" },
    { petId: buddy.id, weight: 14.8, unit: "lbs", recordedAt: "2025-10-01" },
    { petId: buddy.id, weight: 15.1, unit: "lbs", recordedAt: "2025-11-01" },
    { petId: buddy.id, weight: 14.9, unit: "lbs", recordedAt: "2025-12-01" },
    { petId: buddy.id, weight: 15.0, unit: "lbs", recordedAt: "2026-01-01" },
    { petId: luna.id, weight: 18.0, unit: "lbs", recordedAt: "2025-08-01" },
    { petId: luna.id, weight: 18.3, unit: "lbs", recordedAt: "2025-09-01" },
    { petId: luna.id, weight: 18.5, unit: "lbs", recordedAt: "2025-10-01" },
    { petId: luna.id, weight: 18.2, unit: "lbs", recordedAt: "2025-11-01" },
    { petId: luna.id, weight: 18.6, unit: "lbs", recordedAt: "2025-12-01" },
    { petId: luna.id, weight: 18.4, unit: "lbs", recordedAt: "2026-01-01" },
    { petId: max.id, weight: 24.0, unit: "lbs", recordedAt: "2025-08-01" },
    { petId: max.id, weight: 24.5, unit: "lbs", recordedAt: "2025-09-01" },
    { petId: max.id, weight: 25.0, unit: "lbs", recordedAt: "2025-10-01" },
    { petId: max.id, weight: 24.8, unit: "lbs", recordedAt: "2025-11-01" },
    { petId: max.id, weight: 25.2, unit: "lbs", recordedAt: "2025-12-01" },
    { petId: max.id, weight: 25.0, unit: "lbs", recordedAt: "2026-01-01" },
  ]);

  const [vetVisit1, vaccination1, medication1, appointment1, vetVisit2, vaccination2] =
    await db
      .insert(events)
      .values([
        {
          title: "Annual Wellness Exam",
          category: "vet_visit",
          notes: "<p>Routine annual checkup. <strong>All vitals normal.</strong> Vet recommended dental cleaning next quarter.</p>",
          eventDate: "2025-12-10",
          location: "City Vet Clinic",
        },
        {
          title: "Rabies Vaccination",
          category: "vaccination",
          notes: "<p>3-year rabies booster administered. Next due <strong>December 2028</strong>.</p>",
          eventDate: "2025-12-10",
          location: "City Vet Clinic",
        },
        {
          title: "Heartworm Prevention",
          category: "medication",
          notes: "<p>Monthly heartworm prevention given. Brand: <em>Heartgard Plus</em>. Next dose due February 1.</p>",
          eventDate: "2026-01-01",
          reminderDate: "2026-01-28",
        },
        {
          title: "Dental Cleaning",
          category: "appointment",
          notes: "<p>Scheduled dental cleaning procedure. <strong>Fasting required</strong> 12 hours before appointment.</p>",
          eventDate: "2026-03-15",
          reminderDate: "2026-03-10",
          location: "City Vet Clinic",
        },
        {
          title: "Skin Allergy Checkup",
          category: "vet_visit",
          notes: "<p>Follow-up for seasonal allergies. Prescribed <em>Apoquel</em> for 2 weeks.</p><ul><li>Monitor scratching frequency</li><li>Return if symptoms persist</li></ul>",
          eventDate: "2026-01-20",
          location: "PetCare Specialists",
        },
        {
          title: "DHPP Booster",
          category: "vaccination",
          notes: "<p>Distemper/Parvo combination vaccine booster. Records updated.</p>",
          eventDate: "2026-02-14",
          reminderDate: "2026-02-10",
          location: "City Vet Clinic",
        },
      ])
      .returning();

  await db.insert(petEvents).values([
    { petId: buddy.id, eventId: vetVisit1.id },
    { petId: luna.id, eventId: vetVisit1.id },
    { petId: buddy.id, eventId: vaccination1.id },
    { petId: luna.id, eventId: vaccination1.id },
    { petId: max.id, eventId: vaccination1.id },
    { petId: buddy.id, eventId: medication1.id },
    { petId: luna.id, eventId: medication1.id },
    { petId: max.id, eventId: medication1.id },
    { petId: buddy.id, eventId: appointment1.id },
    { petId: luna.id, eventId: vetVisit2.id },
    { petId: max.id, eventId: vaccination2.id },
  ]);

  log("Seed data inserted successfully", "seed");
}
