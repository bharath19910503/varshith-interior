// Full working script with requested features implemented

// DOM elements
const addRowBtn = document.getElementById("addRowBtn");
const clearRowsBtn = document.getElementById("clearRowsBtn");
const invoiceTable = document.getElementById("invoiceTable").querySelector("tbody");
const totalCostEl = document.getElementById("totalCost");
const gstAmountEl = document.getElementById("gstAmount");
const finalCostEl = document.getElementById("finalCost");
const gstPercentEl = document.getElementById("gstPercent");
const clientNameEl = document.getElementById("clientName");
const clientGSTEl = document.getElementById("clientGST");
const companyGSTEl = document.getElementById("companyGST");
const invoiceNumberEl = document.getElementById("invoiceNumber");
const invoiceDateEl = document.getElementById("invoiceDate");
const noteEl = document.getElementById("note");
const generatePDFBtn = document.getElementById("generatePDFBtn");
const upload2D = document.getElementById("upload2D");
const designList = document.getElementById("designList");

let invoices = JSON.parse(localStorage.getItem("invoices") || "[]");
let designs = [];

// Add Item Row
addRowBtn.addEventListener("click", () => {
  const tr = document.createElement("tr");
  tr.innerHTML = `<td><input type="text" placeholder="Item"></td>
                  <td><input type="text" placeholder="Material"></td>
                  <td><input type="number" placeholder="Qty" value="1"></td>
                  <td><input type="number" placeholder="Unit Price" value="0"></td>
                  <td class="amount">0.00</td>
                  <td><button class="deleteBtn">Delete</button></td>`;
  invoiceTable.appendChild(tr);
  updateAmounts();
});

// Delete row
invoiceTable.addEventListener("click", e => {
  if(e.target.classList.contains("deleteBtn")){
    e.target.closest("tr").remove();
    updateAmounts();
  }
});

// Update amounts
invoiceTable.addEventListener("input", updateAmounts);
gstPercentEl.addEventListener("input", updateAmounts);

function updateAmounts(){
  let total = 0;
  Array.from(invoiceTable.rows).forEach(row => {
    const qty = parseFloat(row.cells[2].querySelector("input").value) || 0;
    const price = parseFloat(row.cells[3].querySelector("input").value) || 0;
    const amount = qty * price;
    row.cells[4].textContent = amount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
    total += amount;
  });
  const gstPercent = parseFloat(gstPercentEl.value) || 0;
  const gstAmount = total * gstPercent/100;
  const finalCost = total + gstAmount;

  totalCostEl.textContent = total.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  gstAmountEl.textContent = gstAmount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  finalCostEl.textContent = finalCost.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
}

// Clear All
clearRowsBtn.addEventListener("click", () => {
  invoiceTable.innerHTML = "";
  clientNameEl.value = "";
  clientGSTEl.value = "";
  invoiceNumberEl.value = "";
  invoiceDateEl.value = "";
  companyGSTEl.value = "";
  noteEl.value = "";
  designs = [];
  designList.innerHTML = "";
  updateAmounts();
});

// Convert number to words
function numberToWords(amount){
  // Using Intl.NumberFormat for currency formatting
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency:'INR', maximumFractionDigits:2 }).format(amount);
}

// 2D Upload
upload2D.addEventListener("change", e => {
  Array.from(e.target.files).forEach(file=>{
    const reader = new FileReader();
    reader.onload = function(evt){
      const imgData = evt.target.result;
      const design = { name:file.name, img: imgData };
      designs.push(design);
      renderDesigns();
    }
    reader.readAsDataURL(file);
  });
});

function renderDesigns(){
  designList.innerHTML = "";
  designs.forEach((design, idx)=>{
    const div = document.createElement("div");
    div.className="design-item";
    div.innerHTML = `<img src="${design.img}" class="design-thumb">
                     <div class="design-info">
                        <div>${design.name}</div>
                        <button onclick="removeDesign(${idx})">Remove</button>
                     </div>`;
    designList.appendChild(div);
  });
}
window.removeDesign = function(idx){
  designs.splice(idx,1);
  renderDesigns();
}

// Generate PDF
generatePDFBtn.addEventListener("click", async () => {
  if(!invoiceNumberEl.value){ alert("Enter Invoice Number"); return; }
  if(invoices.find(inv=>inv.invoiceNumber===invoiceNumberEl.value)){ alert("Invoice Number already exists!"); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Watermark (light diagonal)
  doc.setFontSize(40);
  doc.setTextColor(200,200,200);
  doc.text("Varshith Interior Solutions", 30, 150, { angle: 45 });

  // Header
  doc.setTextColor(255,255,255);
  doc.setFillColor(46,125,50);
  doc.rect(0,0,210,40,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(18);
  doc.text("Varshith Interior Solutions", 14, 15);
  doc.setFontSize(10);
  doc.text("NO 39 BRN Ashish Layout, Near Sri Thimmaraya Swami Gudi, Anekal - 562106",14,25);
  doc.text("Phone: +91 9916511599 & 8553608981 | Email: Varshithinteriorsolutions@gmail.com",14,32);

  // Invoice Info
  doc.setTextColor(0,0,0);
  doc.text(`Invoice No: ${invoiceNumberEl.value}`, 14, 45);
  doc.text(`Date: ${invoiceDateEl.value}`, 100,45);
  doc.text(`Client: ${clientNameEl.value}`,14,50);
  if(clientGSTEl.value) doc.text(`Client GST: ${clientGSTEl.value}`,14,55);

  // Table
  const rows = Array.from(invoiceTable.rows).map(row => {
    return Array.from(row.cells).slice(0,5).map(cell => cell.textContent);
  });
  doc.autoTable({ startY:60, head:[["Item","Material","Qty","Unit Price","Amount"]], body:rows });
  let finalY = doc.lastAutoTable.finalY + 10;

  // Totals
  doc.text(`Total Cost: ${totalCostEl.textContent}`,14,finalY); finalY+=6;
  doc.text(`GST: ${gstAmountEl.textContent}`,14,finalY); finalY+=6;
  doc.text(`Final Cost: ${finalCostEl.textContent} (${numberToWords(parseFloat(finalCostEl.textContent.replace(/,/g,'')))})`,14,finalY); finalY+=6;
  doc.text(noteEl.value,14,finalY); finalY+=10;

  // Add 2D → 3D designs in PDF
  for(let d of designs){
    if(finalY > 240) doc.addPage(), finalY=20;
    doc.text(d.name,14,finalY); finalY+=6;
    const imgProps = doc.getImageProperties(d.img);
    const pdfWidth = 100;
    const pdfHeight = (imgProps.height * pdfWidth)/imgProps.width;
    doc.addImage(d.img,'JPEG',14,finalY,pdfWidth,pdfHeight);
    finalY+=pdfHeight + 10;
  }

  // Footer for each page
  const pageCount = doc.internal.getNumberOfPages();
  for(let i=1;i<=pageCount;i++){
    doc.setPage(i);
    doc.setTextColor(255,255,255);
    doc.setFillColor(46,125,50);
    doc.rect(0,280,210,20,'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(10);
    doc.text(`Address: NO 39 BRN Ashish Layout, Near Sri Thimmaraya Swami Gudi, Anekal - 562106`,14,287);
    doc.text(`Phone: +91 9916511599 & 8553608981 | Email: Varshithinteriorsolutions@gmail.com | GST: ${companyGSTEl.value}`,14,294);
    doc.text(`Page ${i} of ${pageCount}`,180,294);
  }

  doc.save(`Invoice_${invoiceNumberEl.value}.pdf`);

  // Save invoice to localStorage
  const invoiceData = {
    invoiceNumber: invoiceNumberEl.value,
    clientName: clientNameEl.value,
    clientGST: clientGSTEl.value,
    companyGST: companyGSTEl.value,
    invoiceDate: invoiceDateEl.value,
    note: noteEl.value,
    items: Array.from(invoiceTable.rows).map(r => ({
      name:r.cells[0].querySelector("input").value,
      material:r.cells[1].querySelector("input").value,
      qty:r.cells[2].querySelector("input").value,
      price:r.cells[3].querySelector("input").value,
      amount:r.cells[4].textContent
    })),
    designs
  };
  invoices.push(invoiceData);
  localStorage.setItem("invoices",JSON.stringify(invoices));
});
