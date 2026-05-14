/* eslint-disable @next/next/no-img-element */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.png"
        alt="imageprompting.org logo"
        width={32}
        height={32}
        className="w-8 h-8 rounded-lg"
      />
      <span className="font-extrabold tracking-tight text-ink whitespace-nowrap">
        imageprompting<span className="text-ink/50">.org</span>
      </span>
    </div>
  );
}
