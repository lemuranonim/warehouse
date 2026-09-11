# Pemetaan Acuan Warehouse Prasad

Ketiga file memiliki fungsi yang berbeda dan tidak boleh dicampur:

- Dua PDF adalah contoh tata letak keluaran laporan.
- Workbook Excel adalah sumber database historis warehouse untuk migrasi.
- Isi transaksi pada PDF tidak menjadi seed, stok, inbound, atau outbound WMS.

## Template Incoming Note

Struktur visual PDF Incoming Note diterapkan pada route `/documents/incoming/[docNo]`. Nilai yang dicetak selalu berasal dari dokumen inbound WMS yang dipilih.

| Bagian format | Sumber data WMS |
| --- | --- |
| From, To, Date, Doc No, DO No | `wms_inbound_documents` |
| Address, Truck ID, Prepare by | metadata `wms_inbound_documents` |
| Material Code, Description, Lot, Qty, UOM, Remark | `wms_inbound_items` dan `wms_materials` |
| Empat blok tanda tangan | `wms_document_signoffs` |
| Document No, Edition, Revision, Effective Date | konfigurasi format laporan |

## Template Delivery Note

Struktur visual PDF Delivery Note diterapkan pada route `/documents/delivery/[docNo]`. Nilai dicetak dari delivery note, outbound allocation, lot yang sudah di-pick/stage, kendaraan, dan pihak serah-terima di WMS.

Dispatch hanya dapat ditutup jika tidak ada lot kurang, lot tambahan, duplikasi, atau selisih kuantitas. PDF contoh tidak digunakan sebagai bukti dispatch aktual.

## Workbook sebagai Database Historis

Workbook dibaca melalui `/admin/inventory`. Sistem mendukung sheet P01, P02 Latest, P02, KA01, KS01, SAP, dan Product List.

| Sumber Excel | Target staging/master |
| --- | --- |
| Date | `stock_date` |
| Material Code / Material | `material_code` |
| Material Description / Description | `material_description` |
| Hybrid, Stage, Flagging | atribut material |
| Batch No / Lot Number | `lot_number` |
| Qty (kg) / Stock (kg) | `qty_kg` |
| WH / Location | `warehouse` |
| Type, Product, Crop, Status | klasifikasi material/inventory |
| Return/Non Return, Ageing, SAP | kontrol rekonsiliasi |
| Note, Action, Remark | catatan tindak lanjut |

Setiap pembacaan menampilkan ringkasan per sheet, baris valid, warning, dan blocked. Preview tidak langsung mengubah stok. Setelah validasi, batch disimpan ke `wms_inventory_import_batches` dan `wms_inventory_import_lines`, lalu dibandingkan dengan ledger melalui `wms_inventory_snapshot_reconciliation_view` sebelum koreksi disetujui.
