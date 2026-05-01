# Events feature — next steps

Prioritas: **High**, **Medium**, **Low**. Ringkasan dari review fitur AI Events (listing, detail, submit, approval admin).

---

## High

1. **Kunci halaman detail ke konten yang sudah disetujui** — Tambahkan filter `approved = true` pada `getEventBySlug` (dan pertimbangkan juga untuk related events / metadata OG), supaya event pending tidak bisa diakses lewat URL langsung.

2. **Sambungkan kontrol “Urutkan” (Terdekat / Terbaru) ke data** — Saat ini `selectedSort` tidak memengaruhi hasil; samakan perilaku dengan `getEvents` (mis. `latest` = `created_at` desc) atau tambahkan helper sort di client yang konsisten dengan server.

3. **Tangani tabrakan `slug` dan error Supabase yang jelas** — Insert bisa gagal jika slug duplikat; tangkap error unik, beri pesan UI (“nama sudah dipakai, ubah nama”), atau gunakan strategi slug unik (suffix).

4. **`status` event selaras dengan waktu** — Job ringan/cron atau computed saat read: set `past` / `upcoming` berdasarkan tanggal agar badge dan CTA konsisten tanpa edit manual.

---

## Medium

5. **Rapikan `useEventForm`** — Hapus atau ganti “Phase 1 mock” di `handleSubmit` agar tidak menyesatkan maintainer; satu jalur submit lewat server action saja, atau panggil `submitEvent` dari hook dengan kontrak yang jelas.

6. **UX kartu & CTA** — Pisahkan “Detail” vs “Daftar”; atau di grid arahkan tombol utama ke `registrationUrl` (dengan `rel`/security) dan sediakan link sekunder ke detail — kurangi klik yang tidak perlu jika niatnya registrasi.

7. **Form lengkap vs skema DB** — Kolom `end_date` / `end_time` ada di DB dan detail sudah memakai `formatEventDateRange`, tapi form submit belum; tambahkan field opsional untuk event multi-hari.

8. **Notifikasi & transparansi untuk submitter** — Email atau in-app (mis. “sedang ditinjau” / “disetujui”) dan halaman “event saya” read-only supaya pengguna tidak harus menebak setelah submit.

---

## Low

9. **Uji otomatis & konsistensi RLS** — Playwright untuk alur list → detail → submit → approve; plus tes bahwa policy Supabase selaras dengan asumsi app (anon tidak baca pending, dll.).

10. **`lib/events-utils` mock vs nyata** — Deprecate atau hapus `getEventBySlug` / `getRelatedEvents` dari mock jika tidak dipakai; dokumentasikan satu sumber kebenaran (Supabase) untuk menghindari regressi dokumentasi (mis. file `.kiro` yang masih mengacu mock).

---

## Urutan kerja yang disarankan

Mulai dari **(1) + (2) + (3)** untuk dampak besar dengan risiko relatif terkendali.
