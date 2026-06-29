type StatusHistoryItem = {
  id: string;
  fromStatus: string;
  toStatus: string;
  reason: string | null;
  changedAt: Date;
};

export function StatusHistoryTimeline({ entries }: { entries: StatusHistoryItem[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-zinc-400">No status changes recorded yet.</p>;
  }

  return (
    <ul className="space-y-3 border-l border-zinc-200 pl-4">
      {entries.map((entry) => (
        <li key={entry.id} className="text-sm">
          <p>
            <span className="font-medium">{entry.fromStatus}</span>
            {" → "}
            <span className="font-medium">{entry.toStatus}</span>
          </p>
          {entry.reason && <p className="text-zinc-600">{entry.reason}</p>}
          <p className="text-xs text-zinc-400">{entry.changedAt.toLocaleString()}</p>
        </li>
      ))}
    </ul>
  );
}
