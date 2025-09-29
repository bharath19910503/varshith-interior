// Global variables
let invoiceItems = [];
let uploadedDesigns = [];
let threeDImages = [];
let invoicesDB = JSON.parse(localStorage.getItem("invoicesDB") || "{}");

// DOM Elements
const addRowBtn = document.getElementById("addRowBtn");
const clearRowsBtn = document.getElementById("clearRowsBtn");
const invoiceTableBody = document.querySelector("#invoiceTable tbody");
const totalCostEl = document.getElementById("totalCost");
const gstAmountEl = document.getElementById("gstAmount");
const finalCostEl = document.getElementById("finalCost");
const gstPercentInput = document.getElementById("gstPercent");
const generatePDFBtn = document.getElementById("generatePDFBtn");
const upload2D = document.getElementById("upload2D");
const designList = document.getElementById("designList");
const logoUpload = document.getElementById("logoUpload");
const logoImg = document.getElementById("logoImg");

const clientNameInput = document.getElementById("clientName");
const invoiceNumberInput = document.getElementById("invoiceNumber");
const invoiceDateInput = document.getElementById("invoiceDate");
const clientGSTInput = document.getElementById("clientGST");

// Recover invoice
const searchInvoiceNumber = document.getElementById("searchInvoiceNumber");
const searchClientName = document.getElementById("searchClientName");
const searchInvoiceDate = document.getElementById("searchInvoiceDate");
const searchInvoiceBtn = document.getElementById("searchInvoiceBtn");
const searchResults = document.getElementById("searchResults");

// Event Listeners
addRowBtn.addEventListener("click", addItemRow);
clearRowsBtn.addEventListener("click", clearAll);
gstPercentInput.addEventListener("input", updateSummary);
generatePDFBtn.addEventListener("click", generatePDF);
upload2D.addEventListener("change", handle2DUpload);
logoUpload.addEventListener("change", handleLogoUpload);
searchInvoiceBtn.addEventListener("click", searchInvoices);

// Functions
function addItemRow() {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td><input type="text" placeholder="Item"></td>
        <td><input type="text" placeholder="Material Used"></td>
        <td><input type="number" placeholder="Qty" min="0"></td>
        <td><input type="number" placeholder="Unit Price" min="0" step="0.01"></td>
        <td class="amount">0.00</td>
        <td><button class="deleteBtn">Delete</button></td>
    `;

    invoiceTableBody.appendChild(row);

    // Event listeners for calculation
    const inputs = row.querySelectorAll("input");
    inputs.forEach(input => input.addEventListener("input", updateSummary));

    // Delete
    row.querySelector(".deleteBtn").addEventListener("click", () => {
        row.remove();
        updateSummary();
    });
}

function updateSummary() {
    let total = 0;
    invoiceItems = [];
    invoiceTableBody.querySelectorAll("tr").forEach(row => {
        const [itemInput, materialInput, qtyInput, unitPriceInput] = row.querySelectorAll("input");
        const item = itemInput.value;
        const material = materialInput.value;
        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(unitPriceInput.value) || 0;
        const amount = qty * price;

        row.querySelector(".amount").textContent = amount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});

        invoiceItems.push({item, material, qty, price, amount});
        total += amount;
    });

    const gstPercent = parseFloat(gstPercentInput.value) || 0;
    const gstAmount = total * gstPercent / 100;
    const final = total + gstAmount;

    totalCostEl.textContent = total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
    gstAmountEl.textContent = gstAmount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
    finalCostEl.textContent = final.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
}

function clearAll() {
    invoiceTableBody.innerHTML = "";
    invoiceNumberInput.value = "";
    clientNameInput.value = "";
    invoiceDateInput.value = "";
    clientGSTInput.value = "";
    invoiceItems = [];
    uploadedDesigns = [];
    threeDImages = [];
    designList.innerHTML = "";
    updateSummary();
}

function handle2DUpload(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const designId = Date.now() + Math.random();
            uploadedDesigns.push({id: designId, name: file.name, dataURL: ev.target.result, snapshot: null});

            const div = document.createElement("div");
            div.className = "design-item";
            div.dataset.id = designId;
            div.innerHTML = `
                <img src="${ev.target.result}" class="design-thumb">
                <div class="design-info">
                    <input type="text" value="${file.name}" class="design-name">
                </div>
                <div class="design-controls">
                    <button class="generate3DBtn">Generate 3D</button>
                </div>
            `;
            designList.appendChild(div);

            div.querySelector(".generate3DBtn").addEventListener("click", () => generate3D(div.dataset.id));
            div.querySelector(".design-name").addEventListener("input", (ev)=>{
                const design = uploadedDesigns.find(d=>d.id == div.dataset.id);
                design.name = ev.target.value;
            });
        };
        reader.readAsDataURL(file);
    });
}

function generate3D(designId) {
    const design = uploadedDesigns.find(d=>d.id == designId);
    if (!design) return;

    // Capture snapshot as "3D preview" (simulate)
    design.snapshot = design.dataURL; 
    alert(`3D Generated for ${design.name}`);
}

function handleLogoUpload(e){
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (ev)=>{ logoImg.src = ev.target.result; };
    reader.readAsDataURL(file);
}

function amountToWords(amount){
    const words = require('number-to-words'); // optional external lib
    return words.toWords(amount);
}

function generatePDF(){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({unit:'pt',format:'a4'});
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 40;

    // Header
    doc.setFillColor(46,125,50); // green
    doc.rect(0,0,pageWidth,50,'F');
    doc.setFontSize(14);
    doc.setTextColor(255,255,255);
    doc.text("Varshith Interior Solutions", 40, 30);
    doc.setFontSize(10);
    doc.text("NO 39 BRN Ashish Layout, Near Sri Thimmaraya Swami Gudi, Anekal - 562106", 40, 45);

    y += 60;

    // Watermark
    doc.setTextColor(200,200,200);
    doc.setFontSize(60);
    doc.text("Varshith Interior Solutions", pageWidth/2, pageHeight/2, {angle:-45, align:"center"});

    doc.setTextColor(0,0,0);
    doc.setFontSize(12);

    doc.text(`Invoice Number: ${invoiceNumberInput.value}`, 40, y);
    y += 20;
    doc.text(`Invoice Date: ${invoiceDateInput.value}`, 40, y);
    y += 20;
    doc.text(`Client Name: ${clientNameInput.value}`, 40, y);
    y += 20;
    doc.text(`Client GST: ${clientGSTInput.value}`, 40, y);
    y += 20;

    // Table
    const tableBody = invoiceItems.map(item => [
        item.item,
        item.material,
        item.qty.toString(),
        item.price.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2}),
        item.amount.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})
    ]);

    doc.autoTable({
        head: [['Item','Material','Qty','Unit Price','Amount']],
        body: tableBody,
        startY: y,
        theme:'grid',
        styles:{cellPadding:3, fontSize:10}
    });

    y = doc.lastAutoTable.finalY + 20;
    const total = parseFloat(totalCostEl.textContent.replace(/,/g,''));
    const gstAmt = parseFloat(gstAmountEl.textContent.replace(/,/g,''));
    const final = parseFloat(finalCostEl.textContent.replace(/,/g,''));

    doc.text(`Total Cost: ${total.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}`, 40, y);
    y += 20;
    doc.text(`GST Amount: ${gstAmt.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}`, 40, y);
    y += 20;
    doc.text(`Final Cost: ${final.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}`, 40, y);
    y += 20;
    doc.text(`Amount in words: ${numberToWords(Math.round(final))} only`, 40, y);
    y += 20;

    doc.text(`Payment note: 50 PCT of the quoted amount has to be paid as advance, 30 PCT after completing 50 % of work and remaining 20 PCT after the completion of work.`, 40, y);
    y += 30;

    // 3D Images
    uploadedDesigns.forEach(d => {
        if(d.snapshot){
            doc.addImage(d.snapshot, 'JPEG', 40, y, 100, 100);
            doc.text(d.name, 150, y+50);
            y += 120;
        }
    });

    // Footer
    doc.setFillColor(46,125,50);
    doc.rect(0,pageHeight-50,pageWidth,50,'F');
    doc.setFontSize(10);
    doc.setTextColor(255,255,255);
    doc.text("Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106", 40, pageHeight-35);
    doc.text("Phone: +91 9916511599 & +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com", 40, pageHeight-20);
    doc.text(`Page 1`, pageWidth-60, pageHeight-20);

    doc.save(`${invoiceNumberInput.value || 'invoice'}.pdf`);

    // Save invoice
    saveInvoice();
}

function saveInvoice(){
    const invoiceNumber = invoiceNumberInput.value;
    if(invoicesDB[invoiceNumber]){
        alert("Invoice Number already exists!");
        return;
    }

    invoicesDB[invoiceNumber] = {
        clientName: clientNameInput.value,
        clientGST: clientGSTInput.value,
        invoiceDate: invoiceDateInput.value,
        gstPercent: gstPercentInput.value,
        items: invoiceItems,
        designs: uploadedDesigns,
        total: totalCostEl.textContent,
        gstAmount: gstAmountEl.textContent,
        final: finalCostEl.textContent,
        note: document.getElementById("note").value,
        logo: logoImg.src || ''
    };

    localStorage.setItem("invoicesDB", JSON.stringify(invoicesDB));
    alert("Invoice saved successfully!");
}

function searchInvoices(){
    const invoiceNum = searchInvoiceNumber.value;
    const clientName = searchClientName.value.toLowerCase();
    const date = searchInvoiceDate.value;

    searchResults.innerHTML = "";

    Object.keys(invoicesDB).forEach(key=>{
        const inv = invoicesDB[key];
        if((!invoiceNum || key.includes(invoiceNum)) &&
           (!clientName || inv.clientName.toLowerCase().includes(clientName)) &&
           (!date || inv.invoiceDate === date)){
            const div = document.createElement("div");
            div.className = "search-result-item";
            div.textContent = `${key} | ${inv.clientName} | ${inv.invoiceDate}`;
            div.addEventListener("click", ()=>{
                loadInvoice(key);
            });
            searchResults.appendChild(div);
        }
    });
}

function loadInvoice(invoiceNumber){
    const inv = invoicesDB[invoiceNumber];
    if(!inv) return;

    invoiceNumberInput.value = invoiceNumber;
    clientNameInput.value = inv.clientName;
    invoiceDateInput.value = inv.invoiceDate;
    clientGSTInput.value = inv.clientGST;
    gstPercentInput.value = inv.gstPercent;
    logoImg.src = inv.logo;

    invoiceTableBody.innerHTML = "";
    uploadedDesigns = inv.designs.map(d=>({...d}));
    uploadedDesigns.forEach(d=>{
        const div = document.createElement("div");
        div.className = "design-item";
        div.dataset.id = d.id;
        div.innerHTML = `
            <img src="${d.dataURL}" class="design-thumb">
            <div class="design-info">
                <input type="text" value="${d.name}" class="design-name">
            </div>
            <div class="design-controls">
                <button class="generate3DBtn">Generate 3D</button>
            </div>
        `;
        designList.appendChild(div);
        div.querySelector(".generate3DBtn").addEventListener("click", () => generate3D(div.dataset.id));
        div.querySelector(".design-name").addEventListener("input", (ev)=>{
            const design = uploadedDesigns.find(des => des.id == div.dataset.id);
            design.name = ev.target.value;
        });
    });

    invoiceItems = inv.items.map(it=>({...it}));
    invoiceItems.forEach(item=>{
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><input type="text" value="${item.item}"></td>
            <td><input type="text" value="${item.material}"></td>
            <td><input type="number" value="${item.qty}"></td>
            <td><input type="number" value="${item.price}"></td>
            <td class="amount">${item.amount.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
            <td><button class="deleteBtn">Delete</button></td>
        `;
        invoiceTableBody.appendChild(row);
        row.querySelectorAll("input").forEach(input => input.addEventListener("input", updateSummary));
        row.querySelector(".deleteBtn").addEventListener("click", ()=>{row.remove();updateSummary();});
    });

    updateSummary();
}

// Number to words (simple)
function numberToWords(amount){
    const words = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
    "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
    const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
    if(amount<20) return words[amount];
    if(amount<100) return tens[Math.floor(amount/10)] + (amount%10>0? " "+words[amount%10]:"");
    if(amount<1000) return words[Math.floor(amount/100)] + " Hundred " + (amount%100>0? numberToWords(amount%100):"");
    if(amount<100000) return numberToWords(Math.floor(amount/1000)) + " Thousand " + (amount%1000>0? numberToWords(amount%1000):"");
    if(amount<10000000) return numberToWords(Math.floor(amount/100000)) + " Lakh " + (amount%100000>0? numberToWords(amount%100000):"");
    return numberToWords(Math.floor(amount/10000000)) + " Crore " + (amount%10000000>0? numberToWords(amount%10000000):"");
}
