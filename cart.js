/* SeiRokom Fashion — Cart Engine FIX
   Fixes:
   1) Now Buy no longer adds a duplicate item to the normal cart.
   2) Size/color options can be stored as separate metadata.
   3) Existing cart behaviour is preserved.
*/
(function () {
  const CART_KEY = "srf_cart";
  const BUY_NOW_KEY = "srf_buy_now";
  const COUPON_KEY = "srf_coupon";
  const ORDERS_KEY = "srf_my_orders";
  const WA_NUMBER = "8801645008919";

  const COUPONS = {
    SEIROKOM10: { type: "percent", value: 10, label: "১০% ছাড়" },
    FIRSTORDER: { type: "percent", value: 15, label: "প্রথম অর্ডারে ১৫% ছাড়" },
  };

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(Array.isArray(cart) ? cart : []));
    updateCartBadge();
  }

  function makeId(id, name) {
    return String(id || "") + "_" + String(name || "").replace(/\s+/g, "_");
  }

  function addToCart(id, name, price, qty, options) {
    qty = Math.max(1, Number(qty) || 1);
    price = Number(price) || 0;
    options = options || {};
    const uniqueId = makeId(id, name);
    const cart = getCart();
    const existing = cart.find(item => item.id === uniqueId);

    if (existing) {
      existing.qty = Number(existing.qty || 0) + qty;
      if (options.size) existing.size = options.size;
      if (options.color) existing.color = options.color;
    } else {
      cart.push({
        id: uniqueId,
        productId: id,
        name: name,
        price: price,
        qty: qty,
        size: options.size || "",
        color: options.color || ""
      });
    }
    saveCart(cart);
    showAddedToast(name);
  }

  /* IMPORTANT: Buy Now is temporary checkout state.
     It does NOT modify srf_cart or the cart badge. */
  function buyNow(id, name, price, qty, options) {
    qty = Math.max(1, Number(qty) || 1);
    price = Number(price) || 0;
    options = options || {};
    localStorage.setItem(BUY_NOW_KEY, JSON.stringify({
      id: makeId(id, name),
      productId: id,
      name: name,
      price: price,
      qty: qty,
      size: options.size || "",
      color: options.color || "",
      createdAt: Date.now()
    }));
    window.location.href = "checkout.html?buyNow=1";
  }

  function getBuyNow() {
    try {
      const raw = localStorage.getItem(BUY_NOW_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function clearBuyNow() {
    localStorage.removeItem(BUY_NOW_KEY);
  }

  function removeFromCart(id) {
    saveCart(getCart().filter(item => item.id !== id));
    if (typeof renderCartPage === "function") renderCartPage();
  }

  function updateQty(id, qty) {
    qty = parseInt(qty, 10);
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (item) {
      if (qty <= 0) saveCart(cart.filter(i => i.id !== id));
      else { item.qty = qty; saveCart(cart); }
    }
    if (typeof renderCartPage === "function") renderCartPage();
  }

  function clearCart() {
    saveCart([]);
    if (typeof renderCartPage === "function") renderCartPage();
  }

  function getCartTotal() {
    return getCart().reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
  }

  function getCartCount() {
    return getCart().reduce((sum, item) => sum + Number(item.qty || 0), 0);
  }

  function getAppliedCoupon() {
    try {
      const raw = localStorage.getItem(COUPON_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function applyCoupon(code) {
    code = (code || "").trim().toUpperCase();
    const coupon = COUPONS[code];
    if (!coupon) return { ok: false, message: "কুপন কোডটি সঠিক নয়।" };
    localStorage.setItem(COUPON_KEY, JSON.stringify({ code, ...coupon }));
    return { ok: true, message: "কুপন প্রয়োগ হয়েছে — " + coupon.label };
  }

  function removeCoupon() { localStorage.removeItem(COUPON_KEY); }

  function getDiscountAmount() {
    const coupon = getAppliedCoupon();
    if (!coupon) return 0;
    const subtotal = getCartTotal();
    if (coupon.type === "percent") return Math.round(subtotal * coupon.value / 100);
    if (coupon.type === "flat") return Math.min(coupon.value, subtotal);
    return 0;
  }

  function getFinalTotal() {
    return Math.max(0, getCartTotal() - getDiscountAmount());
  }

  function generateOrderId() {
    const d = new Date();
    const ymd = d.getFullYear().toString().slice(2) +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0");
    return "SRF-" + ymd + "-" + Math.floor(1000 + Math.random() * 9000);
  }

  function saveMyOrder(orderId) {
    try {
      const list = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
      list.unshift({ orderId, date: new Date().toISOString() });
      localStorage.setItem(ORDERS_KEY, JSON.stringify(list.slice(0, 10)));
    } catch (e) {}
  }

  function getMyOrders() {
    try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]"); }
    catch (e) { return []; }
  }

  function formatTaka(n) {
    return "৳ " + Number(n || 0).toLocaleString("en-US");
  }

  function updateCartBadge() {
    const count = getCartCount();
    document.querySelectorAll(".srf-cart-badge").forEach(el => {
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
        "border-radius:30px;font-size:.9rem;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,.4);" +
        "transition:opacity .3s;opacity:0;pointer-events:none;font-family:inherit;";
      document.body.appendChild(toast);
    }
    toast.textContent = "✓ " + name + " কার্টে যোগ হয়েছে";
    toast.style.opacity = "1";
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.style.opacity = "0", 1800);
  }

  function buildWhatsAppOrderText(customer, items) {
    items = items || getCart();
    const coupon = getAppliedCoupon();
    const subtotal = items.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 0), 0);
    const discount = coupon ? Math.round(subtotal * Number(coupon.value || 0) / 100) : 0;
    const total = Math.max(0, subtotal - discount);

    const lines = ["*নতুন অর্ডার - SeiRokom Fashion*"];
    if (customer) {
      lines.push("নাম: " + customer.name);
      lines.push("ফোন: " + customer.phone);
      lines.push("ঠিকানা: " + customer.address);
      if (customer.note) lines.push("নোট: " + customer.note);
    }
    lines.push("", "পণ্যসমূহ:");
    items.forEach((item, idx) => {
      let extra = "";
      if (item.size) extra += " | সাইজ: " + item.size;
      if (item.color) extra += " | রং: " + item.color;
      lines.push((idx + 1) + ". " + item.name + extra + " x" + item.qty +
        " = " + formatTaka(Number(item.price || 0) * Number(item.qty || 0)));
    });
    lines.push("", "সাবটোটাল: " + formatTaka(subtotal));
    if (coupon) lines.push("কুপন (" + coupon.code + "): -" + formatTaka(discount));
    lines.push("সর্বমোট: " + formatTaka(total));
    return lines.join("\n");
  }

  function sendOrderViaWhatsApp(customer, items) {
    const text = buildWhatsAppOrderText(customer, items);
    window.open("https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text), "_blank");
  }

  window.SRFCart = {
    getCart, saveCart, addToCart, buyNow, getBuyNow, clearBuyNow,
    removeFromCart, updateQty, clearCart, getCartTotal, getCartCount,
    applyCoupon, removeCoupon, getAppliedCoupon, getDiscountAmount,
    getFinalTotal, generateOrderId, saveMyOrder, getMyOrders, formatTaka,
    updateCartBadge, buildWhatsAppOrderText, sendOrderViaWhatsApp
  };
  window.addToCart = addToCart;
  window.buyNow = buyNow;
  document.addEventListener("DOMContentLoaded", updateCartBadge);
})();
