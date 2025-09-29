// Utility: format numbers with commas
function formatNumber(num) {
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Utility: convert number to words (simple)
function numberToWords(num) {
  if (num === 0) return 'zero';
  const a = ['','one','two','three','four','five','six','seven','eight','nine','ten',
             'eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen',
             'eighteen','nineteen'];
  const b = ['', '', 'twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n/10)] + (n%10 ? ' ' + a[n%10] : '');
    if (n < 1000) return a[Math.floor(n/100)] + ' hundred' + (n%100 ? ' ' + inWords(n%100) : '');
    if (n < 100000) return inWords(Math.floor(n/1000)) + ' thousand' + (n%1000 ? ' ' + inWords(n%1000) : '');
    return n.toString();
  }

  let [intPart, decPart] = num.toString().split('.');
  let words = inWords(parseInt(intPart));
  if (decPart) {
    words += ' point';
    for (let d of decPart) {
      words += ' ' + a[parseInt(d)];
    }
  }
  return words;
}

// Elements
const tbody = document.querySelector('#invoiceTable tbody');
const totalCostEl = document.getElementById('totalCost');
const gstPercentEl = document.getElementById('gstPercent');
const gstAmountEl = document.getElementById('gstAmount');
const finalCostEl = document.getElementById('finalCost');
const amountWordsEl = document.getElementById('amountWords');
const designUpload = document.getElementById('designUpload');
const designList = document.getElementById('designList');

let designs = [];

// Add Row
document.getElementById('addRow').addEventListener('click', () => {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input type="text" class="item" /></td>
    <td><input type="text" class="material" /></td>
    <td><input type="number" class="qty" value="1" min="1" /></td>
    <td><input type="number" class="rate" value="0" min="0" /></td>
    <td><input type="text" class="amount" readonly /></td>
    <td><button class="deleteBtn">Delete</button></td>
  `;
  tbody.appendChild(row);
  updateCalculations();
});

// Delete Row
tbody.addEventListener('click', e => {
  if (e.target.classList.contains('deleteBtn')) {
    e.target.closest('tr').remove();
    updateCalculations();
  }
});

// Update on qty or rate change
tbody.addEventListener('input', e => {
  if (e.target.classList.contains('qty') || e.target.classList.contains('rate')) {
    updateCalculations();
  }
});

// GST change
gstPercentEl.addEventListener('input', updateCalculations);

// Update Calculations
function updateCalculations() {
  let total = 0;
  [...tbody.querySelectorAll('tr')].forEach(row => {
    const qty = parseFloat(row.querySelector('.qty').value) || 0;
    const rate = parseFloat(row.querySelector('.rate').value) || 0;
    const amt = qty * rate;
    row.querySelector('.amount').value = formatNumber(amt);
    total += amt;
  });
  totalCostEl.textContent = formatNumber(total);
  const gstP = parseFloat(gstPercentEl.value) || 0;
  const gstAmt = total * gstP / 100;
  gstAmountEl.textContent = formatNumber(gstAmt);
  const final = total + gstAmt;
  finalCostEl.textContent = formatNumber(final);
  amountWordsEl.textContent = numberToWords(final);
}

// Handle design uploads
designUpload.addEventListener('change', e => {
  [...e.target.files].forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      designs.push({ name: file.name, src: ev.target.result });
      renderDesigns();
    };
    reader.readAsDataURL(file);
  });
});

function renderDesigns() {
  designList.innerHTML = '';
  designs.forEach((d,i) => {
    const div = document.createElement('div');
    div.className = 'design-item';
    div.innerHTML = `
      <img src="${d.src}" class="design-thumb" />
      <input type="text" value="${d.name}" data-idx="${i}" />
      <button onclick="removeDesign(${i})">Remove</button>
    `;
    designList.appendChild(div);
  });
}
function removeDesign(i) {
  designs.splice(i,1);
  renderDesigns();
}

// Download Invoice (pdfmake)
document.getElementById('downloadBtn').addEventListener('click', () => {
  const docDefinition = {
    watermark: { text: 'Varshith Interior Solutions', color: 'green', opacity: 0.05, bold: true, italics: false, angle: 45 },
    header: { text: 'Invoice - Varshith Interior Solutions', alignment: 'center', margin: [0,10], color: 'darkgreen' },
    footer: function(currentPage, pageCount) {
      return {
        columns: [
          { text: 'Address: Bangalore, India', alignment: 'center', color: 'darkgreen' },
          { text: 'Phone: +91-9876543210 | Email: info@varshithinterior.com', alignment: 'center', color: 'darkgreen' },
          { text: 'Page ' + currentPage.toString() + ' of ' + pageCount, alignment: 'center', color: 'darkgreen' }
        ],
        margin: [10,0]
      };
    },
    content: []
  };

  // Client & Invoice info
  docDefinition.content.push({
    text: `Invoice No: ${document.getElementById('invoiceNumber').value}
Date: ${document.getElementById('invoiceDate').value}
Client: ${document.getElementById('clientName').value}
Client GST: ${document.getElementById('clientGST').value}`,
    margin: [0,0,0,10]
  });

  // Table data
  const body = [['Item','Material','Qty','Rate','Amount']];
  [...tbody.querySelectorAll('tr')].forEach(row => {
    body.push([
      row.querySelector('.item').value,
      row.querySelector('.material').value,
      row.querySelector('.qty').value,
      row.querySelector('.rate').value,
      row.querySelector('.amount').value
    ]);
  });
  docDefinition.content.push({ table: { headerRows: 1, widths:['*','*','auto','auto','auto'], body }, margin:[0,0,0,10] });

  // Summary
  docDefinition.content.push(`Total: ${totalCostEl.textContent}`);
  docDefinition.content.push(`GST (${gstPercentEl.value}%): ${gstAmountEl.textContent}`);
  docDefinition.content.push(`Final Cost: ${finalCostEl.textContent}`);
  docDefinition.content.push(`Amount in Words: ${amountWordsEl.textContent}`);

  // Designs
  if (designs.length) {
    docDefinition.content.push({ text:'2D → 3D Designs', style:'subheader', margin:[0,10,0,5] });
    designs.forEach(d => {
      docDefinition.content.push({ image: d.src, width: 200, text: d.name, margin:[0,5,0,10] });
    });
  }

  pdfMake.createPdf(docDefinition).download('invoice.pdf');
});

// Recover tab toggle
document.getElementById('invoiceTab').addEventListener('click', () => {
  document.getElementById('invoiceSection').style.display = 'block';
  document.getElementById('recoverSection').style.display = 'none';
});
document.getElementById('recoverTab').addEventListener('click', () => {
  document.getElementById('invoiceSection').style.display = 'none';
  document.getElementById('recoverSection').style.display = 'block';
});
