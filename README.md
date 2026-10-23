# Box Scanner

A single web page for Zebra handhelds (TC51/TC56 and similar). Scan a **plastic box number** and the page shows what is in that box and the shipped quantity of each item.

## Use

1. Open the page in the device's browser.
2. Tap **Choose file** and load the `deliverydetails.xlsx` report for the shipment. The data stays on the device until you load another file.
3. On the Zebra, press the scan button and aim at the box label. On a phone, tap **Scan with camera** and hold the barcode inside the frame.

For each box the page shows the item lines, the total shipped quantity, the order number and the destination location. Unknown boxes give a red message, a low beep and a vibration. Repeat scans are marked in yellow. Tap an item to tick it off while counting.

## Scanner setup

The page expects DataWedge keystroke output with an Enter suffix, which is the Zebra default. Without the Enter suffix it still looks the box up once input pauses. The on-screen keyboard stays hidden while scanning; tap ⌨ to type a box number by hand.

## Camera scanning

- Android Chrome uses the phone's built-in barcode reader. Other browsers (iPhone, desktop) load [barcode-detector](https://github.com/Sec-ant/barcode-detector), which runs zxing-cpp in WebAssembly, the first time the camera opens.
- The camera runs at up to 1920×1080 with continuous autofocus, so the thin bars on the yellow labels resolve. Light and zoom controls appear when the phone supports them.
- Only a box number that is in the loaded delivery stops the camera. Other barcodes on the label (the red label, the white label's own code) are shown as ignored, and scanning continues.

## Password

When hosted on Netlify, the site is behind a password, checked by the edge function in `netlify/edge-functions/auth.js`. The password itself is the `BOX_SCAN_PASSWORD` environment variable in the Netlify project settings, never this repository. A correct password unlocks the device for 30 days, `/logout` signs out, and changing the variable signs everyone out.

## Notes

- No shipment data is stored in this repository. Each device loads its own file.
- The page loads [SheetJS](https://sheetjs.com/) from cdnjs to read the spreadsheet, so the device needs internet. The camera only works over HTTPS.
- Hosted on Netlify at https://box-scan.netlify.app. GitHub Pages would serve the page without the password gate.
