// SeiRokom Fashion — Partner Dashboard: Firebase Auth + Firestore live data
// Shared by: dealership-dashboard.html, dropshipping-dashboard.html,
//            stock-partner-dashboard.html, delivery-man-dashboard.html
// Each dashboard sets window.PARTNER_TYPE before loading this file:
//   'dealer' | 'dropship' | 'stock' | 'delivery'

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, collection, addDoc,
  query, where, getDocs, orderBy, limit
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCdDiP0NAtmSQt5a8I-DEY8G44rAp4z_-M",
  authDomain: "seirokom-fashion.firebaseapp.com",
  projectId: "seirokom-fashion",
  storageBucket: "seirokom-fashion.firebasestorage.app",
  messagingSenderId: "1051300000338",
  appId: "1:1051300000338:web:27f8dd549b0f222bfc658b",
  measurementId: "G-7DYHCWW0YG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const TYPE = window.PARTNER_TYPE; // 'dealer' | 'dropship' | 'stock' | 'delivery'
const PREFIX = { dealer: "DL", dropship: "DS", stock: "SP", delivery: "DM" }[TYPE];

function $(id) { return document.getElementById(id); }
function setText(id, val) { const el = $(id); if (el) el.textContent = val; }
function show(id, on) { const el = $(id); if (el) el.style.display = on ? "" : "none"; }

function genPartnerId() {
  return "SRK-" + PREFIX + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function todayStartMs() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime();
}

function showError(msg) {
  const el = $("auth-error");
  if (el) { el.textContent = msg; el.style.display = "block"; }
}
function clearError() {
  const el = $("auth-error");
  if (el) { el.style.display = "none"; el.textContent = ""; }
}

// ---------- Auth form wiring ----------
function wireAuthForms() {
  const loginForm = $("loginForm");
  const registerForm = $("registerForm");
  const showRegister = $("show-register");
  const showLogin = $("show-login");
  const logoutBtn = $("logout-btn");

  if (showRegister) showRegister.addEventListener("click", (e) => {
    e.preventDefault(); clearError();
    show("loginForm", false); show("toggle-register", false);
    show("registerForm", true); show("toggle-login", true);
  });
  if (showLogin) showLogin.addEventListener("click", (e) => {
    e.preventDefault(); clearError();
    show("registerForm", false); show("toggle-login", false);
    show("loginForm", true); show("toggle-register", true);
  });

  if (loginForm) loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); clearError();
    const email = $("li-email").value.trim();
    const pass = $("li-pass").value;
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      showError("লগইন ব্যর্থ — ইমেইল বা পাসওয়ার্ড ঠিক আছে কিনা দেখুন।");
    }
  });

  if (registerForm) registerForm.addEventListener("submit", async (e) => {
    e.preventDefault(); clearError();
    const name = $("rg-name").value.trim();
    const phone = $("rg-phone").value.trim();
    const area = $("rg-area").value.trim();
    const email = $("rg-email").value.trim();
    const pass = $("rg-pass").value;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const partnerId = genPartnerId();
      await setDoc(doc(db, "partners", cred.user.uid), {
        name, phone, area, type: TYPE, partnerId,
        status: "active", createdAt: Date.now()
      });
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        showError("এই ইমেইল দিয়ে আগে থেকেই অ্যাকাউন্ট আছে — লগইন করুন।");
      } else if (err.code === "auth/weak-password") {
        showError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে।");
      } else {
        showError("অ্যাকাউন্ট খোলা যায়নি, আবার চেষ্টা করুন।");
      }
    }
  });

  if (logoutBtn) logoutBtn.addEventListener("click", () => signOut(auth));
}

// ---------- Quick entry form wiring ----------
function wireEntryForm() {
  const entryForm = $("entryForm");
  if (!entryForm) return;
  entryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    const name = $("entry-name").value.trim();
    const detail = $("entry-detail").value.trim();
    const amount = parseFloat($("entry-amount").value) || 0;
    const commission = parseFloat($("entry-commission").value) || 0;
    const status = $("entry-status").value;
    try {
      if (TYPE === "delivery") {
        await addDoc(collection(db, "deliveries"), {
          deliveryManId: user.uid, customerName: name, address: detail,
          earning: commission, status, createdAt: Date.now()
        });
      } else {
        await addDoc(collection(db, "orders"), {
          partnerId: user.uid, type: TYPE, customerName: name, contact: detail,
          amount, commission, status, createdAt: Date.now()
        });
      }
      entryForm.reset();
      loadStats(user.uid);
      const okMsg = $("entry-ok");
      if (okMsg) { okMsg.style.display = "block"; setTimeout(() => okMsg.style.display = "none", 2500); }
    } catch (err) {
      alert("এন্ট্রি যোগ করা যায়নি, আবার চেষ্টা করুন।");
    }
  });
}

// ---------- Live stats + table ----------
async function loadStats(uid) {
  if (TYPE === "delivery") {
    const q = query(collection(db, "deliveries"), where("deliveryManId", "==", uid));
    const snap = await getDocs(q);
    let assigned = 0, activeToday = 0, delivered = 0, earning = 0;
    const rows = [];
    snap.forEach((d) => {
      const o = d.data();
      if (o.status === "assigned") assigned++;
      if (o.status === "picked" || o.status === "on_the_way") activeToday++;
      if (o.status === "delivered") { delivered++; earning += (o.earning || 0); }
      rows.push({ id: d.id, name: o.customerName || "-", status: o.status || "-", amount: o.earning || 0, ts: o.createdAt || 0 });
    });
    setText("stat-1", assigned);
    setText("stat-2", activeToday);
    setText("stat-3", delivered);
    setText("stat-4", "৳" + earning);
    renderTable(rows);
  } else {
    const q = query(collection(db, "orders"), where("partnerId", "==", uid));
    const snap = await getDocs(q);
    let pending = 0, processing = 0, completed = 0, amountSum = 0, commissionSum = 0;
    const rows = [];
    snap.forEach((d) => {
      const o = d.data();
      if (o.status === "pending") pending++;
      if (o.status === "processing") processing++;
      if (o.status === "completed") completed++;
      amountSum += (o.amount || 0);
      commissionSum += (o.commission || 0);
      rows.push({ id: d.id, name: o.customerName || "-", status: o.status || "-", amount: o.amount || 0, ts: o.createdAt || 0 });
    });
    if (TYPE === "dealer") {
      setText("stat-1", snap.size);
      setText("stat-2", pending);
      setText("stat-3", processing);
      setText("stat-4", "৳" + amountSum);
    } else if (TYPE === "dropship") {
      setText("stat-1", pending);
      setText("stat-2", processing);
      setText("stat-3", completed);
      setText("stat-4", "৳" + commissionSum);
    } else if (TYPE === "stock") {
      setText("stat-2", completed);
      setText("stat-3", pending + processing);
      setText("stat-4", "৳" + commissionSum);
    }
    renderTable(rows);
  }
}

function renderTable(rows) {
  const tbody = $("live-tbody");
  if (!tbody) return;
  rows.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const top = rows.slice(0, 8);
  if (top.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#9a917f;padding:14px;">এখনো কোনো তথ্য যোগ হয়নি</td></tr>';
    return;
  }
  tbody.innerHTML = top.map(r =>
    `<tr><td>${r.id.slice(0, 6)}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.status)}</td><td>৳${r.amount}</td></tr>`
  ).join("");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- Auth state ----------
onAuthStateChanged(auth, async (user) => {
  const gate = $("auth-gate");
  const dash = $("dashboard-app");
  const logoutBtn = $("logout-btn");
  if (user) {
    if (gate) gate.style.display = "none";
    if (dash) dash.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    try {
      const snap = await getDoc(doc(db, "partners", user.uid));
      const data = snap.exists() ? snap.data() : null;
      setText("live-partner-id", data ? data.partnerId : "—");
      setText("live-partner-name", data ? ("স্বাগতম, " + data.name) : "");
      await loadStats(user.uid);
    } catch (err) {
      setText("live-partner-id", "—");
    }
  } else {
    if (gate) gate.style.display = "block";
    if (dash) dash.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
});

wireAuthForms();
wireEntryForm();
