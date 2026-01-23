const API_URL = "http://localhost:8000/api";

const statusEl = document.getElementById("status");
const messageEl = document.getElementById("message");
const captureBtn = document.getElementById("captureBtn");
const nameInput = document.getElementById("name");

// Check connection on load
async function checkConnection() {
    try {
        const res = await fetch(`${API_URL}/health`); // Assuming health endpoint or just root
        if (res.ok) {
            statusEl.textContent = "Connected to Local Backend";
            statusEl.className = "status connected";
            captureBtn.disabled = false;
        } else {
            throw new Error("Backend not responding");
        }
    } catch (e) {
        statusEl.textContent = "Backend Disconnected";
        statusEl.className = "status error";
        captureBtn.disabled = true;
        messageEl.textContent = "Ensure DreamCatcher is running at localhost:8000";
    }
}

captureBtn.addEventListener("click", async () => {
    const name = nameInput.value || "Snapshot " + new Date().toLocaleString();
    captureBtn.disabled = true;
    captureBtn.textContent = "Capturing...";
    messageEl.textContent = "";

    try {
        // Get all tabs
        const tabs = await chrome.tabs.query({ currentWindow: true });

        const windows = [{
            type: "browser",
            name: "Chrome Window",
            urls: tabs.map(t => t.url).filter(u => u && !u.startsWith("chrome://"))
        }];

        // Send to backend
        const res = await fetch(`${API_URL}/snapshots`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
                // Add Authorization if needed later
            },
            body: JSON.stringify({
                name: name,
                notes: "Captured via Chrome Extension",
                windows_json: windows // Backend expects this structure? Need to check model.
                // Wait, model.py had 'windows' vs 'windows_json' issue.
                // Let's check the schema expected by the router. 
            })
        });

        if (res.ok) {
            messageEl.style.color = "green";
            messageEl.textContent = "Snapshot saved successfully!";
            setTimeout(() => window.close(), 1500);
        } else {
            throw new Error("Failed to save");
        }
    } catch (e) {
        console.error(e);
        messageEl.style.color = "red";
        messageEl.textContent = "Error: " + e.message;
        captureBtn.disabled = false;
        captureBtn.textContent = "Save Snapshot";
    }
});

checkConnection();
