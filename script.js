// Globals
let invoiceData = JSON.parse(localStorage.getItem("invoiceData") || "{}");
const invoiceTableBody = document.querySelector("#invoiceTable tbody");
const designList = document.getElementById("designList");
const recoveryResults = document.getElementById("recoveryResults");

// Logo Upload
document.getElementById("logoUpload").addEventListener("change", e => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(ev){
            document.getElementById("logoImg").src = ev.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Amount to Words
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

// Recalculate invoice
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

// Clear All Invoice
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

// 2D → 3D Upload
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
            div.querySelector(".generate3DBtn").addEventListener("click", ()=>{ alert("3D Preview functionality coming soon"); });
            designList.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
});

// Generate PDF
document.getElementById("generatePDFBtn").addEventListener("click", ()=>generatePDF());

// Recover Invoice Clear All
document.getElementById("clearRecoveryBtn").addEventListener("click", ()=>{
    document.getElementById("searchInvoiceNumber").value='';
    document.getElementById("searchClientName").value='';
    document.getElementById("searchInvoiceDate").value='';
    recoveryResults.innerHTML='';
});
