import { db, collection, addDoc, serverTimestamp } from "./firebase-config.js";

function generateOrderId() {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `SRF-${randomNum}`;
}

export async function processOrder(customerData, cartItems, totalAmount, paymentMethod) {
  const orderId = generateOrderId();
  
  const orderPayload = {
    orderId: orderId,
    customer: {
      name: customerData.name,
      phone: customerData.phone,
      address: customerData.address,
      note: customerData.note || ""
    },
    items: cartItems,
    totalAmount: totalAmount,
    paymentMethod: paymentMethod,
    status: "Pending",
    createdAt: serverTimestamp()
  };

  try {
    const docRef = await addDoc(collection(db, "orders"), orderPayload);
    localStorage.removeItem("cart");
    window.location.href = `order-tracking.html?id=${orderId}`;
    return { success: true, orderId: orderId };
  } catch (error) {
    console.error("Error adding order: ", error);
    alert("অর্ডার সম্পন্ন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    return { success: false, error };
  }
}
