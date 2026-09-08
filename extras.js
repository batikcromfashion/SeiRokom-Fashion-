/* SeiRokom Fashion - Wishlist + Size Guide
   Wishlist uses localStorage key "srf_wishlist" -> array of { id, name, price }
   Size Guide renders a modal with a static chart + a simple height/weight calculator.
*/
(function () {
  const WISH_KEY = "srf_wishlist";

  function getWishlist() {
    try {
      const raw = localStorage.getItem(WISH_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveWishlist(list) {
    localStorage.setItem(WISH_KEY, JSON.stringify(list));
    updateWishlistBadge();
    updateHeartStates();
  }

  function isInWishlist(id) {
    return getWishlist().some((item) => item.id === id);
  }

  function toggleWishlist(id, name, price) {
    let list = getWishlist();
    if (list.some((item) => item.id === id)) {
      list = list.filter((item) => item.id !== id);
    } else {
      list.push({ id: id, name: name, price: Number(price) || 0 });
    }
    saveWishlist(list);
  }

  function removeFromWishlist(id) {
    const list = getWishlist().filter((item) => item.id !== id);
    saveWishlist(list);
    if (typeof renderWishlistPage === "function") renderWishlistPage();
  }

  function updateWishlistBadge() {
    const count = getWishlist().length;
    document.querySelectorAll(".srf-wish-badge").forEach((el) => {
      el.textContent = count;
      el.style.display = count > 0 ? "flex" : "none";
    });
  }

  function updateHeartStates() {
    document.querySelectorAll("[data-wishlist-id]").forEach((el) => {
      const id = el.getAttribute("data-wishlist-id");
      if (isInWishlist(id)) {
        el.classList.add("active");
        el.textContent = "♥";
      } else {
        el.classList.remove("active");
        el.textContent = "♡";
      }
    });
  }

  window.SRFWishlist = {
    getWishlist,
    saveWishlist,
    isInWishlist,
    toggleWishlist,
    removeFromWishlist,
    updateWishlistBadge,
    updateHeartStates,
  };
  window.toggleWishlist = toggleWishlist;

  /* ---------------- Size Guide ---------------- */

  const sizeCharts = {
    men: {
      label: "পুরুষদের সাইজ চার্ট",
      rows: [
        ["S", "36", "78-83", "68-73"],
        ["M", "38-40", "84-92", "74-82"],
        ["L", "42", "93-99", "83-89"],
        ["XL", "44", "100-106", "90-96"],
        ["XXL", "46", "107-113", "97-103"],
      ],
    },
    women: {
      label: "মহিলাদের সাইজ চার্ট",
      rows: [
        ["S", "34", "78-82", "60-64"],
        ["M", "36", "83-87", "65-69"],
        ["L", "38", "88-93", "70-75"],
        ["XL", "40", "94-99", "76-81"],
        ["XXL", "42", "100-105", "82-87"],
      ],
    },
    kids: {
      label: "শিশুদের সাইজ চার্ট (বয়স অনুযায়ী)",
      rows: [
        ["2-3 বছর", "-", "50-52", "48-50"],
        ["4-5 বছর", "-", "54-56", "51-53"],
        ["6-7 বছর", "-", "58-60", "54-56"],
        ["8-9 বছর", "-", "62-64", "57-59"],
        ["10-12 বছর", "-", "66-70", "60-63"],
      ],
    },
  };

  function suggestAdultSize(heightCm, weightKg) {
    const bmi = weightKg / Math.pow(heightCm / 100, 2);
    if (heightCm < 160 || bmi < 18) return "S";
    if (heightCm < 170 || bmi < 23) return "M";
    if (heightCm < 178 || bmi < 27) return "L";
    if (heightCm < 185 || bmi < 31) return "XL";
    return "XXL";
  }

  function buildModal() {
    if (document.getElementById("srf-sizeguide-modal")) return;
    const overlay = document.createElement("div");
    overlay.id = "srf-sizeguide-modal";
    overlay.style.cssText =
      "display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:10000;" +
      "align-items:center;justify-content:center;padding:20px;font-family:'Hind Siliguri',sans-serif;";
    overlay.innerHTML =
      '<div style="background:#161616;border:1px solid rgba(201,162,74,0.35);border-radius:14px;max-width:480px;width:100%;max-height:85vh;overflow-y:auto;padding:22px;color:#faf8f4;position:relative;">' +
        '<button id="srf-sg-close" style="position:absolute;top:14px;right:14px;background:none;border:none;color:#a8a196;font-size:1.3rem;cursor:pointer;">×</button>' +
        '<h2 style="color:#e9cd8b;font-size:1.2rem;margin:0 0 14px;">📏 সাইজ গাইড</h2>' +
        '<div id="srf-sg-tabs" style="display:flex;gap:8px;margin-bottom:16px;"></div>' +
        '<div id="srf-sg-chart"></div>' +
        '<div style="margin-top:20px;border-top:1px solid rgba(255,255,255,0.1);padding-top:16px;">' +
          '<h3 style="color:#e9cd8b;font-size:0.95rem;margin:0 0 10px;">আপনার সাইজ বের করুন</h3>' +
          '<label style="font-size:0.82rem;color:#cfc9bd;">উচ্চতা (সেমি)</label>' +
          '<input id="srf-sg-height" type="number" placeholder="যেমন: 170" style="width:100%;padding:9px 12px;margin:6px 0 10px;border-radius:8px;border:1px solid rgba(201,162,74,0.3);background:#0d0d0d;color:#faf8f4;">' +
          '<label style="font-size:0.82rem;color:#cfc9bd;">ওজন (কেজি)</label>' +
          '<input id="srf-sg-weight" type="number" placeholder="যেমন: 65" style="width:100%;padding:9px 12px;margin:6px 0 12px;border-radius:8px;border:1px solid rgba(201,162,74,0.3);background:#0d0d0d;color:#faf8f4;">' +
          '<button id="srf-sg-calc" style="width:100%;padding:11px;border-radius:24px;border:none;background:linear-gradient(135deg,#c9a24a,#e9cd8b);color:#0d0d0d;font-weight:700;cursor:pointer;">সাইজ দেখুন</button>' +
          '<div id="srf-sg-result" style="margin-top:12px;text-align:center;font-size:1rem;color:#e9cd8b;font-weight:600;"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    document.getElementById("srf-sg-close").addEventListener("click", closeSizeGuide);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeSizeGuide();
    });

    document.getElementById("srf-sg-calc").addEventListener("click", function () {
      const h = parseFloat(document.getElementById("srf-sg-height").value);
      const w = parseFloat(document.getElementById("srf-sg-weight").value);
      const resultEl = document.getElementById("srf-sg-result");
      if (!h || !w) {
        resultEl.textContent = "অনুগ্রহ করে উচ্চতা ও ওজন দিন।";
        return;
      }
      const size = suggestAdultSize(h, w);
      resultEl.textContent = "আপনার জন্য সম্ভবত " + size + " সাইজ উপযুক্ত।";
    });

    const tabs = ["men", "women", "kids"];
    const tabLabels = { men: "পুরুষ", women: "মহিলা", kids: "শিশু" };
    const tabsEl = document.getElementById("srf-sg-tabs");
    tabs.forEach(function (key) {
      const btn = document.createElement("button");
      btn.textContent = tabLabels[key];
      btn.dataset.tab = key;
      btn.style.cssText =
        "flex:1;padding:8px;border-radius:20px;border:1px solid rgba(201,162,74,0.4);background:transparent;color:#e9cd8b;cursor:pointer;font-size:0.85rem;font-family:inherit;";
      btn.addEventListener("click", function () {
        renderChart(key);
      });
      tabsEl.appendChild(btn);
    });
  }

  function renderChart(category) {
    const chart = sizeCharts[category];
    const chartEl = document.getElementById("srf-sg-chart");
    if (!chart) return;
    let rowsHtml = chart.rows
      .map(
        (r) =>
          "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td><td>" + r[2] + "</td><td>" + r[3] + "</td></tr>"
      )
      .join("");
    chartEl.innerHTML =
      '<div style="font-size:0.85rem;color:#cfc9bd;margin-bottom:8px;">' + chart.label + "</div>" +
      '<table style="width:100%;border-collapse:collapse;font-size:0.82rem;">' +
      '<thead><tr style="color:#e9cd8b;border-bottom:1px solid rgba(201,162,74,0.3);">' +
      "<th style=\"text-align:left;padding:6px 4px;\">সাইজ</th><th style=\"text-align:left;padding:6px 4px;\">ইঞ্চি</th><th style=\"text-align:left;padding:6px 4px;\">বুক(সেমি)</th><th style=\"text-align:left;padding:6px 4px;\">কোমর(সেমি)</th></tr></thead>" +
      "<tbody>" + rowsHtml + "</tbody></table>";
  }

  window.openSizeGuide = function (category) {
    buildModal();
    document.getElementById("srf-sizeguide-modal").style.display = "flex";
    renderChart(category || "men");
  };

  window.closeSizeGuide = function () {
    const modal = document.getElementById("srf-sizeguide-modal");
    if (modal) modal.style.display = "none";
  };
  var closeSizeGuide = window.closeSizeGuide;

  document.addEventListener("DOMContentLoaded", function () {
    updateWishlistBadge();
    updateHeartStates();
  });
})();
