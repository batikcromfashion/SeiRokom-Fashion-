import { db, collection, query, where, getDocs } from "./firebase-config.js";

async function trackOrder(orderIdInput) {
  const statusContainer = document.getElementById("tracking-result");
  if(!statusContainer) return;
  
  statusContainer.innerHTML = "<p>খুঁজছে...</p>";

  try {
    const q = query(collection(db, "orders"), where("orderId", "==", orderIdInput.trim()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      statusContainer.innerHTML = `<p style="color:red;">দুঃখিত! '${orderIdInput}' আইডি দিয়ে কোনো অর্ডার পাওয়া যায়নি।</p>`;
      return;
    }

    querySnapshot.forEach((doc) => {
      const order = doc.data();
      displayTrackingDetails(order);
    });
  } catch (error) {
    console.error("Tracking Error:", error);
    statusContainer.innerHTML = "<p style='color:red;'>অর্ডার ট্র্যাকিং এ সমস্যা হয়েছে।</p>";
  }
}

function displayTrackingDetails(order) {
  const statusContainer = document.getElementById("tracking-result");

  let html = `
    <div style="border:1px solid #ddd; padding:15px; border-radius:8px; background:#fff;">
      <h3>Order ID: ${order.orderId}</h3>
      <p><strong>Customer Name:</strong> ${order.customer.name}</p>
      <p><strong>Current Status:</strong> <span style="color:#c9a24a; font-weight:bold;">${order.status}</span></p>
      <hr>
      <h4>Order Summary:</h4>
      <ul>
  `;

  order.items.forEach(item => {
    html += `<li>${item.name} x ${item.quantity} - ৳${item.price * item.quantity}</li>`;
  });

  html += `
      </ul>
      <p><strong>Total:</strong> ৳${order.totalAmount}</p>
    </div>
  `;

  statusContainer.innerHTML = html;
}

window.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');
  if (orderId) {
    const inputEl = document.getElementById("order-id-input");
    if(inputEl) inputEl.value = orderId;
    trackOrder(orderId);
  }
});
