var SRFCart = {
  getCart: function() {
    return JSON.parse(localStorage.getItem('srf_cart') || '[]');
  },
  
  saveCart: function(cart) {
    localStorage.setItem('srf_cart', JSON.stringify(cart));
    this.updateBadges();
  },

  addToCart: function(id, name, price, qty, size, color) {
    var cart = this.getCart();
    var found = false;

    // একই প্রোডাক্ট, একই সাইজ এবং একই কালার হলে পরিমাণ (qty) বাড়ানো হবে
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id && cart[i].size === size && cart[i].color === color) {
        cart[i].qty += (qty || 1);
        found = true;
        break;
      }
    }

    if (!found) {
      cart.push({
        id: id,
        name: name,
        price: price,
        qty: qty || 1,
        size: size || '',
        color: color || ''
      });
    }

    this.saveCart(cart);
    alert('পণ্যটি সফলভাবে কার্টে যোগ করা হয়েছে!');
  },

  buyNow: function(id, name, price, qty, size, color) {
    var item = {
      id: id,
      name: name,
      price: price,
      qty: qty || 1,
      size: size || '',
      color: color || ''
    };
    localStorage.setItem('srf_buynow', JSON.stringify(item));
    window.location.href = 'checkout.html?buyNow=1';
  },

  getBuyNow: function() {
    return JSON.parse(localStorage.getItem('srf_buynow') || 'null');
  },

  clearBuyNow: function() {
    localStorage.removeItem('srf_buynow');
  },

  clearCart: function() {
    localStorage.removeItem('srf_cart');
    this.updateBadges();
  },

  formatTaka: function(amount) {
    return '৳ ' + Number(amount).toLocaleString('bn-BD');
  },

  updateBadges: function() {
    var cart = this.getCart();
    var count = cart.reduce(function(acc, item) { return acc + item.qty; }, 0);
    document.querySelectorAll('.srf-cart-badge').forEach(function(el) {
      el.textContent = count;
      el.style.display = count > 0 ? 'inline-flex' : 'none';
    });
  },

  buildWhatsAppOrderText: function(customer, items) {
    var text = "👤 *কাস্টমার তথ্য:*\n";
    text += "নাম: " + customer.name + "\n";
    text += "মোবাইল: " + customer.phone + "\n";
    text += "ঠিকানা: " + customer.address + "\n";
    if (customer.note) {
      text += "নোট: " + customer.note + "\n";
    }
    text += "\n🛍️ *অর্ডারকৃত পণ্য:*\n";
    
    var grandTotal = 0;
    items.forEach(function(item, index) {
      var itemTotal = item.price * item.qty;
      grandTotal += itemTotal;
      
      var options = [];
      if (item.size) options.push("সাইজ: " + item.size);
      if (item.color) options.push("রং: " + item.color);
      var optionStr = options.length > 0 ? " (" + options.join(", ") + ")" : "";

      text += (index + 1) + ". " + item.name + optionStr + " - " + item.qty + "টি x ৳" + item.price + " = ৳" + itemTotal + "\n";
    });

    text += "\n💰 *সর্বমোট মূল্য:* ৳" + grandTotal + "\n";
    return text;
  },

  saveMyOrder: function(orderId) {
    var orders = JSON.parse(localStorage.getItem('srf_my_orders') || '[]');
    orders.unshift({ id: orderId, date: new Date().toISOString() });
    localStorage.setItem('srf_my_orders', JSON.stringify(orders));
  },

  removeCoupon: function() {
    localStorage.removeItem('srf_coupon');
  }
};

document.addEventListener('DOMContentLoaded', function() {
  if (typeof SRFCart !== 'undefined') {
    SRFCart.updateBadges();
  }
});
