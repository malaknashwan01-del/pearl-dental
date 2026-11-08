/** صورة الطبيب، أو صورة ظلية هادية إذا الصورة لسا مش موجودة */
export default function DoctorPhoto({ src, name, className = "" }: { src?: string; name: string; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={`object-cover ${className}`} loading="lazy" draggable={false} />;
  }
  return (
    <div className={`relative overflow-hidden bg-[#dde8f2] ${className}`} role="img" aria-label={name}>
      <svg viewBox="0 0 100 125" className="absolute inset-x-0 bottom-0 h-[86%] w-full" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
        <circle cx="50" cy="44" r="19" fill="#c3d4e4" />
        <path d="M12 125c0-24 17-40 38-40s38 16 38 40z" fill="#c3d4e4" />
        <path d="M38 88l12 14 12-14" fill="none" stroke="#dde8f2" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
