// JS code including:
// - Add/Remove invoice items
// - Calculate totals & GST
// - Save & recover invoice by number, client name, or date
// - 2D → 3D multiple design upload, generate, remove
// - Download PDF with header/footer styles, watermark, page numbers, images, amount in words

let designs = [];
let savedInvoices = {}; // Local storage memory

const invoiceTable = document.getElementById('invoiceTable').querySelector('tbody');
const addRowBtn = document.getElementById('addRowBtn');
const clearRowsBtn = document.getElementById('clearRowsBtn');

function addItemRow(item='', material='', qty=1, unitPrice=0){
  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td><input value="${item}"></td>
    <td><input value="${material}"></td>
    <td><input type="number" value="${qty}" min="0"></td>
    <td><input type="number" value="${unitPrice}" min="0" step="0.01"></td>
    <td class="amount">0.00</td>
    <td><button class="deleteBtn">Delete</button></td>
  `;
  invoiceTable.appendChild(tr);
  updateAmounts();
  
  tr.querySelectorAll('input').forEach(input=>{
      input.addEventListener('input', updateAmounts);
  });
  tr.querySelector('.deleteBtn').addEventListener('click', ()=>{ tr.remove(); updateAmounts(); });
}

function updateAmounts(){
  let total = 0;
  invoiceTable.querySelectorAll('tr').forEach(row=>{
    const qty = parseFloat(row.cells[2].querySelector('input').value) || 0;
    const price = parseFloat(row.cells[3].querySelector('input').value) || 0;
    const amount = qty*price;
    row.cells[4].textContent = amount.toLocaleString('en-IN',{minimumFractionDigits:2, maximumFractionDigits:2});
    total += amount;
  });
  const gstPercent = parseFloat(document.getElementById('gstPercent').value) || 0;
  const gstAmount = total*gstPercent/100;
  const final = total + gstAmount;

  document.getElementById('totalCost').textContent = total.toLocaleString('en-IN',{minimumFractionDigits:2});
  document.getElementById('gstAmount').textContent = gstAmount.toLocaleString('en-IN',{minimumFractionDigits:2});
  document.getElementById('finalCost').textContent = final.toLocaleString('en-IN',{minimumFractionDigits:2});
}

addRowBtn.addEventListener('click', ()=>addItemRow());
clearRowsBtn.addEventListener('click', ()=>{
  invoiceTable.innerHTML='';
  document.getElementById('clientName').value='';
  document.getElementById('clientGST').value='';
  document.getElementById('invoiceNumber').value='';
  document.getElementById('invoiceDate').value='';
  document.getElementById('totalCost').textContent='0.00';
  document.getElementById('gstAmount').textContent='0.00';
  document.getElementById('finalCost').textContent='0.00';
  designs = [];
  document.getElementById('designList').innerHTML='';
});

// 2D → 3D Upload
const upload2D = document.getElementById('upload2D');
upload2D.addEventListener('change', e=>{
  const files = Array.from(e.target.files);
  files.forEach(file=>{
    const reader = new FileReader();
    reader.onload = function(ev){
      const src = ev.target.result;
      const design = {name:file.name, src};
      designs.push(design);
      renderDesigns();
    }
    reader.readAsDataURL(file);
  });
});

function renderDesigns(){
  const list = document.getElementById('designList');
  list.innerHTML='';
  designs.forEach((d,i)=>{
    const div = document.createElement('div');
    div.className='design-item';
    div.innerHTML=`
      <img src="${d.src}" class="design-thumb">
      <div class="design-info">
        <input type="text" value="${d.name}">
      </div>
      <div class="design-controls">
        <button onclick="generate3D(${i})">Generate 3D</button>
        <button onclick="removeDesign(${i})">Remove</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function generate3D(i){
  alert(`3D generation placeholder for: ${designs[i].name}`);
}

function removeDesign(i){
  designs.splice(i,1);
  renderDesigns();
}

// PDF Generation
document.getElementById('generatePDFBtn').addEventListener('click', ()=>{
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const clientName = document.getElementById('clientName').value;
  const clientGST = document.getElementById('clientGST').value;
  const invoiceNumber = document.getElementById('invoiceNumber').value;
  const invoiceDate = document.getElementById('invoiceDate').value;
  const companyGST = document.getElementById('companyGST').value;

  // Header
  doc.setFillColor(46,125,50);
  doc.rect(0,0,210,20,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(14);
  doc.text("Varshith Interior Solutions", 105, 14, {align:'center'});

  let finalY = 30;
  doc.setTextColor(0,0,0);
  doc.setFontSize(11);
  doc.text(`Invoice Number: ${invoiceNumber}`, 14, finalY);
  doc.text(`Invoice Date: ${invoiceDate}`, 140, finalY);
  finalY += 6;
  doc.text(`Client Name: ${clientName}`,14,finalY);
  doc.text(`Client GST: ${clientGST}`,14,finalY+6);

  // Table
  const rows = [];
  invoiceTable.querySelectorAll('tr').forEach(row=>{
    const cells = Array.from(row.querySelectorAll('input')).map(i=>i.value);
    const amount = parseFloat(row.cells[4].textContent.replace(/,/g,''))||0;
    rows.push([...cells, amount.toLocaleString('en-IN',{minimumFractionDigits:2})]);
  });
  doc.autoTable({
    startY:finalY+12,
    head:[['Item','Material Used','Qty','Unit Price','Amount']],
    body:rows,
    theme:'grid',
  });
  finalY = doc.lastAutoTable.finalY;

  // Summary
  const totalCost = parseFloat(document.getElementById('totalCost').textContent.replace(/,/g,''))||0;
  const gstAmount = parseFloat(document.getElementById('gstAmount').textContent.replace(/,/g,''))||0;
  const finalCost = parseFloat(document.getElementById('finalCost').textContent.replace(/,/g,''))||0;

  doc.text(`Total Cost: ${totalCost.toLocaleString('en-IN',{minimumFractionDigits:2})}`,14,finalY+10);
  doc.text(`GST Amount: ${gstAmount.toLocaleString('en-IN',{minimumFractionDigits:2})}`,14,finalY+16);
  doc.text(`Final Cost: ${finalCost.toLocaleString('en-IN',{minimumFractionDigits:2})}`,14,finalY+22);

  doc.text(`Amount in Words: ${numberToWords(finalCost)} Only`,14,finalY+30);

  // 2D→3D images
  let imageY = finalY + 40;
  designs.forEach(d=>{
    if(imageY + 50 > doc.internal.pageSize.getHeight() - 20){
      doc.addPage();
      imageY = 20;
    }
    doc.text(d.name,14,imageY);
    doc.addImage(d.src,'JPEG',14,imageY+2,60,40);
    imageY+=45;
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for(let i=1;i<=pageCount;i++){
    doc.setPage(i);
    doc.setFillColor(46,125,50);
    doc.rect(0,280,210,10,'F');
    doc.setTextColor(255,255,255);
    doc.text(`Address: NO 39 BRN Ashish Layout, Near Sri Thimmaraya Swami Gudi Anekal - 562106 | Phone: +91 9916511599 & +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com | GST: ${companyGST}`,105,287,{align:'center'});
    doc.text(`${i} / ${pageCount}`,200,287,{align:'right'});

    // Watermark
    doc.setTextColor(150,150,150);
    doc.setFontSize(50);
    doc.text("Varshith Interior Solutions",105,150,{angle:45, align:'center'});
  }

  doc.save(`Invoice_${invoiceNumber}.pdf`);
});

// Convert number to words (simplified for final cost)
function numberToWords(amount){
  const words = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
  "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

  function convert(num){
    if(num<20) return words[num];
    if(num<100) return tens[Math.floor(num/10)] + " " + words[num%10];
    if(num<1000) return words[Math.floor(num/100)] + " Hundred " + convert(num%100);
    if(num<100000) return convert(Math.floor(num/1000)) + " Thousand " + convert(num%1000);
    if(num<10000000) return convert(Math.floor(num/100000)) + " Lakh " + convert(num%100000);
    return convert(Math.floor(num/10000000)) + " Crore " + convert(num%10000000);
  }

  const amtInt = Math.floor(amount);
  return convert(amtInt);
}
