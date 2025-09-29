// script.js
let invoiceData = JSON.parse(localStorage.getItem('invoices')) || {};
let designSnapshots = {};

const numberToWords = (num) => {
  // Simple conversion for PDF
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const teens = ['Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  if(num===0) return 'Zero';
  let word = '';
  const n = Math.floor(num);
  if(n >= 1000){ word += ones[Math.floor(n/1000)] + ' Thousand '; num%=1000; }
  if(n >= 100){ word += ones[Math.floor(n/100)] + ' Hundred '; num%=100; }
  if(n >= 20){ word += tens[Math.floor(n/10)] + ' '; num%=10; }
  else if(n>=10){ word += teens[n-10] + ' '; num=0; }
  if(num>0) word += ones[num] + ' ';
  return word.trim();
};

// --- Utility ---
const $ = id => document.getElementById(id);

// --- Invoice Rows ---
const addRowBtn = $('addRowBtn');
const invoiceTable = $('invoiceTable').querySelector('tbody');
addRowBtn.onclick = () => addInvoiceRow();
function addInvoiceRow(item={}, qty=1, price=0){
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input value="${item.name||''}"></td>
    <td><input value="${item.material||''}"></td>
    <td><input type="number" value="${qty}" min="1"></td>
    <td><input type="number" value="${price}" min="0" step="0.01"></td>
    <td class="amount">0</td>
    <td><button class="deleteBtn">X</button></td>
  `;
  tr.querySelector('.deleteBtn').onclick = () => {tr.remove(); calculateTotal();}
  [0,1,2,3].forEach(i=>tr.children[i].querySelector('input').oninput=calculateTotal);
  invoiceTable.appendChild(tr);
  calculateTotal();
}

// --- Calculate Totals ---
function calculateTotal(){
  let total=0, gstPercent=parseFloat($('gstPercent').value)||0;
  invoiceTable.querySelectorAll('tr').forEach(tr=>{
    const qty=parseFloat(tr.children[2].querySelector('input').value)||0;
    const price=parseFloat(tr.children[3].querySelector('input').value)||0;
    const amt=qty*price;
    tr.children[4].textContent=amt.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
    total+=amt;
  });
  const gstAmt=total*gstPercent/100;
  const final=total+gstAmt;
  $('totalCost').textContent=total.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  $('gstAmount').textContent=gstAmt.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  $('finalCost').textContent=final.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  return final;
}

// --- Clear All ---
$('clearRowsBtn').onclick = ()=>{
  invoiceTable.innerHTML='';
  $('clientName').value='';
  $('clientGST').value='';
  $('invoiceNumber').value='';
  $('invoiceDate').value='';
  $('companyGST').value='';
  $('totalCost').textContent='0.00';
  $('gstAmount').textContent='0.00';
  $('finalCost').textContent='0.00';
  $('note').value='';
  designSnapshots={};
}

// --- Recover Invoice ---
$('recoverInvoiceBtn').onclick = ()=>{
  const invNo = $('invoiceNumber').value.trim();
  if(!invNo){ alert('Enter Invoice Number'); return; }
  if(invoiceData[invNo]){
    const data = invoiceData[invNo];
    $('clientName').value = data.clientName;
    $('clientGST').value = data.clientGST;
    $('invoiceDate').value = data.date;
    $('companyGST').value = data.companyGST;
    $('gstPercent').value = data.gstPercent;
    $('note').value = data.note;
    invoiceTable.innerHTML='';
    data.items.forEach(it=>addInvoiceRow(it,it.qty,it.price));
    designSnapshots = data.designs || {};
  } else {
    alert('Invoice not found');
  }
}

// --- 2D Upload ---
$('upload2D').onchange = e=>{
  const files = e.target.files;
  for(let f of files){
    const reader = new FileReader();
    reader.onload=ev=>{
      const dataURL=ev.target.result;
      const div = document.createElement('div');
      div.className='design-item';
      div.innerHTML=`
        <img class="design-thumb" src="${dataURL}">
        <div class="design-info">
          <input value="${f.name}" class="design-name">
        </div>
      `;
      $('designList').appendChild(div);
      designSnapshots[f.name]=dataURL;
    }
    reader.readAsDataURL(f);
  }
}

// --- PDF Generation ---
$('generatePDFBtn').onclick = ()=>{
  const {jsPDF}=window.jspdf;
  const doc = new jsPDF();
  const pageWidth=doc.internal.pageSize.width;
  const pageHeight=doc.internal.pageSize.height;

  // --- Header ---
  doc.setFillColor(46,125,50);
  doc.rect(0,0,pageWidth,25,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(16);
  doc.text('Varshith Interior Solutions',10,15);
  doc.setFontSize(10);
  doc.text('NO 39 BRN Ashish Layout, Near Sri Thimmaraya Swami Gudi, Anekal - 562106',10,22);

  // --- Watermark ---
  doc.setTextColor(0,0,0);
  doc.setFontSize(50);
  doc.setTextColor(0,0,0,0.05);
  doc.text('Varshith Interior Solutions',pageWidth/2, pageHeight/2, {angle:45, align:'center'});

  // --- Items ---
  const tableRows = [];
  invoiceTable.querySelectorAll('tr').forEach(tr=>{
    const row=[];
    for(let i=0;i<5;i++){
      row.push(tr.children[i].textContent);
    }
    tableRows.push(row);
  });
  doc.autoTable({head:[['Item','Material','Qty','Unit Price','Amount']], body: tableRows, startY:30});

  // --- Totals ---
  let final=parseFloat($('finalCost').textContent.replace(/,/g,''))||0;
  let finalY=doc.lastAutoTable.finalY+10;
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(`Total Cost: ${$('totalCost').textContent}`,10,finalY);
  doc.text(`GST Amount: ${$('gstAmount').textContent}`,10,finalY+6);
  doc.text(`Final Cost: ${$('finalCost').textContent}`,10,finalY+12);
  doc.text(`Amount in Words: ${numberToWords(final)} Only`,10,finalY+18);
  doc.text($('note').value,10,finalY+24);

  // --- 2D → 3D Designs ---
  let designY = finalY+30;
  for(let key in designSnapshots){
    if(designY>pageHeight-60){ doc.addPage(); designY=20;}
    doc.setFontSize(10);
    doc.text(key,10,designY);
    doc.addImage(designSnapshots[key],'JPEG',10,designY+2,50,40);
    designY+=45;
  }

  // --- Footer ---
  const footerText = [
    `Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106`,
    `Phone: +91 9916511599 & +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com`,
    `GST: ${$('companyGST').value}`,
  ];
  doc.setFillColor(46,125,50);
  doc.rect(0,pageHeight-20,pageWidth,20,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(10);
  footerText.forEach((txt,i)=>doc.text(txt,10,pageHeight-15+i*5));
  doc.setTextColor(0);
  doc.save(`Invoice_${$('invoiceNumber').value || 'New'}.pdf`);

  // --- Save Invoice Data ---
  const invNo = $('invoiceNumber').value.trim();
  if(invNo){
    invoiceData[invNo] = {
      clientName: $('clientName').value,
      clientGST: $('clientGST').value,
      date: $('invoiceDate').value,
      companyGST: $('companyGST').value,
      gstPercent: $('gstPercent').value,
      note: $('note').value,
      items: Array.from(invoiceTable.querySelectorAll('tr')).map(tr=>({
        name: tr.children[0].querySelector('input').value,
        material: tr.children[1].querySelector('input').value,
        qty: tr.children[2].querySelector('input').value,
        price: tr.children[3].querySelector('input').value,
      })),
      designs: designSnapshots
    };
    localStorage.setItem('invoices', JSON.stringify(invoiceData));
  }
}
