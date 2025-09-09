import { ToothCondition } from "./utils/toothCondition";
import { ToothSchema } from "./utils/schema";
import { convert } from "./utils/teeth-numbering-system";
import DentalHistoryService, { TeethUpdate } from "@/services/dentalHistoryService";

export class Tooth {
  ISO: number = 11; // Default ISO for a tooth
  private patientId: string; // Store the patient ID
  public condition: keyof typeof ToothCondition = "sound"; // Default condition
  private notes: string[] = []; // Notes for the tooth

  constructor(patientId: string) {
    this.patientId = patientId;
  }

  // Computed property to get Universal format from ISO
  get Universal(): string | number {
    return convert(this.ISO).Universal;
  }

  // Computed property to get Palmer notation from ISO
  get Palmer(): string {
    return convert(this.ISO).Palmer;
  }

  // Computed property to get the Name of the tooth from ISO
  get Name(): string {
    return convert(this.ISO).Name;
  }

  // Check if the tooth has any concerns (condition or notes)
  get concern(): boolean {
    return this.condition !== "sound" || this.notes.length > 0;
  }

  // Update ISO and return the instance (fluent API)
  fromISO(iso: number): Tooth {
    this.ISO = iso;
    return this;
  }

  // Deserialize from JSON (ToothSchema) to a Tooth instance
  fromJSON(input: ToothSchema): Tooth {
    this.ISO = input.ISO;
    this.condition = input.condition;
    this.notes = [...input.notes];
    return this;
  }

  // Serialize Tooth instance to JSON (ToothSchema)
  toJSON(): ToothSchema {
    return {
      ISO: this.ISO,
      condition: this.condition,
      notes: [...this.notes],
    };
  }

  // Getters and setters for condition
  getCondition(): keyof typeof ToothCondition {
    return this.condition;
  }

  setCondition(newCondition: keyof typeof ToothCondition): void {
    this.condition = newCondition;
  }

  // Getters and setters for notes
  getNotes(): string[] {
    return [...this.notes];
  }

  addNote(note: string): void {
    if (note) {
      this.notes.push(note);
    }
  }

  removeNote(note: string): void {
    this.notes = this.notes.filter((n) => n !== note);
  }

  // Load this tooth's data from the dental history service
  async loadFromService(): Promise<void> {
    const service = new DentalHistoryService();
    const all = await service.getDentalHistory(this.patientId);
    const match = all.find((t) => Number(t.toothNumber) === Number(this.ISO));
    if (match) {
      this.condition = (match.condition as keyof typeof ToothCondition) || "sound";
      this.notes = Array.isArray(match.history)
        ? match.history.map((h) => h?.description).filter(Boolean)
        : [];
    }
  }

  // Persist this tooth's current state to the service
  async persistToService(): Promise<void> {
    const service = new DentalHistoryService();
    const update: TeethUpdate = {
      toothNumber: String(this.ISO),
      condition: this.condition,
      history: this.notes.map((d) => ({ description: d })),
    };
    await service.bulkPatchDentalHistory(this.patientId, [update]);
  }
}
