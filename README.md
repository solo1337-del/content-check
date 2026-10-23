# Box Scanner

A single web page for Zebra handhelds (TC51/TC56 and similar). Scan a **plastic box number** and the page shows what is in that box and the shipped quantity of each item.

## Use

1. Open the page in the device's browser.
2. Tap **Choose file** and load the `deliverydetails.xlsx` report for the shipment. The data stays on the device until you load another file.
3. Press the scan button and aim at the box label.

For each box the page shows the item lines, the total shipped quantity, the order number and the destination location. Unknown boxes give a red message, a low beep and a vibration. Repeat scans are marked in yellow. Tap an item to tick it off while counting.

## Scanner setup

The page expects DataWedge keystroke output with an Enter suffix, which is the Zebra default. Without the Enter suffix it still looks the box up once input pauses. The on-screen keyboard stays hidden while scanning; tap ⌨ to type a box number by hand.

## Notes

- No shipment data is stored in this repository. Each device loads its own file.
- The page loads [SheetJS](https://sheetjs.com/) from cdnjs to read the spreadsheet, so the device needs internet the first time the page opens.
- To host it, turn on GitHub Pages (Settings → Pages → Deploy from branch `main`, folder `/`).
