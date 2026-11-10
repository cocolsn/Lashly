export function LogoMark({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-14 text-2xl rounded-card" : "size-9 text-base rounded-[10px]";
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center bg-acc font-semibold text-acc-ink ${box}`}
    >
      L
    </span>
  );
}
