"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";

const AddNoteSchema = z.object({
  content: z.string().trim().min(1, "Note can't be empty"),
});

// Append-only — no edit/delete in v1, so corrections go in as new notes and
// the history stays honest rather than silently rewritten.
export async function addNote(listingId: string, formData: FormData) {
  const parsed = AddNoteSchema.parse(Object.fromEntries(formData.entries()));
  await prisma.note.create({ data: { listingId, content: parsed.content } });
  revalidatePath(`/listings/${listingId}`);
}
