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

// Add Row
document.getElementById("addRowBtn").addEventListener("click", ()=>addRow());
function addRow(item='', material='', qty=1, price=0){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input value="${item}"></td>
      <td><input value="${material}"></td>
      <td><input type="number" value="${qty}" min="1"></td>
      <td><input type="number" value="${price}" min="0"></td>
      <td class="amount">${(qty*price).toFixed(2)}</td>
      <td><button class="deleteBtn">Delete</button></td>
    `;
    tr.querySelector(".deleteBtn").addEventListener("click", ()=>{ tr.remove(); recalcInvoice(); });
    tr.querySelectorAll("input").forEach(input=>input.addEventListener("input", recalcInvoice));
    invoiceTableBody.appendChild(tr);
    recalcInvoice();
}

// Recalc
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

// Clear All
document.getElementById("clearRowsBtn").addEventListener("click", ()=>{
    document.getElementById("clientName").value='';
    document.getElementById("invoiceNumber").value='';
    document.getElementById("invoiceDate").value='';
    document.getElementById("clientGST").value='';
    document.getElementById("companyGST").value='';
    invoiceTableBody.innerHTML='';
    designList.innerHTML='';
    recalcInvoice();
});

// Recover Clear
document.getElementById("clearRecoveryBtn").addEventListener("click", ()=>{
    document.getElementById("searchInvoiceNumber").value='';
    document.getElementById("searchClientName").value='';
    document.getElementById("searchInvoiceDate").value='';
    document.getElementById("recoveryResults").innerHTML='';
});

// Upload Logo
document.getElementById("logoUpload").addEventListener("change", e=>{
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function(ev){ document.getElementById("logoImg").src = ev.target.result; }
    reader.readAsDataURL(file);
});

// Upload 2D
document.getElementById("upload2D").addEventListener("change", e=>{
    Array.from(e.target.files).forEach(file=>{
        const reader = new FileReader();
        reader.onload = function(ev){
            const div = document.createElement("div");
            div.className = "design-item";
            div.innerHTML = `
                <img src="${ev.target.result}" class="design-thumb">
                <div class="design-info">
                    <input class="design-name" value="${file.name}">
                    <div class="design-controls">
                        <button class="generate3DBtn">Generate 3D</button>
                        <button class="removeDesignBtn">Remove</button>
                    </div>
                </div>
            `;
            div.querySelector(".removeDesignBtn").addEventListener("click", ()=>div.remove());
            div.querySelector(".generate3DBtn").addEventListener("click", ()=>{
                // Simple 3D placeholder
                const preview = document.getElementById("preview3D");
                preview.innerHTML = '';
                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(75, preview.clientWidth/preview.clientHeight, 0.1, 1000);
                const renderer = new THREE.WebGLRenderer({alpha:true});
                renderer.setSize(preview.clientWidth, preview.clientHeight);
                preview.appendChild(renderer.domElement);
                const geometry = new THREE.BoxGeometry();
                const material = new THREE.MeshBasicMaterial({color:0x00ff00});
                const cube = new THREE.Mesh(geometry, material);
                scene.add(cube);
                camera.position.z = 5;
                const controls = new THREE.OrbitControls(camera, renderer.domElement);
                function animate(){ requestAnimationFrame(animate); cube.rotation.x+=0.01; cube.rotation.y+=0.01; controls.update(); renderer.render(scene,camera);}
                animate();
            });
            designList.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
});

// Generate PDF
document.getElementById("generatePDFBtn").addEventListener("click", ()=>{
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p','pt','a4');
    const clientName = document.getElementById("clientName").value;
    const invoiceNumber = document.getElementById("invoiceNumber").value;
    const invoiceDate = document.getElementById("invoiceDate").value;
    const clientGST = document.getElementById("clientGST").value;
    const companyGST = document.getElementById("companyGST").value;

    if(!invoiceNumber){ alert("Invoice Number required"); return; }

    const headers = ["Item","Material","Qty","Unit Price","Amount"];
    const rows = [];
    invoiceTableBody.querySelectorAll("tr").forEach(tr=>{
        const row = [];
        tr.querySelectorAll("input").forEach((inp,i)=>{ row.push(inp.value); });
        row.push(tr.children[4].textContent);
        rows.push(row);
    });

    // Header
    doc.setFillColor(46,125,50); // Dark Green
    doc.rect(0,0,595,50,'F');
    doc.setFontSize(16);
    doc.setTextColor(255,255,255);
    doc.text("Varshith Interior Solutions", 40, 30);

    doc.setFontSize(10);
    doc.setTextColor(0,0,0);
    doc.text(`Client Name: ${clientName}`, 40, 70);
    doc.text(`Client GST: ${clientGST}`, 40, 85);
    doc.text(`Invoice No: ${invoiceNumber}`, 400, 70);
    doc.text(`Date: ${invoiceDate}`, 400, 85);

    // Table
    doc.autoTable({startY:100, head:[headers], body:rows, theme:'grid'});

    // Payment Note
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.text("Payment note: 50 PCT of the quoted amount has to be paid as advance, 30 PCT after completing 50 % of work and remaining 20 PCT after the completion of work.",40,finalY);

    // Summary Right Side
    const totalX = 400;
    doc.text(`Total Cost: ${document.getElementById("totalCost").textContent}`,totalX,finalY+20);
    doc.text(`GST Amount: ${document.getElementById("gstAmount").textContent}`,totalX,finalY+35);
    doc.text(`Final Cost: ${document.getElementById("finalCost").textContent}`,totalX,finalY+50);
    doc.text(`Amount in Words: ${document.getElementById("amountWords").textContent}`,totalX,finalY+65);

    // 2D Designs
    let yOffset = finalY + 80;
    designList.querySelectorAll(".design-item").forEach(div=>{
        const img = div.querySelector(".design-thumb");
        const name = div.querySelector(".design-name").value;
        doc.setFontStyle("bold");
        doc.text(name,40,yOffset);
        doc.setFontStyle("normal");
        doc.addImage(img.src,'JPEG',40,yOffset+5,100,75);
        yOffset += 90;
        if(yOffset>700){ doc.addPage(); yOffset=40; }
    });

    // Footer
    doc.setFillColor(46,125,50);
    doc.rect(0,770,595,50,'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(10);
    doc.text(`Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106`,40,785);
    doc.text(`Phone: +91 9916511599 & +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com`,40,800);
    doc.text(`Company GST: ${companyGST}`,40,815);

    doc.save(`Invoice_${invoiceNumber}.pdf`);

    // Save Data
    invoiceData[invoiceNumber] = { clientName, invoiceNumber, invoiceDate, clientGST, companyGST, items: rows, totalCost: document.getElementById("totalCost").textContent, gstAmount: document.getElementById("gstAmount").textContent, finalCost: document.getElementById("finalCost").textContent, amountWords: document.getElementById("amountWords").textContent, designs: Array.from(designList.querySelectorAll(".design-item")).map(d=>{return {src:d.querySelector(".design-thumb").src,name:d.querySelector(".design-name").value};}) };
    localStorage.setItem("invoiceData",JSON.stringify(invoiceData));
});

// Recover Invoice
document.getElementById("searchByInvoiceNumber").addEventListener("click", ()=>{
    const num = document.getElementById("searchInvoiceNumber").value;
    const resultDiv = document.getElementById("recoveryResults");
    resultDiv.innerHTML='';
    if(invoiceData[num]){
        const data = invoiceData[num];
        document.getElementById("clientName").value = data.clientName;
        document.getElementById("invoiceNumber").value = data.invoiceNumber;
        document.getElementById("invoiceDate").value = data.invoiceDate;
        document.getElementById("clientGST").value = data.clientGST;
        document.getElementById("companyGST").value = data.companyGST;
        invoiceTableBody.innerHTML='';
        data.items.forEach(item=>addRow(item[0],item[1],item[2],item[3]));
        designList.innerHTML='';
        data.designs.forEach(d=>{
            const div = document.createElement("div");
            div.className="design-item";
            div.innerHTML=`<img src="${d.src}" class="design-thumb"><div class="design-info"><input class="design-name" value="${d.name}"><div class="design-controls"><button class="removeDesignBtn">Remove</button></div></div>`;
            div.querySelector(".removeDesignBtn").addEventListener("click",()=>div.remove());
            designList.appendChild(div);
        });
    } else {
        resultDiv.textContent="No data found";
    }
});
