# Requirements Document

## Introduction

Fitur AI Events List Page adalah halaman baru di platform VibeDevID yang menampilkan daftar event-event AI di Indonesia. Komunitas dan perusahaan dapat berkolaborasi dengan VibeDevID untuk menampilkan event AI mereka. Fase pertama fokus pada halaman list (`/event/list`) dengan data mock, tanpa integrasi database.

## Glossary

- **Event_List_Page**: Halaman yang menampilkan daftar semua event AI di Indonesia
- **Event_Card**: Komponen UI yang menampilkan informasi singkat satu event
- **Filter_System**: Sistem untuk memfilter event berdasarkan kategori, lokasi, dan tanggal
- **Sort_System**: Sistem untuk mengurutkan event berdasarkan tanggal
- **Event_Status**: Status event yang terdiri dari upcoming, ongoing, atau past
- **Event_Category**: Kategori event yang terdiri dari workshop, meetup, conference, atau hackathon
- **Event_Location_Type**: Tipe lokasi event yang terdiri dari online, offline, atau hybrid

## Requirements

### Requirement 1: Menampilkan Daftar Event

**User Story:** Sebagai pengunjung, saya ingin melihat daftar event AI di Indonesia, sehingga saya dapat menemukan event yang menarik untuk diikuti.

#### Acceptance Criteria

1. WHEN pengguna mengakses `/event/list` THEN Event_List_Page SHALL menampilkan daftar Event_Card dari data mock
2. THE Event_Card SHALL menampilkan nama event, tanggal & waktu, lokasi, deskripsi singkat, organizer, dan cover image
3. THE Event_Card SHALL menampilkan badge kategori (workshop, meetup, conference, hackathon)
4. THE Event_Card SHALL menampilkan badge status (upcoming, ongoing, past) dengan warna berbeda
5. WHEN pengguna mengklik Event_Card THEN Event_List_Page SHALL tidak melakukan navigasi (detail page di fase berikutnya)

### Requirement 2: Filter Event

**User Story:** Sebagai pengunjung, saya ingin memfilter event berdasarkan kategori, lokasi, dan tanggal, sehingga saya dapat menemukan event yang sesuai dengan preferensi saya.

#### Acceptance Criteria

1. THE Filter_System SHALL menyediakan filter berdasarkan kategori (All, Workshop, Meetup, Conference, Hackathon)
2. THE Filter_System SHALL menyediakan filter berdasarkan tipe lokasi (All, Online, Offline, Hybrid)
3. THE Filter_System SHALL menyediakan filter berdasarkan rentang tanggal
4. WHEN pengguna memilih filter kategori THEN Event_List_Page SHALL menampilkan hanya event dengan kategori tersebut
5. WHEN pengguna memilih filter lokasi THEN Event_List_Page SHALL menampilkan hanya event dengan tipe lokasi tersebut
6. WHEN pengguna memilih filter tanggal THEN Event_List_Page SHALL menampilkan hanya event dalam rentang tanggal tersebut
7. WHEN pengguna memilih multiple filter THEN Event_List_Page SHALL menampilkan event yang memenuhi semua kriteria filter

### Requirement 3: Sort Event

**User Story:** Sebagai pengunjung, saya ingin mengurutkan event berdasarkan tanggal, sehingga saya dapat melihat event terdekat terlebih dahulu.

#### Acceptance Criteria

1. THE Sort_System SHALL mengurutkan event berdasarkan tanggal terdekat (nearest date first) sebagai default
2. WHEN halaman dimuat THEN Event_List_Page SHALL menampilkan event dengan urutan tanggal terdekat di atas
3. THE Sort_System SHALL menempatkan event upcoming di atas event past

### Requirement 4: Tampilan Responsif

**User Story:** Sebagai pengunjung, saya ingin halaman event dapat diakses dengan baik di berbagai ukuran layar, sehingga saya dapat melihat event dari perangkat apapun.

#### Acceptance Criteria

1. THE Event_List_Page SHALL menampilkan grid 1 kolom di mobile, 2 kolom di tablet, dan 3 kolom di desktop
2. THE Filter_System SHALL dapat diakses dan digunakan di semua ukuran layar
3. THE Event_Card SHALL menyesuaikan ukuran dan layout berdasarkan ukuran layar

### Requirement 5: Data Mock Event

**User Story:** Sebagai developer, saya ingin menggunakan data mock untuk fase pertama, sehingga dapat mengembangkan UI tanpa ketergantungan database.

#### Acceptance Criteria

1. THE Event_List_Page SHALL menggunakan data mock yang didefinisikan di file terpisah
2. THE data mock SHALL mencakup minimal 6 event dengan variasi kategori, lokasi, dan status
3. THE data mock SHALL mengikuti struktur data yang akan digunakan di database nantinya
4. FOR ALL event dalam data mock, setiap event SHALL memiliki semua field yang diperlukan (nama, tanggal, waktu, lokasi, deskripsi, organizer, link registrasi, cover image, kategori, status)

### Requirement 6: Konsistensi Design

**User Story:** Sebagai pengunjung, saya ingin halaman event memiliki tampilan yang konsisten dengan halaman lain di platform, sehingga pengalaman browsing terasa seamless.

#### Acceptance Criteria

1. THE Event_List_Page SHALL menggunakan Navbar dan Footer yang sama dengan halaman lain
2. THE Event_List_Page SHALL menggunakan design system yang sudah ada (warna, typography, spacing)
3. THE Event_Card SHALL mengikuti pola visual yang mirip dengan project card di `/project/list`
4. THE Filter_System SHALL mengikuti pola UI filter yang ada di `/project/list`
