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

// ---------- Stock items (stock partner only): tracks pieces received/sold/returned ----------
function wireStockForm() {
  const form = $("stockForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    const itemName = $("stock-item").value.trim();
    const quantity = parseInt($("stock-qty").value) || 0;
    const status = $("stock-status").value;
    try {
      await addDoc(collection(db, "stock_items"), {
        partnerId: user.uid, itemName, quantity, status, createdAt: Date.now()
      });
      form.reset();
      loadStockItems(user.uid);
      const okMsg = $("stock-ok");
      if (okMsg) { okMsg.style.display = "block"; setTimeout(() => okMsg.style.display = "none", 2500); }
    } catch (err) {
      alert("স্টক এন্ট্রি যোগ করা যায়নি, আবার চেষ্টা করুন।");
    }
  });
}

async function loadStockItems(uid) {
  const q = query(collection(db, "stock_items"), where("partnerId", "==", uid));
  const snap = await getDocs(q);
  let inStock = 0, sold = 0, returned = 0;
  const rows = [];
  snap.forEach((d) => {
    const o = d.data();
    const qty = o.quantity || 0;
    if (o.status === "in_stock") inStock += qty;
    if (o.status === "sold") sold += qty;
    if (o.status === "returned") returned += qty;
    rows.push({ id: d.id, name: o.itemName || "-", status: o.status || "-", qty, ts: o.createdAt || 0 });
  });
  setText("stat-1", inStock);
  lastStats.stockInStock = inStock;
  lastStats.stockSold = sold;
  lastStats.stockReturned = returned;
  rows.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const tbody = $("stock-tbody");
  if (tbody) {
    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#9a917f;padding:14px;">এখনো কোনো স্টক যোগ হয়নি</td></tr>';
    } else {
      const statusLabel = { in_stock: "স্টকে আছে", sold: "বিক্রি হয়েছে", returned: "রিটার্ন/অবিক্রিত" };
      tbody.innerHTML = rows.map(r =>
        `<tr><td>${r.id.slice(0, 6)}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(statusLabel[r.status] || r.status)}</td><td>${r.qty}</td></tr>`
      ).join("");
    }
  }
}

// ---------- Dealer applications (dealer only): new sub-dealer/reseller applicants ----------
function wireDealerAppForm() {
  const form = $("dealerAppForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    const applicantName = $("da-name").value.trim();
    const phone = $("da-phone").value.trim();
    const area = $("da-area").value.trim();
    try {
      await addDoc(collection(db, "dealer_applications"), {
        dealerId: user.uid, applicantName, phone, area, status: "pending", createdAt: Date.now()
      });
      form.reset();
      loadDealerApplications(user.uid);
    } catch (err) {
      alert("আবেদন যোগ করা যায়নি, আবার চেষ্টা করুন।");
    }
  });
}

async function loadDealerApplications(uid) {
  const q = query(collection(db, "dealer_applications"), where("dealerId", "==", uid));
  const snap = await getDocs(q);
  const rows = [];
  snap.forEach((d) => {
    const o = d.data();
    rows.push({ id: d.id, name: o.applicantName || "-", phone: o.phone || "-", area: o.area || "-", status: o.status || "pending", ts: o.createdAt || 0 });
  });
  rows.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  lastStats.pendingApplications = rows.filter(r => r.status === "pending").length;
  const tbody = $("dealerapp-tbody");
  if (!tbody) return;
  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9a917f;padding:14px;">এখনো কোনো আবেদন নেই</td></tr>';
    return;
  }
  const statusLabel = { pending: "পেন্ডিং", approved: "অনুমোদিত", rejected: "বাতিল" };
  tbody.innerHTML = rows.map(r => {
    const actions = r.status === "pending"
      ? `<button class="btn gold" style="padding:5px 8px;font-size:.65rem;margin-right:4px" onclick="updateDealerApp('${r.id}','approved')">✔ অনুমোদন</button><button class="btn" style="padding:5px 8px;font-size:.65rem" onclick="updateDealerApp('${r.id}','rejected')">✘ বাতিল</button>`
      : (statusLabel[r.status] || r.status);
    return `<tr><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.phone)}</td><td>${escapeHtml(r.area)}</td><td>${escapeHtml(statusLabel[r.status] || r.status)}</td><td>${actions}</td></tr>`;
  }).join("");
}

window.updateDealerApp = async function (id, status) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await setDoc(doc(db, "dealer_applications", id), { status }, { merge: true });
    loadDealerApplications(user.uid);
  } catch (err) {
    alert("আপডেট করা যায়নি, আবার চেষ্টা করুন।");
  }
};

// ---------- Live stats + table ----------
let lastStats = {};

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
    lastStats = { assigned, activeToday, delivered, earning };
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
    lastStats = { total: snap.size, pending, processing, completed, amountSum, commissionSum };
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

// ---------- Quick-action buttons (real Firestore data, no more demo alerts) ----------
function buildReportText() {
  const s = lastStats;
  if (TYPE === "delivery") {
    return "📊 আয়ের হিসাব\n\nঅ্যাসাইনড: " + (s.assigned || 0) +
      "\nচলমান (Picked/On the way): " + (s.activeToday || 0) +
      "\nডেলিভার্ড: " + (s.delivered || 0) +
      "\nমোট আয়: ৳" + (s.earning || 0);
  }
  if (TYPE === "dealer") {
    return "📊 বিক্রয় রিপোর্ট\n\nমোট অর্ডার: " + (s.total || 0) +
      "\nপেন্ডিং: " + (s.pending || 0) +
      "\nপ্রসেসিং: " + (s.processing || 0) +
      "\nমোট বিক্রয় মূল্য: ৳" + (s.amountSum || 0);
  }
  if (TYPE === "dropship") {
    return "📊 কমিশনের হিসাব\n\nপেন্ডিং: " + (s.pending || 0) +
      "\nপ্রসেসিং: " + (s.processing || 0) +
      "\nসম্পন্ন: " + (s.completed || 0) +
      "\nমোট কমিশন: ৳" + (s.commissionSum || 0);
  }
  if (TYPE === "stock") {
    return "📊 লাভের হিসাব\n\nসম্পন্ন বিক্রি: " + (s.completed || 0) +
      "\nচলমান (পেন্ডিং+প্রসেসিং): " + ((s.pending || 0) + (s.processing || 0)) +
      "\nমোট লাভের ভাগ: ৳" + (s.commissionSum || 0);
  }
  return "এখনো কোনো তথ্য নেই।";
}

window.quickAction = function (kind) {
  if (!auth.currentUser) {
    alert("এই তথ্য দেখতে আগে লগইন করুন।");
    return;
  }
  if (kind === "view") {
    const table = $("live-tbody");
    const panel = table ? table.closest("section") : null;
    if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (kind === "entry") {
    const form = $("entryForm");
    if (form) form.scrollIntoView({ behavior: "smooth", block: "center" });
  } else if (kind === "report") {
    alert(buildReportText());
  } else if (kind === "view-stock") {
    const table = $("stock-tbody");
    const panel = table ? table.closest("section") : null;
    if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (kind === "view-dealerapp") {
    const table = $("dealerapp-tbody");
    const panel = table ? table.closest("section") : null;
    if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

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
      if (TYPE === "stock") await loadStockItems(user.uid);
      if (TYPE === "dealer") await loadDealerApplications(user.uid);
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
wireStockForm();
wireDealerAppForm();
