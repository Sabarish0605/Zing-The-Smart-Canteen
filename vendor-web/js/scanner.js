// File: vendor-web/js/scanner.js

let html5QrcodeScanner = null;

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
    // Stop scanning once we got a result
    if (html5QrcodeScanner) {
        html5QrcodeScanner.pause(true);
    }

    const resultDiv = document.getElementById('scanResult');
    resultDiv.innerHTML = `<span class="text-blue-600">Processing QR: ${decodedText}...</span>`;

    try {
        const response = await api.verifyQrCode(decodedText);
        resultDiv.innerHTML = `
            <div class="p-4 bg-green-100 text-green-700 rounded border border-green-400 mt-2">
                ✅ Order #${response.id} Verified & Completed!
                <br>Total Amount: ₹${response.totalAmount}
            </div>
        `;
        showToast("Order Completed Successfully!");
        
        // Refresh orders if needed
        loadOrders();
    } catch (error) {
        resultDiv.innerHTML = `
            <div class="p-4 bg-red-100 text-red-700 rounded border border-red-400 mt-2">
                ❌ Invalid QR Code or Verification Failed.
            </div>
        `;
    }

    // Resume scanning after 3 seconds
    setTimeout(() => {
        resultDiv.innerHTML = '';
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
}
