import type { Locale } from "./config";

const ar = {
  meta: {
    title: "Pearl Dental — عيادة أسنان",
    description: "عناية لطيفة بأسنانك بأحدث التقنيات. احجز موعدك في Pearl Dental خلال دقيقة.",
  },
  nav: {
    services: "خدماتنا",
    book: "الحجز",
    team: "أطباؤنا",
    cta: "احجز موعد",
    switchTo: "EN",
    switchLabel: "English",
    home: "الصفحة الرئيسية",
  },
  hero: {
    line1: "ابتسامتك تستحق",
    line2: "لمعة اللؤلؤ",
    side: "عناية لطيفة بأسنانك بأحدث التقنيات، من أول فحص حتى ابتسامة أحلامك.",
    cta: "احجز موعدك",
  },
  services: {
    title: ["رعاية كاملة", "لابتسامة", "صحية"],
    copy: "من التنظيف الدوري حتى زراعة الأسنان، يقدّم فريقنا كل ما تحتاجه ابتسامتك في مكان واحد، بأجهزة حديثة وبدون ألم قدر الإمكان.",
    items: ["تنظيف وتلميع", "تبييض", "حشوات تجميلية", "تقويم شفاف", "زراعة أسنان"],
  },
  book: {
    title: ["احجز موعدك", "بدقيقة"],
    copy: "اختر الخدمة والطبيب والوقت المناسب لك، وسنذكّرك قبل موعدك بيوم. بدون اتصالات وبدون انتظار.",
    cta: "احجز الآن",
  },
  team: {
    title: ["أطباء يهتمون", "براحتك"],
    copy: "نشرح لك كل خطوة قبل أن نبدأ، ونخصّص الوقت الكافي لكل مريض، لأن الزيارة المريحة تبدأ من الثقة.",
    stats: [
      { value: "+12", label: "سنة خبرة" },
      { value: "6", label: "أطباء متخصصين" },
      { value: "6", label: "أيام في الأسبوع" },
    ],
  },
  footer: {
    cta: "جاهز لابتسامة جديدة؟",
    button: "احجز موعدك",
    tagline: "عيادة أسنان",
    hoursTitle: "ساعات العمل",
    hours: ["السبت – الخميس", "9:00 ص – 8:00 م"],
    contactTitle: "تواصل معنا",
    phone: "+970 59 000 0000",
    email: "hello@pearldental.demo",
    socialTitle: "تابعنا",
  },
  badge: { made: "مشروع بورتفوليو من", name: "ملاك" },
};

export type Dictionary = typeof ar;

const en: Dictionary = {
  meta: {
    title: "Pearl Dental — Dental Clinic",
    description: "Gentle dental care with modern technology. Book your visit at Pearl Dental in a minute.",
  },
  nav: {
    services: "Services",
    book: "Booking",
    team: "Our team",
    cta: "Book a visit",
    switchTo: "ع",
    switchLabel: "العربية",
    home: "Home",
  },
  hero: {
    line1: "Your smile deserves",
    line2: "a pearl-like shine",
    side: "Gentle dental care with modern technology, from your first check-up to the smile you've always wanted.",
    cta: "Book a visit",
  },
  services: {
    title: ["Complete care", "for a healthy", "smile"],
    copy: "From regular cleanings to implants, our team covers everything your smile needs in one place, with modern equipment and as little discomfort as possible.",
    items: ["Cleaning & polish", "Whitening", "Cosmetic fillings", "Clear aligners", "Implants"],
  },
  book: {
    title: ["Book your visit", "in a minute"],
    copy: "Pick the treatment, the dentist and a time that suits you, and we'll remind you the day before. No calls, no waiting.",
    cta: "Book now",
  },
  team: {
    title: ["Dentists who care", "about your comfort"],
    copy: "We explain every step before we start and give each patient the time they need, because a relaxed visit starts with trust.",
    stats: [
      { value: "12+", label: "years of experience" },
      { value: "6", label: "specialist dentists" },
      { value: "6", label: "days a week" },
    ],
  },
  footer: {
    cta: "Ready for a new smile?",
    button: "Book a visit",
    tagline: "Dental clinic",
    hoursTitle: "Opening hours",
    hours: ["Saturday – Thursday", "9:00 am – 8:00 pm"],
    contactTitle: "Contact",
    phone: "+970 59 000 0000",
    email: "hello@pearldental.demo",
    socialTitle: "Follow us",
  },
  badge: { made: "Portfolio project by", name: "Malak" },
};

const dictionaries: Record<Locale, Dictionary> = { ar, en };

export const getDictionary = (locale: Locale) => dictionaries[locale];
