import * as THREE from "three";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

/* ============================================================
 * 1) شكل السن — بنوصفه بمعادلة مسافة (SDF) وبنحوّله لمجسم
 *    بخوارزمية Marching Cubes. النتيجة سن ناعم بدون ملف موديل.
 * ============================================================ */

type V3 = [number, number, number];

const len = (x: number, y: number, z: number) => Math.hypot(x, y, z);

function sdSphere(p: V3, c: V3, r: number) {
  return len(p[0] - c[0], p[1] - c[1], p[2] - c[2]) - r;
}

function sdEllipsoid(p: V3, c: V3, r: V3) {
  const x = p[0] - c[0], y = p[1] - c[1], z = p[2] - c[2];
  const k0 = len(x / r[0], y / r[1], z / r[2]);
  const k1 = len(x / (r[0] * r[0]), y / (r[1] * r[1]), z / (r[2] * r[2]));
  return (k0 * (k0 - 1)) / k1;
}

/** مخروط بأطراف مدوّرة — للجذور (من Inigo Quilez) */
function sdRoundCone(p: V3, a: V3, b: V3, r1: number, r2: number) {
  const ba: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const l2 = ba[0] ** 2 + ba[1] ** 2 + ba[2] ** 2;
  const rr = r1 - r2;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  const pa: V3 = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
  const y = pa[0] * ba[0] + pa[1] * ba[1] + pa[2] * ba[2];
  const z = y - l2;
  const xv: V3 = [pa[0] * l2 - ba[0] * y, pa[1] * l2 - ba[1] * y, pa[2] * l2 - ba[2] * y];
  const x2 = xv[0] ** 2 + xv[1] ** 2 + xv[2] ** 2;
  const y2 = y * y * l2;
  const z2 = z * z * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
  if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
  return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}

/** دمج ناعم بين شكلين بدون حافة حادة */
function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);

function toothSdf(p: V3) {
  // التاج (الجزء الظاهر)
  let d = sdEllipsoid(p, [0, 0.3, 0], [0.6, 0.36, 0.54]);
  // النتوءات الأربعة فوق التاج
  for (const [x, z] of [[-0.25, -0.21], [0.25, -0.21], [-0.25, 0.21], [0.25, 0.21]] as const) {
    d = smin(d, sdSphere(p, [x, 0.5, z], 0.25), 0.2);
  }
  // الأخدود بالنص بين النتوءات
  d = smax(d, -sdEllipsoid(p, [0, 0.78, 0], [0.42, 0.14, 0.06]), 0.09);
  d = smax(d, -sdEllipsoid(p, [0, 0.78, 0], [0.06, 0.14, 0.36]), 0.09);
  // الجذور: اثنين قدام وواحد ورا، مايلين لبرا شوي
  d = smin(d, sdRoundCone(p, [-0.26, 0.08, 0.08], [-0.34, -0.86, 0.14], 0.25, 0.07), 0.22);
  d = smin(d, sdRoundCone(p, [0.26, 0.08, 0.08], [0.34, -0.86, 0.14], 0.25, 0.07), 0.22);
  d = smin(d, sdRoundCone(p, [0, 0.08, -0.2], [0.02, -0.74, -0.38], 0.22, 0.07), 0.22);
  return d;
}

/** بيحوّل الـ SDF لمجسم ثابت حجمه ~1 وحدة طول */
export function buildToothGeometry(resolution = 72) {
  const mc = new MarchingCubes(resolution, new THREE.MeshBasicMaterial(), false, false, 120000);
  const { size, size2, halfsize } = mc;
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const p: V3 = [(x - halfsize) / halfsize, (y - halfsize) / halfsize, (z - halfsize) / halfsize];
        // الحقل موجب جوّا السن — السطح عند الصفر
        mc.field[x + y * size + z * size2] = -toothSdf(p);
      }
    }
  }
  mc.isolation = 0;
  mc.update();

  const count = mc.count;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(mc.positionArray.slice(0, count * 3), 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(mc.normalArray.slice(0, count * 3), 3));
  mc.geometry.dispose();
  (mc.material as THREE.Material).dispose();

  // نوسّطه ونخلي طوله 1
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const center = box.getCenter(new THREE.Vector3());
  const height = box.max.y - box.min.y;
  geometry.translate(-center.x, -center.y, -center.z);
  geometry.scale(1 / height, 1 / height, 1 / height);
  geometry.computeBoundingSphere();
  return geometry;
}

/* ============================================================
 * 2) مسار الطيران مع السكرول — مكان لكل قسم
 * ============================================================ */

export interface Keyframe {
  x: number; // -1..1 من عرض الشاشة (موجب = لجهة نهاية السطر)
  y: number; // -1..1 من طول الشاشة
  s: number; // الحجم
  yaw: number; // دوران حول نفسه (درجات)
  pitch: number;
  roll: number;
}

const DESKTOP: Keyframe[] = [
  { x: 0.0, y: -0.16, s: 1.0, yaw: 20, pitch: 6, roll: -6 }, // الواجهة
  { x: -0.3, y: -0.06, s: 0.95, yaw: 110, pitch: 10, roll: 8 }, // خدماتنا
  { x: 0.26, y: -0.24, s: 1.0, yaw: 220, pitch: -8, roll: -10 }, // الحجز
  { x: -0.24, y: 0.0, s: 0.92, yaw: 320, pitch: 8, roll: 6 }, // أطباؤنا
  { x: 0.0, y: -0.14, s: 0.9, yaw: 380, pitch: 4, roll: 0 }, // التواصل
];

const MOBILE: Keyframe[] = [
  { x: 0.0, y: -0.04, s: 0.78, yaw: 20, pitch: 6, roll: -6 },
  { x: 0.12, y: 0.16, s: 0.7, yaw: 110, pitch: 10, roll: 8 },
  { x: 0.2, y: -0.22, s: 0.72, yaw: 220, pitch: -8, roll: -10 },
  { x: 0.22, y: 0.28, s: 0.66, yaw: 320, pitch: 8, roll: 6 },
  { x: 0.0, y: 0.2, s: 0.56, yaw: 380, pitch: 4, roll: 0 },
];

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const rad = THREE.MathUtils.degToRad;

/** progress: رقم القسم + الكسر (مثلاً 1.5 = نص الطريق بين القسم الثاني والثالث) */
export function targetAt(progress: number, keys: Keyframe[]) {
  const p = clamp(Number.isFinite(progress) ? progress : 0, 0, keys.length - 1);
  const i = Math.min(keys.length - 2, Math.floor(p));
  const f = p - i;
  const a = keys[i]!, b = keys[i + 1]!;
  // بيثبت شوي عند كل قسم، وبيطير بين الأقسام
  const t = ease(clamp((f - 0.12) / 0.76, 0, 1));
  const arc = Math.sin(t * Math.PI);
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t) - arc * 0.2, // بينزل بنص الطريق وبيرجع يطلع
    s: lerp(a.s, b.s, t) * (1 + arc * 0.12),
    yaw: lerp(a.yaw, b.yaw, t),
    pitch: lerp(a.pitch, b.pitch, t),
    roll: lerp(a.roll, b.roll, t),
    moving: arc,
  };
}

/* ============================================================
 * 3) المشهد
 * ============================================================ */

function sparkleTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const glow = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  glow.addColorStop(0, "rgba(255,255,255,0.9)");
  glow.addColorStop(0.25, "rgba(255,255,255,0.25)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = "#fff";
  g.beginPath(); // نجمة رباعية
  g.moveTo(64, 4);
  g.quadraticCurveTo(70, 58, 124, 64);
  g.quadraticCurveTo(70, 70, 64, 124);
  g.quadraticCurveTo(58, 70, 4, 64);
  g.quadraticCurveTo(58, 58, 64, 4);
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface ToothSceneOptions {
  rtl: boolean;
  reducedMotion: boolean;
  /** الأقسام اللي السن بيتنقل بينها، بالترتيب */
  sections: HTMLElement[];
  onReady?: () => void;
}

export function createToothScene(canvas: HTMLCanvasElement, opts: ToothSceneOptions) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  // إضاءة: أبيض من فوق، وانعكاسات زرقا وزهرية زي خطوط المعجون
  scene.add(new THREE.HemisphereLight(0xffffff, 0xbfdcff, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 5, 6);
  const rimBlue = new THREE.DirectionalLight(0x2d8cff, 2.6);
  rimBlue.position.set(5, 1, -4);
  const rimPink = new THREE.DirectionalLight(0xff7eb3, 2.4);
  rimPink.position.set(-5, 2, -3);
  scene.add(key, rimBlue, rimPink);

  // الهرمية: flight (المكان والحجم) > tilt (الميلان) > spin (الدوران) > السن
  const flight = new THREE.Group();
  const tilt = new THREE.Group();
  const spin = new THREE.Group();
  flight.add(tilt);
  tilt.add(spin);
  scene.add(flight);

  // مينا السن: أبيض لؤلؤي مع لمعة قوس قزح خفيفة
  const enamel = new THREE.MeshPhysicalMaterial({
    color: 0xfbfdff,
    roughness: 0.2,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    sheen: 0.6,
    sheenColor: new THREE.Color(0xd6ecff),
    sheenRoughness: 0.4,
    iridescence: 0.35,
    iridescenceIOR: 1.3,
    iridescenceThicknessMinimum: 120,
    iridescenceThicknessMaximum: 420,
    envMapIntensity: 1.1,
  });
  const toothGeometry = buildToothGeometry();
  const tooth = new THREE.Mesh(toothGeometry, enamel);
  spin.add(tooth);

  // فقاعات بتلف حوالين السن (بدل أجنحة النحلة)
  const bubbleGeometry = new THREE.SphereGeometry(1, 32, 24);
  const bubbleMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.02,
    metalness: 0,
    transparent: true,
    opacity: 0.32,
    clearcoat: 1,
    iridescence: 1,
    iridescenceIOR: 1.25,
    iridescenceThicknessMinimum: 200,
    iridescenceThicknessMaximum: 600,
    depthWrite: false,
  });
  const bubbles = Array.from({ length: 7 }, (_, i) => {
    const mesh = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
    const size = 0.035 + (i % 3) * 0.022;
    mesh.scale.setScalar(size);
    tilt.add(mesh);
    return {
      mesh,
      radius: 0.62 + (i % 4) * 0.08,
      speed: 0.35 + (i % 3) * 0.12,
      phase: (i / 7) * Math.PI * 2,
      height: -0.25 + ((i * 37) % 10) / 16,
    };
  });

  // نجوم لمعة صغيرة فوق السن
  const sparkleMap = sparkleTexture();
  const sparkleColors = [0xffffff, 0xff7eb3, 0x7fd3ff, 0xffffff, 0x2d8cff];
  const sparkles = sparkleColors.map((color, i) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: sparkleMap, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    const angle = (i / sparkleColors.length) * Math.PI * 2 + 0.4;
    sprite.position.set(Math.cos(angle) * 0.42, 0.45 + (i % 2) * 0.16, Math.sin(angle) * 0.3);
    tilt.add(sprite);
    return { sprite, phase: i * 1.7, base: 0.09 + (i % 2) * 0.05 };
  });

  /* ---------- الحالة ---------- */
  const keys = () => (window.innerWidth < 760 ? MOBILE : DESKTOP);
  const mirror = opts.rtl ? -1 : 1; // بالعربي كل شي معكوس
  const cur = { ...targetAt(0, keys()) };
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  let prevX = cur.x, prevY = cur.y;

  /** وين إحنا بين الأقسام، من مكان كل قسم الحقيقي بالصفحة */
  function scrollProgress() {
    const y = window.scrollY + window.innerHeight * 0.001;
    const tops = opts.sections.map((s) => s.offsetTop);
    for (let i = tops.length - 1; i >= 0; i--) {
      if (y >= tops[i]!) {
        const next = tops[i + 1];
        if (next === undefined) return i;
        return i + clamp((y - tops[i]!) / (next - tops[i]!), 0, 1);
      }
    }
    return 0;
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
  };

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onPointer, { passive: true });

  const timer = new THREE.Timer();
  timer.connect(document);
  const still = opts.reducedMotion;
  let frame = 0;
  let readyFired = false;

  function tick() {
    frame = requestAnimationFrame(tick);
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);
    const t = still ? 0 : timer.getElapsed();
    const target = targetAt(scrollProgress(), keys());

    // بيلحق مكانه بنعومة، فبيبين إنه طاير مش ملزّق بالسكرول
    const k = still ? 1 : 1 - Math.exp(-dt * 3.2);
    cur.x += (target.x - cur.x) * k;
    cur.y += (target.y - cur.y) * k;
    cur.s += (target.s - cur.s) * k;
    cur.yaw += (target.yaw - cur.yaw) * (still ? 1 : 1 - Math.exp(-dt * 2.6));
    cur.pitch += (target.pitch - cur.pitch) * k;
    cur.roll += (target.roll - cur.roll) * k;
    cur.moving = target.moving;
    const vx = dt > 0 ? (cur.x - prevX) / dt : 0;
    const vy = dt > 0 ? (cur.y - prevY) / dt : 0;
    prevX = cur.x;
    prevY = cur.y;

    const km = still ? 0 : 1 - Math.exp(-dt * 2);
    mouse.sx += (mouse.x - mouse.sx) * km;
    mouse.sy += (mouse.y - mouse.sy) * km;

    const halfH = Math.tan(rad(camera.fov / 2)) * camera.position.z;
    const halfW = halfH * camera.aspect;
    const hover = Math.sin(t * 2.1) * 0.045 + Math.sin(t * 3.7) * 0.015;

    flight.position.set(
      cur.x * mirror * halfW + Math.sin(t * 1.3) * 0.04 + mouse.sx * 0.12,
      cur.y * halfH + hover * halfH * 0.5 + mouse.sy * 0.08,
      Math.sin(t * 0.9) * 0.15
    );
    flight.scale.setScalar(halfH * 2 * 0.3 * cur.s);

    // بيميل مع الحركة وباتجاه الماوس
    const pitch = cur.pitch - clamp(vy * 22, -24, 24) + Math.sin(t * 2.1 + 1) * 3 + mouse.sy * 6;
    const roll = cur.roll * mirror - clamp(vx * mirror * 18, -26, 26) * mirror + Math.sin(t * 1.7) * 4 - mouse.sx * 8;
    tilt.rotation.set(rad(pitch), 0, rad(roll));
    spin.rotation.y = rad(cur.yaw * mirror + mouse.sx * 14) + t * 0.25;

    // الفقاعات أسرع لما يكون طاير
    const orbit = 1 + cur.moving * 1.6;
    for (const b of bubbles) {
      const a = t * b.speed * orbit + b.phase;
      b.mesh.position.set(Math.cos(a) * b.radius, b.height + Math.sin(t * 1.3 + b.phase) * 0.08, Math.sin(a) * b.radius * 0.75);
    }
    for (const s of sparkles) {
      const pulse = still ? 0.7 : (Math.sin(t * 3 + s.phase) + 1) / 2;
      s.sprite.scale.setScalar(s.base * (0.35 + pulse * 0.9));
      s.sprite.material.opacity = 0.25 + pulse * 0.75;
    }

    renderer.render(scene, camera);
    if (!readyFired) {
      readyFired = true;
      opts.onReady?.();
    }
  }
  tick();

  return {
    dispose() {
      cancelAnimationFrame(frame);
      timer.dispose();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      toothGeometry.dispose();
      enamel.dispose();
      bubbleGeometry.dispose();
      bubbleMaterial.dispose();
      sparkleMap.dispose();
      sparkles.forEach((s) => s.sprite.material.dispose());
      envTexture.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
