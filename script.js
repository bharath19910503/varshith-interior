// Utility function to format amount with commas
function formatAmount(value) {
    return Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Convert number to words
function numberToWords(amount) {
    const words = require('number-to-words'); // We'll use number-to-words library
    return words.toWords(amount) + " only";
}

// Store invoice data in localStorage
function saveInvoice(data) {
    const invoices = JSON.parse(localStorage.getItem('invoices') || '{}');
    if (invoices[data.invoiceNumber]) {
        alert("Duplicate invoice number not allowed!");
        return false;
    }
    invoices[data.invoiceNumber] = data;
    localStorage.setItem('invoices', JSON.stringify(invoices));
    return true;
}

// Load invoice by number
function loadInvoiceByNumber(invoiceNumber) {
    const invoices = JSON.parse(localStorage.getItem('invoices') || '{}');
    return invoices[invoiceNumber] || null;
}

// Load invoices by client name
function loadInvoiceByClientName(clientName) {
    const invoices = JSON.parse(localStorage.getItem('invoices') || '{}');
    return Object.values(invoices).filter(inv => inv.clientName.toLowerCase() === clientName.toLowerCase());
}

// Load invoices by date
function loadInvoiceByDate(date) {
    const invoices = JSON.parse(localStorage.getItem('invoices') || '{}');
    return Object.values(invoices).filter(inv => inv.invoiceDate === date);
}

// Globals
let invoiceItems = [];
let uploadedDesigns = [];

// DOM Elements
const tableBody = document.querySelector("#invoiceTable tbody");
const totalCostEl = document.getElementById("totalCost");
const gstAmountEl = document.getElementById("gstAmount");
const finalCostEl = document.getElementById("finalCost");
const clientGSTInput = document.getElementById("clientGST");
const ourGSTInput = document.getElementById("ourGST");

// Add new item row
document.getElementById("addRowBtn").addEventListener("click", () => {
    const row = { item: '', material: '', qty: 1, price: 0, amount: 0 };
    invoiceItems.push(row);
    renderTable();
});

// Clear all
document.getElementById("clearRowsBtn").addEventListener("click", () => {
    invoiceItems = [];
    tableBody.innerHTML = '';
    document.getElementById("clientName").value = '';
    document.getElementById("invoiceNumber").value = '';
    document.getElementById("invoiceDate").value = '';
    clientGSTInput.value = '';
    ourGSTInput.value = '';
    totalCostEl.textContent = "0.00";
    gstAmountEl.textContent = "0.00";
    finalCostEl.textContent = "0.00";
});

// Render invoice table
function renderTable() {
    tableBody.innerHTML = '';
    invoiceItems.forEach((row, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><input value="${row.item}" data-index="${index}" data-field="item"></td>
            <td><input value="${row.material}" data-index="${index}" data-field="material"></td>
            <td><input type="number" value="${row.qty}" min="1" data-index="${index}" data-field="qty"></td>
            <td><input type="number" value="${row.price}" min="0" step="0.01" data-index="${index}" data-field="price"></td>
            <td>${formatAmount(row.amount)}</td>
            <td><button class="deleteBtn" data-index="${index}">X</button></td>
        `;
        tableBody.appendChild(tr);
    });
    updateTotals();
}

// Handle table input change
tableBody.addEventListener("input", (e) => {
    const index = e.target.dataset.index;
    const field = e.target.dataset.field;
    if (index !== undefined && field) {
        const row = invoiceItems[index];
        if (field === 'qty' || field === 'price') {
            row[field] = parseFloat(e.target.value) || 0;
            row.amount = row.qty * row.price;
        } else {
            row[field] = e.target.value;
        }
        renderTable();
    }
});

// Handle delete
tableBody.addEventListener("click", (e) => {
    if (e.target.classList.contains("deleteBtn")) {
        const index = e.target.dataset.index;
        invoiceItems.splice(index, 1);
        renderTable();
    }
});

// Update totals
function updateTotals() {
    const total = invoiceItems.reduce((sum, r) => sum + r.amount, 0);
    const gstPercent = parseFloat(document.getElementById("gstPercent").value) || 0;
    const gstAmount = (total * gstPercent) / 100;
    const final = total + gstAmount;
    totalCostEl.textContent = formatAmount(total);
    gstAmountEl.textContent = formatAmount(gstAmount);
    finalCostEl.textContent = formatAmount(final);
}

// 2D → 3D Designer
document.getElementById("upload2D").addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const design = { name: file.name, dataUrl: ev.target.result, snapshot: '' };
            uploadedDesigns.push(design);
            renderDesigns();
        };
        reader.readAsDataURL(file);
    });
});

// Render uploaded designs
function renderDesigns() {
    const container = document.getElementById("designList");
    container.innerHTML = '';
    uploadedDesigns.forEach((d, idx) => {
        const div = document.createElement("div");
        div.className = "design-item";
        div.innerHTML = `
            <img class="design-thumb" src="${d.dataUrl}">
            <div class="design-info">
                <input value="${d.name}" data-index="${idx}" class="design-name">
                <div class="design-controls">
                    <button data-index="${idx}" class="generate3DBtn">Generate 3D</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

// Generate 3D snapshot
document.getElementById("designList").addEventListener("click", (e) => {
    if (e.target.classList.contains("generate3DBtn")) {
        const index = e.target.dataset.index;
        // For simplicity, snapshot same as uploaded image
        uploadedDesigns[index].snapshot = uploadedDesigns[index].dataUrl;
        alert("3D Snapshot generated for " + uploadedDesigns[index].name);
    }
});

// Generate PDF
document.getElementById("generatePDFBtn").addEventListener("click", () => {
    const invoiceNumber = document.getElementById("invoiceNumber").value;
    if (!invoiceNumber) { alert("Invoice number required"); return; }

    // Check for duplicate
    const invoices = JSON.parse(localStorage.getItem('invoices') || '{}');
    if (invoices[invoiceNumber]) {
        alert("Invoice number already exists!");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Watermark
    doc.setFontSize(60);
    doc.setTextColor(200, 200, 200);
    doc.text("Varshith Interior Solutions", pageWidth / 2, pageHeight / 2, { angle: 45, align: "center" });

    // Header
    doc.setFillColor(46, 125, 50);
    doc.rect(0, 0, pageWidth, 60, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("Varshith Interior Solutions", 40, 25);
    doc.setFontSize(10);
    doc.text("NO 39 BRN Ashish Layout, Near Sri Thimmaraya Swami Gudi, Anekal - 562106", 40, 40);
    doc.text("Phone: +91 9916511599 / +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com", 40, 55);

    // Table data
    const tableData = invoiceItems.map(r => [
        r.item, r.material, r.qty, formatAmount(r.price), formatAmount(r.amount)
    ]);

    doc.autoTable({
        startY: 70,
        head: [["Item","Material Used","Qty","Unit Price","Amount"]],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [46, 125, 50] }
    });

    let finalY = doc.lastAutoTable.finalY + 20;
    const total = invoiceItems.reduce((sum, r) => sum + r.amount, 0);
    const gstPercent = parseFloat(document.getElementById("gstPercent").value) || 0;
    const gstAmount = (total * gstPercent) / 100;
    const final = total + gstAmount;

    // Totals
    doc.text(`Total Cost: ${formatAmount(total)}`, 40, finalY);
    doc.text(`GST Amount: ${formatAmount(gstAmount)}`, 40, finalY + 15);
    doc.text(`Final Cost: ${formatAmount(final)}`, 40, finalY + 30);
    doc.text(`Amount in words: ${numberToWords(final)}`, 40, finalY + 50);

    finalY += 70;

    // 2D→3D Designs
    uploadedDesigns.forEach(d => {
        if(d.snapshot){
            doc.addImage(d.snapshot, 'JPEG', 40, finalY, 100, 80);
            doc.text(d.name, 150, finalY + 40);
            finalY += 90;
        }
    });

    // Footer
    doc.setFillColor(46, 125, 50);
    doc.rect(0, pageHeight - 40, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    const footerGST = ourGSTInput.value;
    doc.text(`Address: NO 39 BRN Ashish Layout, Near Sri Thimmaraya Swami Gudi, Anekal - 562106 | Phone: +91 9916511599 & +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com | GST No: ${footerGST}`, 40, pageHeight - 25);

    // Page number
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 60, pageHeight - 25);
    }

    doc.save(`${invoiceNumber}.pdf`);

    // Save invoice
    const invoiceData = {
        invoiceNumber,
        clientName: document.getElementById("clientName").value,
        invoiceDate: document.getElementById("invoiceDate").value,
        clientGST: clientGSTInput.value,
        ourGST: footerGST,
        items: invoiceItems,
        designs: uploadedDesigns,
        totals: { total, gstAmount, final }
    };
    saveInvoice(invoiceData);
});

// Search feature
document.getElementById("searchBtn").addEventListener("click", () => {
    const invNum = document.getElementById("searchInvoiceNumber").value;
    const client = document.getElementById("searchClientName").value;
    const date = document.getElementById("searchInvoiceDate").value;
    const resultsDiv = document.getElementById("searchResults");
    resultsDiv.innerHTML = '';

    let results = [];
    if(invNum) results = loadInvoiceByNumber(invNum) ? [loadInvoiceByNumber(invNum)] : [];
    else if(client) results = loadInvoiceByClientName(client);
    else if(date) results = loadInvoiceByDate(date);

    if(results.length === 0){
        resultsDiv.innerHTML = 'No record found';
        return;
    }

    results.forEach(r => {
        const div = document.createElement("div");
        div.textContent = `Invoice: ${r.invoiceNumber}, Client: ${r.clientName}, Date: ${r.invoiceDate}`;
        const btn = document.createElement("button");
        btn.textContent = "Download";
        btn.addEventListener("click", () => {
            // Recreate PDF for selected invoice
            invoiceItems = r.items;
            uploadedDesigns = r.designs;
            clientGSTInput.value = r.clientGST;
            ourGSTInput.value = r.ourGST;
            document.getElementById("clientName").value = r.clientName;
            document.getElementById("invoiceNumber").value = r.invoiceNumber;
            document.getElementById("invoiceDate").value = r.invoiceDate;
            renderTable();
            document.getElementById("generatePDFBtn").click();
        });
        div.appendChild(btn);
        resultsDiv.appendChild(div);
    });
});
