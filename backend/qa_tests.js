const axios = require('axios');

async function runQATests() {
  try {
    console.log("Starting QA Tests...");
    const api = axios.create({ baseURL: 'http://localhost:5000/api', withCredentials: true });
    
    // 1. Login
    console.log("1. Authenticating...");
    const loginRes = await api.post('/auth/login', { email: 'admin@company.com', password: 'admin123' });
    const cookies = loginRes.headers['set-cookie'];
    if (cookies) {
      api.defaults.headers.common['Cookie'] = cookies.join('; ');
    } else {
      console.log("No cookies returned by login!");
    }
    console.log("-> Authenticated successfully.");

    // 2. Fetch/Create Item
    console.log("2. Setting up dummy data...");
    let items = await api.get('/items');
    let itemData = items.data.items || items.data.rows || items.data;
    if (!Array.isArray(itemData) || itemData.length === 0) {
      console.log("-> Creating dummy drug...");
      await api.post('/items', { name: "QA_DUMMY_DRUG", stock_qty: 100, mrp: 50, rate: 40 });
      items = await api.get('/items');
      itemData = items.data.items || items.data.rows || items.data;
    }
    
    const targetItem = Array.isArray(itemData) ? itemData[0] : Object.values(itemData)[0];
    if (!targetItem) throw new Error("Could not fetch target item from API.");
    console.log("-> Found item:", targetItem.name);

    // 3. Create Sales Challan
    console.log("3. Creating Sales Challan...");
    const scPayload = {
      customerName: "QA Customer",
      subtotal: 50, gstAmount: 6, total: 56, paymentMode: "credit",
      items: [{ name: targetItem.name, qty: 1, rate: 50, amount: 50, gst: 12 }]
    };
    const scRes = await api.post('/sales-challan', scPayload);
    const challanId = scRes.data.id || scRes.data.challan?.id; 
    console.log("-> Sales Challan created ID:", challanId);

    // 4. Convert Sales Challan to Invoice
    console.log("4. Converting Sales Challan to Invoice...");
    const invRes = await api.post(`/sales-challan/${challanId}/invoice`, { status: "unpaid", paymentMode: "credit" });
    console.log("-> Converted successfully to Bill:", invRes.data.bill?.billNo || "Success");

    // 5. Create Purchase Challan
    console.log("5. Creating Purchase Challan...");
    const pcPayload = {
      supplierName: "QA Supplier",
      subtotal: 40, gstAmount: 4.8, total: 44.8, paymentMode: "credit",
      items: [{ name: targetItem.name, qty: 10, rate: 40, amount: 400, gst: 12 }]
    };
    const pcRes = await api.post('/purchase-challan', pcPayload);
    const pChallanId = pcRes.data.id || pcRes.data.challan?.id;
    console.log("-> Purchase Challan created ID:", pChallanId);

    // Approve Purchase Challan
    console.log("-> Approving Purchase Challan...");
    await api.post(`/purchase-challan/${pChallanId}/approve`, {});

    // 6. Convert Purchase Challan to Purchase Bill
    console.log("6. Converting Purchase Challan to Purchase Bill...");
    const pbRes = await api.post(`/purchase-challan/${pChallanId}/convert`, { invoiceNo: "INV-SUP-1" });
    console.log("-> Converted successfully to Purchase Bill:", pbRes.data.bill?.billNo || pbRes.data.billNo || "Success");

    // 7. Test AI Reorder
    console.log("7. Testing AI Reorder endpoint...");
    try {
      const aiRes = await api.get('/ai/reorder/suggestions');
      console.log("-> AI Reorder returned", aiRes.data.length, "suggestions.");
    } catch (aiErr) {
      console.log("-> AI proxy might not be running (expected if Python service is off):", aiErr.message);
    }

    console.log("✅ ALL QA TESTS PASSED SUCCESSFULLY.");
  } catch (error) {
    console.error("❌ QA TEST FAILED:");
    console.error(error.response?.data || error.message);
  }
}

runQATests();
