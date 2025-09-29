/* ========= DOM Elements ========= */
const invoiceTbody = document.querySelector('#invoiceTable tbody');
const addRowBtn = document.getElementById('addRowBtn');
const clearRowsBtn = document.getElementById('clearRowsBtn');
const gstPercentEl = document.getElementById('gstPercent');
const totalCostEl = document.getElementById('totalCost');
const gstAmountEl = document.getElementById('gstAmount');
const finalCostEl = document.getElementById('finalCost');
const generatePDFBtn = document.getElementById('generatePDFBtn');
const logoUpload = document.getElementById('logoUpload');
const logoImg = document.getElementById('logoImg');

const upload2D = document.getElementById('upload2D');
const designListEl = document.getElementById('designList');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const preview3D = document.getElementById('preview3D');

const clientNameEl = document.getElementById('clientName');
const clientGSTEl = document.getElementById('clientGST');
const invoiceNumberEl = document.getElementById('invoiceNumber');
const invoiceDateEl = document.getElementById('invoiceDate');
const ourGSTEl = document.getElementById('ourGST');

const exportJsonBtn = document.getElementById('exportJsonBtn');
const importJsonBtn = document.getElementById('importJsonBtn');
const importJsonFile = document.getElementById('importJsonFile');

let logoDataURL = null;
let designs = [];
let invoiceDataStorage = {}; // key: invoiceNumber, value: invoice object

/* ===== Utilities ===== */
function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function uid(prefix='id'){ return prefix + Math.random().toString(36).slice(2,9); }
function formatNumber(x){ return parseFloat(x||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2}); }

// Number to words (simple for integer part only)
function numberToWords(amount){
  const th = ['','Thousand','Million','Billion','Trillion'];
  const dg = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine'];
  const tn = ['Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tw = ['Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  amount = Math.floor(amount);
  if(amount==0) return 'Zero';
  let words = '';
  let i=0;
  while(amount>0){
    let num = amount%1000;
    if(num){
      let str='';
      let hundreds = Math.floor(num/100);
      let rem = num%100;
      if(hundreds) str += dg[hundreds]+' Hundred ';
      if(rem>0){
        if(rem<20) str += tn[rem-10]||dg[rem]+' ';
        else str += tw[Math.floor(rem/10)-2]+' '+(rem%10>0?dg[rem%10]+' ':'');
      }
      words = str + (th[i]?th[i]+' ':'') + words;
    }
    amount = Math.floor(amount/1000);
    i++;
  }
  return words.trim();
}

/* ===== Invoice Table Functions ===== */
function createRow(item='', material='', qty=1, unitPrice=0){
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input class="item" type="text" value="${escapeHtml(item)}"></td>
    <td><input class="material" type="text" value="${escapeHtml(material)}"></td>
    <td><input class="qty" type="number" min="0" step="1" value="${qty}"></td>
    <td><input class="unitPrice" type="number" min="0" step="0.01" value="${unitPrice}"></td>
    <td><input class="amount" type="text" readonly value="${formatNumber(qty*unitPrice)}"></td>
    <td><button class="deleteBtn">Delete</button></td>
  `;
  invoiceTbody.appendChild(tr);

  const qtyEl = tr.querySelector('.qty');
  const upEl = tr.querySelector('.unitPrice');
  const amountEl = tr.querySelector('.amount');

  function updateLine(){ 
    const q = parseFloat(qtyEl.value)||0;
    const p = parseFloat(upEl.value)||0;
    amountEl.value = formatNumber(q*p);
    recalcTotals();
  }
  qtyEl.addEventListener('input',updateLine);
  upEl.addEventListener('input',updateLine);

  tr.querySelector('.deleteBtn').addEventListener('click',()=>{
    tr.remove();
    recalcTotals();
  });
}

function recalcTotals(){
  let total = 0;
  invoiceTbody.querySelectorAll('tr').forEach(tr=>{
    total += parseFloat(tr.querySelector('.amount').value.replace(/,/g,''))||0;
  });
  totalCostEl.textContent = formatNumber(total);
  const gstPercent = parseFloat(gstPercentEl.value)||0;
  const gstAmount = total*(gstPercent/100);
  gstAmountEl.textContent = formatNumber(gstAmount);
  finalCostEl.textContent = formatNumber(total+gstAmount);
}

/* ===== 2D → 3D Designer ===== */
function renderDesigns(){
  designListEl.innerHTML='';
  designs.forEach((d,i)=>{
    const div = document.createElement('div');
    div.className='design-item';
    div.innerHTML=`
      <img class="design-thumb" src="${d.dataURL}">
      <div class="design-info">
        <input type="text" class="design-name" value="${escapeHtml(d.name)}">
      </div>
      <div class="design-controls">
        <button class="gen3DBtn">Generate 3D</button>
        <button class="delDesignBtn">Delete</button>
      </div>
    `;
    designListEl.appendChild(div);

    div.querySelector('.delDesignBtn').addEventListener('click',()=>{
      designs.splice(i,1);
      renderDesigns();
    });

    div.querySelector('.gen3DBtn').addEventListener('click',()=>{
      preview3D.innerHTML=`<img src="${d.dataURL}" style="width:100%;height:100%;object-fit:contain;">`;
    });

    div.querySelector('.design-name').addEventListener('input',e=>{
      d.name = e.target.value;
    });
  });
}

/* ===== Event Listeners ===== */
addRowBtn.addEventListener('click',()=>createRow());
clearRowsBtn.addEventListener('click',()=>{
  invoiceTbody.innerHTML='';
  recalcTotals();
  clientNameEl.value='';
  clientGSTEl.value='';
  invoiceNumberEl.value='';
  invoiceDateEl.value='';
  ourGSTEl.value='';
  designs=[];
  renderDesigns();
  preview3D.innerHTML='';
});

logoUpload.addEventListener('change',e=>{
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = ev => {
    logoImg.src = ev.target.result;
    logoDataURL = ev.target.result;
  };
  reader.readAsDataURL(file);
});

upload2D.addEventListener('change',e=>{
  Array.from(e.target.files).forEach(f=>{
    const reader = new FileReader();
    reader.onload = ev=>{
      designs.push({name:f.name, dataURL:ev.target.result});
      renderDesigns();
    };
    reader.readAsDataURL(f);
  });
});

/* ===== Generate PDF ===== */
generatePDFBtn.addEventListener('click',()=>{
  const invoiceNumber = invoiceNumberEl.value.trim();
  if(!invoiceNumber){ alert('Invoice number is required'); return; }
  if(invoiceDataStorage[invoiceNumber]){
    alert('Duplicate invoice number!'); return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p','pt','a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const addWatermark = ()=>{
    doc.setFontSize(60);
    doc.setTextColor(200,200,200);
    doc.text('Varshith Interior Solutions', pageWidth/2, pageHeight/2, {align:'center', angle:45});
  };

  const header = ()=>{
    doc.setFillColor(46,125,50);
    doc.rect(0,0,pageWidth,60,'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(18);
    doc.text('Varshith Interior Solutions', 40,40);
    if(logoDataURL) doc.addImage(logoDataURL,'PNG',pageWidth-80,5,60,50);
  };

  const footer = (pageNum,totalPages)=>{
    doc.setFillColor(46,125,50);
    doc.rect(0,pageHeight-40,pageWidth,40,'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(10);
    doc.text(`Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106 | Phone: +91 9916511599 & +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com | GST: ${clientGSTEl.value}`,40,pageHeight-20);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth-80,pageHeight-20);
  };

  addWatermark();
  header();

  const invoiceTable = [];
  invoiceTbody.querySelectorAll('tr').forEach(tr=>{
    invoiceTable.push([
      tr.querySelector('.item').value,
      tr.querySelector('.material').value,
      tr.querySelector('.qty').value,
      tr.querySelector('.unitPrice').value,
      tr.querySelector('.amount').value
    ]);
  });

  doc.autoTable({
    startY:70,
    head:[['Item','Material Used','Qty','Unit Price','Amount']],
    body:invoiceTable,
    theme:'grid',
    headStyles:{fillColor:[46,125,50]},
    didDrawPage: (data)=>{
      const pageNum = doc.internal.getNumberOfPages();
      footer(pageNum, pageNum);
    }
  });

  // Totals
  const finalCost = parseFloat(finalCostEl.textContent.replace(/,/g,''))||0;
  let y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Total Cost: ${totalCostEl.textContent}`,40,y);
  doc.text(`GST: ${gstAmountEl.textContent}`,200,y);
  doc.text(`Final Cost: ${formatNumber(finalCost)}`,300,y);

  y+=20;
  doc.text(`Amount in words: ${numberToWords(finalCost)} only`,40,y);

  // Designs
  if(designs.length){
    y+=30;
    doc.text('Designs:',40,y);
    designs.forEach(d=>{
      y+=15;
      doc.text(`- ${d.name}`,50,y);
    });
  }

  doc.save(`Invoice_${invoiceNumber}.pdf`);

  // Save in storage
  invoiceDataStorage[invoiceNumber]={
    clientName:clientNameEl.value,
    clientGST:clientGSTEl.value,
    ourGST:ourGSTEl.value,
    invoiceDate:invoiceDateEl.value,
    invoiceItems:invoiceTable,
    totalCost:totalCostEl.textContent,
    gstAmount:gstAmountEl.textContent,
    finalCost:finalCostEl.textContent,
    designs:JSON.parse(JSON.stringify(designs))
  };

  alert('Invoice PDF generated and saved!');
});
