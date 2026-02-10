import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { insertPetSchema, insertWeightEntrySchema, insertEventSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  registerObjectStorageRoutes(app);

  // --- Pets ---
  app.get("/api/pets", async (_req, res) => {
    const pets = await storage.getPets();
    res.json(pets);
  });

  app.get("/api/pets/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid pet ID" });
    const pet = await storage.getPet(id);
    if (!pet) return res.status(404).json({ error: "Pet not found" });
    res.json(pet);
  });

  app.post("/api/pets", async (req, res) => {
    try {
      const validatedData = insertPetSchema.parse(req.body);
      const pet = await storage.createPet(validatedData);
      res.status(201).json(pet);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/pets/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid pet ID" });
    try {
      const validatedData = insertPetSchema.partial().parse(req.body);
      const pet = await storage.updatePet(id, validatedData);
      if (!pet) return res.status(404).json({ error: "Pet not found" });
      res.json(pet);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/pets/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid pet ID" });
    await storage.deletePet(id);
    res.status(204).send();
  });

  // --- Weight Entries ---
  app.get("/api/pets/:id/weights", async (req, res) => {
    const petId = parseInt(req.params.id);
    if (isNaN(petId)) return res.status(400).json({ error: "Invalid pet ID" });
    const entries = await storage.getWeightEntries(petId);
    res.json(entries);
  });

  app.get("/api/weight-entries", async (_req, res) => {
    const entries = await storage.getAllWeightEntries();
    res.json(entries);
  });

  app.post("/api/weight-entries", async (req, res) => {
    try {
      const validatedData = insertWeightEntrySchema.parse(req.body);
      const entry = await storage.createWeightEntry(validatedData);
      res.status(201).json(entry);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  });

  // --- Events ---
  app.get("/api/events", async (_req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  app.get("/api/pets/:id/events", async (req, res) => {
    const petId = parseInt(req.params.id);
    if (isNaN(petId)) return res.status(400).json({ error: "Invalid pet ID" });
    const events = await storage.getEventsByPet(petId);
    res.json(events);
  });

  app.post("/api/events", async (req, res) => {
    try {
      const { petIds, ...eventData } = req.body;
      if (!petIds || !Array.isArray(petIds) || petIds.length === 0) {
        return res.status(400).json({ error: "At least one pet must be selected" });
      }
      const validatedData = insertEventSchema.parse(eventData);
      const event = await storage.createEvent(validatedData, petIds);
      res.status(201).json(event);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid event ID" });
    await storage.deleteEvent(id);
    res.status(204).send();
  });

  return httpServer;
}
