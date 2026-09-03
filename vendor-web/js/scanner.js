// File: vendor-web/js/scanner.js

let html5QrcodeScanner = null;
let currentScannedOrder = null;

function initScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
    }

    html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: {width: 250, height: 250} },
        /* verbose= */ false
    );

    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

async function onScanSuccess(decodedText, decodedResult) {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.pause(true);
    }

    currentScannedOrder = decodedText;
    const resultDiv = document.getElementById('scanResult');
    resultDiv.innerHTML = `
        <div class="p-4 bg-yellow-100 text-yellow-800 rounded border border-yellow-400 mt-2">
            ⚠️ Order Scanned: ${decodedText}. <br><strong>Press SPACEBAR to Complete</strong>
        </div>
    `;
}

document.addEventListener('keydown', async (e) => {
    const scannerTab = document.getElementById('tab-scanner');
    if (!scannerTab.classList.contains('hidden-section') && currentScannedOrder && e.code === 'Space') {
        e.preventDefault();
        await completeScannedOrder();
    }
});

async function completeScannedOrder() {
    const resultDiv = document.getElementById('scanResult');
    resultDiv.innerHTML = `<span class="text-blue-600">Completing Order: ${currentScannedOrder}...</span>`;

    try {
        const response = await api.verifyQrCode(currentScannedOrder);
        resultDiv.innerHTML = `
            <div class="p-4 bg-green-100 text-green-700 rounded border border-green-400 mt-2">
                ✅ Order #${response.id} Verified & Completed!
                <br>Total Amount: ₹${response.totalAmount}
            </div>
        `;
        showToast("Order Completed Successfully!");
        
        loadOrders();
    } catch (error) {
        resultDiv.innerHTML = `
            <div class="p-4 bg-red-100 text-red-700 rounded border border-red-400 mt-2">
                ❌ Verification Failed.
            </div>
        `;
    }

    currentScannedOrder = null;

    setTimeout(() => {
        resultDiv.innerHTML = '<span style="color: var(--primary-color);">Awaiting scan...</span>';
        if (html5QrcodeScanner) {
            html5QrcodeScanner.resume();
        }
    }, 3000);
}

function onScanFailure(error) {
    // handle scan failure, usually better to ignore and keep scanning
    // console.warn(`Code scan error = ${error}`);
}

function stopScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
        html5QrcodeScanner = null;
    }
    currentScannedOrder = null;
    const resultDiv = document.getElementById('scanResult');
    if(resultDiv) resultDiv.innerHTML = '<span style="color: var(--primary-color);">Awaiting scan...</span>';
}
