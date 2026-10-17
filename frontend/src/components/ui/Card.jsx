export function Card({ title, right, children, className = "", pad = "p-5", glow = false }) {
  return (
    <section className={`depth rounded-2xl ${glow ? "neon" : "border border-line bg-s1/85"} ${pad} ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-display font-semibold text-[17px] tracking-tight text-tx">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
