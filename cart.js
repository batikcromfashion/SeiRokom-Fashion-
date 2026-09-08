/* SeiRokom Fashion - Shared Cart Engine
   localStorage-based cart used across all pages (mens/womens/kids/new-collection/cart/checkout).
   Key: "srf_cart" -> array of { id, name, price, qty }
*/
(function () {
  const CART_KEY = "srf_cart";
  const COUPON_KEY = "srf_coupon";
  const ORDERS_KEY = "srf_my_orders";
  const WA_NUMBER = "8801645008919";

  // Valid coupons — edit here to add/remove/change discounts
  const COUPONS = {
    SEIROKOM10: { type: "percent", value: 10, label: "১০% ছাড়" },
    FIRSTORDER: { type: "percent", value: 15, label: "প্রথম অর্ডারে ১৫% ছাড়" },
  };

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }

  function addToCart(id, name, price, qty) {
    qty = qty || 1;
    price = Number(price) || 0;
    const cart = getCart();
    const existing = cart.find((item) => item.id === id);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ id: id, name: name, price: price, qty: qty });
    }
    saveCart(cart);
    showAddedToast(name);
  }

  function buyNow(id, name, price, qty) {
    qty = qty || 1;
    price = Number(price) || 0;
    saveCart([{ id: id, name: name, price: price, qty: qty }]);
    window.location.href = "checkout.html";
  }

  function removeFromCart(id) {
    let cart = getCart();
    cart = cart.filter((item) => item.id !== id);
    saveCart(cart);
    if (typeof renderCartPage === "function") renderCartPage();
  }

  function updateQty(id, qty) {
    qty = parseInt(qty, 10);
    let cart = getCart();
    const item = cart.find((i) => i.id === id);
    if (item) {
      if (qty <= 0) {
        cart = cart.filter((i) => i.id !== id);
      } else {
        item.qty = qty;
      }
    }
    saveCart(cart);
    if (typeof renderCartPage === "function") renderCartPage();
  }

  function clearCart() {
    saveCart([]);
    if (typeof renderCartPage === "function") renderCartPage();
  }

  function getCartTotal() {
    return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function getCartCount() {
    return getCart().reduce((sum, item) => sum + item.qty, 0);
  }

  function getAppliedCoupon() {
    try {
      const raw = localStorage.getItem(COUPON_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function applyCoupon(code) {
    code = (code || "").trim().toUpperCase();
    const coupon = COUPONS[code];
    if (!coupon) {
      return { ok: false, message: "কুপন কোডটি সঠিক নয়।" };
    }
    localStorage.setItem(COUPON_KEY, JSON.stringify({ code: code, ...coupon }));
    return { ok: true, message: "কুপন প্রয়োগ হয়েছে — " + coupon.label };
  }

  function removeCoupon() {
    localStorage.removeItem(COUPON_KEY);
  }

  function getDiscountAmount() {
    const coupon = getAppliedCoupon();
    if (!coupon) return 0;
    const subtotal = getCartTotal();
    if (coupon.type === "percent") {
      return Math.round((subtotal * coupon.value) / 100);
    }
    if (coupon.type === "flat") {
      return Math.min(coupon.value, subtotal);
    }
    return 0;
  }

  function getFinalTotal() {
    return Math.max(0, getCartTotal() - getDiscountAmount());
  }

  function generateOrderId() {
    const d = new Date();
    const ymd =
      d.getFullYear().toString().slice(2) +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return "SRF-" + ymd + "-" + rand;
  }

  function saveMyOrder(orderId) {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift({ orderId: orderId, date: new Date().toISOString() });
      localStorage.setItem(ORDERS_KEY, JSON.stringify(list.slice(0, 10)));
    } catch (e) {}
  }

  function getMyOrders() {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function formatTaka(n) {
    return "৳ " + Number(n).toLocaleString("en-US");
  }

  function updateCartBadge() {
    const count = getCartCount();
    document.querySelectorAll(".srf-cart-badge").forEach((el) => {
      el.textContent = count;
      el.style.display = count > 0 ? "flex" : "none";
    });
  }

  function showAddedToast(name) {
    let toast = document.getElementById("srf-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "srf-toast";
      toast.style.cssText =
        "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);" +
        "background:#111;color:#e9cd8b;border:1px solid #c9a24a;padding:12px 20px;" +
        "border-radius:30px;font-size:0.9rem;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.4);" +
        "transition:opacity 0.3s;opacity:0;pointer-events:none;font-family:inherit;";
      document.body.appendChild(toast);
    }
    toast.textContent = "✓ " + name + " কার্টে যোগ হয়েছে";
    toast.style.opacity = "1";
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
      toast.style.opacity = "0";
    }, 1800);
  }

  function buildWhatsAppOrderText(customer) {
    const cart = getCart();
    const coupon = getAppliedCoupon();
    let lines = [];
    lines.push("*নতুন অর্ডার - SeiRokom Fashion*");
    if (customer) {
      lines.push("নাম: " + customer.name);
      lines.push("ফোন: " + customer.phone);
      lines.push("ঠিকানা: " + customer.address);
      if (customer.note) lines.push("নোট: " + customer.note);
    }
    lines.push("");
    lines.push("পণ্যসমূহ:");
    cart.forEach((item, idx) => {
      lines.push(
        (idx + 1) + ". " + item.name + " x" + item.qty + " = " + formatTaka(item.price * item.qty)
      );
    });
    lines.push("");
    lines.push("সাবটোটাল: " + formatTaka(getCartTotal()));
    if (coupon) {
      lines.push("কুপন (" + coupon.code + "): -" + formatTaka(getDiscountAmount()));
    }
    lines.push("সর্বমোট: " + formatTaka(getFinalTotal()));
    lines.push("পেমেন্ট: ক্যাশ অন ডেলিভারি (COD)");
    return lines.join("\n");
  }

  function sendOrderViaWhatsApp(customer) {
    const text = buildWhatsAppOrderText(customer);
    const url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text);
    window.open(url, "_blank");
  }

  // Expose globally
  window.SRFCart = {
    getCart,
    saveCart,
    addToCart,
    buyNow,
    removeFromCart,
    updateQty,
    clearCart,
    getCartTotal,
    getCartCount,
    applyCoupon,
    removeCoupon,
    getAppliedCoupon,
    getDiscountAmount,
    getFinalTotal,
    generateOrderId,
    saveMyOrder,
    getMyOrders,
    formatTaka,
    updateCartBadge,
    buildWhatsAppOrderText,
    sendOrderViaWhatsApp,
  };
  // Back-compat global function name used inline in product cards
  window.addToCart = addToCart;
  window.buyNow = buyNow;

  document.addEventListener("DOMContentLoaded", updateCartBadge);
})();
