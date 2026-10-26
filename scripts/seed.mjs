/**
 * Full-platform data seed for Athar.
 *
 * Creates real Firebase Auth accounts and real Firestore documents in the
 * project pointed at by .env (VITE_FIREBASE_*). Everything it writes is live —
 * the accounts can log in, the records show up in the running app.
 *
 *   node scripts/seed.mjs
 *
 * Safe to re-run: accounts are created-or-signed-into, every document uses a
 * deterministic id, and it never deletes anything.
 *
 * The Firestore rules only let an account write its own users/organizations
 * doc, and only an admin can mark an organization verified — so the script:
 *   1. creates each account and, while signed in as it, writes its own profile
 *   2. signs in as admin@athar.gov and flips tier2/tier3 orgs to verified
 *   3. writes all the cross-references (opportunities, applications, crises,
 *      messages, notifications, training records) as admin
 * If the admin password is wrong, step 2/3 are skipped with a warning and the
 * orgs are left pending for you to approve in the Verification tab.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
function loadEnv() {
  const env = {};
  for (const line of readFileSync(join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, "$2");
  }
  return env;
}
const env = loadEnv();
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Missing VITE_FIREBASE_* values in .env");
  process.exit(1);
}
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ts = (daysAgo = 0, hoursAgo = 0) =>
  Timestamp.fromDate(new Date(Date.now() - daysAgo * 864e5 - hoursAgo * 36e5));
const avatar = (seed) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;
const PW = env.SEED_USER_PASSWORD;
const ADMIN_PW = env.SEED_ADMIN_PASSWORD;
if (!PW || !ADMIN_PW) {
  console.error("Missing SEED_USER_PASSWORD / SEED_ADMIN_PASSWORD in .env");
  process.exit(1);
}

let writes = 0;
let failures = 0;
const TRANSIENT = new Set([
  "unavailable", "deadline-exceeded", "aborted", "internal", "cancelled",
  "resource-exhausted", "unknown",
]);
async function put(path, id, data) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await setDoc(doc(db, path, id), data, { merge: true });
      writes++;
      return;
    } catch (e) {
      const code = e.code || "";
      const retryable = TRANSIENT.has(code) || /network|fetch failed|ETIMEDOUT/i.test(e.message || "");
      if (retryable && attempt < 5) {
        await sleep(1500 * attempt);
        continue;
      }
      failures++;
      console.log(`   ! write ${path}/${id} failed: ${code || e.message}`);
      return;
    }
  }
}

// ---------------------------------------------------------------------------
const CAUSE_TITLE = {
  cause_1: "Disaster Response & Relief",
  cause_2: "Youth Education & Mentorship",
  cause_3: "Environmental Conservation",
  cause_4: "Healthcare Access & Clinics",
  cause_5: "Food Security & Nutrition",
  cause_6: "Clean Water Initiatives",
  cause_7: "Animal Rescue & Welfare",
  cause_8: "Elderly Care & Support",
  cause_9: "Technology for Good",
  cause_10: "Refugee Aid & Resettlement",
};

const VOLUNTEERS = [
  {
    key: "alaa", email: "alaa@gmail.com", password: PW, name: "Alaa Matar",
    city: "Istanbul", phone: "+90 532 118 4410",
    bio: "Arabic/Turkish interpreter and trained first responder. Two years supporting refugee reception centres in Istanbul; comfortable in high-pressure field settings.",
    skills: ["First Aid", "Translation (Arabic)", "Psychological First Aid", "Logistics", "AVR"],
    languages: [{ name: "Arabic", proficiency: "Native" }, { name: "Turkish", proficiency: "Fluent" }, { name: "English", proficiency: "Conversational" }],
    causes: ["cause_1", "cause_10"], avr: true, bloodType: "O+", impactScore: 340,
  },
  {
    key: "omar", email: "omar.kaya@athar.seed", password: PW, name: "Omar Kaya",
    city: "Ankara", phone: "+90 533 224 7781",
    bio: "Logistics coordinator and off-road driver. Ran supply convoys during the 2023 earthquake response and now trains new AVR drivers.",
    skills: ["Logistics", "Driving", "Search & Rescue", "Warehouse Management", "AVR"],
    languages: [{ name: "Turkish", proficiency: "Native" }, { name: "English", proficiency: "Fluent" }],
    causes: ["cause_1", "cause_5"], avr: true, bloodType: "A+", impactScore: 512,
  },
  {
    key: "lina", email: "lina.demir@athar.seed", password: PW, name: "Lina Demir",
    city: "Izmir", phone: "+90 535 903 1120",
    bio: "Primary school teacher volunteering on after-school mentorship and literacy programmes for children in under-resourced neighbourhoods.",
    skills: ["Teaching", "Childcare", "Translation (English)", "Curriculum Design"],
    languages: [{ name: "Turkish", proficiency: "Native" }, { name: "English", proficiency: "Fluent" }],
    causes: ["cause_2", "cause_8"], avr: false, bloodType: "B+", impactScore: 176,
  },
  {
    key: "mert", email: "mert.yilmaz@athar.seed", password: PW, name: "Mert Yilmaz",
    city: "Istanbul", phone: "+90 536 771 5098",
    bio: "Full-stack developer. Builds internal dashboards and data pipelines for NGOs and helps run the AVR comms tooling during activations.",
    skills: ["Web Development", "Data Analysis", "Social Media", "GIS Mapping", "AVR"],
    languages: [{ name: "Turkish", proficiency: "Native" }, { name: "English", proficiency: "Fluent" }],
    causes: ["cause_9", "cause_3"], avr: true, bloodType: "AB+", impactScore: 298,
  },
  {
    key: "sara", email: "sara.haddad@athar.seed", password: PW, name: "Sara Haddad",
    city: "Bursa", phone: "+90 537 400 6642",
    bio: "Registered nurse. Volunteers at mobile health clinics and provides psychological first aid training to community volunteers.",
    skills: ["Medical", "First Aid", "Psychological First Aid", "Triage"],
    languages: [{ name: "Arabic", proficiency: "Native" }, { name: "Turkish", proficiency: "Fluent" }, { name: "English", proficiency: "Fluent" }],
    causes: ["cause_4", "cause_1"], avr: false, bloodType: "O-", impactScore: 224,
  },
];

const ORGS = [
  { key: "anatolia", email: "contact@anatoliayouth.org", password: PW, tier: "tier1", name: "Anatolia Youth & Social Solidarity", city: "Istanbul", category: "Youth Development", causes: "Youth Education & Mentorship, Community Development, Elderly Care", tagline: "Grassroots youth action across Istanbul", description: "Anatolia Youth & Social Solidarity is a student-founded community initiative running after-school clubs, neighbourhood clean-ups and elderly-companionship visits across three Istanbul districts. We connect university volunteers with families who need a hand.", mission: "To give every young person in our neighbourhoods a mentor, a safe space and a way to give back." },
  { key: "campusgreen", email: "team@campusgreen.athar.seed", password: PW, tier: "tier1", name: "Campus Green Collective", city: "Izmir", category: "Environment", causes: "Environmental Conservation, Clean Water Initiatives", tagline: "Students restoring Izmir's coastline", description: "Campus Green Collective is a volunteer group of Izmir university students organising weekly beach and river clean-ups, native tree planting days and campus recycling drives. Everything we do is hands-on and open to anyone.", mission: "To leave Izmir's shoreline and green spaces measurably cleaner every semester." },
  { key: "neighborhoodhands", email: "hello@neighborhoodhands.athar.seed", password: PW, tier: "tier1", name: "Neighborhood Hands Initiative", city: "Bursa", category: "Community Support", causes: "Elderly Care & Support, Food Security & Nutrition, Community Development", tagline: "Neighbours helping neighbours in Bursa", description: "Neighborhood Hands is a small Bursa community initiative matching volunteers with elderly and housebound residents for weekly grocery runs, home repairs and companionship. We also run a monthly community kitchen.", mission: "To make sure no one on our street is left to manage alone." },

  { key: "hope", email: "office@hopethrougheducation.athar.seed", password: PW, tier: "tier2", name: "Hope Through Education Foundation", city: "Ankara", category: "Education Non-Profit", causes: "Youth Education & Mentorship, Refugee Aid & Resettlement", tagline: "Classrooms for children the system missed", description: "Hope Through Education Foundation is a registered Ankara NGO operating catch-up learning centres for out-of-school and refugee children, running a trained-tutor programme and providing school supplies and transport stipends to 600+ students a year.", mission: "To return every out-of-school child in Ankara to a classroom within one school year." },
  { key: "cleanwater", email: "info@cleanwateranatolia.athar.seed", password: PW, tier: "tier2", name: "Clean Water Anatolia", city: "Izmir", category: "Environmental Non-Profit", causes: "Clean Water Initiatives, Environmental Conservation, Healthcare Access & Clinics", tagline: "Safe water for rural Aegean villages", description: "Clean Water Anatolia is a registered NGO installing and maintaining village-scale water filtration systems across the rural Aegean, testing supplies for contamination and training local committees to run them.", mission: "To bring tested, reliable drinking water to every village we can reach in the Aegean region." },
  { key: "paws", email: "shelter@anatolianpaws.athar.seed", password: PW, tier: "tier2", name: "Anatolian Paws Rescue", city: "Antalya", category: "Animal Welfare Non-Profit", causes: "Animal Rescue & Welfare", tagline: "Rescue, rehabilitate, rehome", description: "Anatolian Paws Rescue is a registered Antalya animal-welfare NGO running a 120-animal shelter, a mobile spay-neuter clinic and a foster network. Volunteers help with daily care, transport, adoption events and clinic support.", mission: "To end the stray-animal cycle in Antalya province through rescue, sterilisation and adoption." },
  { key: "brighthealth", email: "clinics@brighthealthnetwork.athar.seed", password: PW, tier: "tier2", name: "Bright Health Clinics Network", city: "Istanbul", category: "Healthcare Non-Profit", causes: "Healthcare Access & Clinics, Food Security & Nutrition", tagline: "Free primary care for uninsured families", description: "Bright Health Clinics Network is a registered NGO running four free primary-care clinics in Istanbul serving uninsured and migrant families, plus a monthly mobile clinic. We rely on volunteer clinicians, translators and reception staff.", mission: "To make sure a lack of papers or money never stops someone getting basic healthcare." },

  { key: "rapidrelief", email: "ops@rapidrelief.athar.seed", password: PW, tier: "tier3", name: "Rapid Relief Türkiye", city: "Ankara", category: "Disaster Response NGO", causes: "Disaster Response & Relief, Food Security & Nutrition, Clean Water Initiatives", tagline: "First on the ground, coordinated by the book", description: "Rapid Relief Türkiye is a government-accredited disaster-response NGO maintaining pre-positioned supply caches and a trained rapid-deployment roster. We run field kitchens, water distribution and shelter setup within 24 hours of an activation under the national response framework.", mission: "To deliver coordinated life-saving relief within the first 24 hours of any major incident in Türkiye." },
  { key: "quake", email: "command@quakeresponse.athar.seed", password: PW, tier: "tier3", name: "Quake Response Alliance", city: "Istanbul", category: "Search & Rescue NGO", causes: "Disaster Response & Relief, Healthcare Access & Clinics", tagline: "Urban search, rescue and structural triage", description: "Quake Response Alliance is a government-accredited urban search-and-rescue NGO. We field certified USAR teams, structural engineers and medical triage units, and run the volunteer reserve that backfills logistics and family-liaison roles during an earthquake response.", mission: "To cut the time between a building collapse and a trained rescuer on the rubble." },
  { key: "refugeebridge", email: "field@refugeebridge.athar.seed", password: PW, tier: "tier3", name: "Refugee Bridge Humanitarian", city: "Istanbul", category: "Humanitarian Response NGO", causes: "Refugee Aid & Resettlement, Disaster Response & Relief, Youth Education & Mentorship", tagline: "Reception, protection, resettlement support", description: "Refugee Bridge Humanitarian is a government-accredited NGO operating reception-centre support, protection case-work and resettlement-preparation classes for newly arrived families. During surge events we deploy interpreters and registration teams to border and transit points.", mission: "To make the first month in a new country survivable and the path forward navigable." },
];
const ORG_BY_KEY = Object.fromEntries(ORGS.map((o) => [o.key, o]));

const OPPS = [
  { org: "anatolia", title: "After-school homework club mentor", category: "Education", type: "Recurring", location: "Istanbul", skills: ["Teaching", "Childcare"], needed: 8, days: 3 },
  { org: "anatolia", title: "Weekend neighbourhood clean-up crew", category: "Community", type: "One-time", location: "Istanbul", skills: ["Logistics"], needed: 20, days: 6 },
  { org: "anatolia", title: "Elderly companionship home visits", category: "Community", type: "Recurring", location: "Istanbul", skills: ["Psychological First Aid", "Driving"], needed: 10, days: 9 },

  { org: "campusgreen", title: "Coastline clean-up & waste survey", category: "Environment", type: "Recurring", location: "Izmir", skills: ["Logistics", "Data Analysis"], needed: 25, days: 2 },
  { org: "campusgreen", title: "Native tree planting day", category: "Environment", type: "One-time", location: "Izmir", skills: [], needed: 40, days: 12 },
  { org: "campusgreen", title: "Campus recycling data tracker", category: "Technology", type: "Recurring", location: "Remote", skills: ["Data Analysis", "Web Development"], needed: 3, days: 5 },

  { org: "neighborhoodhands", title: "Weekly grocery run for housebound residents", category: "Community", type: "Recurring", location: "Bursa", skills: ["Driving"], needed: 12, days: 4 },
  { org: "neighborhoodhands", title: "Monthly community kitchen cook", category: "Community", type: "Recurring", location: "Bursa", skills: ["Cooking", "Logistics"], needed: 6, days: 8 },
  { org: "neighborhoodhands", title: "Minor home repairs helper", category: "Community", type: "One-time", location: "Bursa", skills: ["Carpentry"], needed: 5, days: 14 },

  { org: "hope", title: "Volunteer tutor — maths & Turkish", category: "Education", type: "Recurring", location: "Ankara", skills: ["Teaching", "Curriculum Design"], needed: 15, days: 2 },
  { org: "hope", title: "Arabic-speaking classroom assistant", category: "Education", type: "Recurring", location: "Ankara", skills: ["Translation (Arabic)", "Childcare"], needed: 6, days: 5 },
  { org: "hope", title: "School-supply drive logistics", category: "Community", type: "One-time", location: "Ankara", skills: ["Logistics", "Warehouse Management"], needed: 10, days: 11 },

  { org: "cleanwater", title: "Village water-testing field team", category: "Environment", type: "Recurring", location: "Izmir", skills: ["Data Analysis", "First Aid"], needed: 8, days: 3 },
  { org: "cleanwater", title: "Filtration system install & maintenance", category: "Environment", type: "Recurring", location: "Izmir", skills: ["Carpentry", "Logistics"], needed: 6, days: 7 },
  { org: "cleanwater", title: "Community committee training facilitator", category: "Education", type: "One-time", location: "Izmir", skills: ["Teaching"], needed: 4, days: 15 },

  { org: "paws", title: "Daily shelter animal care", category: "Animal Rights", type: "Recurring", location: "Antalya", skills: [], needed: 20, days: 1 },
  { org: "paws", title: "Mobile spay-neuter clinic assistant", category: "Healthcare", type: "Recurring", location: "Antalya", skills: ["Medical", "First Aid"], needed: 5, days: 6 },
  { org: "paws", title: "Adoption-event social media & photos", category: "Technology", type: "One-time", location: "Antalya", skills: ["Social Media"], needed: 3, days: 10 },

  { org: "brighthealth", title: "Free clinic reception & registration", category: "Healthcare", type: "Recurring", location: "Istanbul", skills: ["Translation (Arabic)", "Data Analysis"], needed: 10, days: 2 },
  { org: "brighthealth", title: "Volunteer nurse — mobile clinic", category: "Healthcare", type: "Recurring", location: "Istanbul", skills: ["Medical", "Triage", "First Aid"], needed: 6, days: 4 },
  { org: "brighthealth", title: "Patient-flow data & scheduling", category: "Technology", type: "Recurring", location: "Remote", skills: ["Data Analysis", "Web Development"], needed: 2, days: 9 },

  { org: "rapidrelief", title: "Field kitchen operations volunteer", category: "Emergency", type: "Recurring", location: "Ankara", skills: ["Cooking", "Logistics"], needed: 12, days: 3 },
  { org: "rapidrelief", title: "Supply cache inventory & rotation", category: "Emergency", type: "Recurring", location: "Ankara", skills: ["Warehouse Management", "Logistics"], needed: 6, days: 6 },
  { org: "rapidrelief", title: "AVR rapid-deployment driver (reserve)", category: "Emergency", type: "Recurring", location: "Ankara", skills: ["Driving", "Search & Rescue", "AVR"], needed: 15, days: 8, avrOnly: true },

  { org: "quake", title: "Family-liaison & information desk", category: "Emergency", type: "Recurring", location: "Istanbul", skills: ["Psychological First Aid", "Translation (Arabic)"], needed: 10, days: 2 },
  { org: "quake", title: "Logistics backfill for USAR teams", category: "Emergency", type: "Recurring", location: "Istanbul", skills: ["Logistics", "GIS Mapping"], needed: 8, days: 5 },
  { org: "quake", title: "AVR structural-triage support (reserve)", category: "Emergency", type: "Recurring", location: "Istanbul", skills: ["Search & Rescue", "First Aid", "AVR"], needed: 12, days: 7, avrOnly: true },

  { org: "refugeebridge", title: "Reception-centre interpreter (Arabic)", category: "Humanitarian", type: "Recurring", location: "Istanbul", skills: ["Translation (Arabic)", "Psychological First Aid"], needed: 12, days: 2 },
  { org: "refugeebridge", title: "Resettlement-prep class facilitator", category: "Education", type: "Recurring", location: "Istanbul", skills: ["Teaching", "Translation (English)"], needed: 8, days: 5 },
  { org: "refugeebridge", title: "Registration team — surge deployment", category: "Humanitarian", type: "Recurring", location: "Istanbul", skills: ["Data Analysis", "Translation (Arabic)", "AVR"], needed: 10, days: 9, avrOnly: true },
];
const OPP_IDS = {};
OPPS.forEach((o) => {
  (OPP_IDS[o.org] ??= []).push(`seed_opp_${o.org}_${OPP_IDS[o.org].length + 1}`);
});
const oppId = (orgKey, n) => OPP_IDS[orgKey][n - 1];

const APPS = [
  ["alaa", "refugeebridge", 1, "accepted", 46, "I interpret Arabic/Turkish daily and have worked reception centres before. Available mornings."],
  ["alaa", "hope", 2, "accepted", 22, "Happy to support the Arabic-speaking classroom — I work well with kids."],
  ["alaa", "brighthealth", 1, "pending", 0, "First-aid trained and fluent Arabic; I can cover the front desk and triage translation."],
  ["alaa", "quake", 1, "completed", 30, "Supported the last activation on the information desk. Ready to do it again."],
  ["omar", "rapidrelief", 1, "accepted", 60, "Ran field kitchens during the 2023 response. I can lead a shift."],
  ["omar", "rapidrelief", 2, "accepted", 18, "I know cache rotation and can train newcomers on the inventory system."],
  ["omar", "anatolia", 2, "completed", 8, "Brought a van and four friends to the last clean-up."],
  ["omar", "neighborhoodhands", 1, "pending", 0, "I'm in Ankara but travel to Bursa weekly and can cover a grocery route."],
  ["lina", "hope", 1, "accepted", 40, "Primary teacher, six years. I can take the maths and Turkish catch-up group."],
  ["lina", "cleanwater", 3, "accepted", 12, "I've facilitated community training before and can adapt the material for mixed groups."],
  ["lina", "anatolia", 1, "pending", 0, "I'd love to mentor at the homework club on weekday afternoons."],
  ["lina", "campusgreen", 2, "completed", 6, "Joined the tree-planting day with my students — great morning."],
  ["mert", "campusgreen", 3, "accepted", 24, "I'll build the recycling tracker and a small dashboard for the weekly numbers."],
  ["mert", "brighthealth", 3, "accepted", 20, "Can set up the patient-flow scheduling and reporting, fully remote."],
  ["mert", "quake", 2, "pending", 0, "GIS mapping and logistics tooling — I helped build the comms setup last time."],
  ["mert", "cleanwater", 1, "completed", 10, "Cleaned and analysed the last round of water-test data."],
  ["sara", "brighthealth", 2, "accepted", 52, "Registered nurse. I can cover the mobile clinic twice a month."],
  ["sara", "paws", 2, "accepted", 14, "Happy to assist the spay-neuter clinic — I have surgical-assist experience."],
  ["sara", "quake", 1, "pending", 0, "I can run psychological first aid at the family-liaison desk."],
];

const CRISES = [
  { id: "seed_crisis_1", org: "rapidrelief", title: "Flash flooding — Sinop coastal district", description: "Overnight flooding has cut road access to three neighbourhoods in Sinop. We are standing up a field kitchen and water-distribution point and need drivers and logistics volunteers on the reserve roster to deploy within 12 hours.", severity: "High", location: "Sinop", skillsNeeded: ["Driving", "Logistics", "Search & Rescue"], needed: 10, days: 1, responders: ["omar", "mert"] },
  { id: "seed_crisis_2", org: "quake", title: "M5.4 earthquake — structural assessment, Düzce", description: "A 5.4 earthquake near Düzce has caused partial collapses in older buildings. USAR teams are deploying; we need reserve volunteers for the family-liaison desk, interpretation and logistics backfill at the coordination centre.", severity: "Critical", location: "Düzce", skillsNeeded: ["Psychological First Aid", "Translation (Arabic)", "First Aid", "Logistics"], needed: 14, days: 0, responders: ["alaa"] },
];

// ---------------------------------------------------------------------------
const uidByEmail = {};
let accCreated = 0;
let accReused = 0;

async function ensureAccount(email, password) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      accCreated++;
      return cred.user.uid;
    } catch (e) {
      if (e.code === "auth/email-already-in-use") {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        accReused++;
        return cred.user.uid;
      }
      if (e.code === "auth/too-many-requests") {
        console.log("   rate-limited, waiting 30s…");
        await sleep(30000);
        continue;
      }
      if (e.code === "auth/network-request-failed") {
        console.log(`   network blip on ${email}, retrying in 5s…`);
        await sleep(5000);
        continue;
      }
      throw e;
    }
  }
  throw new Error(`could not create or sign in ${email}`);
}
const vUid = (key) => uidByEmail[VOLUNTEERS.find((v) => v.key === key).email];
const oUid = (key) => uidByEmail[ORG_BY_KEY[key].email];

// ---------------------------------------------------------------------------
async function main() {
  console.log(`\nSeeding project "${firebaseConfig.projectId}"\n`);
  const ADMIN_EMAIL = "admin@athar.gov";

  // ---- 1. accounts + own profile (signed in as each) --------------------
  console.log("1/6  accounts + profiles");
  for (const v of VOLUNTEERS) {
    const id = await ensureAccount(v.email, v.password);
    uidByEmail[v.email] = id;
    await put("users", id, {
      uid: id, name: v.name, email: v.email, phone: v.phone, role: "volunteer",
      city: v.city, country: "Türkiye", bio: v.bio,
      photoUrl: avatar(v.name), avatarUrl: avatar(v.name),
      skills: v.skills, languages: v.languages, interests: v.skills.slice(0, 3),
      experiences: [], educations: [], impactScore: v.impactScore, isAVRMember: v.avr,
      availability: { weekdays: true, weekends: true, hours: "5-10 hours", format: "Flexible" },
      crisisInfo: { bloodType: v.bloodType, drivingLicense: v.skills.includes("Driving"), emergencyName: "Next of kin (seed)", emergencyRelation: "Sibling", emergencyPhone: "+90 500 000 0000" },
      legalIdentity: { type: "citizen", legalName: v.name, idNumber: "10000000000", birthYear: "1994", submittedAt: ts(40) },
      supportedCauses: v.causes.map((c) => ({ id: c, title: CAUSE_TITLE[c], hoursContributed: 6, impactScore: 40 })),
      createdAt: ts(45),
    });
    console.log(`   volunteer  ${v.name}${v.avr ? "  [AVR]" : ""}`);
    await sleep(350);
  }

  for (const o of ORGS) {
    const id = await ensureAccount(o.email, o.password);
    uidByEmail[o.email] = id;
    const orgSnap = await getDoc(doc(db, "organizations", id));
    const exists = orgSnap.exists();
    const curStatus = exists ? orgSnap.data().verificationStatus : null;
    const slug = o.name.toLowerCase().replace(/[^a-z]+/g, "-").slice(0, 20);
    const profile = {
      uid: id, name: o.name, email: o.email, role: "organization",
      phone: `+90 21${o.tier.slice(-1)} ${o.key.slice(0, 3).toUpperCase()} 4400`,
      registrationId: `TR-NGO-${o.tier.toUpperCase()}-${o.key.slice(0, 4).toUpperCase()}`,
      category: o.category, tagline: o.tagline, description: o.description, mission: o.mission, bio: o.tagline,
      address: `${o.key} Mah. Solidarity Cd. No:${10 + o.name.length}, ${o.city}`,
      city: o.city, country: "Türkiye", location: `${o.city}, Türkiye`,
      website: `https://${slug}.athar.seed`, causes: o.causes,
      boardMembers: "Founding board: Chair, Treasurer, Secretary and two community trustees (seed data).",
      safeguardingPolicy: "All volunteers are briefed on our safeguarding code, checks are required for roles working with minors, and incidents are reported to the designated safeguarding lead within 24 hours (seed data).",
      yearFounded: `${2010 + (o.name.length % 12)}`,
      photoUrl: avatar(o.name), logoUrl: avatar(o.name), coverUrl: "",
      impactSummary: o.tier === "tier3" ? "Accredited under the national response framework. 20+ activations." : o.tier === "tier2" ? "Registered NGO. 5,000+ volunteer hours delivered last year." : "Community initiative. Active every week since founding.",
      updatedAt: ts(1),
    };
    // tier/verified/verificationStatus only on first create (the rules forbid an
    // org changing them itself afterwards — the admin pass handles that).
    // tier1 is auto-verified; tier2/tier3 are created "pending audit" (the rules
    // only let an admin move them to verified). Set on first create only.
    const isT1 = o.tier === "tier1";
    if (!exists) {
      profile.tier = o.tier;
      profile.createdAt = ts(60);
      profile.verified = isT1;
      profile.verificationStatus = isT1 ? "verified" : "pending";
    }
    await put("organizations", id, profile);

    // migrate any tier2/3 org left at 'unverified' by an earlier run up to
    // 'pending' — the rules allow the org itself to make exactly this move.
    if (exists && !isT1 && (!curStatus || curStatus === "unverified")) {
      await put("organizations", id, { verificationStatus: "pending" });
      await put("users", id, { verificationStatus: "pending" });
    }

    const nametagExists = (await getDoc(doc(db, "users", id))).exists();
    const nametag = { uid: id, name: o.name, email: o.email, role: "organization" };
    if (!nametagExists) {
      nametag.tier = o.tier;
      nametag.verified = isT1;
      nametag.verificationStatus = isT1 ? "verified" : "pending";
    }
    await put("users", id, nametag);

    // every tier2/tier3 org gets a verification request in the admin queue.
    if (!isT1) {
      const vrId = `seed_vr_${o.key}`;
      let vrExists = false;
      try {
        vrExists = (await getDoc(doc(db, "verificationRequests", vrId))).exists();
      } catch {
        vrExists = false; // read of a missing request is denied → treat as absent
      }
      if (!vrExists) {
        const lic = `TR-NGO-${o.tier.toUpperCase()}-${o.key.slice(0, 4).toUpperCase()}`;
        await put("verificationRequests", vrId, {
          orgId: id, name: o.name, collectionName: "organizations", category: o.category,
          registrationId: lic, yearFounded: profile.yearFounded,
          auditData: {
            legalName: o.name, licenseId: lic,
            signatoryName: "Authorised signatory (seed)",
            signatoryRole: o.tier === "tier3" ? "Executive Director" : "Programme Director",
          },
          status: "pending", submittedAt: ts(4 + ORGS.indexOf(o)),
        });
      }
    }
    console.log(`   org [${o.tier}]  ${o.name}${isT1 ? "" : "  (pending audit)"}`);
    await sleep(350);
  }

  // ---- 2. admin pass: verify tier2/tier3 orgs --------------------------
  console.log("2/6  admin verification pass");
  let isAdmin = false;
  let adminUid = null;
  try {
    adminUid = await ensureAccount(ADMIN_EMAIL, ADMIN_PW);
  } catch (e) {
    console.log(`   admin sign-in failed (${e.code || e.message}) — orgs left pending`);
  }
  if (adminUid) {
    for (let attempt = 1; attempt <= 4 && !isAdmin; attempt++) {
      try {
        isAdmin = (await getDoc(doc(db, "admins", adminUid))).exists();
        if (!isAdmin) break; // clean "does not exist" — no point retrying
      } catch (e) {
        if (attempt === 4) console.log(`   could not read admins/ (${e.code || e.message})`);
        await sleep(1500 * attempt);
      }
    }
    if (!isAdmin) console.log("   no admins/ record readable for this account — skipping verification");
  }
  if (isAdmin) {
    for (const o of ORGS) {
      if (o.tier === "tier1") continue;
      const id = oUid(o.key);
      await put("organizations", id, { verified: true, verificationStatus: "verified" });
      await put("users", id, { verified: true, verificationStatus: "verified" });
    }
    console.log("   tier2 + tier3 orgs marked verified");
  }

  // ---- 3. opportunities ----------------------------------------------
  console.log("3/6  opportunities");
  const nById = {};
  for (const op of OPPS) {
    nById[op.org] = (nById[op.org] || 0) + 1;
    const n = nById[op.org];
    const org = ORG_BY_KEY[op.org];
    await put("opportunities", oppId(op.org, n), {
      orgId: oUid(op.org), orgName: org.name, organization: org.name, title: op.title,
      description: `${org.name} is looking for volunteers for "${op.title}". ${op.type} role based in ${op.location}. ${org.mission}`,
      category: op.category, cause: op.category, type: op.type, location: op.location,
      skills: op.skills, requiredSkills: op.skills,
      volunteersNeeded: op.needed, goal: op.needed, volunteersResponded: 0, applicantsCount: 0,
      deadline: new Date(Date.now() + (30 - op.days) * 864e5).toISOString().slice(0, 10),
      orgTier: org.tier, isCrisis: org.tier === "tier3",
      targetAudience: op.avrOnly ? "avr_only" : "public",
      status: "active", hidden: false, createdAt: ts(op.days), updatedAt: ts(op.days),
    });
  }
  console.log(`   ${OPPS.length} opportunities`);

  // ---- 4. applications + org notifications --------------------------
  console.log("4/6  applications");
  for (const [vk, ok, n, status, hours, note] of APPS) {
    const v = VOLUNTEERS.find((x) => x.key === vk);
    const org = ORG_BY_KEY[ok];
    const opp = OPPS.filter((o) => o.org === ok)[n - 1];
    const oppDocId = oppId(ok, n);
    const when = ts(Math.max(opp.days - 1, 1));
    await put("applications", `seed_app_${vk}_${oppDocId}`, {
      oppId: oppDocId, oppTitle: opp.title, orgId: oUid(ok), orgName: org.name,
      volunteerId: vUid(vk), volunteerName: v.name, coverLetter: note,
      status, hoursContributed: hours, appliedAt: when,
    });
    await put("notifications", `seed_notif_app_${vk}_${oppDocId}`, {
      orgId: oUid(ok), title: "New application",
      message: `${v.name} applied for "${opp.title}"`,
      type: "application", read: status !== "pending", createdAt: when,
    });
  }
  console.log(`   ${APPS.length} applications`);

  // ---- 5. crises + responses + AVR notifications ------------------
  console.log("5/6  crises");
  for (const c of CRISES) {
    const org = ORG_BY_KEY[c.org];
    await put("crises", c.id, {
      orgId: oUid(c.org), organization: org.name, organizationVerified: true,
      title: c.title, description: c.description, severity: c.severity, location: c.location,
      skillsNeeded: c.skillsNeeded, volunteersNeeded: c.needed,
      volunteersActivated: c.responders.length + 3, volunteersResponded: c.responders.length,
      status: "Active", commsLink: `https://meet.athar.seed/${c.id}`,
      createdAt: ts(c.days, 6), lastActivityAt: ts(c.days, 1),
    });
    for (const v of VOLUNTEERS.filter((x) => x.avr)) {
      await put("notifications", `seed_notif_${c.id}_${v.key}`, {
        userId: vUid(v.key), organizationName: org.name,
        title: `CRISIS ALERT: ${c.title}`,
        message: `${org.name} has activated the reserve. ${c.needed} volunteers needed in ${c.location}.`,
        type: "info", read: c.responders.includes(v.key), createdAt: ts(c.days, 6), link: "/crisis",
      });
    }
    for (const rk of c.responders) {
      await put("crisisResponses", `seed_cr_${rk}_${c.id}`, {
        crisisId: c.id, volunteerId: vUid(rk), status: "accepted", respondedAt: ts(c.days, 3),
      });
      await put("applications", `seed_app_${rk}_${c.id}`, {
        oppId: c.id, oppTitle: `CRISIS: ${c.title}`, orgId: oUid(c.org), orgName: org.name,
        volunteerId: vUid(rk), volunteerName: VOLUNTEERS.find((x) => x.key === rk).name,
        status: "accepted", type: "emergency", hoursContributed: 0, appliedAt: ts(c.days, 2),
      });
    }
  }
  console.log(`   ${CRISES.length} active crises`);

  // ---- 6. messages + training records ----------------------------
  console.log("6/6  messages + training");
  const thread = (prefix, missionId, lines, baseDays, extra = {}) =>
    Promise.all(
      lines.map(([sid, sname, srole, text], i) =>
        put("messages", `${prefix}_${i + 1}`, {
          missionId, text, senderId: sid, senderName: sname, senderRole: srole,
          avatar: avatar(sname), timestamp: ts(baseDays, 20 - i * 3), ...extra,
        })
      )
    );

  await thread("seed_msg_mission", oppId("refugeebridge", 1), [
    [oUid("refugeebridge"), ORG_BY_KEY.refugeebridge.name, "organization", "Hi Alaa — thanks for signing up for the reception-centre interpreter role. Can you start this Thursday, 09:00?"],
    [vUid("alaa"), "Alaa Matar", "volunteer", "Yes, Thursday works. Which centre am I reporting to?"],
    [oUid("refugeebridge"), ORG_BY_KEY.refugeebridge.name, "organization", "Fatih reception centre, ask for Derya at the front desk. Bring ID. We'll have Arabic and Turkish families in that morning."],
    [vUid("alaa"), "Alaa Matar", "volunteer", "Got it. I'll be there 08:45."],
  ], 2);

  await thread("seed_msg_crisis", "seed_crisis_1", [
    [oUid("rapidrelief"), ORG_BY_KEY.rapidrelief.name, "organization", "Reserve activated for the Sinop flooding. Muster point is the Ankara depot, 06:00. Reply here to confirm."],
    [vUid("omar"), "Omar Kaya", "volunteer", "Confirmed. I'll bring the 4x4 and can take three passengers."],
    [vUid("mert"), "Mert Yilmaz", "volunteer", "Confirmed — I'll set up the field comms and the intake sheet on the way."],
    [oUid("rapidrelief"), ORG_BY_KEY.rapidrelief.name, "organization", "Perfect. Roads to the north district are still cut — we'll route via the coastal road. Water pallets are loaded."],
  ], 1);

  const dmId = `dm_${oUid("brighthealth")}_${vUid("sara")}`;
  await put("messages", "seed_msg_dm_1", {
    missionId: dmId, channelTitle: "Bright Health Clinics Network",
    text: "Sara, could you swap to the 14th for the mobile clinic? We're short a nurse that day.",
    senderId: oUid("brighthealth"), senderName: ORG_BY_KEY.brighthealth.name, senderRole: "organization",
    targetUserId: vUid("sara"), avatar: avatar("BH"), timestamp: ts(3, 5),
  });
  await put("messages", "seed_msg_dm_2", {
    missionId: dmId, channelTitle: "Bright Health Clinics Network",
    text: "That's fine, I can do the 14th. Same location in Esenler?",
    senderId: vUid("sara"), senderName: "Sara Haddad", senderRole: "volunteer",
    targetUserId: oUid("brighthealth"), avatar: avatar("Sara"), timestamp: ts(3, 4),
  });

  for (const v of VOLUNTEERS) {
    const id = vUid(v.key);
    await put("userCourses", `${id}_c1`, { userId: id, courseId: "c1", status: "completed", completedLessons: 8, progress: 100, enrolledAt: ts(35), completedAt: ts(20).toDate().toLocaleDateString() });
    await put("userCourses", `${id}_c2`, { userId: id, courseId: "c2", status: "enrolled", completedLessons: 3, progress: 40, enrolledAt: ts(12) });
    await put("userCertificates", `${id}_skill_1`, { userId: id, sourceId: "1", title: "Psychological First Aid — Foundations", type: "skill", issuedAt: ts(18) });
    await put("userSimulations", `${id}_1`, { userId: id, scenarioId: "1", completed: true, score: v.avr ? 96 : 91, title: "Crisis Text Line - Distressed Caller", category: "Psychological First Aid", difficulty: "Intermediate", estimatedTime: 15 });
  }
  console.log("   3 message threads + training records");

  // ---- summary -------------------------------------------------
  console.log("\n────────────────────────────────────────────────────────");
  console.log(`accounts: ${accCreated} created, ${accReused} reused   |   docs: ${writes} written, ${failures} failed`);
  if (!isAdmin) console.log("\nNOTE: admin pass skipped — tier2/tier3 orgs are unverified.\n      Log in as admin and approve them in the Verification tab.");
  console.log("\nLOGINS  (seed accounts all use SEED_USER_PASSWORD from .env)\n");
  console.log("  role         email                                          password");
  console.log("  ───────────────────────────────────────────────────────────────────────");
  for (const v of VOLUNTEERS) console.log(`  volunteer    ${v.email.padEnd(46)} ${v.password}${v.avr ? "   [AVR]" : ""}`);
  for (const o of ORGS) console.log(`  org ${o.tier}    ${o.email.padEnd(46)} ${o.password}`);
  console.log(`  admin        ${ADMIN_EMAIL.padEnd(46)} ${ADMIN_PW}  (unchanged)`);
  console.log("\nDone.\n");
  process.exit(failures > 0 ? 2 : 0);
}

main().catch((e) => {
  console.error("\nSEED FAILED:", e);
  process.exit(1);
});
