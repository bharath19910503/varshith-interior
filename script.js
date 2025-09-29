// script.js
let invoiceData = JSON.parse(localStorage.getItem('invoices') || '{}');
const invoiceTable = document.getElementById('invoiceTable').querySelector('tbody');
const addRowBtn = document.getElementById('addRowBtn');
const clearRowsBtn = document.getElementById('clearRowsBtn');
const generatePDFBtn = document.getElementById('generatePDFBtn');
const clientNameInput = document.getElementById('clientName');
const clientGSTInput = document.getElementById('clientGST');
const invoiceNumberInput = document.getElementById('invoiceNumber');
const invoiceDateInput = document.getElementById('invoiceDate');
const gstPercentInput = document.getElementById('gstPercent');
const totalCostEl = document.getElementById('totalCost');
const gstAmountEl = document.getElementById('gstAmount');
const finalCostEl = document.getElementById('finalCost');
const recoverInvoiceBtn = document.getElementById('recoverInvoiceBtn');

function formatAmount(num){
  return Number(num).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2});
}

function amountInWords(num) {
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const numParts = num.toString().split(".");
  let n = parseInt(numParts[0],10);
  let words = '';
  if(n<20){ words = a[n]; } else { words = b[Math.floor(n/10)] + ' ' + a[n%10]; }
  if(numParts[1]) words += ' point ' + numParts[1].split('').map(x=>a[parseInt(x)]).join(' '); 
  return words;
}

function updateSummary(){
  let total = 0;
  invoiceTable.querySelectorAll('tr').forEach(row=>{
    const amount = parseFloat(row.querySelector('.amount').value || 0);
    total += amount;
  });
  totalCostEl.textContent = formatAmount(total);
  const gst = total*(parseFloat(gstPercentInput.value)/100);
  gstAmountEl.textContent = formatAmount(gst);
  finalCostEl.textContent = formatAmount(total+gst);
}

function addRow(item='', material='', qty=1, price=0){
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input class="item" value="${item}"></td>
    <td><input class="material" value="${material}"></td>
    <td><input class="qty" type="number" value="${qty}" min="1"></td>
    <td><input class="price" type="number" value="${price}"></td>
    <td><input class="amount" value="${formatAmount(qty*price)}" readonly></td>
    <td><button class="deleteBtn">Delete</button></td>
  `;
  invoiceTable.appendChild(row);

  row.querySelectorAll('input').forEach(input=>{
    input.addEventListener('input', ()=>{
      const qty = parseFloat(row.querySelector('.qty').value || 0);
      const price = parseFloat(row.querySelector('.price').value || 0);
      row.querySelector('.amount').value = formatAmount(qty*price);
      updateSummary();
    });
  });

  row.querySelector('.deleteBtn').addEventListener('click', ()=>{ row.remove(); updateSummary(); });

  updateSummary();
}

addRowBtn.addEventListener('click', ()=> addRow());
clearRowsBtn.addEventListener('click', ()=>{
  invoiceTable.innerHTML = '';
  clientNameInput.value='';
  clientGSTInput.value='';
  invoiceNumberInput.value='';
  invoiceDateInput.value='';
  updateSummary();
});

recoverInvoiceBtn.addEventListener('click', ()=>{
  const invNo = invoiceNumberInput.value;
  if(invNo && invoiceData[invNo]){
    const data = invoiceData[invNo];
    clientNameInput.value = data.clientName;
    clientGSTInput.value = data.clientGST;
    invoiceDateInput.value = data.invoiceDate;
    invoiceTable.innerHTML = '';
    data.items.forEach(item=> addRow(item.item, item.material, item.qty, item.price));
    gstPercentInput.value = data.gstPercent;
  } else {
    alert('Invoice not found');
  }
});

generatePDFBtn.addEventListener('click', ()=>{
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const headerColor = '#2e7d32';
  const footerColor = '#2e7d32';

  // Watermark
  doc.setTextColor(200,200,200);
  doc.setFontSize(60);
  doc.text('Varshith Interior Solutions',105,150,{angle:45,align:'center'});

  // Header
  doc.setTextColor(255,255,255);
  doc.setFillColor(...[46,125,50]);
  doc.rect(0,0,210,20,'F');
  doc.text('Varshith Interior Solutions',105,14,{align:'center'});

  // Footer
  doc.setFillColor(...[46,125,50]);
  doc.rect(0,287,210,10,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(10);
  doc.text(`Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106 | Phone: +91 9916511599 & +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com`,105,293,{align:'center'});

  // Client Details
  doc.setTextColor(0,0,0);
  doc.setFontSize(12);
  let y = 30;
  doc.text(`Invoice No: ${invoiceNumberInput.value}`,10,y);
  doc.text(`Invoice Date: ${invoiceDateInput.value}`,150,y);
  y+=10;
  doc.text(`Client Name: ${clientNameInput.value}`,10,y);
  doc.text(`Client GST No: ${clientGSTInput.value}`,10,y+7);

  // Table
  const rows = [];
  invoiceTable.querySelectorAll('tr').forEach(row=>{
    rows.push([
      row.querySelector('.item').value,
      row.querySelector('.material').value,
      row.querySelector('.qty').value,
      row.querySelector('.price').value,
      row.querySelector('.amount').value
    ]);
  });

  doc.autoTable({
    head: [['Item','Material Used','Qty','Unit Price','Amount']],
    body: rows,
    startY: y+20,
    theme:'grid'
  });

  y = doc.lastAutoTable.finalY+10;
  doc.text(`Total Cost: ${totalCostEl.textContent}`,10,y);
  doc.text(`GST: ${gstAmountEl.textContent}`,70,y);
  doc.text(`Final Cost: ${finalCostEl.textContent}`,120,y);
  y+=7;
  doc.text(`Amount in Words: ${amountInWords(parseFloat(finalCostEl.textContent))}`,10,y);

  // 2D → 3D Images
  const designList = document.querySelectorAll('.design-thumb');
  let imgY = y+10;
  designList.forEach((img, index)=>{
    if(imgY>250){ doc.addPage(); imgY=20; }
    doc.addImage(img.src,'JPEG',10,imgY,50,30);
    doc.text(img.alt,65,imgY+15);
    imgY+=40;
  });

  doc.save(`Invoice_${invoiceNumberInput.value}.pdf`);

  // Save invoice to localStorage
  const invNo = invoiceNumberInput.value;
  invoiceData[invNo] = {
    clientName: clientNameInput.value,
    clientGST: clientGSTInput.value,
    invoiceDate: invoiceDateInput.value,
    gstPercent: gstPercentInput.value,
    items: rows.map(r=>({item:r[0],material:r[1],qty:r[2],price:r[3]}))
  };
  localStorage.setItem('invoices', JSON.stringify(invoiceData));
});
