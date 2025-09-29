const $ = id => document.getElementById(id);
let designSnapshots = {};
let invoiceData = JSON.parse(localStorage.getItem('invoices') || '{}');

function updateTotals() {
    let total=0;
    document.querySelectorAll('#invoiceTable tbody tr').forEach(tr=>{
        const qty=parseFloat(tr.querySelector('.qty').value)||0;
        const price=parseFloat(tr.querySelector('.unitPrice').value)||0;
        const amt=qty*price;
        tr.querySelector('.amount').textContent=amt.toLocaleString('en-IN',{minimumFractionDigits:2});
        total+=amt;
    });
    $('totalCost').textContent = total.toLocaleString('en-IN',{minimumFractionDigits:2});
    const gst=parseFloat($('gstPercent').value||0)/100*total;
    $('gstAmount').textContent = gst.toLocaleString('en-IN',{minimumFractionDigits:2});
    const final=total+gst;
    $('finalCost').textContent=final.toLocaleString('en-IN',{minimumFractionDigits:2});
    $('amountInWords').textContent = numberToWords(final) + ' Only';
}

function numberToWords(amount){
    // Simple number to words (supports up to 999,999)
    const words=["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
    "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
    const tens=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
    if(amount<20) return words[Math.floor(amount)];
    if(amount<100) return tens[Math.floor(amount/10)] + (amount%10>0?" "+words[amount%10]:"");
    if(amount<1000) return words[Math.floor(amount/100)] + " Hundred" + (amount%100>0?" "+numberToWords(amount%100):"");
    if(amount<1000000) return numberToWords(Math.floor(amount/1000))+" Thousand"+(amount%1000>0?" "+numberToWords(amount%1000):"");
    return amount;
}

// Add Item
$('addRowBtn').onclick = () => {
    const tbody=$('#invoiceTable').querySelector('tbody');
    const tr=document.createElement('tr');
    tr.innerHTML=`<td><input class="item"></td>
                    <td><input class="material"></td>
                    <td><input class="qty" type="number" min="0" step="0.01"></td>
                    <td><input class="unitPrice" type="number" min="0" step="0.01"></td>
                    <td class="amount">0.00</td>
                    <td><button class="deleteBtn">Delete</button></td>`;
    tbody.appendChild(tr);
    tr.querySelectorAll('input').forEach(inp=>inp.oninput=updateTotals);
    tr.querySelector('.deleteBtn').onclick=()=>{tr.remove();updateTotals();}
};

// Clear All
$('clearRowsBtn').onclick = () => {
    $('#invoiceTable').querySelector('tbody').innerHTML='';
    $('clientName').value='';
    $('clientGST').value='';
    $('invoiceNumber').value='';
    $('invoiceDate').value='';
    $('companyGST').value='';
    updateTotals();
};

// Upload Logo
$('logoUpload').onchange=e=>{
    const file=e.target.files[0];
    if(file){
        const reader=new FileReader();
        reader.onload=ev=> $('logoImg').src=ev.target.result;
        reader.readAsDataURL(file);
    }
};

// 2D → 3D Upload + Generate + Remove
$('upload2D').onchange = e => {
    const files = e.target.files;
    for (let f of files) {
        const reader = new FileReader();
        reader.onload = ev => {
            const dataURL = ev.target.result;
            const div = document.createElement('div');
            div.className = 'design-item';
            div.innerHTML = `
                <img class="design-thumb" src="${dataURL}">
                <div class="design-info">
                    <input value="${f.name}" class="design-name">
                </div>
                <div class="design-controls">
                    <button class="generate3DBtn">Generate 3D</button>
                    <button class="removeBtn">Remove</button>
                </div>
            `;
            $('designList').appendChild(div);
            designSnapshots[f.name] = dataURL;

            // Generate 3D placeholder
            div.querySelector('.generate3DBtn').onclick = () => {
                alert(`3D generation placeholder for ${f.name}`);
            };

            // Remove design
            div.querySelector('.removeBtn').onclick = () => {
                delete designSnapshots[f.name];
                div.remove();
            };
        };
        reader.readAsDataURL(f);
    }
};

// Generate PDF
$('generatePDFBtn').onclick=()=>{
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    // Watermark
    doc.setFontSize(60);
    doc.setTextColor(200,200,200);
    doc.text('Varshith Interior Solutions', pageWidth/2, pageHeight/2, {angle:45, align:'center'});

    // Header
    doc.setFontSize(16);
    doc.setTextColor(0,0,0);
    doc.text('Varshith Interior Solutions', 14, 20);
    doc.setFontSize(10);
    doc.text('NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106', 14, 26);
    doc.text('Phone: +91 9916511599 & +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com', 14, 32);

    // Client Info
    let y=40;
    doc.setFontSize(12);
    doc.text(`Invoice No: ${$('invoiceNumber').value || ''}`,14,y);
    doc.text(`Invoice Date: ${$('invoiceDate').value || ''}`, 120,y);
    y+=6;
    doc.text(`Client Name: ${$('clientName').value || ''}`,14,y);
    doc.text(`Client GST: ${$('clientGST').value || ''}`,14,y+6);

    // Table
    const tableRows=[];
    $('#invoiceTable tbody tr').forEach(tr=>{
        tableRows.push([
            tr.querySelector('.item').value || '',
            tr.querySelector('.material').value || '',
            tr.querySelector('.qty').value || '',
            parseFloat(tr.querySelector('.unitPrice').value||0).toLocaleString('en-IN',{minimumFractionDigits:2}),
            tr.querySelector('.amount').textContent || ''
        ]);
    });
    doc.autoTable({
        startY:y+14,
        head:[['Item','Material Used','Qty','Unit Price','Amount']],
        body:tableRows,
        theme:'grid'
    });

    let finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total Cost: ${$('totalCost').textContent}`,14,finalY);
    doc.text(`GST Amount: ${$('gstAmount').textContent}`,14,finalY+6);
    doc.text(`Final Cost: ${$('finalCost').textContent}`,14,finalY+12);
    doc.text(`Amount in Words: ${$('amountInWords').textContent}`,14,finalY+18);

    // 2D → 3D Designs
    let designY = finalY + 24;
    Object.keys(designSnapshots).forEach(name=>{
        if(designY>pageHeight-50){doc.addPage(); designY=20;}
        doc.text(name,14,designY);
        doc.addImage(designSnapshots[name],'JPEG',14,designY+2,50,40);
        designY+=44;
    });

    // Footer
    doc.setFontSize(10);
    doc.text(`Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106`,14,pageHeight-20);
    doc.text(`Phone: +91 9916511599 & +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com | GST: ${$('companyGST').value || ''}`,14,pageHeight-14);

    // Page Number
    const pageCount = doc.internal.getNumberOfPages();
    for(let i=1;i<=pageCount;i++){
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth-40,pageHeight-10);
    }

    doc.save(`Invoice-${$('invoiceNumber').value || 'New'}.pdf`);
};
