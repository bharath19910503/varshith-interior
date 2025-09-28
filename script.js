// ===== Invoice Logic =====
const addItemBtn = document.getElementById('addItemBtn');
const invoiceTableBody = document.querySelector('#invoiceTable tbody');
const gstPercentInput = document.getElementById('gstPercent');
const totalCostTd = document.getElementById('totalCost');
const gstAmountTd = document.getElementById('gstAmount');
const finalCostTd = document.getElementById('finalCost');

function recalcTotals() {
  let total = 0;
  invoiceTableBody.querySelectorAll('tr').forEach(row => {
    const amount = parseFloat(row.querySelector('.amount').value) || 0;
    total += amount;
  });
  totalCostTd.textContent = total.toFixed(2);

  const gstPercent = parseFloat(gstPercentInput.value) || 0;
  const gstAmount = total * gstPercent / 100;
  gstAmountTd.textContent = gstAmount.toFixed(2);
  finalCostTd.textContent = (total + gstAmount).toFixed(2);
}

function addItemRow() {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input type="text" class="item"></td>
    <td><input type="text" class="material"></td>
    <td><input type="number" class="qty" value="1"></td>
    <td><input type="number" class="amount" value="0"></td>
  `;
  invoiceTableBody.appendChild(row);

  row.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', recalcTotals);
  });
}

addItemBtn.addEventListener('click', addItemRow);
gstPercentInput.addEventListener('input', recalcTotals);

// ===== PDF Download =====
const downloadPdfBtn = document.getElementById('downloadPdfBtn');

downloadPdfBtn.addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Varshith Interior Solution', 14, 22);
  doc.setFontSize(12);
  doc.text('Invoice', 14, 32);

  let y = 40;
  const rows = [];
  invoiceTableBody.querySelectorAll('tr').forEach((row) => {
    rows.push([
      row.querySelector('.item').value,
      row.querySelector('.material').value,
      row.querySelector('.qty').value,
      row.querySelector('.amount').value
    ]);
  });

  doc.autoTable({
    startY: y,
    head: [['Item', 'Material', 'Qty', 'Amount']],
    body: rows
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.text(`Total Cost: ${totalCostTd.textContent}`, 14, finalY);
  doc.text(`GST: ${gstAmountTd.textContent}`, 14, finalY + 10);
  doc.text(`Final Cost: ${finalCostTd.textContent}`, 14, finalY + 20);

  doc.save('Invoice.pdf');
});

// ===== 3D Design Generation =====
const upload2D = document.getElementById('upload2D');
const generate3DBtn = document.getElementById('generate3DBtn');
const progressBar = document.getElementById('progressBar');
const preview3D = document.getElementById('preview3D');

generate3DBtn.addEventListener('click', () => {
  if (!upload2D.files[0]) {
    alert('Please upload a 2D design first!');
    return;
  }

  progressBar.style.width = '0%';
  progressBar.textContent = '0%';
  preview3D.innerHTML = '<p>Generating 3D design...</p>';

  let progress = 0;
  const interval = setInterval(() => {
    progress += 10; // simulate progress
    progressBar.style.width = progress + '%';
    progressBar.textContent = progress + '%';

    if (progress >= 100) {
      clearInterval(interval);

      // Display generated 3D design (simulate)
      const reader = new FileReader();
      reader.onload = function(e) {
        preview3D.innerHTML = `<img src="${e.target.result}" alt="3D Design" style="max-width:100%; height:auto;">`;
      };
      reader.readAsDataURL(upload2D.files[0]);
    }
  }, 300);
});
