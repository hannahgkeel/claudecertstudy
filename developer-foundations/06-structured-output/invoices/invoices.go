// Package invoices holds messy sample invoices to extract data from.
package invoices

type Sample struct {
	ID   string
	Text string
}

var All = []Sample{
	{"inv-complete", `INVOICE #A-2291   Date: 2026-03-04   Due: 2026-04-03   PO: PO-7781
From: Brightline Design Ltd    To: Harbor Foods Inc.
3 x Logo concepts @ 400.00 = 1,200.00
1 x Brand guideline document @ 950.00 = 950.00
Total due: USD 2,150.00
Category: design services`},

	{"inv-missing-fields", `Invoice no. 5530
Northwind Cloud -> Harbor Foods
Monthly hosting (Feb)   1   x   EUR 310.00
Extra storage 500GB     2   x   EUR 45.00
TOTAL EUR 400.00
Thanks for your business!`},

	{"inv-discrepancy", `INV 88-B  | 2026-02-11 | Payment terms: net 30
Vendor: Coastal Office Supply   Bill to: Harbor Foods
Printer paper (box)   10 @ 32.50
Toner cartridge        4 @ 89.00
Desk chairs            2 @ 210.00
Amount payable: $1,100.00
(Office equipment and supplies)`},

	{"inv-odd-category", `Receipt / Invoice 0042 — 2026-01-20
Guided team kayak day for 12 staff, Riverbend Adventures
12 x 85.00
Total: CAD 1020.00`},
}
