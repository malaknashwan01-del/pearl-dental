/**
 * بيانات العيادة: الخدمات، الأطباء، وساعات الدوام.
 * كلها هون بمكان واحد، والحجوزات بس بقاعدة البيانات.
 */

export type Lang = "ar" | "en";
type Text = Record<Lang, string>;

export const CLINIC_TZ = "Asia/Gaza";
/** المواعيد بتبدأ كل ربع ساعة */
export const SLOT_MINUTES = 15;
/** أبعد يوم بتقدر تحجز فيه */
export const BOOKING_WINDOW_DAYS = 21;
/** ما بنقبل حجز قبل أقل من ساعة من الموعد */
export const MIN_NOTICE_MINUTES = 60;
/** الإلغاء أونلاين مسموح لحد 12 ساعة قبل الموعد */
export const CANCEL_NOTICE_HOURS = 12;

export type ServiceId = "checkup" | "cleaning" | "filling" | "whitening" | "aligners" | "implant" | "kids";

export interface Service {
  id: ServiceId;
  minutes: number;
  /** السعر بالشيكل — 0 يعني مجاناً */
  priceFrom: number;
  name: Text;
  blurb: Text;
}

export const SERVICES: Service[] = [
  {
    id: "checkup",
    minutes: 30,
    priceFrom: 80,
    name: { ar: "فحص واستشارة", en: "Check-up" },
    blurb: {
      ar: "فحص كامل وصورة أشعة رقمية، وتخرج بخطة واضحة وأسعار مكتوبة.",
      en: "A full exam and a digital X-ray. You leave with a clear plan and written prices.",
    },
  },
  {
    id: "cleaning",
    minutes: 45,
    priceFrom: 150,
    name: { ar: "تنظيف وتلميع", en: "Cleaning & polish" },
    blurb: {
      ar: "إزالة الجير والتصبغات بجهاز فوق صوتي، ثم تلميع يعيد للأسنان ملمسها الناعم.",
      en: "Tartar and stains removed with an ultrasonic scaler, then a polish that leaves teeth smooth.",
    },
  },
  {
    id: "filling",
    minutes: 45,
    priceFrom: 200,
    name: { ar: "حشوة تجميلية", en: "Tooth-coloured filling" },
    blurb: {
      ar: "حشوة بلون السن نفسه، لا تظهر عند الابتسام.",
      en: "A filling matched to your tooth's shade, invisible when you smile.",
    },
  },
  {
    id: "whitening",
    minutes: 60,
    priceFrom: 600,
    name: { ar: "تبييض في العيادة", en: "In-clinic whitening" },
    blurb: {
      ar: "جلسة واحدة تفتّح الأسنان عدة درجات، مع حماية كاملة للثة.",
      en: "One session that lifts your shade several steps, with the gums fully protected.",
    },
  },
  {
    id: "aligners",
    minutes: 30,
    priceFrom: 0,
    name: { ar: "استشارة تقويم شفاف", en: "Clear aligner consultation" },
    blurb: {
      ar: "مسح ثلاثي الأبعاد لأسنانك، لترى النتيجة المتوقعة قبل أن تقرر.",
      en: "A 3D scan of your teeth, so you see the expected result before you decide.",
    },
  },
  {
    id: "implant",
    minutes: 30,
    priceFrom: 100,
    name: { ar: "استشارة زراعة", en: "Implant consultation" },
    blurb: {
      ar: "تقييم العظم بالأشعة، وشرح كل مرحلة ومدتها وتكلفتها.",
      en: "Bone assessment on X-ray, and every stage explained with its time and cost.",
    },
  },
  {
    id: "kids",
    minutes: 30,
    priceFrom: 80,
    name: { ar: "أسنان الأطفال", en: "Children's dentistry" },
    blurb: {
      ar: "زيارات هادئة للأطفال من عمر سنتين، وأول زيارة للتعارف فقط دون أي علاج.",
      en: "Calm visits for children from age two. The first one is just to say hello.",
    },
  },
];

/** 0 = الأحد ... 5 = الجمعة (مسكّر) ... 6 = السبت */
type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type Hours = [open: string, close: string];

export interface Doctor {
  slug: string;
  gender: "f" | "m";
  name: Text;
  role: Text;
  bio: Text;
  years: number;
  languages: Text;
  services: ServiceId[];
  hours: Partial<Record<Weekday, Hours>>;
  /** صورة بمجلد public/photos — إذا مش موجودة بتظهر الأحرف الأولى */
  photo: string;
}

export const DOCTORS: Doctor[] = [
  {
    slug: "sara",
    gender: "f",
    name: { ar: "د. سارة الخطيب", en: "Dr. Sara Al-Khatib" },
    role: { ar: "أخصائية تقويم الأسنان", en: "Orthodontist" },
    bio: {
      ar: "تعالج الكبار والمراهقين بالتقويم الشفاف، وتعرض لك كل مرحلة على الشاشة قبل أن تبدأ.",
      en: "Treats adults and teens with clear aligners, and likes to walk you through every step on screen.",
    },
    years: 11,
    languages: { ar: "العربية، الإنجليزية", en: "Arabic, English" },
    services: ["aligners", "checkup"],
    hours: { 6: ["10:00", "18:00"], 1: ["10:00", "18:00"], 3: ["10:00", "18:00"] },
    photo: "dr-sara",
  },
  {
    slug: "laith",
    gender: "m",
    name: { ar: "د. ليث منصور", en: "Dr. Laith Mansour" },
    role: { ar: "جراحة وزراعة الفم", en: "Oral surgeon & implants" },
    bio: {
      ar: "زراعة الأسنان وخلع أضراس العقل وجراحات اللثة. يعرفه مرضاه بيده الخفيفة.",
      en: "Implants, wisdom teeth and gum surgery. Patients know him for a light hand.",
    },
    years: 16,
    languages: { ar: "العربية، الإنجليزية، الألمانية", en: "Arabic, English, German" },
    services: ["implant", "checkup"],
    hours: { 0: ["12:00", "20:00"], 2: ["12:00", "20:00"], 4: ["12:00", "20:00"] },
    photo: "dr-laith",
  },
  {
    slug: "rana",
    gender: "f",
    name: { ar: "د. رنا حداد", en: "Dr. Rana Haddad" },
    role: { ar: "تجميل الأسنان", en: "Cosmetic dentist" },
    bio: {
      ar: "التبييض والحشوات التجميلية والتنظيف. تنظر إلى الابتسامة كاملة، لا إلى سن واحد.",
      en: "Whitening, tooth-coloured fillings and cleanings. She looks at the whole smile, not one tooth.",
    },
    years: 7,
    languages: { ar: "العربية، الإنجليزية", en: "Arabic, English" },
    services: ["whitening", "filling", "cleaning", "checkup"],
    hours: {
      6: ["09:00", "15:00"],
      0: ["09:00", "15:00"],
      1: ["09:00", "15:00"],
      2: ["09:00", "15:00"],
      3: ["09:00", "15:00"],
    },
    photo: "dr-rana",
  },
  {
    slug: "yousef",
    gender: "m",
    name: { ar: "د. يوسف عابد", en: "Dr. Yousef Abed" },
    role: { ar: "طب أسنان الأطفال", en: "Paediatric dentist" },
    bio: {
      ar: "ينتظر الأطفال زيارته. يشرح لهم بالألعاب قبل أن يمسك أي أداة.",
      en: "Kids actually look forward to seeing him. He explains with toys before he picks up a tool.",
    },
    years: 9,
    languages: { ar: "العربية، الإنجليزية", en: "Arabic, English" },
    services: ["kids", "cleaning", "checkup"],
    hours: {
      6: ["14:00", "20:00"],
      0: ["14:00", "20:00"],
      2: ["14:00", "20:00"],
      3: ["14:00", "20:00"],
    },
    photo: "dr-yousef",
  },
];

export const getService = (id: string) => SERVICES.find((s) => s.id === id);
export const getDoctor = (slug: string) => DOCTORS.find((d) => d.slug === slug);
export const doctorsFor = (serviceId: string) => DOCTORS.filter((d) => d.services.includes(serviceId as ServiceId));
