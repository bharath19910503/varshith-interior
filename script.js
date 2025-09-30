// Globals
let invoiceData = JSON.parse(localStorage.getItem("invoiceData") || "{}");
const invoiceTableBody = document.querySelector("#invoiceTable tbody");
const designList = document.getElementById("designList");

// Number to Words
function numberToWords(amount) {
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
      'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function inWords(num){
      if(num<20) return a[num];
      if(num<100) return b[Math.floor(num/10)] + (num%10!==0?' '+a[num%10]:'');
      if(num<1000) return a[Math.floor(num/100)] + ' Hundred ' + (num%100!==0?inWords(num%100):'');
      if(num<100000) return inWords(Math.floor(num/1000)) + ' Thousand ' + (num%1000!==0?inWords(num%1000):'');
      if(num<10000000) return inWords(Math.floor(num/100000)) + ' Lakh ' + (num%100000!==0?inWords(num%100000):'');
      return inWords(Math.floor(num/10000000)) + ' Crore ' + (num%10000000!==0?inWords(num%10000000):'');
  }
  let [intPart, decPart] = amount.toFixed(2).split('.');
  return inWords(parseInt(intPart)) + (parseInt(decPart)?' point ' + decPart.split('').map(d=>a[d]).join(' '):'');
}

// Add Item
document.getElementById("addRowBtn").addEventListener("click", ()=>addRow());
function addRow(item='', material='', qty=1, price=0){
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><input value="${item}"></td>
                    <td><input value="${material}"></td>
                    <td><input type="number" value="${qty}" min="1"></td>
                    <td><input type="number" value="${price}" min="0"></td>
                    <td class="amount">${(qty*price).toFixed(2)}</td>
                    <td><button class="deleteBtn">Delete</button></td>`;
    tr.querySelector(".deleteBtn").addEventListener("click", ()=>{ tr.remove(); recalcInvoice(); });
    tr.querySelectorAll("input").forEach(input=>input.addEventListener("input", recalcInvoice));
    invoiceTableBody.appendChild(tr);
    recalcInvoice();
}

// Recalc invoice
function recalcInvoice(){
    let total = 0;
    invoiceTableBody.querySelectorAll("tr").forEach(tr=>{
        const qty = parseFloat(tr.children[2].querySelector("input").value) || 0;
        const price = parseFloat(tr.children[3].querySelector("input").value) || 0;
        const amount = qty*price;
        tr.children[4].textContent = amount.toFixed(2);
        total+=amount;
    });
    const gstPercent = parseFloat(document.getElementById("gstPercent").value) || 0;
    const gstAmount = total*gstPercent/100;
    const final = total+gstAmount;
    document.getElementById("totalCost").textContent = total.toLocaleString('en-IN',{minimumFractionDigits:2});
    document.getElementById("gstAmount").textContent = gstAmount.toLocaleString('en-IN',{minimumFractionDigits:2});
    document.getElementById("finalCost").textContent = final.toLocaleString('en-IN',{minimumFractionDigits:2});
    document.getElementById("amountWords").textContent = numberToWords(final);
}

// Clear Invoice
document.getElementById("clearRowsBtn").addEventListener("click", clearInvoice);
function clearInvoice(){ document.querySelectorAll("#clientName,#clientGST,#invoiceNumber,#invoiceDate,#companyGST").forEach(el=>el.value=''); invoiceTableBody.innerHTML=''; designList.innerHTML=''; recalcInvoice(); }

// 2D → 3D Upload
document.getElementById("upload2D").addEventListener("change", e=>{
    Array.from(e.target.files).forEach(file=>{
        const reader = new FileReader();
        reader.onload = ev=>{
            const div = document.createElement("div");
            div.className="design-item";
            div.innerHTML=`<img src="${ev.target.result}" class="design-thumb">
                           <div class="design-info">
                             <input class="design-name" value="${file.name}">
                             <div class="design-controls">
                               <button class="generate3DBtn">Generate 3D</button>
                               <button class="removeDesignBtn">Remove</button>
                             </div></div>`;
            div.querySelector(".removeDesignBtn").addEventListener("click", ()=>div.remove());
            div.querySelector(".generate3DBtn").addEventListener("click", ()=>generate3D(div));
            designList.appendChild(div);
        }; reader.readAsDataURL(file);
    });
});

// 3D preview
function generate3D(div){
    const container=document.getElementById("preview3D"); container.innerHTML='';
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(75, container.clientWidth/container.clientHeight, 0.1,1000);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setSize(container.clientWidth,container.clientHeight);
    container.appendChild(renderer.domElement);
    const geometry=new THREE.BoxGeometry(); const material=new THREE.MeshBasicMaterial({color:0x2e7d32, wireframe:true});
    const cube=new THREE.Mesh(geometry, material); scene.add(cube); camera.position.z=3;
    const controls=new THREE.OrbitControls(camera, renderer.domElement);
    function animate(){requestAnimationFrame(animate); renderer.render(scene,camera);}
    animate();
}

// Logo Upload
document.getElementById("logoUpload").addEventListener("change", e=>{
    const file=e.target.files[0]; if(file){const reader=new FileReader(); reader.onload=ev=>document.getElementById("logoImg").src=ev.target.result; reader.readAsDataURL(file);}
});

// PDF generation (complete)
document.getElementById("generatePDFBtn").addEventListener("click", generatePDF);

// Recover Invoice functionality
document.getElementById("searchByInvoiceNumber").addEventListener("click", ()=>searchInvoice("invoiceNumber", document.getElementById("searchInvoiceNumber").value));
document.getElementById("searchByClientName").addEventListener("click", ()=>searchInvoice("clientName", document.getElementById("searchClientName").value));
document.getElementById("searchByInvoiceDate").addEventListener("click", ()=>searchInvoice("invoiceDate", document.getElementById("searchInvoiceDate").value));
document.getElementById("clearRecoveryBtn").addEventListener("click", ()=>{
  document.getElementById("searchInvoiceNumber").value='';
  document.getElementById("searchClientName").value='';
  document.getElementById("searchInvoiceDate").value='';
  document.getElementById("recoveryResults").innerHTML='';
});

function searchInvoice(field, value){
  const results = Object.values(invoiceData).filter(inv=>inv[field] && inv[field].includes(value));
  const container=document.getElementById("recoveryResults"); container.innerHTML='';
  if(results.length===0){ container.innerHTML='<div>No matching invoices found</div>'; return;}
  results.forEach(inv=>{
    const div=document.createElement("div"); div.className='invoice-recovery-item';
    div.innerHTML=`Invoice #: ${inv.invoiceNumber}, Client: ${inv.clientName}, Date: ${inv.invoiceDate}`;
    container.appendChild(div);
  });
}

// PDF generation function
function generatePDF(){
  const { jsPDF }=window.jspdf; const doc=new jsPDF('p','pt','a4');
  const clientName=document.getElementById("clientName").value;
  const invoiceNumber=document.getElementById("invoiceNumber").value;
  if(!invoiceNumber){alert("Invoice Number required"); return;}
  const invoiceDate=document.getElementById("invoiceDate").value;
  const clientGST=document.getElementById("clientGST").value;
  const companyGST=document.getElementById("companyGST").value;

  const items=Array.from(invoiceTableBody.querySelectorAll("tr")).map(tr=>({
      item: tr.children[0].querySelector("input").value,
      material: tr.children[1].querySelector("input").value,
      qty: tr.children[2].querySelector("input").value,
      price: tr.children[3].querySelector("input").value,
      amount: tr.children[4].textContent
  }));

  const total=document.getElementById("totalCost").textContent;
  const gst=document.getElementById("gstAmount").textContent;
  const final=document.getElementById("finalCost").textContent;
  const words=document.getElementById("amountWords").textContent;

  // Header
  doc.setFillColor(46,125,32); doc.rect(0,0,595,50,'F'); doc.setFontSize(16); doc.setTextColor(255,255,255);
  doc.text("Varshith Interior Solutions", 40,30); doc.setFontSize(10); doc.text(`Invoice #: ${invoiceNumber}`,400,20);
  doc.text(`Date: ${invoiceDate}`,400,35);

  // Items table
  doc.autoTable({
      startY:60,
      head:[['Item','Material','Qty','Unit Price','Amount']],
      body: items.map(i=>[i.item,i.material,i.qty,i.price,i.amount]),
      theme:'grid',
      headStyles:{fillColor:[46,125,32],textColor:255},
      margin:{left:40,right:40}
  });

  // Summary
  const y = doc.lastAutoTable.finalY + 20;
  doc.text(`Total: ${total}`,400,y);
  doc.text(`GST: ${gst}`,400,y+15);
  doc.text(`Final Amount: ${final}`,400,y+30);
  doc.text(`Amount in Words: ${words}`,40,y+45);
  doc.text("Payment Note: 50% of the quoted amount has to be paid as advance, 30% after completing 50% of work and remaining 20% after completion.",40,y+60);

  // Designs
  let dy=y+90;
  Array.from(designList.querySelectorAll(".design-item")).forEach(d=>{
      doc.setFont(undefined,'bold'); doc.text(d.querySelector(".design-name").value,40,dy);
      const img=new Image(); img.src=d.querySelector(".design-thumb").src;
      doc.addImage(img,'JPEG',40,dy+5,100,75); dy+=85;
  });

  doc.save(`Invoice_${invoiceNumber}.pdf`);
}
