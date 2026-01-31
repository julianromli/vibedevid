# Dokumen Requirements

## Pendahuluan

Fitur Submit Event Modal memungkinkan pengguna yang sudah login untuk mengirimkan event AI baru melalui form modal popup. Event yang disubmit akan memerlukan persetujuan admin sebelum ditampilkan di daftar event publik. Fitur ini mendukung upload gambar cover melalui UploadThing atau input URL manual.

## Glossary

- **Submit_Event_Modal**: Komponen modal popup yang berisi form untuk mengirimkan event baru
- **Event_Form**: Form dalam modal yang mengumpulkan informasi event dari pengguna
- **Cover_Image_Uploader**: Komponen untuk upload gambar cover event via UploadThing atau URL
- **Event_Validator**: Modul yang memvalidasi input form sebelum submission
- **Slug_Generator**: Fungsi yang menghasilkan slug URL-friendly dari nama event

## Requirements

### Requirement 1: Autentikasi Pengguna

**User Story:** Sebagai pengguna, saya ingin sistem memastikan hanya pengguna yang sudah login yang dapat mengirimkan event, sehingga submission event dapat dilacak dan dimoderasi.

#### Acceptance Criteria

1. WHEN pengguna yang belum login mengklik tombol "Submit Event" THEN Submit_Event_Modal SHALL menampilkan pesan untuk login terlebih dahulu
2. WHEN pengguna yang sudah login mengklik tombol "Submit Event" THEN Submit_Event_Modal SHALL membuka form submission event
3. THE Submit_Event_Modal SHALL menyimpan ID pengguna yang mengirimkan event untuk keperluan tracking

### Requirement 2: Form Input Event

**User Story:** Sebagai pengguna, saya ingin mengisi informasi event melalui form yang terstruktur, sehingga event saya dapat ditampilkan dengan lengkap.

#### Acceptance Criteria

1. THE Event_Form SHALL menampilkan field input untuk: name, date, time, locationType, locationDetail, description, organizer, registrationUrl, coverImage, dan category
2. WHEN pengguna mengisi field name THEN Slug_Generator SHALL otomatis menghasilkan slug dari nama event
3. THE Event_Form SHALL menyediakan dropdown untuk locationType dengan opsi: online, offline, hybrid
4. THE Event_Form SHALL menyediakan dropdown untuk category dengan opsi: workshop, meetup, conference, hackathon
5. THE Event_Form SHALL otomatis mengatur status event ke 'upcoming' saat submission

### Requirement 3: Upload Cover Image

**User Story:** Sebagai pengguna, saya ingin dapat mengupload gambar cover atau memasukkan URL gambar, sehingga event saya memiliki visual yang menarik.

#### Acceptance Criteria

1. THE Cover_Image_Uploader SHALL menyediakan opsi upload file via UploadThing
2. THE Cover_Image_Uploader SHALL menyediakan opsi input URL gambar manual
3. WHEN pengguna mengupload file THEN Cover_Image_Uploader SHALL membatasi ukuran maksimal 10MB
4. WHEN pengguna memilih salah satu metode (upload atau URL) THEN Cover_Image_Uploader SHALL menggunakan metode tersebut untuk coverImage
5. THE Cover_Image_Uploader SHALL menampilkan preview gambar setelah upload atau input URL berhasil

### Requirement 4: Validasi Form

**User Story:** Sebagai pengguna, saya ingin mendapat feedback jika ada input yang tidak valid, sehingga saya dapat memperbaiki sebelum submit.

#### Acceptance Criteria

1. WHEN pengguna mencoba submit dengan field required kosong THEN Event_Validator SHALL menampilkan pesan error pada field tersebut
2. WHEN pengguna memasukkan registrationUrl yang bukan format URL valid THEN Event_Validator SHALL menampilkan pesan error
3. THE Event_Validator SHALL memvalidasi bahwa semua field required terisi: name, date, time, locationType, locationDetail, description, organizer, registrationUrl, coverImage, category
4. IF validasi gagal THEN Event_Validator SHALL mencegah submission dan menampilkan semua error

### Requirement 5: Submission dan Moderasi

**User Story:** Sebagai pengguna, saya ingin event saya disimpan untuk direview admin, sehingga event berkualitas dapat ditampilkan di platform.

#### Acceptance Criteria

1. WHEN pengguna submit event yang valid THEN Submit_Event_Modal SHALL menyimpan event dengan field approved=false
2. WHEN submission berhasil THEN Submit_Event_Modal SHALL menutup modal dan menampilkan toast notification sukses
3. WHEN submission berhasil THEN Submit_Event_Modal SHALL redirect pengguna ke halaman /event/list
4. THE Submit_Event_Modal SHALL menyimpan submitted_by dengan ID pengguna yang mengirimkan

### Requirement 6: UI/UX Modal

**User Story:** Sebagai pengguna, saya ingin form submission mudah diakses dan digunakan, sehingga pengalaman submit event menyenangkan.

#### Acceptance Criteria

1. THE Submit_Event_Modal SHALL ditampilkan sebagai modal popup menggunakan komponen Dialog yang sudah ada
2. THE Submit_Event_Modal SHALL dapat ditutup dengan tombol close atau klik di luar modal
3. WHEN form sedang dalam proses submission THEN Submit_Event_Modal SHALL menampilkan loading state dan disable tombol submit
4. THE Submit_Event_Modal SHALL memiliki tombol trigger yang ditempatkan di section bawah daftar event pada halaman /event/list
