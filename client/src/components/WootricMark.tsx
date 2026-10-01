type WootricMarkProps = {
  className?: string;
};

/** Marca circular da Wootric renderizada em CSS para funcionar no preview e na produção. */
export function WootricMark({ className = "" }: WootricMarkProps) {
  return (
    <span
      className={`inline-flex aspect-square items-center justify-center rounded-full bg-[#8CC5FF] p-[20%] ${className}`}
      aria-hidden="true"
    >
      <span className="flex h-full w-full items-center justify-center rounded-full bg-[#2457E8] p-[26%]">
        <span className="h-full w-full rounded-full bg-[#071D87]" />
      </span>
    </span>
  );
}
