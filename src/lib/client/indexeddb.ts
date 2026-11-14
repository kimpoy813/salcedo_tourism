export interface LocalItineraryStop {
  placeId: string;
  placeName: string;
  placeSlug: string;
  placeType: string;
  barangayName?: string | null;
  featuredImageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  visitTime: string;
  durationMinutes: number;
  personalNotes: string;
  /** 1-based day of a multi-day trip (Day 1 = plannedVisitDate). */
  day?: number;
}

export interface LocalItineraryDraft {
  id: string;
  title: string;
  plannedVisitDate: string;
  /** Total trip length in days (1–14). Stops carry their own `day`. */
  numberOfDays?: number;
  description: string;
  stops: LocalItineraryStop[];
  updatedAt: string;
  /** Local lifecycle so finished trips count on-device even without registration. */
  status?: "planning" | "completed";
  completedAt?: string | null;
  /** placeId -> star rating the tourist gave after the trip. */
  ratings?: Record<string, number>;
}

export interface LocalTripReceipt {
  referenceNumber: string;
  title: string;
  plannedVisitDate: string;
  totalStops: number;
  savedAt: string;
  note?: string;
  status?: "submitted" | "completed";
  completedAt?: string | null;
  ratings?: Record<string, number>;
}

const DB_NAME = "turi-salcedo-local-v1";
const DB_VERSION = 1;
const STORE_DRAFTS = "drafts";
const STORE_SAVED = "saved_places";
const STORE_RECEIPTS = "submitted_receipts";

function openTuriDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        db.createObjectStore(STORE_DRAFTS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_SAVED)) {
        db.createObjectStore(STORE_SAVED, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_RECEIPTS)) {
        db.createObjectStore(STORE_RECEIPTS, { keyPath: "referenceNumber" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function lsRead<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsWrite(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export async function listLocalDrafts(): Promise<LocalItineraryDraft[]> {
  try {
    const db = await openTuriDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DRAFTS, "readonly");
      const req = tx.objectStore(STORE_DRAFTS).getAll();
      req.onsuccess = () => {
        const items = (req.result as LocalItineraryDraft[]) || [];
        resolve(items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return lsRead<LocalItineraryDraft[]>("turi_drafts", []);
  }
}

export async function saveLocalDraft(draft: LocalItineraryDraft): Promise<void> {
  try {
    const db = await openTuriDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_DRAFTS, "readwrite");
      tx.objectStore(STORE_DRAFTS).put(draft);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const existing = lsRead<LocalItineraryDraft[]>("turi_drafts", []).filter(
      (d) => d.id !== draft.id
    );
    lsWrite("turi_drafts", [draft, ...existing]);
  }
}

export async function deleteLocalDraft(id: string): Promise<void> {
  try {
    const db = await openTuriDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_DRAFTS, "readwrite");
      tx.objectStore(STORE_DRAFTS).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const existing = lsRead<LocalItineraryDraft[]>("turi_drafts", []).filter((d) => d.id !== id);
    lsWrite("turi_drafts", existing);
  }
}

export async function listSavedPlaceIds(): Promise<string[]> {
  try {
    const db = await openTuriDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SAVED, "readonly");
      const req = tx.objectStore(STORE_SAVED).getAll();
      req.onsuccess = () => {
        const rows = (req.result as Array<{ id: string }>) || [];
        resolve(rows.map((r) => r.id));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return lsRead<string[]>("turi_saved_places", []);
  }
}

export async function toggleSavedPlaceId(placeId: string): Promise<boolean> {
  const current = await listSavedPlaceIds();
  const exists = current.includes(placeId);
  try {
    const db = await openTuriDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SAVED, "readwrite");
      if (exists) {
        tx.objectStore(STORE_SAVED).delete(placeId);
      } else {
        tx.objectStore(STORE_SAVED).put({ id: placeId, savedAt: new Date().toISOString() });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const next = exists ? current.filter((i) => i !== placeId) : [...current, placeId];
    lsWrite("turi_saved_places", next);
  }
  return !exists;
}

export async function listLocalReceipts(): Promise<LocalTripReceipt[]> {
  try {
    const db = await openTuriDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_RECEIPTS, "readonly");
      const req = tx.objectStore(STORE_RECEIPTS).getAll();
      req.onsuccess = () => {
        const items = (req.result as LocalTripReceipt[]) || [];
        resolve(items.sort((a, b) => b.savedAt.localeCompare(a.savedAt)));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return lsRead<LocalTripReceipt[]>("turi_receipts", []);
  }
}

export async function saveLocalReceipt(receipt: LocalTripReceipt): Promise<void> {
  try {
    const db = await openTuriDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_RECEIPTS, "readwrite");
      tx.objectStore(STORE_RECEIPTS).put(receipt);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const existing = lsRead<LocalTripReceipt[]>("turi_receipts", []).filter(
      (r) => r.referenceNumber !== receipt.referenceNumber
    );
    lsWrite("turi_receipts", [receipt, ...existing]);
  }
}

export async function removeLocalReceipt(referenceNumber: string): Promise<void> {
  try {
    const db = await openTuriDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_RECEIPTS, "readwrite");
      tx.objectStore(STORE_RECEIPTS).delete(referenceNumber);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const existing = lsRead<LocalTripReceipt[]>("turi_receipts", []).filter(
      (r) => r.referenceNumber !== referenceNumber
    );
    lsWrite("turi_receipts", existing);
  }
}
