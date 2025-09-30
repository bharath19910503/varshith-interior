// Globals
let invoiceData = JSON.parse(localStorage.getItem("invoiceData") || "{}");
const invoiceTableBody = document.querySelector("#invoiceTable tbody");

// Logo Upload
document.getElementById("logoUpload").addEventListener("change", e=>{
    const file = e.target.files[0];
    if(file){
        const reader=new FileReader();
        reader.onload = function(ev){
            document.getElementById("logoImg").src=ev.target.result;
        }
        reader.readAsDataURL(file);
    }
});

// Number to Words
function numberToWords(amount){
    const a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
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

// Recalculate Invoice
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

// Clear
document.getElementById("clearRowsBtn").addEventListener("click", ()=>{
    document.getElementById("clientName").value='';
    document.getElementById("invoiceNumber").value='';
    document.getElementById("invoiceDate").value='';
    document.getElementById("clientGST").value='';
    document.getElementById("companyGST").value='';
    invoiceTableBody.innerHTML='';
    recalcInvoice();
});

// 2D → 3D Designer
const designList=document.getElementById("designList");
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
            div.querySelector(".generate3DBtn").addEventListener("click",()=>render3D(ev.target.result, div));
            designList.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
});

// Render 3D
function render3D(imageSrc, containerDiv){
    containerDiv.querySelector("canvas")?.remove();
    const previewDiv=document.createElement("div");
    containerDiv.appendChild(previewDiv);
    previewDiv.style.width="100%"; previewDiv.style.height="200px"; previewDiv.style.border="1px solid #ddd"; previewDiv.style.borderRadius="6px";
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(45, previewDiv.clientWidth/previewDiv.clientHeight,0.1,1000);
    const renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(previewDiv.clientWidth, previewDiv.clientHeight);
    previewDiv.appendChild(renderer.domElement);
    const controls=new THREE.OrbitControls(camera,renderer.domElement);
    camera.position.z=5;
    const texture=new THREE.TextureLoader().load(imageSrc);
    const geometry=new THREE.BoxGeometry(1,1,1);
    const material=new THREE.MeshBasicMaterial({map:texture});
    const mesh=new THREE.Mesh(geometry,material);
    scene.add(mesh);
    function animate(){requestAnimationFrame(animate); renderer.render(scene,camera);}
    animate();
}

// Invoice Recovery
document.getElementById("searchByInvoiceNumber").addEventListener("click",()=>{
    const num=document.getElementById("searchInvoiceNumber").value;
    if(invoiceData[num]) loadInvoice(invoiceData[num]);
    else alert("Invoice not found!");
});
document.getElementById("searchByClientName").addEventListener("click",()=>{
    const name=document.getElementById("searchClientName").value;
    displayRecoveryResults(Object.values(invoiceData).filter(inv=>inv.clientName===name));
});
document.getElementById("searchByInvoiceDate").addEventListener("click",()=>{
    const date=document.getElementById("searchInvoiceDate").value;
    displayRecoveryResults(Object.values(invoiceData).filter(inv=>inv.invoiceDate===date));
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
document.getElementById("generatePDFBtn").addEventListener("click", async ()=>{
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF('p','pt','a4');
    const pageWidth=595, pageHeight=842, margin=40, footerHeight=50;
    const clientName=document.getElementById("clientName").value;
    const invoiceNumber=document.getElementById("invoiceNumber").value;
    const invoiceDate=document.getElementById("invoiceDate").value;
    const clientGST=document.getElementById("clientGST").value;
    const companyGST=document.getElementById("companyGST").value;
    const logoImg=document.getElementById("logoImg");

    if(!invoiceNumber){alert("Invoice Number required"); return;}
    if(!invoiceData[invoiceNumber]) invoiceData[invoiceNumber]={};

    // Logo header
    if(logoImg.src){
        await new Promise(res=>{
            const img=new Image();
            img.onload=res;
            img.src=logoImg.src;
        });
        const maxLogoWidth = 60, maxLogoHeight = 50;
        let logoWidth = logoImg.naturalWidth, logoHeight = logoImg.naturalHeight;
        const aspectRatio = logoWidth/logoHeight;
        if(logoWidth > maxLogoWidth){logoWidth=maxLogoWidth; logoHeight=logoWidth/aspectRatio;}
        if(logoHeight > maxLogoHeight){logoHeight=maxLogoHeight; logoWidth=logoHeight*aspectRatio;}
        doc.addImage(logoImg.src,'PNG',margin,5,logoWidth,logoHeight);
    }

    doc.setFillColor(46,125,50); doc.rect(0,0,pageWidth,50,'F');
    doc.setFontSize(16); doc.setTextColor(255,255,255);
    doc.text("Varshith Interior Solutions", margin + 70, 30);
    doc.setFontSize(10); doc.setTextColor(0,0,0);
    doc.text(`Client Name: ${clientName}`, 40,70);
    doc.text(`Client GST: ${clientGST}`, 40,85);
    doc.text(`Invoice No: ${invoiceNumber}`, 400,70);
    doc.text(`Date: ${invoiceDate}`, 400,85);

    // Table
    const headers=["Item","Material","Qty","Unit Price","Amount"];
    const rows=[];
    invoiceTableBody.querySelectorAll("tr").forEach(tr=>{
        const row=[]; tr.querySelectorAll("input").forEach(inp=>row.push(inp.value));
        row.push(tr.children[4].textContent); rows.push(row);
    });
    doc.autoTable({startY:100,head:[headers],body:rows,theme:'grid'});

    // Summary & Payment Note
    let finalY = doc.lastAutoTable.finalY + 20;
    const summaryTexts = [
        `Total Cost: ${document.getElementById("totalCost").textContent}`,
        `GST Amount: ${document.getElementById("gstAmount").textContent}`,
        `Final Cost: ${document.getElementById("finalCost").textContent}`,
        `Amount in Words: ${document.getElementById("amountWords").textContent}`,
        "Payment Note: 50 PCT of the quoted amount has to be paid as advance, 30 PCT after completing 50% of work and remaining 20 PCT after the completion of work"
    ];
    summaryTexts.forEach(text=>{
        if(finalY+15>pageHeight-footerHeight){addFooter(doc,pageHeight,footerHeight,pageWidth,companyGST,margin); doc.addPage(); finalY=margin;}
        doc.text(text,margin,finalY); finalY+=15;
    });

    // 3D Designs Auto-Fit
    const designCanvases = document.querySelectorAll(".design-item canvas");
    const maxImgHeight = 250, maxImgWidth = pageWidth-2*margin;
    let designsPerPage = Math.floor((pageHeight-finalY-footerHeight)/(maxImgHeight+10));
    let currentDesignIndex = 0;
    while(currentDesignIndex < designCanvases.length){
        let designsThisPage = 0, yPos = finalY;
        while(designsThisPage<designsPerPage && currentDesignIndex<designCanvases.length){
            const canvas = designCanvases[currentDesignIndex];
            const imgData = canvas.toDataURL("image/jpeg",0.6);
            let imgWidth = maxImgWidth, imgHeight = maxImgHeight;
            const aspectRatio = canvas.width/canvas.height;
            if(imgWidth/imgHeight>aspectRatio) imgWidth=imgHeight*aspectRatio;
            else imgHeight=imgWidth/aspectRatio;
            if(yPos+imgHeight>pageHeight-footerHeight) break;
            doc.addImage(imgData,'JPEG',margin,yPos,imgWidth,imgHeight);
            yPos+=imgHeight+10;
            currentDesignIndex++; designsThisPage++;
        }
        if(currentDesignIndex<designCanvases.length){addFooter(doc,pageHeight,footerHeight,pageWidth,companyGST,margin); doc.addPage(); finalY=margin;}
        else finalY=yPos;
    }

    // Footer
    addFooter(doc,pageHeight,footerHeight,pageWidth,companyGST,margin);
    doc.save(`Invoice_${invoiceNumber}.pdf`);

    // Save
    invoiceData[invoiceNumber]={clientName,invoiceNumber,invoiceDate,clientGST,companyGST,items:rows};
    localStorage.setItem("invoiceData",JSON.stringify(invoiceData));
});

// Footer helper
function addFooter(doc,pageHeight,footerHeight,pageWidth,companyGST,margin){
    doc.setFillColor(46,125,50); doc.rect(0,pageHeight-footerHeight,pageWidth,footerHeight,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(10);
    doc.text(`Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106`,margin,pageHeight-footerHeight+15);
    doc.text(`Phone: +91 9916511599 & +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com`,margin,pageHeight-footerHeight+30);
    doc.text(`Company GST: ${companyGST}`,margin,pageHeight-footerHeight+45);
}
