/* ==========================
   Invoice + 3D Designer Script
========================== */

// --- Global references ---
const invoiceTbody = document.querySelector("#invoiceTable tbody");
const gstPercentEl = document.getElementById("gstPercent");
const totalCostEl = document.getElementById("totalCost");
const gstAmountEl = document.getElementById("gstAmount");
const finalCostEl = document.getElementById("finalCost");
const addRowBtn = document.getElementById("addRowBtn");
const clearRowsBtn = document.getElementById("clearRowsBtn");
const generatePDFBtn = document.getElementById("generatePDFBtn");

let designs = [];      // stores uploaded designs with snapshots
let logoDataURL = "";  // stores uploaded logo

/* ===== Add Row ===== */
function addRow(item="", material="", qty=1, price=0) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input class="item" value="${item}"></td>
    <td><input class="material" value="${material}"></td>
    <td><input type="number" class="qty" value="${qty}" min="0"></td>
    <td><input type="number" class="price" value="${price}" step="0.01"></td>
    <td><input class="amount" readonly></td>
    <td><button class="deleteBtn">X</button></td>
  `;
  invoiceTbody.appendChild(tr);
  updateTotals();
}

addRowBtn.addEventListener("click", ()=> addRow());
clearRowsBtn.addEventListener("click", ()=> {
  invoiceTbody.innerHTML = "";
  updateTotals();
});

/* ===== Delete Row ===== */
invoiceTbody.addEventListener("click", e=>{
  if(e.target.classList.contains("deleteBtn")) {
    e.target.closest("tr").remove();
    updateTotals();
  }
});

/* ===== Update Totals ===== */
function updateTotals() {
  let total = 0;
  invoiceTbody.querySelectorAll("tr").forEach(tr=>{
    const qty = parseFloat(tr.querySelector(".qty").value) || 0;
    const price = parseFloat(tr.querySelector(".price").value) || 0;
    const amt = qty * price;
    tr.querySelector(".amount").value = amt.toFixed(2);
    total += amt;
  });

  const gstPercent = parseFloat(gstPercentEl.value) || 0;
  const gstAmount = total * gstPercent / 100;
  const final = total + gstAmount;

  totalCostEl.textContent = total.toFixed(2);
  gstAmountEl.textContent = gstAmount.toFixed(2);
  finalCostEl.textContent = final.toFixed(2);
}

invoiceTbody.addEventListener("input", updateTotals);
gstPercentEl.addEventListener("input", updateTotals);

/* ===== Logo Upload ===== */
document.getElementById("logoUpload").addEventListener("change", e=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ev=>{
    logoDataURL = ev.target.result;
    document.getElementById("logoImg").src = logoDataURL;
  };
  reader.readAsDataURL(file);
});

/* ===== PDF Generation ===== */
generatePDFBtn.addEventListener("click", ()=>{
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p","pt","a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  const clientName = document.getElementById("clientName").value || "";
  const invoiceNumber = document.getElementById("invoiceNumber").value || "";
  const invoiceDate = document.getElementById("invoiceDate").value || new Date().toLocaleDateString();
  const gstPercent = parseFloat(gstPercentEl.value) || 0;

  // --- Header ---
  if(logoDataURL){
    try { doc.addImage(logoDataURL, "PNG", margin, 20, 72, 48); } catch(e){}
  }
  doc.setFontSize(18);
  doc.text("Varshith Interior Solutions", pageWidth/2, 40, { align:"center" });
  doc.setFontSize(10);
  doc.text("NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106", pageWidth/2, 55, { align:"center" });
  doc.text("Phone: +91 9916511599 & +91 8553608981   Email: Varshithinteriorsolutions@gmail.com", pageWidth/2, 68, { align:"center" });

  // --- Invoice Info ---
  let infoY = 90;
  doc.setFontSize(10);
  if(clientName) doc.text(`Client: ${clientName}`, margin, infoY);
  const rightX = pageWidth - margin - 200;
  if(invoiceNumber) doc.text(`Invoice No: ${invoiceNumber}`, rightX, infoY);
  if(invoiceDate) doc.text(`Date: ${invoiceDate}`, rightX, infoY + 12);

  // --- Table ---
  let body = [];
  invoiceTbody.querySelectorAll("tr").forEach(tr=>{
    body.push([
      tr.querySelector(".item").value,
      tr.querySelector(".material").value,
      tr.querySelector(".qty").value,
      tr.querySelector(".amount").value
    ]);
  });

  doc.autoTable({
    head:[["Item","Material Used","Qty","Amount"]],
    body,
    startY: 110,
    theme:"grid",
    styles:{ fontSize:10, cellPadding:6 },
    headStyles:{ fillColor:[46,125,50], textColor:255 },
    margin:{ left: margin, right: margin }
  });

  let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 120;

  // --- Totals ---
  const total = parseFloat(totalCostEl.textContent)||0;
  const gstAmount = parseFloat(gstAmountEl.textContent)||0;
  const final = parseFloat(finalCostEl.textContent)||0;

  const totalsX = pageWidth - margin - 220;
  doc.setFontSize(11);
  doc.text("Summary", totalsX, finalY + 20);
  doc.setFontSize(10);
  doc.text(`Total Cost: ${total.toFixed(2)}`, totalsX, finalY + 40);
  doc.text(`GST (${gstPercent}%): ${gstAmount.toFixed(2)}`, totalsX, finalY + 55);
  doc.setFont(undefined,"bold");
  doc.text(`Final Cost: ${final.toFixed(2)}`, totalsX, finalY + 70);
  doc.setFont(undefined,"normal");

  // --- Note at Bottom ---
  const noteText = document.getElementById("note").value.replace(/^Note:\s*/i, "");
  const bottomY = pageHeight - 100;
  doc.setDrawColor(150); doc.setLineWidth(0.5);
  doc.line(margin, bottomY - 6, pageWidth - margin, bottomY - 6);
  doc.setFontSize(10);
  const wrappedNote = doc.splitTextToSize(noteText, pageWidth - 2*margin);
  doc.text(wrappedNote, margin, bottomY);

  // --- Footer ---
  doc.setFontSize(10);
  doc.text("© 2025 Varshith Interior Solutions", pageWidth/2, pageHeight - 20, { align:"center" });

  doc.save(`Invoice_${invoiceNumber || Date.now()}.pdf`);
});

/* ===== Helper for images ===== */
function getImageTypeFromDataURL(dataURL){
  if(dataURL.indexOf("image/jpeg")>=0) return "JPEG";
  if(dataURL.indexOf("image/png")>=0) return "PNG";
  return "PNG";
}
