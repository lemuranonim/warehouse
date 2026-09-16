# Production Readiness — Warehouse Digitalization WMS

## Keputusan rilis

Kode dan database saat ini adalah **production candidate**, bukan pengganti persetujuan proses bisnis. Go-live diberikan setelah migrasi live berhasil, master data aktual tersedia, dan seluruh gate berikut lulus serta disetujui process owner warehouse.

| Area | Status kode | Gate sebelum live |
| --- | --- | --- |
| Session dan route protection | Siap | Uji login, logout, expiry, user non-WMS, dan user nonaktif |
| Role dan warehouse scope | Siap | Uji setiap role pada minimal dua warehouse berbeda |
| Dashboard live | Siap | Rekonsiliasi KPI dengan query database/SAP yang disetujui |
| Scanner lookup | Siap | Uji token valid, invalid, inactive, dan lintas warehouse |
| Putaway | Siap untuk UAT | Uji retry, kapasitas, race condition, status LPN, dan audit trail |
| Import workbook | Siap untuk UAT | Uji workbook aktual, hash deduplication, lokasi, dan rekonsiliasi total |
| Receiving/picking/staging/shipping/count/adjustment | Siap untuk UAT | Uji happy path, retry, concurrency, variance, dan role negatif |
| Master data UI | Siap | Verifikasi kode warehouse/lokasi/material aktual sebelum transaksi |
| Realtime | Siap | Uji dua sesi browser dan pantau subscription setelah deployment |

## Urutan deployment

1. Buat backup database atau pastikan point-in-time recovery aktif.
2. Terapkan dan uji seluruh migrasi pada project staging yang strukturnya sama dengan production.
3. Untuk instalasi baru jalankan migrasi `0001` sampai `0005` berurutan. Untuk database yang sudah memakai `0001`–`0003`, jalankan `0004` lalu `0005` setelah backup.
4. Selesaikan rekonsiliasi data lama sebelum memvalidasi constraint historis yang dibuat `NOT VALID`.
5. Provision user, role, default warehouse, dan warehouse scope.
6. Deploy dengan `NEXT_PUBLIC_WMS_DATA_MODE=demo`, lakukan smoke test, lalu ubah ke `live` setelah migrasi `0005`, master data, dan UAT disetujui.
7. Pantau `/api/health`, log aplikasi, Supabase Auth, query latency, serta error berdasarkan `X-Request-Id`.

## Provisioning user

User harus sudah ada di Supabase Auth. Setelah itu administrator database membuat profile dan role WMS. `warehouse_scope` harus menggunakan kode yang sama dengan `wms_warehouses.warehouse_code` dan `wms_locations.warehouse`.

```sql
insert into public.wms_profiles (id, full_name, default_warehouse, warehouse_scope, is_active)
values ('AUTH-USER-UUID', 'Nama Pengguna', 'Prasad 01', array['Prasad 01'], true)
on conflict (id) do update
set full_name = excluded.full_name,
    default_warehouse = excluded.default_warehouse,
    warehouse_scope = excluded.warehouse_scope,
    is_active = excluded.is_active;

insert into public.wms_user_roles (user_id, role_id)
select 'AUTH-USER-UUID', id
from public.wms_roles
where name = 'Operator Forklift'
on conflict do nothing;
```

Gunakan `Admin` dan `Supervisor` secara terbatas karena kedua role tersebut memiliki akses lintas warehouse pada baseline ini.

## Verifikasi keamanan database

Jalankan pemeriksaan berikut sebagai administrator database setelah migrasi `0005`:

```sql
select has_table_privilege('anon', 'public.wms_lpns', 'select') as anon_can_read_lpns;
select has_function_privilege('anon', 'public.wms_putaway_lpn(text,text,text)', 'execute') as anon_can_putaway;
select has_function_privilege('authenticated', 'public.wms_putaway_lpn(text,text,text)', 'execute') as user_can_call_putaway;
```

Hasil yang diharapkan: `false`, `false`, `true`. Lanjutkan dengan pengujian menggunakan JWT setiap role; privilege check saja tidak membuktikan policy RLS sudah benar.

## Skenario UAT minimum

- User tanpa profile WMS ditolak walaupun sudah login pada aplikasi lain di project Supabase yang sama.
- Profile `is_active=false` tidak dapat membuka halaman maupun menjalankan RPC.
- Viewer dapat melihat route umum tetapi tidak dapat membuka Admin, Checker, Operator, atau Supervisor transaction route.
- Operator tidak dapat melakukan putaway pada lokasi di luar warehouse scope.
- Scan token tidak valid tercatat sebagai gagal tanpa membuka data sensitif.
- Pengulangan request putaway dengan idempotency key yang sama tidak membuat movement kedua.
- Putaway ke lokasi penuh ditolak dan lokasi LPN tidak berubah.
- Saldo LPN tidak dapat menjadi negatif.
- Workbook salah format, terenkripsi, terlalu besar, atau memiliki rasio kompresi berbahaya ditolak.
- Mode demo tidak menjalankan mutation RPC.
- Pengguna authenticated tidak dapat melakukan direct insert/update/delete pada tabel operasional.
- Role `anon` tidak memiliki privilege pada tabel/view/sequence `wms_*`, dan role `authenticated` tidak memiliki `TRUNCATE`, `REFERENCES`, atau `TRIGGER` pada objek WMS.
- Dua browser yang membuka task sama menerima pembaruan realtime setelah salah satunya memposting transaksi.
- File import yang sama tidak membuat batch atau saldo ganda.
- Session kedaluwarsa diarahkan ke login dan API mengembalikan 401.

## Catatan operasional

- Rate limit import saat ini disimpan per instance aplikasi. Untuk deployment multi-instance, gunakan limiter terdistribusi (misalnya Redis/KV atau gateway rate limit).
- Health endpoint memeriksa konfigurasi wajib, bukan konektivitas mendalam ke database. Tambahkan synthetic authenticated check pada platform monitoring tanpa mempublikasikan credential.
- Service worker hanya menyimpan offline shell dan aset statis terpilih; response berisi data user tidak disimpan di cache offline.
- Jangan mengaktifkan mode live sebelum master data aktual, migrasi `0005`, backup/PITR, dan sign-off UAT tersedia.
