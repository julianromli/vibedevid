# Requirements Document

## Introduction

Fitur AI Event Detail Page adalah halaman detail untuk menampilkan informasi lengkap sebuah event AI di Indonesia. Halaman ini dapat diakses melalui URL `/event/[slug]` dengan slug yang SEO-friendly. Fase pertama menggunakan data mock dari `lib/data/mock-events.ts` tanpa integrasi database.

## Glossary

- **Event_Detail_Page**: Halaman yang menampilkan informasi lengkap satu event AI
- **Event_Slug**: Identifier unik event dalam format URL-friendly (contoh: `ai-workshop-jakarta-2025`)
- **Event_Status_Badge**: Badge yang menampilkan status event (upcoming, ongoing, past)
- **Event_Category_Badge**: Badge yang menampilkan kategori event (workshop, meetup, conference, hackathon)
- **Registration_CTA**: Tombol call-to-action untuk registrasi event
- **Share_Functionality**: Fitur untuk membagikan link event ke platform lain
- **Related_Events**: Daftar event lain dengan kategori yang sama
- **SEO_Metadata**: Metadata halaman untuk optimasi mesin pencari (title, description, og:image)

## Requirements

### Requirement 1: Menampilkan Informasi Event Lengkap

**User Story:** Sebagai pengunjung, saya ingin melihat informasi lengkap sebuah event AI, sehingga saya dapat memutuskan apakah akan mengikuti event tersebut.

#### Acceptance Criteria

1. WHEN pengguna mengakses `/event/[slug]` THEN Event_Detail_Page SHALL menampilkan informasi lengkap event yang sesuai dengan slug
2. THE Event_Detail_Page SHALL menampilkan cover image event dengan aspect ratio 16:9
3. THE Event_Detail_Page SHALL menampilkan nama event sebagai heading utama
4. THE Event_Detail_Page SHALL menampilkan tanggal dan waktu event (termasuk end date/time jika ada)
5. THE Event_Detail_Page SHALL menampilkan tipe lokasi (online, offline, hybrid) dan detail lokasi
6. THE Event_Detail_Page SHALL menampilkan deskripsi lengkap event
7. THE Event_Detail_Page SHALL menampilkan nama organizer event

### Requirement 2: Menampilkan Badge Status dan Kategori

**User Story:** Sebagai pengunjung, saya ingin melihat status dan kategori event dengan jelas, sehingga saya dapat dengan cepat memahami jenis dan ketersediaan event.

#### Acceptance Criteria

1. THE Event_Detail_Page SHALL menampilkan Event_Status_Badge (upcoming, ongoing, past)
2. THE Event_Detail_Page SHALL menampilkan Event_Category_Badge (workshop, meetup, conference, hackathon)
3. THE Event_Status_Badge SHALL menggunakan style yang konsisten dengan Event_Card di halaman list

### Requirement 3: Tombol Registrasi

**User Story:** Sebagai pengunjung, saya ingin dapat mendaftar ke event dengan mudah, sehingga saya dapat mengikuti event yang menarik.

#### Acceptance Criteria

1. THE Event_Detail_Page SHALL menampilkan Registration_CTA yang prominent
2. WHEN pengguna mengklik Registration_CTA THEN Event_Detail_Page SHALL membuka registrationUrl di tab baru
3. THE Registration_CTA SHALL menampilkan icon external link untuk menandakan navigasi ke situs eksternal
4. WHILE event status adalah 'past' THEN Registration_CTA SHALL ditampilkan dalam state disabled atau hidden

### Requirement 4: Navigasi Kembali

**User Story:** Sebagai pengunjung, saya ingin dapat kembali ke halaman daftar event dengan mudah, sehingga saya dapat melanjutkan browsing event lain.

#### Acceptance Criteria

1. THE Event_Detail_Page SHALL menampilkan tombol atau link untuk kembali ke `/event/list`
2. THE navigasi kembali SHALL ditempatkan di posisi yang mudah ditemukan (header area)

### Requirement 5: SEO Metadata

**User Story:** Sebagai platform, saya ingin halaman event memiliki metadata SEO yang baik, sehingga event dapat ditemukan melalui mesin pencari.

#### Acceptance Criteria

1. THE Event_Detail_Page SHALL mengatur page title dengan format "[Nama Event] | AI Events Indonesia"
2. THE Event_Detail_Page SHALL mengatur meta description dengan deskripsi event (truncated jika perlu)
3. THE Event_Detail_Page SHALL mengatur og:image dengan cover image event
4. THE Event_Detail_Page SHALL mengatur og:title dan og:description untuk social sharing

### Requirement 6: Penanganan Event Tidak Ditemukan

**User Story:** Sebagai pengunjung, saya ingin melihat pesan yang jelas ketika event tidak ditemukan, sehingga saya tahu bahwa URL yang diakses tidak valid.

#### Acceptance Criteria

1. WHEN slug tidak ditemukan dalam data mock THEN Event_Detail_Page SHALL menampilkan halaman 404
2. THE halaman 404 SHALL menyediakan link untuk kembali ke halaman daftar event

### Requirement 7: Fitur Share

**User Story:** Sebagai pengunjung, saya ingin dapat membagikan event ke teman atau media sosial, sehingga saya dapat mengajak orang lain untuk ikut event.

#### Acceptance Criteria

1. THE Event_Detail_Page SHALL menyediakan Share_Functionality
2. THE Share_Functionality SHALL menyediakan opsi copy link ke clipboard
3. WHEN pengguna mengklik copy link THEN Event_Detail_Page SHALL menampilkan feedback bahwa link telah disalin

### Requirement 8: Tampilan Responsif

**User Story:** Sebagai pengunjung, saya ingin halaman detail event dapat diakses dengan baik di berbagai ukuran layar, sehingga saya dapat melihat detail event dari perangkat apapun.

#### Acceptance Criteria

1. THE Event_Detail_Page SHALL menampilkan layout yang optimal di mobile, tablet, dan desktop
2. THE cover image SHALL menyesuaikan ukuran berdasarkan viewport
3. THE Registration_CTA SHALL tetap mudah diakses di semua ukuran layar

### Requirement 9: Related Events (Opsional)

**User Story:** Sebagai pengunjung, saya ingin melihat event lain yang serupa, sehingga saya dapat menemukan lebih banyak event yang menarik.

#### Acceptance Criteria

1. THE Event_Detail_Page MAY menampilkan Related_Events section
2. IF Related_Events ditampilkan THEN Event_Detail_Page SHALL menampilkan maksimal 3 event dengan kategori yang sama
3. THE Related_Events SHALL tidak menampilkan event yang sedang dilihat

### Requirement 10: Konsistensi Design

**User Story:** Sebagai pengunjung, saya ingin halaman detail event memiliki tampilan yang konsisten dengan halaman lain di platform, sehingga pengalaman browsing terasa seamless.

#### Acceptance Criteria

1. THE Event_Detail_Page SHALL menggunakan Navbar dan Footer yang sama dengan halaman lain
2. THE Event_Detail_Page SHALL menggunakan design system yang sudah ada (warna, typography, spacing)
3. THE Event_Detail_Page SHALL mengikuti pola layout yang mirip dengan project detail page di `/project/[slug]`
