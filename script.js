// Helper functions
function formatNumber(num){
  return num.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2});
}

function numberToWords(num){
  const a=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve",
           "Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b=["","Ten","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if(num===0) return "Zero";
  if(num<20) return a[num];
  if(num<100) return b[Math.floor(num/10)]+" "+a[num%10];
  if(num<1000) return a[Math.floor(num/100)]+" Hundred "+numberToWords(num%100);
  if(num<1000000) return numberToWords(Math.floor(num/1000))+" Thousand "+numberToWords(num%1000);
  return numberToWords(Math.floor(num/1000000))+" Million "+numberToWords(num%1000000);
}

// Elements
const invoiceTable = document.getElementById('invoiceTable').querySelector('tbody');
const totalCostEl = document.getElementById('totalCost');
const gstAmountEl = document.getElementById('gstAmount');
const finalCostEl = document.getElementById('finalCost');
const amountInWordsEl = document.getElementById('amountInWords');

const clientNameEl = document.getElementById('clientName');
const clientGSTEl = document.getElementById('clientGST');
const invoiceNumberEl = document.getElementById('invoiceNumber');
const invoiceDateEl = document.getElementById('invoiceDate');
const gstNumberEl = document.getElementById('gstNumber');

const addRowBtn = document.getElementById('addRowBtn');
const clearRowsBtn = document.getElementById('clearRowsBtn');
const generatePDFBtn = document.getElementById('generatePDFBtn');

// 2D → 3D
const upload2D = document.getElementById('upload2D');
const designList = document.getElementById('designList');

// Load saved invoices from localStorage
let invoices = JSON.parse(localStorage.getItem('invoices')||'{}');

// --- Invoice Table Functions ---
function updateSummary(){
  let total = 0;
  Array.from(invoiceTable.rows).forEach(row=>{
    const qty = parseFloat(row.querySelector('.qty').value)||0;
    const price = parseFloat(row.querySelector('.unitPrice').value)||0;
    const amt = qty*price;
    row.querySelector('.amount').textContent = formatNumber(amt);
    total += amt;
  });
  const gstAmt = total*0.1;
  const final = total+gstAmt;
  totalCostEl.textContent = formatNumber(total);
  gstAmountEl.textContent = formatNumber(gstAmt);
  finalCostEl.textContent = formatNumber(final);
  amountInWordsEl.textContent = numberToWords(Math.floor(final)) + " point " + Math.round((final-Math.floor(final))*100);
}

function addRow(item='', material='', qty='', unitPrice=''){
  const row = invoiceTable.insertRow();
  row.innerHTML = `
    <td><input type="text" class="item" value="${item}"></td>
    <td><input type="text" class="material" value="${material}"></td>
    <td><input type="number" class="qty" value="${qty}" min="0"></td>
    <td><input type="number" class="unitPrice" value="${unitPrice}" min="0"></td>
    <td class="amount">${formatNumber((qty||0)*(unitPrice||0))}</td>
    <td><button class="deleteBtn">Delete</button></td>
  `;
  row.querySelectorAll('input').forEach(input=>{
    input.addEventListener('input', updateSummary);
  });
  row.querySelector('.deleteBtn').addEventListener('click', ()=>{
    row.remove();
    updateSummary();
  });
}

// --- Buttons ---
addRowBtn.addEventListener('click', ()=>addRow());
clearRowsBtn.addEventListener('click', ()=>{
  invoiceTable.innerHTML = '';
  updateSummary();
  clientNameEl.value='';
  clientGSTEl.value='';
  invoiceNumberEl.value='';
  invoiceDateEl.value='';
});

generatePDFBtn.addEventListener('click', ()=>{
  if(!invoiceNumberEl.value){
    alert('Please enter invoice number!');
    return;
  }
  if(invoices[invoiceNumberEl.value]){
    alert('Invoice number already exists!');
    return;
  }

  const {jsPDF} = window.jspdf;
  const doc = new jsPDF();

  // Watermark
  doc.setFontSize(50);
  doc.setTextColor(200,200,200);
  doc.text('Varshith Interior Solutions', 35, 150, {angle:45});

  // Header
  doc.setFontSize(16);
  doc.setTextColor(0,0,0);
  doc.text('Varshith Interior Solutions',14,20);
  doc.setFontSize(10);
  doc.text('NO 39 BRN Ashish Layout, Near Sri Thimmaraya Swami Gudi, Anekal - 562106',14,26);
  doc.text('Phone: +91 9916511599 & +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com',14,32);

  // Client Info
  doc.setFontSize(12);
  doc.text(`Client: ${clientNameEl.value}`,14,42);
  if(clientGSTEl.value) doc.text(`Client GST: ${clientGSTEl.value}`,14,48);
  doc.text(`Invoice #: ${invoiceNumberEl.value}`,14,54);
  doc.text(`Date: ${invoiceDateEl.value}`,14,60);

  // Table
  const tableData = [];
  Array.from(invoiceTable.rows).forEach(row=>{
    tableData.push([
      row.querySelector('.item').value,
      row.querySelector('.material').value,
      row.querySelector('.qty').value,
      row.querySelector('.unitPrice').value,
      row.querySelector('.amount').textContent
    ]);
  });

  doc.autoTable({
    startY:68,
    head:[['Item','Material','Qty','Unit Price','Amount']],
    body:tableData,
    theme:'grid'
  });

  // Summary
  let finalY = doc.lastAutoTable.finalY + 6;
  doc.text(`Total Cost: ${totalCostEl.textContent}`,14,finalY);
  doc.text(`GST Amount: ${gstAmountEl.textContent}`,14,finalY+6);
  doc.text(`Final Cost: ${finalCostEl.textContent}`,14,finalY+12);
  doc.text(`Amount in Words: ${amountInWordsEl.textContent}`,14,finalY+18);

  // 2D → 3D Images
  let imgY = finalY + 24;
  designList.querySelectorAll('.design-thumb').forEach((img,i)=>{
    const name = designList.querySelectorAll('.design-info div')[i].textContent;
    const canvas = document.createElement('canvas');
    canvas.width=img.width;
    canvas.height=img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img,0,0,img.width,img.height);
    const imgData = canvas.toDataURL('image/jpeg');
    doc.addImage(imgData,'JPEG',14,imgY,50,40);
    doc.text(name,70,imgY+20);
    imgY +=45;
    if(imgY>250){ doc.addPage(); imgY=20; }
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for(let i=1;i<=pageCount;i++){
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(0,0,0);
    doc.text(`Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106`,14,290);
    if(gstNumberEl.value) doc.text(`Company GST: ${gstNumberEl.value}`,14,296);
    doc.text(`Phone: +91 9916511599 & +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com`,14,302);
    doc.text(`Page ${i} of ${pageCount}`,170,302);
  }

  doc.save(`Invoice_${invoiceNumberEl.value}.pdf`);

  // Save to localStorage
  invoices[invoiceNumberEl.value] = {
    clientName:clientNameEl.value,
    clientGST:clientGSTEl.value,
    invoiceNumber:invoiceNumberEl.value,
    invoiceDate:invoiceDateEl.value,
    gstNumber:gstNumberEl.value,
    table:Array.from(invoiceTable.rows).map(r=>({
      item:r.querySelector('.item').value,
      material:r.querySelector('.material').value,
      qty:r.querySelector('.qty').value,
      unitPrice:r.querySelector('.unitPrice').value
    })),
    designs:Array.from(designList.querySelectorAll('.design-thumb')).map((img,i)=>{
      return {
        src:img.src,
        name:designList.querySelectorAll('.design-info div')[i].textContent
      }
    }),
    totalCost:totalCostEl.textContent,
    gstAmount:gstAmountEl.textContent,
    finalCost:finalCostEl.textContent,
    amountInWords:amountInWordsEl.textContent
  };
  localStorage.setItem('invoices',JSON.stringify(invoices));
});

// --- Recover Invoice ---
invoiceNumberEl.addEventListener('change', ()=>{
  const inv = invoices[invoiceNumberEl.value];
  if(inv){
    clientNameEl.value=inv.clientName;
    clientGSTEl.value=inv.clientGST;
    invoiceDateEl.value=inv.invoiceDate;
    gstNumberEl.value=inv.gstNumber;
    invoiceTable.innerHTML='';
    inv.table.forEach(r=>addRow(r.item,r.material,r.qty,r.unitPrice));
  }
});

// --- Add design ---
upload2D.addEventListener('change', ()=>{
  Array.from(upload2D.files).forEach(file=>{
    const reader = new FileReader();
    reader.onload = e=>{
      const div = document.createElement('div');
      div.className='design-item';
      div.innerHTML=`
        <img src="${e.target.result}" class="design-thumb">
        <div class="design-info"><div>${file.name}</div></div>
        <div class="design-controls">
          <button class="generate3DBtn">Generate 3D</button>
          <button class="removeDesignBtn">Remove</button>
        </div>
      `;
      div.querySelector('.removeDesignBtn').addEventListener('click', ()=>div.remove());
      div.querySelector('.generate3DBtn').addEventListener('click', ()=>{
        alert('3D generation placeholder'); // Placeholder for 3D generation
      });
      designList.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
});
