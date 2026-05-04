import PptxGenJS from "pptxgenjs";

const pptx = new PptxGenJS();

// ── Theme colors ──
const ORANGE = "FF6A00";
const DARK = "101214";
const GRAY = "6F757C";
const LIGHT_BG = "F9F7F4";
const WHITE = "FFFFFF";
const BEIGE = "E9E3DA";
const GREEN = "22C55E";
const BLUE = "3B82F6";
const PURPLE = "8B5CF6";

pptx.author = "YantraSetu Team";
pptx.company = "ShaanLabs";
pptx.subject = "YantraSetu - Project Presentation";
pptx.title = "YantraSetu - India's Heavy Equipment Marketplace";

// Helper: add consistent slide footer
function addFooter(slide, slideNum, totalSlides) {
  slide.addText(`YantraSetu  •  India's Heavy Equipment Marketplace`, {
    x: 0.3, y: 7.0, w: 8, h: 0.4,
    fontSize: 8, color: GRAY, fontFace: "Segoe UI",
  });
  slide.addText(`${slideNum} / ${totalSlides}`, {
    x: 8.5, y: 7.0, w: 1.2, h: 0.4,
    fontSize: 8, color: GRAY, fontFace: "Segoe UI", align: "right",
  });
}

// Helper: section divider slide
function addSectionSlide(title, subtitle, slideNum, totalSlides) {
  const slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 2.8, w: 10, h: 0.06, fill: { color: ORANGE },
  });
  slide.addText(title, {
    x: 0.8, y: 2.0, w: 8.4, h: 0.8,
    fontSize: 36, color: WHITE, fontFace: "Segoe UI", bold: true,
  });
  slide.addText(subtitle, {
    x: 0.8, y: 3.1, w: 8.4, h: 0.6,
    fontSize: 16, color: BEIGE, fontFace: "Segoe UI",
  });
  slide.addText(`${slideNum} / ${totalSlides}`, {
    x: 8.5, y: 7.0, w: 1.2, h: 0.4,
    fontSize: 8, color: GRAY, fontFace: "Segoe UI", align: "right",
  });
  return slide;
}

const TOTAL = 15;
let sn = 0;

// ═══════════════════════════════════════════════════════════════
// SLIDE 1 — TITLE
// ═══════════════════════════════════════════════════════════════
sn++;
const s1 = pptx.addSlide();
s1.background = { color: DARK };
// Orange accent bar
s1.addShape(pptx.shapes.RECTANGLE, {
  x: 0, y: 0, w: 10, h: 0.12, fill: { color: ORANGE },
});
// Title
s1.addText("YantraSetu", {
  x: 0.8, y: 1.8, w: 8.4, h: 1.2,
  fontSize: 52, color: WHITE, fontFace: "Segoe UI", bold: true,
});
s1.addText("यन्त्रसेतु", {
  x: 0.8, y: 2.9, w: 8.4, h: 0.6,
  fontSize: 22, color: ORANGE, fontFace: "Segoe UI",
});
// Subtitle
s1.addText("India's Premier Heavy Equipment Marketplace Platform", {
  x: 0.8, y: 3.6, w: 8.4, h: 0.6,
  fontSize: 18, color: BEIGE, fontFace: "Segoe UI",
});
// Meaning
s1.addShape(pptx.shapes.RECTANGLE, {
  x: 0.8, y: 4.5, w: 5, h: 0.05, fill: { color: ORANGE },
});
s1.addText("Yantra (Machine) + Setu (Bridge)  =  Bridge of Machines", {
  x: 0.8, y: 4.7, w: 8.4, h: 0.4,
  fontSize: 12, color: GRAY, fontFace: "Segoe UI", italic: true,
});
// Tech badges
const techBadges = ["React 18", "TypeScript", "Node.js", "Express", "PostgreSQL", "Sequelize", "AI/ML Engine"];
techBadges.forEach((t, i) => {
  s1.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8 + i * 1.2, y: 5.5, w: 1.1, h: 0.35,
    fill: { color: "1A1C1E" }, line: { color: ORANGE, width: 0.5 },
    rectRadius: 0.1,
  });
  s1.addText(t, {
    x: 0.8 + i * 1.2, y: 5.5, w: 1.1, h: 0.35,
    fontSize: 7, color: ORANGE, fontFace: "Segoe UI", align: "center", valign: "middle", bold: true,
  });
});
addFooter(s1, sn, TOTAL);


// ═══════════════════════════════════════════════════════════════
// SLIDE 2 — PROBLEM & SOLUTION
// ═══════════════════════════════════════════════════════════════
sn++;
const s2 = pptx.addSlide();
s2.background = { color: LIGHT_BG };
s2.addText("Problem & Solution", {
  x: 0.5, y: 0.3, w: 9, h: 0.6,
  fontSize: 28, color: DARK, fontFace: "Segoe UI", bold: true,
});
s2.addShape(pptx.shapes.RECTANGLE, {
  x: 0.5, y: 0.85, w: 2, h: 0.05, fill: { color: ORANGE },
});

// Problem section
s2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.5, y: 1.2, w: 4.2, h: 4.8,
  fill: { color: WHITE }, line: { color: BEIGE, width: 1 }, rectRadius: 0.15,
});
s2.addText("🔴  The Problem", {
  x: 0.8, y: 1.4, w: 3.6, h: 0.4,
  fontSize: 16, color: "DC2626", fontFace: "Segoe UI", bold: true,
});
s2.addText(`India's heavy equipment market ($20B+) has:`, {
  x: 0.8, y: 1.85, w: 3.6, h: 0.35,
  fontSize: 11, color: DARK, fontFace: "Segoe UI", bold: true,
});
const problems = [
  "Fragmented local dealers & word-of-mouth",
  "No standardized pricing — buyers overpay",
  "No verification — high fraud risk",
  "Operators & mechanics lack a formal marketplace",
  "Manual rental processes, no digital agreements",
  "Spare parts difficult to source",
];
problems.forEach((p, i) => {
  s2.addText(`✗  ${p}`, {
    x: 0.8, y: 2.3 + i * 0.5, w: 3.6, h: 0.4,
    fontSize: 10, color: GRAY, fontFace: "Segoe UI",
  });
});

// Solution section
s2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 5.3, y: 1.2, w: 4.2, h: 4.8,
  fill: { color: WHITE }, line: { color: GREEN, width: 1 }, rectRadius: 0.15,
});
s2.addText("🟢  YantraSetu Solution", {
  x: 5.6, y: 1.4, w: 3.6, h: 0.4,
  fontSize: 16, color: "16A34A", fontFace: "Segoe UI", bold: true,
});
const solutions = [
  "Unified marketplace for Buy/Sell/Rent",
  "AI-powered fair price prediction",
  "Document verification & trust scoring",
  "Operator & Mechanic hiring marketplaces",
  "Digital rental agreements & tracking",
  "Searchable spare parts with compatibility",
  "Location-based discovery (GPS radius)",
  "Subscription-based revenue model",
];
solutions.forEach((s, i) => {
  s2.addText(`✓  ${s}`, {
    x: 5.6, y: 1.9 + i * 0.45, w: 3.6, h: 0.35,
    fontSize: 10, color: DARK, fontFace: "Segoe UI",
  });
});
addFooter(s2, sn, TOTAL);


// ═══════════════════════════════════════════════════════════════
// SLIDE 3 — TECHNOLOGY STACK
// ═══════════════════════════════════════════════════════════════
sn++;
const s3 = pptx.addSlide();
s3.background = { color: LIGHT_BG };
s3.addText("Technology Stack", {
  x: 0.5, y: 0.3, w: 9, h: 0.6,
  fontSize: 28, color: DARK, fontFace: "Segoe UI", bold: true,
});
s3.addShape(pptx.shapes.RECTANGLE, {
  x: 0.5, y: 0.85, w: 2, h: 0.05, fill: { color: ORANGE },
});

const techSections = [
  { title: "Frontend", color: BLUE, items: ["React 18 + TypeScript", "Vite (Build Tool)", "Vanilla CSS Design System", "GSAP + ScrollTrigger", "Lucide React (Icons)", "React Router v6 (Lazy)"] },
  { title: "Backend", color: ORANGE, items: ["Node.js 20", "Express.js", "Sequelize v6 ORM", "JWT Auth (Access + Refresh)", "Helmet.js + CORS", "express-rate-limit"] },
  { title: "Database", color: GREEN, items: ["PostgreSQL (Production)", "SQLite (Development)", "16 Tables, 80+ Indexes", "JSONB flexible fields", "Soft-delete (paranoid)", "Auto-migrations"] },
  { title: "AI / ML", color: PURPLE, items: ["Price Prediction Engine", "Recommendation System", "Demand Forecasting", "Sentiment Analysis (AFINN)", "SEO Quality Scorer", "Lead Scoring Engine"] },
];

techSections.forEach((sec, i) => {
  const x = 0.5 + i * 2.35;
  s3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y: 1.2, w: 2.15, h: 5.2,
    fill: { color: WHITE }, line: { color: BEIGE, width: 1 }, rectRadius: 0.12,
  });
  // Header bar
  s3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: x + 0.1, y: 1.35, w: 1.95, h: 0.42,
    fill: { color: sec.color }, rectRadius: 0.08,
  });
  s3.addText(sec.title, {
    x: x + 0.1, y: 1.35, w: 1.95, h: 0.42,
    fontSize: 12, color: WHITE, fontFace: "Segoe UI", bold: true, align: "center", valign: "middle",
  });
  sec.items.forEach((item, j) => {
    s3.addText(`•  ${item}`, {
      x: x + 0.15, y: 2.0 + j * 0.52, w: 1.85, h: 0.42,
      fontSize: 9, color: DARK, fontFace: "Segoe UI",
    });
  });
});
addFooter(s3, sn, TOTAL);


// ═══════════════════════════════════════════════════════════════
// SLIDE 4 — SYSTEM ARCHITECTURE
// ═══════════════════════════════════════════════════════════════
sn++;
const s4 = pptx.addSlide();
s4.background = { color: WHITE };
s4.addText("System Architecture", {
  x: 0.5, y: 0.3, w: 9, h: 0.6,
  fontSize: 28, color: DARK, fontFace: "Segoe UI", bold: true,
});
s4.addShape(pptx.shapes.RECTANGLE, {
  x: 0.5, y: 0.85, w: 2, h: 0.05, fill: { color: ORANGE },
});

// Client Layer
s4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 1.5, y: 1.3, w: 7, h: 1.3,
  fill: { color: "EFF6FF" }, line: { color: BLUE, width: 1.5 }, rectRadius: 0.15,
});
s4.addText("🖥  CLIENT — React 18 + TypeScript + Vite", {
  x: 1.7, y: 1.35, w: 6.6, h: 0.35,
  fontSize: 12, color: BLUE, fontFace: "Segoe UI", bold: true,
});
s4.addText("27 Lazy-loaded Pages  •  AuthContext  •  Hooks (GPS, SEO, UTM)  •  api.ts HTTP Client", {
  x: 1.7, y: 1.75, w: 6.6, h: 0.35,
  fontSize: 9, color: DARK, fontFace: "Segoe UI",
});
s4.addText("PageShell  •  SearchOverlay  •  LazyImage  •  GSAP Animations", {
  x: 1.7, y: 2.1, w: 6.6, h: 0.3,
  fontSize: 9, color: GRAY, fontFace: "Segoe UI",
});

// Arrow
s4.addText("▼  HTTP / REST API (JSON)  ▼", {
  x: 3, y: 2.65, w: 4, h: 0.4,
  fontSize: 10, color: ORANGE, fontFace: "Segoe UI", align: "center", bold: true,
});

// Server Layer
s4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 1.5, y: 3.1, w: 7, h: 2.5,
  fill: { color: "FFF7ED" }, line: { color: ORANGE, width: 1.5 }, rectRadius: 0.15,
});
s4.addText("⚡ API SERVER — Express.js + Node.js 20", {
  x: 1.7, y: 3.15, w: 6.6, h: 0.35,
  fontSize: 12, color: ORANGE, fontFace: "Segoe UI", bold: true,
});
s4.addText("Middleware: Helmet → CORS → Rate Limiter → Sanitizer → Compression → Morgan", {
  x: 1.7, y: 3.55, w: 6.6, h: 0.3,
  fontSize: 9, color: DARK, fontFace: "Segoe UI",
});

const apiRoutes = [
  "/api/auth", "/api/machinery", "/api/parts", "/api/operators",
  "/api/mechanics", "/api/bookings", "/api/chats", "/api/reviews",
  "/api/admin", "/api/subscriptions", "/api/ml", "/api/invoices",
];
apiRoutes.forEach((r, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  s4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 1.8 + col * 1.6, y: 3.95 + row * 0.45, w: 1.5, h: 0.35,
    fill: { color: WHITE }, line: { color: BEIGE, width: 0.5 }, rectRadius: 0.06,
  });
  s4.addText(r, {
    x: 1.8 + col * 1.6, y: 3.95 + row * 0.45, w: 1.5, h: 0.35,
    fontSize: 7, color: DARK, fontFace: "Consolas", align: "center", valign: "middle",
  });
});

s4.addText("16 Controllers  →  7 AI Services  →  15 Models", {
  x: 1.7, y: 5.2, w: 6.6, h: 0.3,
  fontSize: 9, color: GRAY, fontFace: "Segoe UI", bold: true,
});

// Arrow
s4.addText("▼  Sequelize ORM  ▼", {
  x: 3, y: 5.65, w: 4, h: 0.35,
  fontSize: 10, color: GREEN, fontFace: "Segoe UI", align: "center", bold: true,
});

// Database Layer
s4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 1.5, y: 6.05, w: 7, h: 0.7,
  fill: { color: "F0FDF4" }, line: { color: GREEN, width: 1.5 }, rectRadius: 0.15,
});
s4.addText("🗄  DATABASE — PostgreSQL (Prod) / SQLite (Dev)  •  16 Tables  •  80+ Indexes", {
  x: 1.7, y: 6.05, w: 6.6, h: 0.7,
  fontSize: 11, color: "166534", fontFace: "Segoe UI", bold: true, valign: "middle",
});
addFooter(s4, sn, TOTAL);


// ═══════════════════════════════════════════════════════════════
// SLIDE 5 — SECTION: DATABASE DESIGN
// ═══════════════════════════════════════════════════════════════
sn++;
addSectionSlide("Database Design", "16 Tables  •  80+ Indexes  •  Soft Deletes  •  JSONB Fields", sn, TOTAL);


// ═══════════════════════════════════════════════════════════════
// SLIDE 6 — DATABASE TABLES (Overview)
// ═══════════════════════════════════════════════════════════════
sn++;
const s6 = pptx.addSlide();
s6.background = { color: WHITE };
s6.addText("Database Tables Overview", {
  x: 0.5, y: 0.3, w: 9, h: 0.5,
  fontSize: 24, color: DARK, fontFace: "Segoe UI", bold: true,
});
s6.addShape(pptx.shapes.RECTANGLE, {
  x: 0.5, y: 0.75, w: 2, h: 0.04, fill: { color: ORANGE },
});

const tables = [
  { name: "users", desc: "User accounts, auth, profiles, referrals", cols: 27, pk: "UUID", soft: "✓" },
  { name: "machinery_listings", desc: "Heavy equipment for sale/rent", cols: 32, pk: "UUID", soft: "✓" },
  { name: "part_listings", desc: "Spare parts marketplace", cols: 20, pk: "UUID", soft: "✓" },
  { name: "operator_profiles", desc: "Equipment operator profiles & certs", cols: 26, pk: "UUID", soft: "✓" },
  { name: "mechanic_profiles", desc: "Mechanic profiles & specializations", cols: 25, pk: "UUID", soft: "✓" },
  { name: "chats", desc: "Chat conversations between users", cols: 13, pk: "UUID", soft: "—" },
  { name: "messages", desc: "Individual chat messages", cols: 10, pk: "UUID", soft: "—" },
  { name: "reviews", desc: "Ratings & reviews with sub-ratings", cols: 18, pk: "UUID", soft: "✓" },
  { name: "rental_bookings", desc: "Equipment rental booking records", cols: 30, pk: "UUID", soft: "—" },
  { name: "transactions", desc: "All financial transactions", cols: 16, pk: "UUID", soft: "—" },
  { name: "subscriptions", desc: "Subscription plan records", cols: 9, pk: "UUID", soft: "—" },
  { name: "certification_requests", desc: "Document verification requests", cols: 12, pk: "UUID", soft: "✓" },
  { name: "fraud_reports", desc: "User fraud reports & evidence", cols: 11, pk: "UUID", soft: "✓" },
  { name: "notifications", desc: "Push notification records", cols: 7, pk: "UUID", soft: "—" },
  { name: "activity_logs", desc: "Immutable system audit logs", cols: 8, pk: "UUID", soft: "—" },
  { name: "campaign_visits", desc: "UTM campaign tracking", cols: 10, pk: "UUID", soft: "—" },
];

// Table headers
const headerY = 1.0;
const colXs = [0.5, 2.4, 5.5, 6.6, 7.3, 8.1];
const colWs = [1.9, 3.1, 1.0, 0.7, 0.8, 0.8];
const headers = ["Table Name", "Description", "Columns", "PK", "Soft Del.", "FK ➜"];

headers.forEach((h, i) => {
  s6.addText(h, {
    x: colXs[i], y: headerY, w: colWs[i], h: 0.35,
    fontSize: 8, color: WHITE, fontFace: "Segoe UI", bold: true, align: "center", valign: "middle",
    fill: { color: DARK },
  });
});

tables.forEach((t, i) => {
  const y = headerY + 0.37 + i * 0.345;
  const bg = i % 2 === 0 ? LIGHT_BG : WHITE;
  const vals = [t.name, t.desc, `${t.cols}`, t.pk, t.soft, "users"];
  vals.forEach((v, j) => {
    s6.addText(v, {
      x: colXs[j], y, w: colWs[j], h: 0.33,
      fontSize: j === 0 ? 8 : 7,
      color: j === 0 ? ORANGE : DARK,
      fontFace: j === 0 ? "Consolas" : "Segoe UI",
      bold: j === 0,
      align: j <= 1 ? "left" : "center",
      valign: "middle",
      fill: { color: bg },
    });
  });
});
addFooter(s6, sn, TOTAL);


// ═══════════════════════════════════════════════════════════════
// SLIDE 7 — KEY TABLE SCHEMAS (Details)
// ═══════════════════════════════════════════════════════════════
sn++;
const s7 = pptx.addSlide();
s7.background = { color: WHITE };
s7.addText("Key Table Schemas", {
  x: 0.5, y: 0.3, w: 9, h: 0.5,
  fontSize: 24, color: DARK, fontFace: "Segoe UI", bold: true,
});
s7.addShape(pptx.shapes.RECTANGLE, {
  x: 0.5, y: 0.75, w: 2, h: 0.04, fill: { color: ORANGE },
});

// Users table
s7.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.4, y: 1.0, w: 4.4, h: 5.5,
  fill: { color: LIGHT_BG }, line: { color: BEIGE, width: 1 }, rectRadius: 0.1,
});
s7.addText("users", {
  x: 0.6, y: 1.05, w: 2, h: 0.35,
  fontSize: 14, color: ORANGE, fontFace: "Consolas", bold: true,
});
const userCols = [
  "id         UUID PK",
  "phone      VARCHAR(15) UNIQUE",
  "email      VARCHAR(255) UNIQUE",
  "password   VARCHAR(255) bcrypt",
  "firstName  VARCHAR(100)",
  "lastName   VARCHAR(100)",
  "userType   ENUM (8 roles)",
  "accountTier ENUM (4 tiers)",
  "companyName VARCHAR(255)",
  "gstNumber  VARCHAR(50)",
  "city, state, pincode",
  "latitude   DECIMAL(10,8)",
  "longitude  DECIMAL(11,8)",
  "isVerified BOOLEAN",
  "rating     DECIMAL(2,1)",
  "reviewCount INTEGER",
  "otpCode    VARCHAR(10)",
  "referralCode VARCHAR(20)",
  "metadata   JSONB",
];
userCols.forEach((c, i) => {
  s7.addText(c, {
    x: 0.65, y: 1.45 + i * 0.26, w: 4, h: 0.24,
    fontSize: 7, color: DARK, fontFace: "Consolas",
  });
});

// MachineryListing table
s7.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 5.2, y: 1.0, w: 4.4, h: 5.5,
  fill: { color: LIGHT_BG }, line: { color: BEIGE, width: 1 }, rectRadius: 0.1,
});
s7.addText("machinery_listings", {
  x: 5.4, y: 1.05, w: 3.5, h: 0.35,
  fontSize: 14, color: ORANGE, fontFace: "Consolas", bold: true,
});
const mlCols = [
  "id          UUID PK",
  "userId      UUID FK → users",
  "listingType ENUM (sale, rent)",
  "category    ENUM (4 types)",
  "subCategory VARCHAR(100)",
  "make, model VARCHAR(100)",
  "year        INTEGER",
  "hoursUsed   INTEGER",
  "condition   ENUM (3 types)",
  "price       DECIMAL(15,2)",
  "rentalUnit  ENUM (3 types)",
  "securityDeposit DECIMAL",
  "withOperator BOOLEAN",
  "city, state, district",
  "latitude, longitude",
  "status      ENUM (6 states)",
  "isFeatured  BOOLEAN",
  "images      JSONB []",
  "viewCount   INTEGER",
  "metadata    JSONB",
];
mlCols.forEach((c, i) => {
  s7.addText(c, {
    x: 5.45, y: 1.45 + i * 0.26, w: 4, h: 0.24,
    fontSize: 7, color: DARK, fontFace: "Consolas",
  });
});
addFooter(s7, sn, TOTAL);


// ═══════════════════════════════════════════════════════════════
// SLIDE 8 — ER DIAGRAM
// ═══════════════════════════════════════════════════════════════
sn++;
const s8 = pptx.addSlide();
s8.background = { color: WHITE };
s8.addText("Entity-Relationship (ER) Diagram", {
  x: 0.5, y: 0.2, w: 9, h: 0.5,
  fontSize: 24, color: DARK, fontFace: "Segoe UI", bold: true,
});
s8.addShape(pptx.shapes.RECTANGLE, {
  x: 0.5, y: 0.65, w: 2.5, h: 0.04, fill: { color: ORANGE },
});

// Central entity - Users
const cx = 4.0, cy = 3.4;
s8.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: cx, y: cy, w: 2, h: 0.6,
  fill: { color: ORANGE }, rectRadius: 0.1,
});
s8.addText("USERS", {
  x: cx, y: cy, w: 2, h: 0.6,
  fontSize: 14, color: WHITE, fontFace: "Segoe UI", bold: true, align: "center", valign: "middle",
});

// Surrounding entities
const entities = [
  { name: "MACHINERY\nLISTINGS", x: 0.5, y: 0.9, w: 1.8, h: 0.7, color: BLUE, rel: "1:N" },
  { name: "PART\nLISTINGS", x: 7.7, y: 0.9, w: 1.8, h: 0.7, color: BLUE, rel: "1:N" },
  { name: "OPERATOR\nPROFILES", x: 0.3, y: 2.8, w: 1.8, h: 0.7, color: GREEN, rel: "1:1" },
  { name: "MECHANIC\nPROFILES", x: 7.9, y: 2.8, w: 1.8, h: 0.7, color: GREEN, rel: "1:1" },
  { name: "CHATS", x: 0.3, y: 4.7, w: 1.6, h: 0.6, color: PURPLE, rel: "1:N" },
  { name: "MESSAGES", x: 0.3, y: 5.6, w: 1.6, h: 0.6, color: PURPLE, rel: "1:N (via Chat)" },
  { name: "REVIEWS", x: 2.5, y: 5.8, w: 1.6, h: 0.6, color: "EC4899", rel: "1:N" },
  { name: "RENTAL\nBOOKINGS", x: 4.3, y: 5.6, w: 1.8, h: 0.7, color: ORANGE, rel: "1:N" },
  { name: "TRANSACTIONS", x: 6.3, y: 5.5, w: 1.8, h: 0.6, color: "EAB308", rel: "1:N" },
  { name: "SUBSCRIPTIONS", x: 8.0, y: 4.5, w: 1.8, h: 0.6, color: PURPLE, rel: "1:N" },
  { name: "NOTIFICATIONS", x: 8.0, y: 5.5, w: 1.8, h: 0.6, color: GREEN, rel: "1:N" },
  { name: "CERTIFICATIONS", x: 2.5, y: 1.6, w: 1.8, h: 0.6, color: "EAB308", rel: "1:N" },
  { name: "FRAUD\nREPORTS", x: 5.8, y: 1.4, w: 1.6, h: 0.7, color: "DC2626", rel: "1:N" },
  { name: "ACTIVITY\nLOGS", x: 8.0, y: 1.7, w: 1.6, h: 0.7, color: GRAY, rel: "1:N" },
];

entities.forEach((e) => {
  s8.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: e.x, y: e.y, w: e.w, h: e.h,
    fill: { color: WHITE }, line: { color: e.color, width: 1.5 }, rectRadius: 0.08,
  });
  s8.addText(e.name, {
    x: e.x, y: e.y, w: e.w, h: e.h * 0.7,
    fontSize: 7, color: e.color, fontFace: "Segoe UI", bold: true, align: "center", valign: "bottom",
  });
  s8.addText(e.rel, {
    x: e.x, y: e.y + e.h * 0.55, w: e.w, h: e.h * 0.4,
    fontSize: 6, color: GRAY, fontFace: "Segoe UI", align: "center", valign: "top",
  });
});

// Legend
s8.addText("Legend:  1:N = One-to-Many    1:1 = One-to-One    All FK → users.id", {
  x: 0.5, y: 6.6, w: 9, h: 0.3,
  fontSize: 8, color: GRAY, fontFace: "Segoe UI", italic: true,
});
s8.addText("RENTAL_BOOKINGS also FK → machinery_listings  |  MESSAGES FK → chats", {
  x: 0.5, y: 6.85, w: 9, h: 0.25,
  fontSize: 7, color: GRAY, fontFace: "Segoe UI", italic: true,
});
addFooter(s8, sn, TOTAL);


// ═══════════════════════════════════════════════════════════════
// SLIDE 9 — ENTITY DETAILS
// ═══════════════════════════════════════════════════════════════
sn++;
const s9 = pptx.addSlide();
s9.background = { color: WHITE };
s9.addText("Entity Details & Relationships", {
  x: 0.5, y: 0.3, w: 9, h: 0.5,
  fontSize: 24, color: DARK, fontFace: "Segoe UI", bold: true,
});
s9.addShape(pptx.shapes.RECTANGLE, {
  x: 0.5, y: 0.75, w: 2.5, h: 0.04, fill: { color: ORANGE },
});

const entityDetails = [
  { entity: "User", type: "Central Entity", attrs: "phone, email, password, userType (8 roles), accountTier, location (GPS), rating, referralCode", rels: "→ MachineryListing, PartListing, OperatorProfile, MechanicProfile, Chat, Review, Transaction, Subscription, Notification, ActivityLog" },
  { entity: "MachineryListing", type: "Core Entity", attrs: "listingType (sale/rent), category, make, model, year, condition, price, GPS location, status (6 states), images (JSONB), documents", rels: "→ User (owner), → RentalBooking" },
  { entity: "RentalBooking", type: "Transaction Entity", attrs: "startDate, endDate, rentalRate, securityDeposit, commission, paymentStatus, depositStatus, payoutStatus, digital agreement", rels: "→ MachineryListing, → User (owner), → User (renter)" },
  { entity: "Chat / Message", type: "Communication", attrs: "buyerId, sellerId, listingType, leadFee tracking, unread counts, message types (text, image, document, location)", rels: "→ User (buyer), → User (seller), → Message (1:N)" },
  { entity: "Review", type: "Trust System", attrs: "rating (1-5), sub-ratings (punctuality, quality, communication, value), review/response cycle, flagging system", rels: "→ User (reviewer), → User (reviewee)" },
  { entity: "Transaction", type: "Financial", attrs: "8 transaction types, 6 payment methods, gateway tracking, commission calculation, security deposit handling", rels: "→ User" },
];

entityDetails.forEach((e, i) => {
  const y = 1.0 + i * 0.95;
  const bgColor = i % 2 === 0 ? LIGHT_BG : WHITE;
  s9.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.4, y, w: 9.2, h: 0.85,
    fill: { color: bgColor }, line: { color: BEIGE, width: 0.5 }, rectRadius: 0.08,
  });
  s9.addText(e.entity, {
    x: 0.55, y, w: 2, h: 0.35,
    fontSize: 11, color: ORANGE, fontFace: "Consolas", bold: true,
  });
  s9.addText(e.type, {
    x: 2.6, y, w: 1.3, h: 0.35,
    fontSize: 7, color: PURPLE, fontFace: "Segoe UI", bold: true, italic: true,
  });
  s9.addText(`Attributes: ${e.attrs}`, {
    x: 0.55, y: y + 0.3, w: 8.8, h: 0.25,
    fontSize: 7, color: DARK, fontFace: "Segoe UI",
  });
  s9.addText(`Relations: ${e.rels}`, {
    x: 0.55, y: y + 0.55, w: 8.8, h: 0.25,
    fontSize: 7, color: GRAY, fontFace: "Segoe UI", italic: true,
  });
});
addFooter(s9, sn, TOTAL);


// ═══════════════════════════════════════════════════════════════
// SLIDE 10 — DATA FLOW DIAGRAM: User Authentication
// ═══════════════════════════════════════════════════════════════
sn++;
const s10 = pptx.addSlide();
s10.background = { color: WHITE };
s10.addText("Data Flow Diagrams", {
  x: 0.5, y: 0.2, w: 9, h: 0.5,
  fontSize: 24, color: DARK, fontFace: "Segoe UI", bold: true,
});
s10.addShape(pptx.shapes.RECTANGLE, {
  x: 0.5, y: 0.65, w: 2, h: 0.04, fill: { color: ORANGE },
});

// DFD 1: Auth Flow
s10.addText("1. User Authentication Flow", {
  x: 0.5, y: 0.85, w: 9, h: 0.35,
  fontSize: 14, color: DARK, fontFace: "Segoe UI", bold: true,
});

const authSteps = [
  { label: "User\n(Browser)", x: 0.3, color: BLUE },
  { label: "POST /api/\nauth/register", x: 2.0, color: ORANGE },
  { label: "Validate &\nHash Password", x: 3.7, color: PURPLE },
  { label: "Store in\nDB (users)", x: 5.4, color: GREEN },
  { label: "Generate\nJWT Tokens", x: 7.1, color: ORANGE },
  { label: "Return\nAccess+Refresh", x: 8.7, color: BLUE },
];
authSteps.forEach((s) => {
  s10.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: s.x, y: 1.35, w: 1.5, h: 0.65,
    fill: { color: WHITE }, line: { color: s.color, width: 1.2 }, rectRadius: 0.08,
  });
  s10.addText(s.label, {
    x: s.x, y: 1.35, w: 1.5, h: 0.65,
    fontSize: 7, color: s.color, fontFace: "Segoe UI", bold: true, align: "center", valign: "middle",
  });
});
// Arrows between
for (let i = 0; i < authSteps.length - 1; i++) {
  s10.addText("→", {
    x: authSteps[i].x + 1.45, y: 1.5, w: 0.3, h: 0.35,
    fontSize: 14, color: GRAY, fontFace: "Segoe UI", align: "center", valign: "middle",
  });
}

// DFD 2: Listing Flow
s10.addText("2. Machinery Listing Flow", {
  x: 0.5, y: 2.35, w: 9, h: 0.35,
  fontSize: 14, color: DARK, fontFace: "Segoe UI", bold: true,
});
const listingSteps = [
  { label: "Seller\nCreates Listing", x: 0.3, color: BLUE },
  { label: "Validate &\nSanitize Input", x: 2.0, color: ORANGE },
  { label: "Store Images\n(JSONB)", x: 3.7, color: GREEN },
  { label: "Status:\nPending", x: 5.4, color: "EAB308" },
  { label: "Admin\nApproves", x: 7.1, color: PURPLE },
  { label: "Live on\nMarketplace", x: 8.7, color: GREEN },
];
listingSteps.forEach((s) => {
  s10.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: s.x, y: 2.85, w: 1.5, h: 0.65,
    fill: { color: WHITE }, line: { color: s.color, width: 1.2 }, rectRadius: 0.08,
  });
  s10.addText(s.label, {
    x: s.x, y: 2.85, w: 1.5, h: 0.65,
    fontSize: 7, color: s.color, fontFace: "Segoe UI", bold: true, align: "center", valign: "middle",
  });
});
for (let i = 0; i < listingSteps.length - 1; i++) {
  s10.addText("→", {
    x: listingSteps[i].x + 1.45, y: 3.0, w: 0.3, h: 0.35,
    fontSize: 14, color: GRAY, fontFace: "Segoe UI", align: "center", valign: "middle",
  });
}

// DFD 3: Rental Booking
s10.addText("3. Rental Booking Flow", {
  x: 0.5, y: 3.85, w: 9, h: 0.35,
  fontSize: 14, color: DARK, fontFace: "Segoe UI", bold: true,
});
const bookingSteps = [
  { label: "Renter\nSelects Machine", x: 0.3, color: BLUE },
  { label: "Choose Dates\n& Operator", x: 2.0, color: ORANGE },
  { label: "Calculate Costs\n+ Commission", x: 3.7, color: PURPLE },
  { label: "Create Booking\n(pending)", x: 5.4, color: "EAB308" },
  { label: "Owner\nConfirms", x: 7.1, color: GREEN },
  { label: "Active Rental\n+ Tracking", x: 8.7, color: GREEN },
];
bookingSteps.forEach((s) => {
  s10.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: s.x, y: 4.35, w: 1.5, h: 0.65,
    fill: { color: WHITE }, line: { color: s.color, width: 1.2 }, rectRadius: 0.08,
  });
  s10.addText(s.label, {
    x: s.x, y: 4.35, w: 1.5, h: 0.65,
    fontSize: 7, color: s.color, fontFace: "Segoe UI", bold: true, align: "center", valign: "middle",
  });
});
for (let i = 0; i < bookingSteps.length - 1; i++) {
  s10.addText("→", {
    x: bookingSteps[i].x + 1.45, y: 4.5, w: 0.3, h: 0.35,
    fontSize: 14, color: GRAY, fontFace: "Segoe UI", align: "center", valign: "middle",
  });
}

// DFD 4: AI/ML
s10.addText("4. AI/ML Intelligence Flow", {
  x: 0.5, y: 5.35, w: 9, h: 0.35,
  fontSize: 14, color: DARK, fontFace: "Segoe UI", bold: true,
});
const mlSteps = [
  { label: "Listing Data\n(Historical)", x: 0.3, color: BLUE },
  { label: "Feature\nExtraction", x: 2.0, color: ORANGE },
  { label: "ML Model\nTraining", x: 3.7, color: PURPLE },
  { label: "Price\nPrediction", x: 5.4, color: GREEN },
  { label: "Demand\nForecasting", x: 7.1, color: "EAB308" },
  { label: "SEO Score\n& Recommend", x: 8.7, color: ORANGE },
];
mlSteps.forEach((s) => {
  s10.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: s.x, y: 5.85, w: 1.5, h: 0.65,
    fill: { color: WHITE }, line: { color: s.color, width: 1.2 }, rectRadius: 0.08,
  });
  s10.addText(s.label, {
    x: s.x, y: 5.85, w: 1.5, h: 0.65,
    fontSize: 7, color: s.color, fontFace: "Segoe UI", bold: true, align: "center", valign: "middle",
  });
});
for (let i = 0; i < mlSteps.length - 1; i++) {
  s10.addText("→", {
    x: mlSteps[i].x + 1.45, y: 6.0, w: 0.3, h: 0.35,
    fontSize: 14, color: GRAY, fontFace: "Segoe UI", align: "center", valign: "middle",
  });
}
addFooter(s10, sn, TOTAL);


// ═══════════════════════════════════════════════════════════════
// SLIDE 11 — DATA FLOW: Payment & Chat
// ═══════════════════════════════════════════════════════════════
sn++;
const s11 = pptx.addSlide();
s11.background = { color: WHITE };
s11.addText("Data Flow — Payment & Messaging", {
  x: 0.5, y: 0.2, w: 9, h: 0.5,
  fontSize: 24, color: DARK, fontFace: "Segoe UI", bold: true,
});
s11.addShape(pptx.shapes.RECTANGLE, {
  x: 0.5, y: 0.65, w: 2.5, h: 0.04, fill: { color: ORANGE },
});

// Payment flow
s11.addText("5. Payment & Transaction Flow", {
  x: 0.5, y: 0.9, w: 9, h: 0.35,
  fontSize: 14, color: DARK, fontFace: "Segoe UI", bold: true,
});
const paySteps = [
  { label: "User Selects\nPlan/Service", x: 0.3, color: BLUE },
  { label: "Choose Payment\nUPI/Card/Net", x: 2.2, color: ORANGE },
  { label: "Create Pending\nTransaction", x: 4.1, color: "EAB308" },
  { label: "Gateway\nVerification", x: 6.0, color: PURPLE },
  { label: "Update Status\n+ GST Invoice", x: 7.9, color: GREEN },
];
paySteps.forEach((s) => {
  s11.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: s.x, y: 1.4, w: 1.7, h: 0.7,
    fill: { color: WHITE }, line: { color: s.color, width: 1.5 }, rectRadius: 0.08,
  });
  s11.addText(s.label, {
    x: s.x, y: 1.4, w: 1.7, h: 0.7,
    fontSize: 8, color: s.color, fontFace: "Segoe UI", bold: true, align: "center", valign: "middle",
  });
});
for (let i = 0; i < paySteps.length - 1; i++) {
  s11.addText("➜", {
    x: paySteps[i].x + 1.65, y: 1.55, w: 0.4, h: 0.4,
    fontSize: 14, color: GRAY, fontFace: "Segoe UI", align: "center", valign: "middle",
  });
}

// Chat flow
s11.addText("6. Chat / Messaging Flow", {
  x: 0.5, y: 2.5, w: 9, h: 0.35,
  fontSize: 14, color: DARK, fontFace: "Segoe UI", bold: true,
});
const chatSteps = [
  { label: "Buyer Clicks\n'Contact'", x: 0.3, color: BLUE },
  { label: "Create/Find\nChat Room", x: 2.2, color: ORANGE },
  { label: "Send Message\n(text/image)", x: 4.1, color: PURPLE },
  { label: "Update Unread\nCounters", x: 6.0, color: "EAB308" },
  { label: "Real-time\nNotification", x: 7.9, color: GREEN },
];
chatSteps.forEach((s) => {
  s11.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: s.x, y: 3.0, w: 1.7, h: 0.7,
    fill: { color: WHITE }, line: { color: s.color, width: 1.5 }, rectRadius: 0.08,
  });
  s11.addText(s.label, {
    x: s.x, y: 3.0, w: 1.7, h: 0.7,
    fontSize: 8, color: s.color, fontFace: "Segoe UI", bold: true, align: "center", valign: "middle",
  });
});
for (let i = 0; i < chatSteps.length - 1; i++) {
  s11.addText("➜", {
    x: chatSteps[i].x + 1.65, y: 3.15, w: 0.4, h: 0.4,
    fontSize: 14, color: GRAY, fontFace: "Segoe UI", align: "center", valign: "middle",
  });
}

// Admin moderation
s11.addText("7. Admin Moderation Flow", {
  x: 0.5, y: 4.1, w: 9, h: 0.35,
  fontSize: 14, color: DARK, fontFace: "Segoe UI", bold: true,
});
const adminSteps = [
  { label: "New Listing /\nFraud Report", x: 0.3, color: "DC2626" },
  { label: "Admin\nDashboard", x: 2.2, color: ORANGE },
  { label: "Review Content\n& Documents", x: 4.1, color: PURPLE },
  { label: "Approve /\nReject / Ban", x: 6.0, color: "EAB308" },
  { label: "Log Action\n& Notify", x: 7.9, color: GREEN },
];
adminSteps.forEach((s) => {
  s11.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: s.x, y: 4.6, w: 1.7, h: 0.7,
    fill: { color: WHITE }, line: { color: s.color, width: 1.5 }, rectRadius: 0.08,
  });
  s11.addText(s.label, {
    x: s.x, y: 4.6, w: 1.7, h: 0.7,
    fontSize: 8, color: s.color, fontFace: "Segoe UI", bold: true, align: "center", valign: "middle",
  });
});
for (let i = 0; i < adminSteps.length - 1; i++) {
  s11.addText("➜", {
    x: adminSteps[i].x + 1.65, y: 4.75, w: 0.4, h: 0.4,
    fontSize: 14, color: GRAY, fontFace: "Segoe UI", align: "center", valign: "middle",
  });
}
addFooter(s11, sn, TOTAL);


// ═══════════════════════════════════════════════════════════════
// SLIDE 12 — MODULES OVERVIEW
// ═══════════════════════════════════════════════════════════════
sn++;
const s12 = pptx.addSlide();
s12.background = { color: WHITE };
s12.addText("Platform Modules (17 Modules)", {
  x: 0.5, y: 0.2, w: 9, h: 0.5,
  fontSize: 24, color: DARK, fontFace: "Segoe UI", bold: true,
});
s12.addShape(pptx.shapes.RECTANGLE, {
  x: 0.5, y: 0.65, w: 2, h: 0.04, fill: { color: ORANGE },
});

const modules = [
  { icon: "🔐", name: "Authentication", desc: "Phone/Email login, OTP, JWT tokens" },
  { icon: "🏗️", name: "Machinery Marketplace", desc: "Buy/Sell/Rent heavy equipment" },
  { icon: "⚙️", name: "Spare Parts", desc: "Parts listing with compatibility" },
  { icon: "👷", name: "Operator Marketplace", desc: "Hire certified operators" },
  { icon: "🔧", name: "Mechanic Marketplace", desc: "Find skilled mechanics" },
  { icon: "📋", name: "Rental & Booking", desc: "Full rental workflow + agreements" },
  { icon: "💬", name: "Chat / Messaging", desc: "Real-time buyer-seller messaging" },
  { icon: "⭐", name: "Review & Rating", desc: "Multi-dimensional ratings" },
  { icon: "🛡️", name: "Admin Dashboard", desc: "Moderation, analytics, user mgmt" },
  { icon: "📜", name: "Certification", desc: "Document verification system" },
  { icon: "🚨", name: "Fraud Detection", desc: "Reporting & investigation" },
  { icon: "💳", name: "Subscriptions", desc: "Tiered plans with GST billing" },
  { icon: "🔔", name: "Notifications", desc: "In-app notification system" },
  { icon: "🤖", name: "AI / ML Engine", desc: "Price prediction, demand forecast" },
  { icon: "📊", name: "Analytics", desc: "UTM tracking, campaign metrics" },
  { icon: "🔍", name: "SEO Automation", desc: "Auto meta tags, JSON-LD schema" },
  { icon: "🧾", name: "Invoice Generation", desc: "GST-compliant invoices" },
];

modules.forEach((m, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const x = 0.5 + col * 3.15;
  const y = 0.9 + row * 0.95;

  s12.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w: 2.95, h: 0.8,
    fill: { color: i % 2 === 0 ? LIGHT_BG : WHITE }, line: { color: BEIGE, width: 0.7 }, rectRadius: 0.08,
  });
  s12.addText(`${m.icon}  ${m.name}`, {
    x: x + 0.1, y, w: 2.7, h: 0.4,
    fontSize: 10, color: DARK, fontFace: "Segoe UI", bold: true,
  });
  s12.addText(m.desc, {
    x: x + 0.35, y: y + 0.35, w: 2.5, h: 0.35,
    fontSize: 8, color: GRAY, fontFace: "Segoe UI",
  });
});
addFooter(s12, sn, TOTAL);


// ═══════════════════════════════════════════════════════════════
// SLIDE 13 — UI SCREENS OVERVIEW
// ═══════════════════════════════════════════════════════════════
sn++;
const s13 = pptx.addSlide();
s13.background = { color: WHITE };
s13.addText("UI Screens — 27 Pages", {
  x: 0.5, y: 0.2, w: 9, h: 0.5,
  fontSize: 24, color: DARK, fontFace: "Segoe UI", bold: true,
});
s13.addShape(pptx.shapes.RECTANGLE, {
  x: 0.5, y: 0.65, w: 2, h: 0.04, fill: { color: ORANGE },
});

const screens = [
  { name: "Landing Page (App.tsx)", route: "/", desc: "Hero, categories, featured, AI insights, testimonials" },
  { name: "Browse Marketplace", route: "/browse", desc: "Search, filters, category, price, location radius" },
  { name: "Listing Detail", route: "/listings/:id", desc: "Gallery, specs, AI price check, seller info, contact" },
  { name: "Create Listing", route: "/create-listing", desc: "Multi-step form: Sale vs Rent, images, documents" },
  { name: "Login / Register", route: "/login, /register", desc: "Phone/Email auth, OTP verification" },
  { name: "User Dashboard", route: "/dashboard", desc: "Stats overview, recent activity, quick actions" },
  { name: "My Listings", route: "/my-listings", desc: "Manage active, pending, sold listings" },
  { name: "Subscription Plans", route: "/plans", desc: "4 tiers, comparison table, UPI/Card payment" },
  { name: "Operators Page", route: "/operators", desc: "Browse & hire certified equipment operators" },
  { name: "Mechanics Page", route: "/mechanics", desc: "Find mechanics by skill & location" },
  { name: "Spare Parts", route: "/parts", desc: "Parts marketplace with compatibility filters" },
  { name: "Bookings", route: "/bookings", desc: "Rental booking management (renter/owner)" },
  { name: "Chats", route: "/chats", desc: "Buyer-seller messaging with lead tracking" },
  { name: "Admin Panel", route: "/admin", desc: "Full moderation: users, listings, fraud, analytics" },
  { name: "Market Insights", route: "/market-insights", desc: "AI market analysis, demand trends" },
  { name: "Profile / Settings", route: "/profile", desc: "Edit profile, company info, location" },
  { name: "Notifications", route: "/notifications", desc: "System & activity notifications" },
  { name: "Certifications", route: "/certifications", desc: "Upload & track document verification" },
  { name: "Loan Eligibility", route: "/loan-eligibility", desc: "Equipment financing calculator" },
  { name: "Saved Listings", route: "/saved", desc: "Bookmarked listings" },
];

screens.forEach((s, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 0.4 + col * 4.8;
  const y = 0.9 + row * 0.58;
  const bg = i % 2 === 0 ? LIGHT_BG : WHITE;

  s13.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w: 4.6, h: 0.52,
    fill: { color: bg }, line: { color: BEIGE, width: 0.5 }, rectRadius: 0.06,
  });
  s13.addText(s.name, {
    x: x + 0.1, y, w: 2.1, h: 0.26,
    fontSize: 8, color: DARK, fontFace: "Segoe UI", bold: true,
  });
  s13.addText(s.route, {
    x: x + 2.2, y, w: 2.2, h: 0.26,
    fontSize: 7, color: ORANGE, fontFace: "Consolas",
  });
  s13.addText(s.desc, {
    x: x + 0.1, y: y + 0.24, w: 4.3, h: 0.24,
    fontSize: 6.5, color: GRAY, fontFace: "Segoe UI",
  });
});
addFooter(s13, sn, TOTAL);


// ═══════════════════════════════════════════════════════════════
// SLIDE 14 — SECURITY & FEATURES
// ═══════════════════════════════════════════════════════════════
sn++;
const s14 = pptx.addSlide();
s14.background = { color: WHITE };
s14.addText("Security & Key Features", {
  x: 0.5, y: 0.2, w: 9, h: 0.5,
  fontSize: 24, color: DARK, fontFace: "Segoe UI", bold: true,
});
s14.addShape(pptx.shapes.RECTANGLE, {
  x: 0.5, y: 0.65, w: 2, h: 0.04, fill: { color: ORANGE },
});

// Security
s14.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.4, y: 0.9, w: 4.4, h: 5.5,
  fill: { color: LIGHT_BG }, line: { color: "DC2626", width: 1 }, rectRadius: 0.12,
});
s14.addText("🔒  Security Implementation", {
  x: 0.6, y: 1.0, w: 4, h: 0.4,
  fontSize: 14, color: "DC2626", fontFace: "Segoe UI", bold: true,
});
const secItems = [
  "JWT Authentication (access + refresh tokens)",
  "bcryptjs password hashing (10 rounds)",
  "Helmet.js — security headers",
  "CORS — strict origin control",
  "express-rate-limit — DDoS protection",
  "Input sanitization — XSS prevention",
  "Anti-spam middleware (frequency detection)",
  "Fraud reporting & investigation system",
  "Soft-delete (paranoid) — data recovery",
  "Role-based access control (8 user types)",
  "OTP-based phone verification",
  "Admin audit logs (ActivityLog)",
  "Request compression (gzip)",
  "Morgan HTTP logging",
];
secItems.forEach((item, i) => {
  s14.addText(`✓  ${item}`, {
    x: 0.7, y: 1.5 + i * 0.35, w: 3.8, h: 0.3,
    fontSize: 8, color: DARK, fontFace: "Segoe UI",
  });
});

// Key Features
s14.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 5.2, y: 0.9, w: 4.4, h: 5.5,
  fill: { color: LIGHT_BG }, line: { color: GREEN, width: 1 }, rectRadius: 0.12,
});
s14.addText("✨  Key Platform Features", {
  x: 5.4, y: 1.0, w: 4, h: 0.4,
  fontSize: 14, color: GREEN, fontFace: "Segoe UI", bold: true,
});
const features = [
  "GPS location-based radius search",
  "AI price prediction (multivariate LR)",
  "Demand forecasting by category/region",
  "Sentiment analysis on reviews (AFINN)",
  "SEO auto-optimization (meta, JSON-LD)",
  "Lead scoring engine",
  "UTM campaign tracking & analytics",
  "Digital rental agreements",
  "GST-compliant invoice generation",
  "Subscription tiers (Free→Enterprise)",
  "Multi-format media (images, video, docs)",
  "Real-time messaging system",
  "Admin moderation dashboard",
  "Responsive design (mobile-first)",
];
features.forEach((f, i) => {
  s14.addText(`✓  ${f}`, {
    x: 5.5, y: 1.5 + i * 0.35, w: 3.8, h: 0.3,
    fontSize: 8, color: DARK, fontFace: "Segoe UI",
  });
});
addFooter(s14, sn, TOTAL);


// ═══════════════════════════════════════════════════════════════
// SLIDE 15 — THANK YOU
// ═══════════════════════════════════════════════════════════════
sn++;
const s15 = pptx.addSlide();
s15.background = { color: DARK };
s15.addShape(pptx.shapes.RECTANGLE, {
  x: 0, y: 0, w: 10, h: 0.12, fill: { color: ORANGE },
});
s15.addText("Thank You!", {
  x: 0.8, y: 2.0, w: 8.4, h: 1.0,
  fontSize: 48, color: WHITE, fontFace: "Segoe UI", bold: true, align: "center",
});
s15.addShape(pptx.shapes.RECTANGLE, {
  x: 3.5, y: 3.1, w: 3, h: 0.06, fill: { color: ORANGE },
});
s15.addText("YantraSetu — India's Heavy Equipment Marketplace", {
  x: 1, y: 3.4, w: 8, h: 0.5,
  fontSize: 16, color: BEIGE, fontFace: "Segoe UI", align: "center",
});
s15.addText("Built with React • Node.js • PostgreSQL • AI/ML", {
  x: 1, y: 4.0, w: 8, h: 0.4,
  fontSize: 12, color: GRAY, fontFace: "Segoe UI", align: "center",
});
// Tech badges row
const finalBadges = ["Full-Stack", "AI-Powered", "Production-Ready", "Scalable", "Secure"];
finalBadges.forEach((b, i) => {
  s15.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 1.0 + i * 1.7, y: 5.0, w: 1.5, h: 0.4,
    fill: { color: "1A1C1E" }, line: { color: ORANGE, width: 1 }, rectRadius: 0.1,
  });
  s15.addText(b, {
    x: 1.0 + i * 1.7, y: 5.0, w: 1.5, h: 0.4,
    fontSize: 9, color: ORANGE, fontFace: "Segoe UI", bold: true, align: "center", valign: "middle",
  });
});

s15.addText("Questions & Discussion", {
  x: 1, y: 5.8, w: 8, h: 0.4,
  fontSize: 14, color: WHITE, fontFace: "Segoe UI", align: "center",
});
addFooter(s15, sn, TOTAL);


// ── Save ──
const outputPath = "./YantraSetu_Presentation.pptx";
await pptx.writeFile({ fileName: outputPath });
console.log(`\n✅ Presentation saved to: ${outputPath}`);
console.log(`📊 Total slides: ${TOTAL}`);
