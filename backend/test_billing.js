const axios = require('axios');

async function testBilling() {
  try {
    const api = axios.create({ baseURL: 'http://localhost:5000/api', withCredentials: true });
    const loginRes = await api.post('/auth/login', { email: 'admin@company.com', password: 'admin123' });
    api.defaults.headers.common['Cookie'] = loginRes.headers['set-cookie'].join('; ');

    const items = await api.get('/items');
    let itemData = items.data.items || items.data.rows || items.data;
    if (itemData && !Array.isArray(itemData) && itemData.items) itemData = itemData.items; // Double check
    
    const targetItem = Array.isArray(itemData) ? itemData[0] : Object.values(itemData)[0];
    if (!targetItem) throw new Error("Could not extract target item");

    const payload = {
      customerName: "QA Customer",
      items: [{ name: targetItem.name, batch: targetItem.batch, qty: 1, rate: targetItem.mrp, amount: targetItem.mrp, gst: 12 }],
      subtotal: targetItem.mrp,
      gstAmount: 6,
      discount: 0,
      total: targetItem.mrp + 6,
      paymentMode: "cash",
      status: "paid"
    };

    const res = await api.post('/billing', payload);
    console.log("SUCCESS:", res.data.billNo || res.data);
  } catch (error) {
    console.error("FAILED:", error.response?.data || error.message);
  }
}
testBilling();
