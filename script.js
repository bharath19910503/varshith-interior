// ===== Helper Functions =====
function formatNumber(num) {
  return Number(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function amountInWords(amount) {
  // simple number to words function for demo
  const words = require('number-to-words');
  return words.toWords(amount) + " only";
}

// ===== Invoice Storage =====
let invoices = JSON.parse(localStorage.getItem('invoices') || "[]");

// ===== Invoice Item Table =====
const invoiceTableBody = document.querySelector("#invoiceTable tbody");
const addRowBtn = document.getElementById("addRowBtn");
const clearRowsBtn = document.getElementById("clearRowsBtn");
const gstPercentInput = document.getElementById("gstPercent");

function calculateTotals() {
  let total = 0;
  Array.from(invoiceTableBody.rows).forEach(row => {
    const qty = parseFloat(row.querySelector(".qty").value) || 0;
    const price = parseFloat(row.querySelector(".unitPrice").value) || 0;
    const amt = qty * price;
    row.querySelector(".amount").value = formatNumber(amt);
    total += amt;
  });

  const gstPercent = parseFloat(gstPercentInput.value) || 0;
  const gstAmount = total * gstPercent / 100;
  const finalCost = total + gstAmount;

  document.getElementById("totalCost").textContent = formatNumber(total);
  document.getElementById("gstAmount").textContent = formatNumber(gstAmount);
  document.getElementById("finalCost").textContent = formatNumber(finalCost);

  return { total, gstAmount, finalCost };
}

function addInvoiceRow(item = '', material = '', qty=1, price=0) {
  const row = invoiceTableBody.insertRow();
  row.innerHTML = `
    <td><input type="text" class="item" value="${item}"></td>
    <td><input type="text" class="material" value="${material}"></td>
    <td><input type="number" class="qty" value="${qty}" min="0"></td>
    <td><input type="number" class="unitPrice" value="${price}" min="0"></td>
    <td><input type="text" class="amount" value="0.00" readonly></td>
    <td><button class="deleteBtn">Delete</button></td>
  `;
  row.querySelector(".qty").addEventListener('input', calculateTotals);
  row.querySelector(".unitPrice").addEventListener('input', calculateTotals);
  row.querySelector(".deleteBtn").addEventListener('click', () => {
    row.remove();
    calculateTotals();
  });
}

addRowBtn.addEventListener('click', () => addInvoiceRow());
clearRowsBtn.addEventListener('click', () => {
  invoiceTableBody.innerHTML = '';
  document.getElementById("clientName").value = '';
  document.getElementById("clientGST").value = '';
  document.getElementById("invoiceNumber").value = '';
  document.getElementById("invoiceDate").value = '';
  document.getElementById("companyGST").value = '';
  document.getElementById("totalCost").textContent = '0.00';
  document.getElementById("gstAmount").textContent = '0.00';
  document.getElementById("finalCost").textContent = '0.00';
});

invoiceTableBody.addEventListener('input', calculateTotals);

// ===== 2D → 3D Designer =====
const upload2D = document.getElementById("upload2D");
const designList = document.getElementById("designList");
let uploadedDesigns = [];

upload2D.addEventListener('change', (e) => {
  Array.from(e.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function(event) {
      const design = { name: file.name, data: event.target.result, snapshot: null };
      uploadedDesigns.push(design);
      renderDesignList();
    };
    reader.readAsDataURL(file);
  });
});

function renderDesignList() {
  designList.innerHTML = '';
  uploadedDesigns.forEach((design, idx) => {
    const div = document.createElement('div');
    div.className = 'design-item';
    div.innerHTML = `
      <img class="design-thumb" src="${design.data}">
      <div class="design-info">
        <input type="text" class="design-name" value="${design.name}">
      </div>
      <div class="design-controls">
        <button data-idx="${idx}" class="generate3DBtn">Generate 3D</button>
      </div>
    `;
    designList.appendChild(div);
  });

  document.querySelectorAll(".generate3DBtn").forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.getAttribute("data-idx");
      generate3DDesign(idx);
    });
  });
}

function generate3DDesign(idx) {
  // Simple snapshot: we will just store original 2D image for PDF
  uploadedDesigns[idx].snapshot = uploadedDesigns[idx].data;
  alert(`3D for ${uploadedDesigns[idx].name} generated (snapshot stored).`);
}

// ===== Save/Recover Invoices =====
const invoiceNumberInput = document.getElementById("invoiceNumber");
const clientNameInput = document.getElementById("clientName");
const invoiceDateInput = document.getElementById("invoiceDate");
const clientGSTInput = document.getElementById("clientGST");
const companyGSTInput = document.getElementById("companyGST");

function saveInvoice() {
  const invNo = invoiceNumberInput.value.trim();
  if(!invNo) { alert("Invoice number required"); return; }
  if(invoices.some(inv => inv.invoiceNumber === invNo)) { alert("Duplicate invoice number"); return; }

  const invoice = {
    invoiceNumber: invNo,
    clientName: clientNameInput.value,
    clientGST: clientGSTInput.value,
    companyGST: companyGSTInput.value,
    date: invoiceDateInput.value,
    items: Array.from(invoiceTableBody.rows).map(row => ({
      item: row.querySelector(".item").value,
      material: row.querySelector(".material").value,
      qty: row.querySelector(".qty").value,
      unitPrice: row.querySelector(".unitPrice").value,
      amount: row.querySelector(".amount").value
    })),
    gstPercent: gstPercentInput.value,
    totals: calculateTotals(),
    note: document.getElementById("note").value,
    designs: uploadedDesigns.map(d => ({ name: d.name, snapshot: d.snapshot }))
  };
  invoices.push(invoice);
  localStorage.setItem('invoices', JSON.stringify(invoices));
  alert("Invoice saved!");
}

// ===== PDF Generation =====
document.getElementById("generatePDFBtn").addEventListener('click', () => {
  const { total, gstAmount, finalCost } = calculateTotals();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p','pt','a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(46,125,50);
  doc.rect(0,0,pageWidth,60,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(16);
  doc.text("Varshith Interior Solutions", 40, 25);
  doc.setFontSize(10);
  doc.text("NO 39 BRN Ashish Layout, Near Sri Thimmaraya Swami Gudi, Anekal - 562106", 40, 40);
  doc.text(`Phone: +91 9916511599 & +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com`, 40, 52);

  // Watermark
  doc.setTextColor(150,150,150);
  doc.setFontSize(60);
  doc.text("Varshith Interior Solutions", pageWidth/2, pageHeight/2, { align: "center", angle:45 });

  // Invoice Info
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text(`Invoice Number: ${invoiceNumberInput.value}`, 40, 80);
  doc.text(`Invoice Date: ${invoiceDateInput.value}`, 40, 95);
  doc.text(`Client Name: ${clientNameInput.value}`, 40, 110);
  doc.text(`Client GST: ${clientGSTInput.value}`, 40, 125);

  // Table
  doc.autoTable({
    startY: 140,
    head: [['Item','Material Used','Qty','Unit Price','Amount']],
    body: Array.from(invoiceTableBody.rows).map(row => [
      row.querySelector(".item").value,
      row.querySelector(".material").value,
      row.querySelector(".qty").value,
      row.querySelector(".unitPrice").value,
      row.querySelector(".amount").value
    ]),
    theme: 'grid',
    headStyles: { fillColor: [46,125,50], textColor: 255 },
    footStyles: { fillColor: [46,125,50], textColor: 255 },
    didDrawPage: (data) => {
      const str = `Page ${doc.internal.getCurrentPageInfo().pageNumber}`;
      doc.setFontSize(10);
      doc.text(str, pageWidth-50, pageHeight-10);
      // Footer
      doc.setFillColor(46,125,50);
      doc.rect(0,pageHeight-50,pageWidth,50,'F');
      doc.setTextColor(255);
      doc.text(`Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106`, 40, pageHeight-35);
      doc.text(`Phone: +91 9916511599 & +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com | GST: ${companyGSTInput.value}`, 40, pageHeight-20);
    }
  });

  // Summary
  let finalY = doc.lastAutoTable.finalY + 20;
  doc.text(`Total Cost: ${formatNumber(total)}`, 40, finalY);
  doc.text(`GST Amount: ${formatNumber(gstAmount)}`, 40, finalY+15);
  doc.text(`Final Cost: ${formatNumber(finalCost)}`, 40, finalY+30);
  doc.text(`Amount in Words: ${amountInWords(finalCost)}`, 40, finalY+45);
  doc.text(document.getElementById("note").value, 40, finalY+65);

  // 2D → 3D Designs
  let designY = finalY+90;
  uploadedDesigns.forEach(d => {
    if(d.snapshot) doc.addImage(d.snapshot,'JPEG', 40, designY, 100, 75);
    doc.text(d.name, 150, designY+40);
    designY += 90;
    if(designY > pageHeight-100) doc.addPage(), designY = 40;
  });

  doc.save(`Invoice-${invoiceNumberInput.value}.pdf`);
});

// Export / Import JSON
document.getElementById("exportJsonBtn").addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(invoices,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "invoices.json";
  a.click();
});

document.getElementById("importJsonBtn").addEventListener('click', () => {
  document.getElementById("importJsonFile").click();
});

document.getElementById("importJsonFile").addEventListener('change', (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function(event){
    invoices = JSON.parse(event.target.result);
    localStorage.setItem('invoices', JSON.stringify(invoices));
    alert("Invoices imported!");
  }
  reader.readAsText(file);
});

// ===== Search / Recover =====
function renderSearchResults(results) {
  const div = document.getElementById("searchResults");
  div.innerHTML = '';
  results.forEach(inv => {
    const btn = document.createElement('button');
    btn.textContent = `Invoice: ${inv.invoiceNumber} (${inv.date})`;
    btn.addEventListener('click', () => loadInvoice(inv.invoiceNumber));
    div.appendChild(btn);
  });
}

document.getElementById("searchByInvoice").addEventListener('click', () => {
  const invNo = document.getElementById("searchInvoiceNumber").value.trim();
  const results = invoices.filter(i => i.invoiceNumber === invNo);
  renderSearchResults(results);
});

document.getElementById("searchByClient").addEventListener('click', () => {
  const name = document.getElementById("searchClientName").value.trim().toLowerCase();
  const results = invoices.filter(i => i.clientName.toLowerCase().includes(name));
  renderSearchResults(results);
});

document.getElementById("searchByDate").addEventListener('click', () => {
  const date = document.getElementById("searchDate").value;
  const results = invoices.filter(i => i.date === date);
  renderSearchResults(results);
});

function loadInvoice(invNo) {
  const inv = invoices.find(i => i.invoiceNumber === invNo);
  if(!inv) return alert("Invoice not found");
  invoiceNumberInput.value = inv.invoiceNumber;
  clientNameInput.value = inv.clientName;
  clientGSTInput.value = inv.clientGST;
  companyGSTInput.value = inv.companyGST;
  invoiceDateInput.value = inv.date;
  gstPercentInput.value = inv.gstPercent;
  invoiceTableBody.innerHTML = '';
  inv.items.forEach(it => addInvoiceRow(it.item,it.material,it.qty,it.unitPrice));
  uploadedDesigns = inv.designs.map(d => ({ name: d.name, data: d.snapshot, snapshot: d.snapshot }));
  renderDesignList();
  document.getElementById("note").value = inv.note;
  calculateTotals();
}
