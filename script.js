// Main script.js
let invoiceData = JSON.parse(localStorage.getItem('invoices') || '{}');

function updateSummary() {
  let total = 0;
  document.querySelectorAll("#invoiceTable tbody tr").forEach(row => {
    const qty = parseFloat(row.querySelector(".qty").value) || 0;
    const price = parseFloat(row.querySelector(".unitPrice").value) || 0;
    const amount = qty * price;
    row.querySelector(".amount").textContent = amount.toFixed(2);
    total += amount;
  });
  const gstPercent = 18;
  const gstAmount = total * gstPercent / 100;
  const final = total + gstAmount;

  document.getElementById("totalCost").textContent = total.toLocaleString();
  document.getElementById("gstAmount").textContent = gstAmount.toLocaleString();
  document.getElementById("finalCost").textContent = final.toLocaleString();
  document.getElementById("amountInWords").textContent = numberToWords(final);
}

function addRow() {
  const tbody = document.querySelector("#invoiceTable tbody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input class="item" placeholder="Item"></td>
    <td><input class="material" placeholder="Material Used"></td>
    <td><input class="qty" type="number" value="1"></td>
    <td><input class="unitPrice" type="number" value="0"></td>
    <td class="amount">0.00</td>
    <td><button class="deleteBtn">Delete</button></td>
  `;
  tbody.appendChild(tr);
  tr.querySelectorAll("input").forEach(inp => inp.addEventListener("input", updateSummary));
  tr.querySelector(".deleteBtn").addEventListener("click", () => { tr.remove(); updateSummary(); });
  updateSummary();
}

document.getElementById("addRowBtn").addEventListener("click", addRow);
document.getElementById("clearRowsBtn").addEventListener("click", () => {
  document.querySelector("#invoiceTable tbody").innerHTML = "";
  document.getElementById("clientName").value = "";
  document.getElementById("invoiceNumber").value = "";
  document.getElementById("invoiceDate").value = "";
  document.getElementById("clientGST").value = "";
  document.getElementById("companyGST").value = "";
  updateSummary();
});

function numberToWords(amount) {
  const num = amount.toFixed(2).split(".");
  let words = toWords(parseInt(num[0]));
  if (parseInt(num[1])) words += ` point ${num[1].split('').map(d=>toWords(parseInt(d))).join(' ')}`;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// Simple number to words function for demo
function toWords(s){
  const a=["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
  const b=["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
  if(s<20) return a[s];
  if(s<100) return b[Math.floor(s/10)] + (s%10? " " + a[s%10] : "");
  if(s<1000) return a[Math.floor(s/100)] + " hundred" + (s%100? " " + toWords(s%100):"");
  if(s<1000000) return toWords(Math.floor(s/1000)) + " thousand" + (s%1000? " " + toWords(s%1000):"");
  return s;
}

document.getElementById("generatePDFBtn").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p','pt','a4');
  const invoiceNumber = document.getElementById("invoiceNumber").value;
  if(!invoiceNumber) return alert("Invoice number required");
  if(invoiceData[invoiceNumber]) return alert("Invoice number already exists");

  const clientName = document.getElementById("clientName").value;
  const invoiceDate = document.getElementById("invoiceDate").value;
  const clientGST = document.getElementById("clientGST").value;
  const companyGST = document.getElementById("companyGST").value;
  const finalCost = document.getElementById("finalCost").textContent;
  const amountWords = document.getElementById("amountInWords").textContent;

  // Add header
  doc.setFillColor(46,125,50);
  doc.rect(0,0,595,40,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(14);
  doc.text("Varshith Interior Solutions", 40, 28);

  // Watermark
  doc.setTextColor(200,200,200);
  doc.setFontSize(40);
  doc.text("VARSHITH INTERIOR SOLUTIONS", 150, 400, {angle:45,opacity:0.1});

  // Invoice meta
  doc.setTextColor(0,0,0);
  doc.setFontSize(12);
  doc.text(`Invoice Number: ${invoiceNumber}`,40,60);
  doc.text(`Client Name: ${clientName}`,40,80);
  doc.text(`Invoice Date: ${invoiceDate}`,40,100);
  doc.text(`Client GST: ${clientGST}`,40,120);

  // Table
  const rows = [];
  document.querySelectorAll("#invoiceTable tbody tr").forEach(row => {
    const item = row.querySelector(".item").value;
    const mat = row.querySelector(".material").value;
    const qty = row.querySelector(".qty").value;
    const unit = row.querySelector(".unitPrice").value;
    const amount = row.querySelector(".amount").textContent;
    rows.push([item,mat,qty,unit,amount]);
  });

  doc.autoTable({
    head:[['Item','Material','Qty','Unit Price','Amount']],
    body:rows,
    startY:140,
  });

  let finalY = doc.lastAutoTable.finalY + 20;
  doc.text(`Total Cost: ${document.getElementById("totalCost").textContent}`,40,finalY);
  doc.text(`GST: ${document.getElementById("gstAmount").textContent}`,40,finalY+20);
  doc.text(`Final Cost: ${finalCost}`,40,finalY+40);
  doc.text(`Amount in words: ${amountWords}`,40,finalY+60);

  // Footer
  doc.setFillColor(46,125,50);
  doc.rect(0,780,595,40,'F');
  doc.setTextColor(255,255,255);
  doc.text(`Address: NO 39 BRN Ashish Layout, Near Sri Thimmaraya Swami Gudi, Anekal - 562106`,40,795);
  doc.text(`Phone: +91 9916511599 & +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com`,40,810);
  if(companyGST) doc.text(`Company GST: ${companyGST}`,40,825);

  // Save
  invoiceData[invoiceNumber] = {
    clientName, invoiceDate, clientGST, companyGST,
    items: rows, totalCost: document.getElementById("totalCost").textContent,
    gstAmount: document.getElementById("gstAmount").textContent,
    finalCost, amountWords
  };
  localStorage.setItem('invoices',JSON.stringify(invoiceData));
  doc.save(`Invoice_${invoiceNumber}.pdf`);
});

// Pull previous invoice
document.getElementById("invoiceNumber").addEventListener("change", ()=>{
  const val = document.getElementById("invoiceNumber").value;
  if(invoiceData[val]){
    const data = invoiceData[val];
    document.getElementById("clientName").value = data.clientName;
    document.getElementById("invoiceDate").value = data.invoiceDate;
    document.getElementById("clientGST").value = data.clientGST;
    document.getElementById("companyGST").value = data.companyGST;
    const tbody = document.querySelector("#invoiceTable tbody");
    tbody.innerHTML = "";
    data.items.forEach(row=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `<td><input class="item" value="${row[0]}"></td>
                      <td><input class="material" value="${row[1]}"></td>
                      <td><input class="qty" type="number" value="${row[2]}"></td>
                      <td><input class="unitPrice" type="number" value="${row[3]}"></td>
                      <td class="amount">${row[4]}</td>
                      <td><button class="deleteBtn">Delete</button></td>`;
      tbody.appendChild(tr);
      tr.querySelectorAll("input").forEach(inp => inp.addEventListener("input", updateSummary));
      tr.querySelector(".deleteBtn").addEventListener("click",()=>{tr.remove();updateSummary()});
    });
    updateSummary();
  } else {
    document.getElementById("clientName").value = "";
    document.getElementById("invoiceDate").value = "";
    document.getElementById("clientGST").value = "";
    document.getElementById("companyGST").value = "";
    document.querySelector("#invoiceTable tbody").innerHTML = "";
    updateSummary();
  }
});
