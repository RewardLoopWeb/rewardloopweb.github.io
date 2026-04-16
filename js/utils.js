// utils.js — Firebase init, Firestore helpers, access session management

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCAh_enaOplvVLLrPwWI2PmBe0t_nEWLQQ",
  authDomain: "giveawaysloop-c2d7b.firebaseapp.com",
  projectId: "giveawaysloop-c2d7b",
  storageBucket: "giveawaysloop-c2d7b.firebasestorage.app",
  messagingSenderId: "691273086302",
  appId: "1:691273086302:web:e00d77930eee12e4934bcf",
  measurementId: "G-P87DXJB5YH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── FIRESTORE ────────────────────────────────────────────────────────────────

export async function loadActiveGiveaways() {
  try {
    const ref = collection(db, "giveawaysnoaccess");
    const snap = await getDocs(ref);
    const giveaways = [];
    snap.forEach(doc => {
      giveaways.push({ id: doc.id, ...doc.data() });
    });
    return giveaways;
  } catch (err) {
    console.error("Firestore load error:", err);
    return [];
  }
}

// ── ACCESS SESSION (LocalStorage) ────────────────────────────────────────────

const AD_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const KEY_PREFIX = "rewardloop_access_";

function accessKey(gid) {
  return `${KEY_PREFIX}${gid}`;
}

function getAccessRecord(gid) {
  try {
    const raw = localStorage.getItem(accessKey(gid));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function hasValidAccess(gid) {
  const rec = getAccessRecord(gid);
  if (!rec || !rec.expiresAt) return false;
  return Date.now() < rec.expiresAt;
}

export function grantAccess(gid) {
  const rec = { expiresAt: Date.now() + AD_COOLDOWN_MS };
  localStorage.setItem(accessKey(gid), JSON.stringify(rec));
}

export function clearAccess(gid) {
  localStorage.removeItem(accessKey(gid));
}

// FIX: was missing export — caused ReferenceError in main.js
export function clearAllAccess() {
  Object.keys(localStorage)
    .filter(k => k.startsWith(KEY_PREFIX))
    .forEach(k => localStorage.removeItem(k));
}

export function getAccessRecord_public(gid) {
  return getAccessRecord(gid);
}
