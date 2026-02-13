import {
  pets,
  weightEntries,
  events,
  petEvents,
  vaccinations,
  medications,
  type Pet,
  type InsertPet,
  type WeightEntry,
  type InsertWeightEntry,
  type Event,
  type InsertEvent,
  type EventWithPets,
  type Vaccination,
  type InsertVaccination,
  type Medication,
  type InsertMedication,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  getPets(): Promise<Pet[]>;
  getPet(id: number): Promise<Pet | undefined>;
  createPet(pet: InsertPet): Promise<Pet>;
  updatePet(id: number, pet: Partial<InsertPet>): Promise<Pet | undefined>;
  deletePet(id: number): Promise<void>;

  getWeightEntries(petId: number): Promise<WeightEntry[]>;
  getAllWeightEntries(): Promise<(WeightEntry & { petName: string })[]>;
  createWeightEntry(entry: InsertWeightEntry): Promise<WeightEntry>;

  getEvents(): Promise<EventWithPets[]>;
  getEventsByPet(petId: number): Promise<EventWithPets[]>;
  createEvent(event: InsertEvent, petIds: number[]): Promise<Event>;
  deleteEvent(id: number): Promise<void>;

  getVaccinationsByPet(petId: number): Promise<Vaccination[]>;
  createVaccination(data: InsertVaccination): Promise<Vaccination>;
  updateVaccination(id: number, data: Partial<InsertVaccination>): Promise<Vaccination | undefined>;
  deleteVaccination(id: number): Promise<void>;

  getMedicationsByPet(petId: number): Promise<Medication[]>;
  createMedication(data: InsertMedication): Promise<Medication>;
  updateMedication(id: number, data: Partial<InsertMedication>): Promise<Medication | undefined>;
  deleteMedication(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getPets(): Promise<Pet[]> {
    return db.select().from(pets).orderBy(asc(pets.name));
  }

  async getPet(id: number): Promise<Pet | undefined> {
    const [pet] = await db.select().from(pets).where(eq(pets.id, id));
    return pet || undefined;
  }

  async createPet(pet: InsertPet): Promise<Pet> {
    const [created] = await db.insert(pets).values(pet).returning();
    return created;
  }

  async updatePet(id: number, data: Partial<InsertPet>): Promise<Pet | undefined> {
    const [updated] = await db.update(pets).set(data).where(eq(pets.id, id)).returning();
    return updated || undefined;
  }

  async deletePet(id: number): Promise<void> {
    await db.delete(pets).where(eq(pets.id, id));
  }

  async getWeightEntries(petId: number): Promise<WeightEntry[]> {
    return db
      .select()
      .from(weightEntries)
      .where(eq(weightEntries.petId, petId))
      .orderBy(asc(weightEntries.recordedAt));
  }

  async getAllWeightEntries(): Promise<(WeightEntry & { petName: string })[]> {
    const result = await db
      .select({
        id: weightEntries.id,
        petId: weightEntries.petId,
        weight: weightEntries.weight,
        unit: weightEntries.unit,
        recordedAt: weightEntries.recordedAt,
        petName: pets.name,
      })
      .from(weightEntries)
      .innerJoin(pets, eq(weightEntries.petId, pets.id))
      .orderBy(asc(weightEntries.recordedAt));
    return result;
  }

  async createWeightEntry(entry: InsertWeightEntry): Promise<WeightEntry> {
    const [created] = await db.insert(weightEntries).values(entry).returning();
    return created;
  }

  async getEvents(): Promise<EventWithPets[]> {
    const allEvents = await db
      .select()
      .from(events)
      .orderBy(desc(events.eventDate));

    const result: EventWithPets[] = [];
    for (const event of allEvents) {
      const eventPetLinks = await db
        .select({ pet: pets })
        .from(petEvents)
        .innerJoin(pets, eq(petEvents.petId, pets.id))
        .where(eq(petEvents.eventId, event.id));

      result.push({
        ...event,
        pets: eventPetLinks.map((l) => l.pet),
      });
    }
    return result;
  }

  async getEventsByPet(petId: number): Promise<EventWithPets[]> {
    const petEventLinks = await db
      .select({ eventId: petEvents.eventId })
      .from(petEvents)
      .where(eq(petEvents.petId, petId));

    const eventIds = petEventLinks.map((l) => l.eventId);
    if (eventIds.length === 0) return [];

    const allEvents = await this.getEvents();
    return allEvents.filter((e) => eventIds.includes(e.id));
  }

  async createEvent(event: InsertEvent, petIds: number[]): Promise<Event> {
    const [created] = await db.insert(events).values(event).returning();

    if (petIds.length > 0) {
      await db.insert(petEvents).values(
        petIds.map((petId) => ({
          petId,
          eventId: created.id,
        }))
      );
    }

    return created;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(petEvents).where(eq(petEvents.eventId, id));
    await db.delete(events).where(eq(events.id, id));
  }

  async getVaccinationsByPet(petId: number): Promise<Vaccination[]> {
    return db
      .select()
      .from(vaccinations)
      .where(eq(vaccinations.petId, petId))
      .orderBy(desc(vaccinations.dateAdministered));
  }

  async createVaccination(data: InsertVaccination): Promise<Vaccination> {
    const [created] = await db.insert(vaccinations).values(data).returning();
    return created;
  }

  async updateVaccination(id: number, data: Partial<InsertVaccination>): Promise<Vaccination | undefined> {
    const [updated] = await db.update(vaccinations).set(data).where(eq(vaccinations.id, id)).returning();
    return updated || undefined;
  }

  async deleteVaccination(id: number): Promise<void> {
    await db.delete(vaccinations).where(eq(vaccinations.id, id));
  }

  async getMedicationsByPet(petId: number): Promise<Medication[]> {
    return db
      .select()
      .from(medications)
      .where(eq(medications.petId, petId))
      .orderBy(desc(medications.startDate));
  }

  async createMedication(data: InsertMedication): Promise<Medication> {
    const [created] = await db.insert(medications).values(data).returning();
    return created;
  }

  async updateMedication(id: number, data: Partial<InsertMedication>): Promise<Medication | undefined> {
    const [updated] = await db.update(medications).set(data).where(eq(medications.id, id)).returning();
    return updated || undefined;
  }

  async deleteMedication(id: number): Promise<void> {
    await db.delete(medications).where(eq(medications.id, id));
  }
}

export const storage = new DatabaseStorage();
