import { addNote } from "@/lib/actions/note-actions";

type NoteItem = {
  id: string;
  content: string;
  createdAt: Date;
};

export function NotesPanel({ listingId, notes }: { listingId: string; notes: NoteItem[] }) {
  const boundAddNote = addNote.bind(null, listingId);

  return (
    <div>
      <form action={boundAddNote} className="flex flex-col gap-2">
        <textarea
          name="content"
          required
          rows={3}
          placeholder="Add a note…"
          className="block w-full rounded-md border border-zinc-300 px-2 py-1 text-sm"
        />
        <button
          type="submit"
          className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Add note
        </button>
      </form>

      <div className="mt-4 space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-zinc-400">No notes yet.</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="rounded-md border border-zinc-200 p-3 text-sm">
              <p className="whitespace-pre-wrap">{note.content}</p>
              <p className="mt-1 text-xs text-zinc-400">{note.createdAt.toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
