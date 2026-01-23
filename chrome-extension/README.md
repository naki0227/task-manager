# DreamCatcher Helper Extension

This Chrome Extension works with the DreamCatcher Backend to capture your current browser context (open tabs) for the "Infinite Resume" feature.

## Installation

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (top right toggle).
3. Click **Load unpacked**.
4. Select this `chrome-extension` directory.

## Usage

1. Ensure the DreamCatcher Backend is running (`localhost:8000`).
2. Click the extension icon in your toolbar.
3. Click "Save Snapshot".
4. The current tabs will be saved to your DreamCatcher context history.

## Troubleshooting

- **Connection Error**: Check if the backend is running at `http://localhost:8000`.
- **CORS Error**: Ensure the backend allows `localhost` origin (configured in `main.py`).
