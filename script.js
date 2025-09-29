/* ======= DOM elements ======= */
const invoiceTbody = document.querySelector('#invoiceTable tbody');
const addRowBtn = document.getElementById('addRowBtn');
const clearRowsBtn = document.getElementById('clearRowsBtn');
const gstPercentEl = document.getElementById('gstPercent');
const totalCostEl = document.getElementById('totalCost');
const gstAmountEl = document.getElementById('gstAmount');
const finalCostEl = document.getElementById('finalCost');
const amountInWordsEl = document.getElementById('amountInWords');
const generatePDFBtn = document.getElementById('generatePDFBtn');
const logoUpload = document.getElementById('logoUpload');
const logoImg = document.getElementById('logoImg');
const upload2D = document.getElementById('upload2D');
const designListEl = document.getElementById('designList');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const preview3D = document.getElementById('preview3D');

const clientNameEl = document.getElementById('clientName');
const invoiceNumberEl = document.getElementById('invoiceNumber');
const invoiceDateEl = document.getElementById('invoiceDate');
const clientGSTEl = document.getElementById('clientGST');
const gstNumberEl = document.getElementById('gstNumber');

const exportJsonBtn = document.getElementById('exportJsonBtn');
const importJsonBtn = document.getElementById('importJsonBtn');
const importJsonFile = document.getElementById('importJsonFile');

let logoDataURL = null;
let designs = [];

/* ======= Utilities ======= */
function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function uid(prefix='id'){ return prefix + Math.random().toString(36).slice(2,9); }
function getImageTypeFromDataURL(dataURL){
  if(!dataURL) return 'PNG';
  const h = dataURL.substring(0,30).toLowerCase();
  if(h.includes('data:image/jpeg')||h.includes('data:image/jpg')) return 'JPEG';
  if(h.includes('data:image/png')) return 'PNG';
  return 'PNG';
}

/* Format number with commas */
function formatNumber(n){ return parseFloat(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}); }

/* Convert number to words (Indian currency) */
function numberToWords(num){
  if(isNaN(num)) return '';
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function inWords(n){
    if(n<20) return a[n];
    if(n<100) return b[Math.floor(n/10)] + (n%10? ' '+a[n%10]:'');
    if(n<1000) return a[Math.floor(n/100)] + ' Hundred ' + (n%100? 'and '+inWords(n%100):'');
    if(n<100000) return inWords(Math.floor(n/1000)) + ' Thousand ' + (n%1000? inWords(n%1000):'');
    if(n<10000000) return inWords(Math.floor(n/100000)) + ' Lakh ' + (n%100000? inWords(n%100000):'');
    return inWords(Math.floor(n/10000000)) + ' Crore ' + (n%10000000? inWords(n%10000000):'');
  }
  let parts = num.toFixed(2).split('.');
  return inWords(parseInt(parts[0]))+' Rupees'+(parts[1]&&parts[1]!='00'? ' and '+inWords(parseInt(parts[1]))+' Paise':'');
}

/* ======= Invoice rows ======= */
function updateTotals(){
  let total=0;
  invoiceTbody.querySelectorAll('tr').forEach(tr=>{
    const qty = parseFloat(tr.querySelector('.qty').value)||0;
    const price = parseFloat(tr.querySelector('.unitPrice').value)||0;
    const amt = qty*price;
    tr.querySelector('.amount').textContent = formatNumber(amt);
    total += amt;
  });
  const gstPercent = parseFloat(gstPercentEl.value)||0;
  const gstAmt = total*gstPercent/100;
  const final = total+gstAmt;
  totalCostEl.textContent = formatNumber(total);
  gstAmountEl.textContent = formatNumber(gstAmt);
  finalCostEl.textContent = formatNumber(final);
  amountInWordsEl.textContent = numberToWords(final);
}

function addItemRow(item='',material='',qty='',price=''){
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="item" value="${escapeHtml(item)}"></td>
    <td><input type="text" class="material" value="${escapeHtml(material)}"></td>
    <td><input type="number" class="qty" value="${qty}" min="0"></td>
    <td><input type="number" class="unitPrice" value="${price}" min="0" step="0.01"></td>
    <td class="amount">${formatNumber((qty||0)*(price||0))}</td>
    <td><button class="deleteBtn">Delete</button></td>
  `;
  tr.querySelectorAll('input').forEach(inp=>inp.addEventListener('input',updateTotals));
  tr.querySelector('.deleteBtn').addEventListener('click',()=>{tr.remove();updateTotals();});
  invoiceTbody.appendChild(tr);
  updateTotals();
}

/* ======= Event Listeners ======= */
addRowBtn.addEventListener('click',()=>addItemRow());
clearRowsBtn.addEventListener('click',()=>{
  invoiceTbody.innerHTML='';
  clientNameEl.value=''; invoiceNumberEl.value=''; invoiceDateEl.value='';
  clientGSTEl.value=''; gstNumberEl.value='';
  updateTotals();
});
gstPercentEl.addEventListener('input',updateTotals);

logoUpload.addEventListener('change', e=>{
  const file=e.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{logoImg.src=reader.result; logoDataURL=reader.result;}
  reader.readAsDataURL(file);
});

/* ======= 2D → 3D ======= */
upload2D.addEventListener('change', e=>{
  const files = Array.from(e.target.files);
  files.forEach(file=>{
    const reader = new FileReader();
    reader.onload = ()=>{
      const id = uid('design');
      const div = document.createElement('div');
      div.className='design-item';
      div.innerHTML = `
        <img src="${reader.result}" class="design-thumb"/>
        <div class="design-info">
          <input class="designName" value="${escapeHtml(file.name)}">
        </div>
        <div class="design-controls">
          <button class="generate3D">Generate 3D</button>
        </div>
      `;
      designListEl.appendChild(div);
      designs.push({id,src:reader.result,name:file.name,snapshot:null});
      div.querySelector('.generate3D').addEventListener('click',()=>{
        // simulate 3D render, capture snapshot
        designs.find(d=>d.id===id).snapshot = reader.result; // Using 2D as snapshot
        alert('3D Generated for '+file.name);
      });
    };
    reader.readAsDataURL(file);
  });
});

/* ======= PDF generation ======= */
generatePDFBtn.addEventListener('click',()=>{
  if(!invoiceNumberEl.value){
    alert('Invoice Number required'); return;
  }
  // prevent duplicate invoice
  let savedInvoices = JSON.parse(localStorage.getItem('savedInvoices')||'{}');
  if(savedInvoices[invoiceNumberEl.value]){
    alert('Invoice number already exists!'); return;
  }

  const {jsPDF} = window.jspdf;
  const doc = new jsPDF('p','mm','a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // watermark
  doc.setFontSize(50); doc.setTextColor(200,200,200); doc.text('Varshith Interior Solutions', pageWidth/4, pageHeight/2, {angle:45});

  // Header
  doc.setFillColor(46,125,50);
  doc.rect(0,0,pageWidth,25,'F');
  doc.setFontSize(14); doc.setTextColor(255,255,255);
  doc.text('Varshith Interior Solutions',10,15);
  doc.setFontSize(10);
  doc.text('Address: NO 39 BRN Ashish Layout, Near Sri Thimmaraya Swami Gudi, Anekal - 562106',10,22);
  doc.text('Phone: +91 9916511599, +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com',10,28);

  // Logo
  if(logoDataURL){
    doc.addImage(logoDataURL,'PNG',pageWidth-40,3,35,20);
  }

  // Invoice meta
  doc.setFontSize(12);
  doc.text(`Invoice Number: ${invoiceNumberEl.value}`,10,40);
  doc.text(`Invoice Date: ${invoiceDateEl.value}`,10,47);
  doc.text(`Client Name: ${clientNameEl.value}`,10,54);
  doc.text(`Client GST Number: ${clientGSTEl.value}`,10,61);

  // Invoice table
  const tableData = [];
  invoiceTbody.querySelectorAll('tr').forEach(tr=>{
    const item=tr.querySelector('.item').value;
    const material=tr.querySelector('.material').value;
    const qty=tr.querySelector('.qty').value;
    const price=tr.querySelector('.unitPrice').value;
    const amount=tr.querySelector('.amount').textContent;
    tableData.push([item,material,qty,price,amount]);
  });

  doc.autoTable({
    head:[['Item','Material Used','Qty','Unit Price','Amount']],
    body: tableData,
    startY:70,
    theme:'grid',
    headStyles:{fillColor:[46,125,50]}
  });

  let finalY = doc.lastAutoTable.finalY + 5;
  doc.text(`Total Cost: ${totalCostEl.textContent}`,10,finalY);
  finalY +=7;
  doc.text(`GST Amount: ${gstAmountEl.textContent}`,10,finalY);
  finalY +=7;
  doc.text(`Final Cost: ${finalCostEl.textContent}`,10,finalY);
  finalY +=7;
  doc.text(`Amount in Words: ${amountInWordsEl.textContent}`,10,finalY);
  finalY +=10;
  doc.text(`Payment note: ${note.value}`,10,finalY);
  finalY +=10;

  // 3D Designs
  designs.forEach((d,i)=>{
    if(d.snapshot){
      if(finalY+40>pageHeight-20) doc.addPage(), finalY=20;
      doc.addImage(d.snapshot,getImageTypeFromDataURL(d.snapshot),10,finalY,60,40);
      doc.text(d.name,75,finalY+20);
      finalY +=45;
    }
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for(let i=1;i<=pageCount;i++){
    doc.setPage(i);
    doc.setFillColor(46,125,50);
    doc.rect(0,pageHeight-20,pageWidth,20,'F');
    doc.setFontSize(10); doc.setTextColor(255,255,255);
    doc.text(`Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106`,10,pageHeight-14);
    doc.text(`Phone: +91 9916511599 & +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com | GST: ${gstNumberEl.value}`,10,pageHeight-7);
    doc.text(`Page ${i} of ${pageCount}`,pageWidth-30,pageHeight-7);
  }

  // save PDF
  doc.save(`${invoiceNumberEl.value}.pdf`);

  // save to localStorage
  savedInvoices[invoiceNumberEl.value] = {
    invoiceNumber:invoiceNumberEl.value,
    invoiceDate:invoiceDateEl.value,
    clientName:clientNameEl.value,
    clientGST:clientGSTEl.value,
    gstNumber:gstNumberEl.value,
    items:tableData,
    note:note.value,
    logo:logoDataURL,
    designs:designs
  };
  localStorage.setItem('savedInvoices',JSON.stringify(savedInvoices));
  alert('Invoice saved and downloaded!');
});

/* ======= Export / Import JSON ======= */
exportJsonBtn.addEventListener('click',()=>{
  const data = localStorage.getItem('savedInvoices')||'{}';
  const blob = new Blob([data],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download='invoices.json'; a.click();
});

importJsonBtn.addEventListener('click',()=>importJsonFile.click());
importJsonFile.addEventListener('change',e=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload=()=>{
    try{
      const data = JSON.parse(reader.result);
      localStorage.setItem('savedInvoices',JSON.stringify(data));
      alert('Invoices imported successfully');
    }catch(err){alert('Invalid JSON')}
  }
  reader.readAsText(file);
});

/* ======= Search Invoice ======= */
document.getElementById('searchInvoiceBtn').addEventListener('click',()=>{
  const searchInv = prompt('Enter Invoice Number:');
  if(!searchInv) return;
  const savedInvoices = JSON.parse(localStorage.getItem('savedInvoices')||'{}');
  if(!savedInvoices[searchInv]) return alert('Invoice not found');
  const inv = savedInvoices[searchInv];
  clientNameEl.value=inv.clientName;
  invoiceNumberEl.value=inv.invoiceNumber;
  invoiceDateEl.value=inv.invoiceDate;
  clientGSTEl.value=inv.clientGST;
  gstNumberEl.value=inv.gstNumber;
  invoiceTbody.innerHTML='';
  inv.items.forEach(row=>{
    addItemRow(...row);
  });
  designs = inv.designs||[];
  designListEl.innerHTML='';
  designs.forEach(d=>{
    const div = document.createElement('div');
    div.className='design-item';
    div.innerHTML = `
      <img src="${d.src}" class="design-thumb"/>
      <div class="design-info">
        <input class="designName" value="${escapeHtml(d.name)}">
      </div>
      <div class="design-controls">
        <button class="generate3D">Generate 3D</button>
      </div>
    `;
    designListEl.appendChild(div);
    div.querySelector('.generate3D').addEventListener('click',()=>{
      d.snapshot = d.src;
      alert('3D Generated for '+d.name);
    });
  });
  updateTotals();
});
