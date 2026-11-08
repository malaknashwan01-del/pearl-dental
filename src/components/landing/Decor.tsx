/* الشعار وأيقونات صغيرة مشتركة */

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="#1F5FD6" />
      <path
        d="M12.6 13.4c0-2.9 2.1-4.7 4.5-4.7 1.3 0 2 .6 2.9.6s1.6-.6 2.9-.6c2.4 0 4.5 1.8 4.5 4.7 0 2.4-.9 3.6-1.3 6-.5 3-.7 9.4-2.6 9.4-1.7 0-1.6-5.9-3.5-5.9s-1.8 5.9-3.5 5.9c-1.9 0-2.1-6.4-2.6-9.4-.4-2.4-1.3-3.6-1.3-6z"
        fill="#fff"
      />
      <circle cx="29.5" cy="10.5" r="2.2" fill="#E8588C" />
    </svg>
  );
}

/** سهم بيتعكس لحاله بالعربي */
export function Arrow({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`${className} rtl:-scale-x-100`} aria-hidden="true">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

export function Phone({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6.2 2.8 4 3.4c-.8.2-1.3 1-1.1 1.8 1.6 6.3 5.6 10.3 11.9 11.9.8.2 1.6-.3 1.8-1.1l.6-2.2-3.4-1.7-1.6 1.6c-2.2-1-3.9-2.7-4.9-4.9l1.6-1.6z" />
    </svg>
  );
}
