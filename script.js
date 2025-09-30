// Globals
let invoiceData = JSON.parse(localStorage.getItem("invoiceData") || "{}");
const invoiceTableBody = document.querySelector("#invoiceTable tbody");
const designList = document.getElementById("designList");
let renderer, scene, camera, current3DMesh;

// Number to Words
function numberToWords(amount){
    const a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const b=['','', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    function inWords(num){
        if(num<20) return a[num];
        if(num<100) return b[Math.floor(num/10)] + (num%10!==0?' '+a[num%10]:'');
        if(num<1000) return a[Math.floor(num/100)]+' Hundred '+(num%100!==0?inWords(num%100):'');
        if(num<100000) return inWords(Math.floor(num/1000))+' Thousand '+(num%1000!==0?inWords(num%1000):'');
        if(num<10000000) return inWords(Math.floor(num/100000))+' Lakh '+(num%100000!==0?inWords(num%100000):'');
        return inWords(Math.floor(num/10000000))+' Crore '+(num%10000000!==0?inWords(num%10000000):'');
    }
    let [intPart, decPart] = amount.toFixed(2).split('.');
    return inWords(parseInt(intPart)) + (parseInt(decPart)?' point '+decPart.split('').map(d=>a[d]).join(' '):'');
}

// Add Item
document.getElementById("addRowBtn").addEventListener("click", ()=>addRow());
function addRow(item='', material='', qty=1, price=0){
    const tr=document.createElement("tr");
    tr.innerHTML=`<td><input value="${item}"></td>
    <td><input value="${material}"></td>
    <td><input type="number" value="${qty}" min="1"></td>
    <td><input type="number" value="${price}" min="0"></td>
    <td class="amount">${(qty*price).toFixed(2)}</td>
    <td><button class="deleteBtn">Delete</button></td>`;
    tr.querySelector(".deleteBtn").addEventListener("click",()=>{tr.remove();recalcInvoice();});
    tr.querySelectorAll("input").forEach(inp=>inp.addEventListener("input",recalcInvoice));
    invoiceTableBody.appendChild(tr);
    recalcInvoice();
}

// Recalculate
function recalcInvoice(){
    let total=0;
    invoiceTableBody.querySelectorAll("tr").forEach(tr=>{
        const qty=parseFloat(tr.children[2].querySelector("input").value)||0;
        const price=parseFloat(tr.children[3].querySelector("input").value)||0;
        const amount=qty*price;
        tr.children[4].textContent=amount.toFixed(2);
        total+=amount;
    });
    const gstPercent=parseFloat(document.getElementById("gstPercent").value)||0;
    const gstAmount=total*gstPercent/100;
    const final=total+gstAmount;
    document.getElementById("totalCost").textContent=total.toLocaleString('en-IN',{minimumFractionDigits:2});
    document.getElementById("gstAmount").textContent=gstAmount.toLocaleString('en-IN',{minimumFractionDigits:2});
    document.getElementById("finalCost").textContent=final.toLocaleString('en-IN',{minimumFractionDigits:2});
    document.getElementById("amountWords").textContent=numberToWords(final);
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

// 2D → 3D Upload & Preview
document.getElementById("upload2D").addEventListener("change", e=>{
    Array.from(e.target.files).forEach(file=>{
        const reader=new FileReader();
        reader.onload=function(ev){
            const div=document.createElement("div");
            div.className="design-item";
            div.innerHTML=`<img src="${ev.target.result}" class="design-thumb">
            <div class="design-info">
            <input class="design-name" value="${file.name}">
            <div class="design-controls">
            <button class="generate3DBtn">Generate 3D</button>
            <button class="removeDesignBtn">Remove</button>
            </div></div>`;
            div.querySelector(".removeDesignBtn").addEventListener("click",()=>div.remove());
            div.querySelector(".generate3DBtn").addEventListener("click",()=>{render3D(ev.target.result);});
            designList.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
});

// Render 3D using Three.js
function render3D(imageSrc){
    const container=document.getElementById("preview3D");
    container.innerHTML='';
    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(45,container.clientWidth/container.clientHeight,0.1,1000);
    renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(container.clientWidth,container.clientHeight);
    container.appendChild(renderer.domElement);
    const controls=new THREE.OrbitControls(camera,renderer.domElement);
    camera.position.z=5;
    const texture=new THREE.TextureLoader().load(imageSrc);
    const geometry=new THREE.BoxGeometry(1,1,1);
    const material=new THREE.MeshBasicMaterial({map:texture});
    current3DMesh=new THREE.Mesh(geometry,material);
    scene.add(current3DMesh);
    function animate(){requestAnimationFrame(animate);renderer.render(scene,camera);}
    animate();
}

// Recover Invoice
document.getElementById("searchByInvoiceNumber").addEventListener("click",()=>{
    const num=document.getElementById("searchInvoiceNumber").value;
    if(invoiceData[num]){loadInvoice(invoiceData[num]);} else alert("Invoice not found!");
});
document.getElementById("searchByClientName").addEventListener("click",()=>{
    const name=document.getElementById("searchClientName").value;
    const results=Object.values(invoiceData).filter(inv=>inv.clientName===name);
    displayRecoveryResults(results);
});
document.getElementById("searchByInvoiceDate").addEventListener("click",()=>{
    const date=document.getElementById("searchInvoiceDate").value;
    const results=Object.values(invoiceData).filter(inv=>inv.invoiceDate===date);
    displayRecoveryResults(results);
});
document.getElementById("clearRecoveryBtn").addEventListener("click", ()=>{
    document.getElementById("searchInvoiceNumber").value='';
    document.getElementById("searchClientName").value='';
    document.getElementById("searchInvoiceDate").value='';
    document.getElementById("recoveryResults").innerHTML='';
});
function loadInvoice(inv){
    document.getElementById("clientName").value=inv.clientName;
    document.getElementById("invoiceNumber").value=inv.invoiceNumber;
    document.getElementById("invoiceDate").value=inv.invoiceDate;
    document.getElementById("clientGST").value=inv.clientGST;
    document.getElementById("companyGST").value=inv.companyGST;
    invoiceTableBody.innerHTML='';
    inv.items.forEach(row=>addRow(row[0],row[1],parseFloat(row[2]),parseFloat(row[3])));
}
function displayRecoveryResults(results){
    const container=document.getElementById("recoveryResults");
    container.innerHTML='';
    results.forEach(inv=>{
        const btn=document.createElement("button");
        btn.textContent=`Invoice ${inv.invoiceNumber} - ${inv.clientName} (${inv.invoiceDate})`;
        btn.addEventListener("click",()=>loadInvoice(inv));
        container.appendChild(btn);
    });
}

// PDF Generation
document.getElementById("generatePDFBtn").addEventListener("click", ()=>{
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF('p','pt','a4');
    const clientName=document.getElementById("clientName").value;
    const invoiceNumber=document.getElementById("invoiceNumber").value;
    const invoiceDate=document.getElementById("invoiceDate").value;
    const clientGST=document.getElementById("clientGST").value;
    const companyGST=document.getElementById("companyGST").value;
    if(!invoiceNumber){alert("Invoice Number required"); return;}
    if(!invoiceData[invoiceNumber]) invoiceData[invoiceNumber]={};
    doc.setFillColor(46,125,50);
    doc.rect(0,0,595,50,'F');
    doc.setFontSize(16); doc.setTextColor(255,255,255);
    doc.text("Varshith Interior Solutions", 40, 30);
    doc.setFontSize(10); doc.setTextColor(0,0,0);
    doc.text(`Client Name: ${clientName}`, 40, 70);
    doc.text(`Client GST: ${clientGST}`, 40, 85);
    doc.text(`Invoice No: ${invoiceNumber}`, 400, 70);
    doc.text(`Date: ${invoiceDate}`, 400, 85);
    const headers=["Item","Material","Qty","Unit Price","Amount"];
    const rows=[];
    invoiceTableBody.querySelectorAll("tr").forEach(tr=>{
        const row=[]; tr.querySelectorAll("input").forEach(inp=>row.push(inp.value));
        row.push(tr.children[4].textContent); rows.push(row);
    });
    doc.autoTable({startY:100,head:[headers],body:rows,theme:'grid'});
    const finalY=doc.lastAutoTable.finalY+20;
    doc.text(`Total Cost: ${document.getElementById("totalCost").textContent}`,40,finalY);
    doc.text(`GST Amount: ${document.getElementById("gstAmount").textContent}`,40,finalY+15);
    doc.text(`Final Cost: ${document.getElementById("finalCost").textContent}`,40,finalY+30);
    doc.text(`Amount in Words: ${document.getElementById("amountWords").textContent}`,40,finalY+45);
    doc.setFillColor(46,125,50);
    doc.rect(0,770,595,50,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(10);
    doc.text(`Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106`,40,785);
    doc.text(`Phone: +91 9916511599 & +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com`,40,800);
    doc.text(`Company GST: ${companyGST}`,40,815);
    doc.save(`Invoice_${invoiceNumber}.pdf`);
    invoiceData[invoiceNumber]={clientName,invoiceNumber,invoiceDate,clientGST,companyGST,items:rows};
    localStorage.setItem("invoiceData",JSON.stringify(invoiceData));
});
