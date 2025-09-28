// Add Item Row
document.getElementById('addItem').addEventListener('click', () => {
    let tbody = document.getElementById('invoiceBody');
    let row = tbody.insertRow();
    for (let i = 0; i < 4; i++) {
        let cell = row.insertCell();
        cell.contentEditable = true;
        cell.innerText = i === 0 ? "New Item" : i === 1 ? "Material" : i === 2 ? "1" : "0";
    }
});

// Calculate totals
function calculateTotals() {
    let tbody = document.getElementById('invoiceBody');
    let total = 0;
    for (let row of tbody.rows) {
        let amount = parseFloat(row.cells[3].innerText) || 0;
        total += amount;
    }
    let gst = total * 0.18;
    let finalCost = total + gst;
    document.getElementById('totalCost').innerText = total.toFixed(2);
    document.getElementById('gst').innerText = gst.toFixed(2);
    document.getElementById('finalCost').innerText = finalCost.toFixed(2);
}

setInterval(calculateTotals, 500);

// Generate PDF
document.getElementById('generatePDF').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    let doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Varshith Interior Solution", 105, 20, null, null, 'center');

    let data = [];
    let tbody = document.getElementById('invoiceBody');
    for (let row of tbody.rows) {
        data.push([row.cells[0].innerText, row.cells[1].innerText, row.cells[2].innerText, row.cells[3].innerText]);
    }

    doc.autoTable({
        head: [['Item', 'Material Used', 'Qty', 'Amount']],
        body: data,
        startY: 30,
        styles: { fillColor: [0, 128, 0], textColor: [255, 255, 255] }
    });

    doc.text(`Total Cost: ${document.getElementById('totalCost').innerText}`, 14, doc.lastAutoTable.finalY + 10);
    doc.text(`GST (18%): ${document.getElementById('gst').innerText}`, 14, doc.lastAutoTable.finalY + 20);
    doc.text(`Final Cost: ${document.getElementById('finalCost').innerText}`, 14, doc.lastAutoTable.finalY + 30);

    doc.save('Invoice.pdf');
});

// 3D Preview
document.getElementById('generate3D').addEventListener('click', () => {
    let fileInput = document.getElementById('designFile');
    if (!fileInput.files.length) return alert("Select a file first!");

    let file = fileInput.files[0];
    let reader = new FileReader();
    let progressBar = document.getElementById('progress');
    progressBar.style.width = '0%';
    progressBar.innerText = '0%';

    let progress = 0;
    let interval = setInterval(() => {
        progress += 10;
        progressBar.style.width = progress + '%';
        progressBar.innerText = progress + '%';
        if (progress >= 100) clearInterval(interval);
    }, 200);

    reader.onload = function(e) {
        load3DPreview(e.target.result);
    };
    reader.readAsDataURL(file);
});

function load3DPreview(imgSrc) {
    let container = document.getElementById('3dContainer');
    container.innerHTML = '';

    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(75, 600/400, 0.1, 1000);
    let renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(600, 400);
    container.appendChild(renderer.domElement);

    let light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    scene.add(light);

    let textureLoader = new THREE.TextureLoader();
    textureLoader.load(imgSrc, (texture) => {
        let geometry = new THREE.PlaneGeometry(4, 4 * texture.image.height / texture.image.width);
        let material = new THREE.MeshLambertMaterial({ map: texture });
        let mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        camera.position.z = 5;

        function animate() {
            requestAnimationFrame(animate);
            mesh.rotation.y += 0.01;
            renderer.render(scene, camera);
        }
        animate();
    });
}
