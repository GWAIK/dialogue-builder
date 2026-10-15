export function AddBar({
  onLine,
  onChoice,
  onFact,
  onCondition,
}: {
  onLine: () => void;
  onChoice: () => void;
  onFact: () => void;
  onCondition: () => void;
}) {
  const items = [
    ["Line", onLine],
    ["Choice", onChoice],
    ["Set fact", onFact],
    ["Condition", onCondition],
  ] as const;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([label, action]) => (
        <button
          key={label}
          type="button"
          onClick={action}
          className="rounded border border-line bg-panel px-2.5 py-1 text-xs text-ink hover:border-gold"
        >
          + {label}
        </button>
      ))}
    </div>
  );
}
