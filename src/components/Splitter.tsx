export function Splitter({ label, onDrag }: { label: string; onDrag: (deltaX: number) => void }) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      title="Drag to resize"
      onPointerDown={(event) => {
        event.preventDefault();
        let last = event.clientX;
        const move = (pointer: PointerEvent) => {
          onDrag(pointer.clientX - last);
          last = pointer.clientX;
        };
        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      }}
      className="w-1.5 shrink-0 cursor-col-resize bg-line hover:bg-gold"
    />
  );
}
