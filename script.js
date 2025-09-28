/* ----------------------------
  Invoice + PDF + 3D final script
   - Add / delete invoice rows
   - Auto totals & editable GST
   - Professional PDF with header/footer, logo, page numbers, autotable wrapping
   - Upload 2D -> map to 3D plane preview with OrbitControls
------------------------------*/

///// Globals /////
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
const generate3DBtn = document.getElementById('generate3DBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const preview3D = document.getElementById('preview3D');

let logoDataURL = null;
let designDataURL = null; // for PDF + preview

// Helper: create an invoice row
function createRow(item = '', material = '', qty = 1, amount = 0) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input class="item" type="text" placeholder="Item" value="${escapeHtml(item)}" /></td>
    <td><input class="material" type="text" placeholder="Material Used" value="${escapeHtml(material)}" /></td>
    <td><input class="qty" type="number" min="0" step="1" value="${qty}" /></td>
    <td><input class="amount" type="number" min="0" step="0.01" value="${amount}" /></td>
    <td><button class="deleteBtn">Delete</button></td>
  `;
  invoiceTbody.appendChild(row);

  // listeners
  row.querySelectorAll('input').forEach(i => i.addEventListener('input', recalcTotals));
  row.querySelector('.deleteBtn').addEventListener('click', () => { row.remove(); recalcTotals(); });
  return row;
}

// Escaping helper to avoid accidental injection into inputs
function escapeHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Initialize: start with no rows (per request)
recalcTotals();

addRowBtn.addEventListener('click', () => { createRow(); recalcTotals(); });
clearRowsBtn.addEventListener('click', () => {
  invoiceTbody.innerHTML = '';
  recalcTotals();
});

// recalc totals
function recalcTotals(){
  let total = 0;
  invoiceTbody.querySelectorAll('tr').forEach(row => {
    const amt = parseFloat(row.querySelector('.amount').value) || 0;
    total += amt;
  });
  const gstPercent = parseFloat(gstPercentEl.value) || 0;
  const gstAmount = total * gstPercent / 100;
  const final = total + gstAmount;

  totalCostEl.textContent = total.toFixed(2);
  gstAmountEl.textContent = gstAmount.toFixed(2);
  finalCostEl.textContent = final.toFixed(2);
}
gstPercentEl.addEventListener('input', recalcTotals);


///// Logo upload (appears in header + PDF) /////
logoUpload.addEventListener('change', (ev) => {
  const f = ev.target.files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = e => {
    logoDataURL = e.target.result;
    logoImg.src = logoDataURL;
  };
  r.readAsDataURL(f);
});


/* ============================
   Professional PDF generation
   - uses jsPDF + autotable (autotable script must be loaded in index.html)
   - header (logo & company), footer with page numbers
   - table with wrapped text and column widths
   - totals in table footer area (on last page)
   - uploaded 2D design (if provided) is included at top-left
   ============================ */
generatePDFBtn.addEventListener('click', async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // gather invoice meta
  const clientName = document.getElementById('clientName')?.value || '';
  const invoiceNumber = document.getElementById('invoiceNumber')?.value || '';
  const invoiceDate = document.getElementById('invoiceDate')?.value || new Date().toLocaleDateString();
  const gstPercent = parseFloat(gstPercentEl.value) || 0;

  // prepare table body
  const body = [];
  invoiceTbody.querySelectorAll('tr').forEach(row => {
    const item = row.querySelector('.item').value || '';
    const material = row.querySelector('.material').value || '';
    const qty = row.querySelector('.qty').value || '';
    const amount = row.querySelector('.amount').value || '';
    body.push([item, material, qty, amount]);
  });

  // totals
  const total = parseFloat(totalCostEl.textContent) || 0;
  const gstAmount = parseFloat(gstAmountEl.textContent) || 0;
  const final = parseFloat(finalCostEl.textContent) || 0;

  // header function (called by autoTable.didDrawPage)
  function drawHeader(data) {
    // logo top-left (if available)
    if (logoDataURL) {
      try { doc.addImage(logoDataURL, 'PNG', margin, 18, 72, 48); }
      catch(e){ /* ignore if image invalid */ }
    }
    // company title center
    doc.setFontSize(18);
    doc.setTextColor(20,20,20);
    doc.text("Varshith Interior Solution", pageWidth/2, 40, { align: 'center' });

    // small company lines under title
    doc.setFontSize(10);
    doc.text("NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106", pageWidth/2, 56, { align: 'center' });
    doc.text("Phone: +91 9916511599 & +91 8553608981   Email: Varshithinteriorsolutions@gmail.com", pageWidth/2, 70, { align: 'center' });

    // invoice meta top-right
    doc.setFontSize(10);
    const metaX = pageWidth - margin - 160;
    doc.text(`Invoice No: ${invoiceNumber}`, metaX, 30);
    doc.text(`Date: ${invoiceDate}`, metaX, 44);
    if(clientName) doc.text(`Client: ${clientName}`, metaX, 58);
  }

  // footer function
  function drawFooter(data) {
    const pageCount = doc.internal.getNumberOfPages();
    const pageNumber = data.pageNumber;
    doc.setFontSize(10);
    doc.setTextColor(100);
    // left footer (address)
    const footerY = pageHeight - 30;
    doc.text("Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106", margin, footerY);
    doc.text("Phone: +91 9916511599 & +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com", margin, footerY + 12);
    // page number right
    doc.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - margin - 60, footerY + 6);
  }

  // If there's an uploaded design, try to draw it top-left (below header)
  // We'll pass it to autoTable startY logic by adjusting startY.
  let topStartY = 110;
  if (designDataURL) {
    // draw design image at left area (next to header), but keep header drawn by autotable didDrawPage
    try {
      doc.addImage(designDataURL, 'PNG', margin, 86, 100, 70);
      topStartY = 170;
    } catch(e){
      topStartY = 110;
    }
  }

  // Setup autoTable
  doc.autoTable({
    head: [['Item', 'Material Used', 'Qty', 'Amount']],
    body: body,
    startY: topStartY,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 6,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [46,125,50],
      textColor: 255,
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 170 }, // Item
      1: { cellWidth: 230 }, // Material Used (wider)
      2: { cellWidth: 50, halign: 'center' }, // Qty
      3: { cellWidth: 70, halign: 'right' } // Amount
    },
    didDrawPage: function (data) {
      drawHeader(data);
      drawFooter(data);
    },
    margin: { top: topStartY - 30, bottom: 100 }
  });

  // ensure totals are printed on last page and not overlapping
  let finalY = doc.lastAutoTable.finalY + 12;
  if (finalY + 80 > pageHeight - 40) {
    doc.addPage();
    // call header/footer for this new page
    const blankData = { pageNumber: doc.internal.getNumberOfPages() };
    drawHeader(blankData);
    drawFooter(blankData);
    finalY = 80;
  }

  // Draw totals block (right side)
  const totalsX = pageWidth - margin - 200;
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text("Summary", totalsX, finalY);
  doc.setFontSize(10);
  doc.text(`Total Cost:`, totalsX, finalY + 18);
  doc.text(`${(total).toFixed(2)}`, totalsX + 120, finalY + 18, { align: 'right' });
  doc.text(`GST (${gstPercent}%):`, totalsX, finalY + 36);
  doc.text(`${(gstAmount).toFixed(2)}`, totalsX + 120, finalY + 36, { align: 'right' });
  doc.setFont(undefined,'bold');
  doc.text(`Final Cost:`, totalsX, finalY + 56);
  doc.text(`${(final).toFixed(2)}`, totalsX + 120, finalY + 56, { align: 'right' });
  doc.setFont(undefined,'normal');

  // Note block under totals
  const note = document.getElementById('note').value || '';
  doc.setFontSize(10);
  doc.text("Note:", margin, finalY + 20);
  doc.text(note, margin, finalY + 36, { maxWidth: pageWidth - 2 * margin - 40 });

  // Save
  doc.save(`Invoice_${invoiceNumber || Date.now()}.pdf`);
});


/* =============================
   3D Preview (map uploaded image onto a plane)
   - shows progress bar (simulated while texture loads)
   - OrbitControls enabled (pan/zoom/rotate)
   =============================*/
let scene, camera, renderer, controls, planeMesh;

generate3DBtn.addEventListener('click', () => {
  const file = upload2D.files[0];
  if(!file) { alert("Please upload a 2D image first."); return; }

  const reader = new FileReader();
  reader.onload = e => {
    designDataURL = e.target.result; // store for PDF inclusion too
    simulateProgressThenRender(designDataURL);
  };
  reader.readAsDataURL(file);
});

function simulateProgressThenRender(url) {
  progressContainer.style.display = 'block';
  progressBar.style.width = '0%';
  let p = 0;
  const id = setInterval(() => {
    p += Math.random() * 18; // random progress
    if (p >= 100) p = 100;
    progressBar.style.width = `${p}%`;
    if (p === 100) {
      clearInterval(id);
      setTimeout(() => { progressContainer.style.display = 'none'; render3DPlane(url); }, 200);
    }
  }, 150);
}

function render3DPlane(textureURL) {
  // destroy previous renderer if any
  if(renderer) {
    try {
      renderer.forceContextLoss();
      renderer.domElement.remove();
    } catch(e){}
    renderer = null;
    scene = null;
    camera = null;
    controls = null;
    planeMesh = null;
  }

  // prepare scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3f3f3);
  const w = preview3D.clientWidth || 600;
  const h = preview3D.clientHeight || 380;
  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
  camera.position.set(0, 0, 5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(w, h);
  preview3D.innerHTML = '';
  preview3D.appendChild(renderer.domElement);

  // lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.4);
  dir.position.set(0, 1, 1);
  scene.add(dir);

  // plane geometry (map image as texture)
  const geometry = new THREE.PlaneGeometry(4, 3);
  const loader = new THREE.TextureLoader();
  const texture = loader.load(textureURL, () => {
    renderer.render(scene, camera);
  }, undefined, (err) => {
    console.error('Texture load error', err);
  });

  const material = new THREE.MeshPhongMaterial({ map: texture });
  planeMesh = new THREE.Mesh(geometry, material);
  scene.add(planeMesh);

  // orbit controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  // responsive resize
  window.addEventListener('resize', onResize);
  function onResize() {
    const ww = preview3D.clientWidth || 600;
    const hh = preview3D.clientHeight || 380;
    camera.aspect = ww / hh;
    camera.updateProjectionMatrix();
    renderer.setSize(ww, hh);
  }

  // animate loop
  (function animate(){
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  })();
}

/* ============= Utilities ============= */
document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
  const rows = [];
  invoiceTbody.querySelectorAll('tr').forEach(r => {
    rows.push({
      item: r.querySelector('.item').value,
      material: r.querySelector('.material').value,
      qty: r.querySelector('.qty').value,
      amount: r.querySelector('.amount').value
    });
  });
  const payload = {
    clientName: document.getElementById('clientName')?.value || '',
    invoiceNumber: document.getElementById('invoiceNumber')?.value || '',
    invoiceDate: document.getElementById('invoiceDate')?.value || '',
    gst: gstPercentEl.value,
    rows
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice_${payload.invoiceNumber || Date.now()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
});

document.getElementById('importJsonBtn')?.addEventListener('click', () => {
  document.getElementById('importJsonFile').click();
});
document.getElementById('importJsonFile')?.addEventListener('change', (ev) => {
  const f = ev.target.files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = e => {
    try {
      const obj = JSON.parse(e.target.result);
      invoiceTbody.innerHTML = '';
      (obj.rows || []).forEach(rw => createRow(rw.item, rw.material, rw.qty, rw.amount));
      if(obj.gst) gstPercentEl.value = obj.gst;
      if(obj.clientName) document.getElementById('clientName').value = obj.clientName;
      if(obj.invoiceNumber) document.getElementById('invoiceNumber').value = obj.invoiceNumber;
      if(obj.invoiceDate) document.getElementById('invoiceDate').value = obj.invoiceDate;
      recalcTotals();
    } catch(err) {
      alert('Invalid JSON file');
    }
  };
  r.readAsText(f);
});

/* small helper to create row used by import/export & initial */
function createRow(item='', material='', qty=1, amount=0){
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input class="item" type="text" placeholder="Item" value="${escapeHtml(item)}"></td>
    <td><input class="material" type="text" placeholder="Material Used" value="${escapeHtml(material)}"></td>
    <td><input class="qty" type="number" min="0" step="1" value="${qty}"></td>
    <td><input class="amount" type="number" min="0" step="0.01" value="${amount}"></td>
    <td><button class="deleteBtn">Delete</button></td>
  `;
  invoiceTbody.appendChild(row);
  row.querySelectorAll('input').forEach(i=>i.addEventListener('input', recalcTotals));
  row.querySelector('.deleteBtn').addEventListener('click', ()=>{ row.remove(); recalcTotals(); });
}
