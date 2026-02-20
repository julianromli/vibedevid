'use client'

import Link from 'next/link'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import { useAuth } from '@/hooks/useAuth'

const updatedAt = '20 February 2026'
const effectiveAt = '20 February 2026'

const sections = [
  {
    id: 'acceptance',
    title: '1. Persetujuan atas Syarat',
    body: [
      'Dengan mengakses atau menggunakan VibeDev ID, Anda menyetujui Terms of Service ini. Jika Anda tidak setuju, Anda tidak boleh menggunakan layanan kami.',
    ],
  },
  {
    id: 'service',
    title: '2. Deskripsi Layanan',
    body: [
      'VibeDev ID adalah platform komunitas developer untuk membangun profil, berbagi project, berdiskusi, dan berkolaborasi.',
    ],
  },
  {
    id: 'accounts',
    title: '3. Akun Pengguna',
    body: ['Anda bertanggung jawab atas akun Anda dan aktivitas yang terjadi di dalamnya.'],
    bullets: [
      'Gunakan data pendaftaran yang akurat dan selalu diperbarui.',
      'Jaga keamanan kredensial akun Anda.',
      'Jangan membagikan akses akun kepada pihak lain tanpa kontrol yang sesuai.',
      'Laporkan dugaan akses tidak sah sesegera mungkin.',
    ],
  },
  {
    id: 'acceptable-use',
    title: '4. Penggunaan yang Diizinkan dan Dilarang',
    body: ['Anda setuju untuk menggunakan layanan secara legal, etis, dan menghormati komunitas.'],
    bullets: [
      'Dilarang menyebarkan spam, penipuan, malware, atau aktivitas ilegal.',
      'Dilarang melakukan scraping berbahaya, abuse API, atau upaya mengganggu sistem.',
      'Dilarang melakukan pelecehan, ujaran kebencian, doxxing, dan intimidasi.',
      'Dilarang menyamar sebagai pihak lain atau memalsukan identitas.',
    ],
  },
  {
    id: 'user-content',
    title: '5. Konten Pengguna',
    body: [
      'Anda mempertahankan kepemilikan konten yang Anda unggah. Namun, untuk mengoperasikan platform, Anda memberi kami lisensi non-eksklusif, global, bebas royalti untuk menampilkan, menyimpan, memproses, dan mendistribusikan konten tersebut di layanan VibeDev ID.',
      'Anda menyatakan memiliki hak yang sah atas konten yang dipublikasikan dan konten tersebut tidak melanggar hak pihak ketiga.',
    ],
  },
  {
    id: 'moderation',
    title: '6. Moderasi dan Penegakan',
    body: [
      'Kami dapat meninjau, membatasi, menurunkan visibilitas, atau menghapus konten yang melanggar aturan komunitas, hukum, atau keamanan layanan.',
      'Kami dapat memberikan peringatan, pembatasan fitur, suspensi sementara, atau penghentian akun sesuai tingkat pelanggaran.',
    ],
  },
  {
    id: 'ip',
    title: '7. Kekayaan Intelektual',
    body: [
      'Elemen platform VibeDev ID seperti brand, logo, desain sistem, dan teknologi layanan dilindungi hak kekayaan intelektual. Penggunaan di luar batas izin tertulis tidak diperkenankan.',
    ],
  },
  {
    id: 'third-party',
    title: '8. Layanan Pihak Ketiga',
    body: [
      'Layanan kami dapat terintegrasi dengan penyedia pihak ketiga (misalnya autentikasi, storage, analitik). Penggunaan layanan pihak ketiga tetap tunduk pada kebijakan dan syarat mereka masing-masing.',
    ],
  },
  {
    id: 'disclaimer',
    title: '9. Disclaimer',
    body: [
      'Layanan disediakan "as is" dan "as available". Kami berupaya menjaga layanan tetap andal, namun tidak menjamin bebas gangguan, bebas error, atau sesuai untuk setiap kebutuhan spesifik pengguna.',
    ],
  },
  {
    id: 'liability',
    title: '10. Batas Tanggung Jawab',
    body: [
      'Sejauh diizinkan hukum, VibeDev ID tidak bertanggung jawab atas kerugian tidak langsung, insidental, khusus, konsekuensial, atau kehilangan keuntungan/data yang timbul dari penggunaan layanan.',
    ],
  },
  {
    id: 'termination',
    title: '11. Penghentian Layanan',
    body: [
      'Anda dapat menghentikan penggunaan kapan saja. Kami dapat menghentikan atau membatasi akses akun yang melanggar Terms ini, menimbulkan risiko keamanan, atau merugikan komunitas.',
    ],
  },
  {
    id: 'changes',
    title: '12. Perubahan Terms',
    body: [
      'Kami dapat memperbarui Terms of Service dari waktu ke waktu. Jika ada perubahan material, kami akan memberikan pemberitahuan yang wajar melalui platform.',
    ],
  },
  {
    id: 'law',
    title: '13. Hukum yang Berlaku',
    body: [
      'Terms ini diatur oleh hukum yang berlaku di yurisdiksi operasional VibeDev ID, kecuali ditentukan lain oleh hukum yang wajib berlaku.',
    ],
  },
  {
    id: 'contact',
    title: '14. Kontak',
    body: ['Untuk pertanyaan terkait Terms of Service, hubungi support@vibedev.id.'],
  },
]

export function TermsOfServiceClient() {
  const { isLoggedIn, user } = useAuth()

  return (
    <div className="bg-background min-h-screen">
      <Navbar
        showNavigation={true}
        isLoggedIn={isLoggedIn}
        user={user || undefined}
      />
      <main className="pb-16 pt-28">
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="border-border/70 mb-8 rounded-2xl border bg-gradient-to-b from-emerald-500/10 via-lime-500/5 to-transparent p-6 sm:p-8">
            <p className="text-primary mb-2 text-sm font-medium tracking-wide uppercase">VibeDev ID Legal</p>
            <h1 className="mb-3 font-semibold text-3xl tracking-tight sm:text-4xl">Terms of Service</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Halaman ini menjelaskan aturan penggunaan platform VibeDev ID agar komunitas tetap aman, terbuka, dan
              produktif.
            </p>
            <div className="text-muted-foreground mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm">
              <span>Effective: {effectiveAt}</span>
              <span>Last updated: {updatedAt}</span>
            </div>
          </div>

          <div className="mb-10 grid gap-3 sm:grid-cols-2">
            <Link
              href="/privacy-policy"
              className="border-border/70 hover:bg-accent/40 rounded-xl border p-4 text-sm transition-colors"
            >
              Lihat juga Privacy Policy
            </Link>
            <Link
              href="/"
              className="border-border/70 hover:bg-accent/40 rounded-xl border p-4 text-sm transition-colors"
            >
              Kembali ke beranda VibeDev ID
            </Link>
          </div>

          <article className="space-y-5">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="border-border/70 rounded-xl border bg-card p-5 sm:p-6"
              >
                <h2 className="mb-3 font-semibold text-lg sm:text-xl">{section.title}</h2>
                <div className="space-y-3 text-muted-foreground text-sm leading-6 sm:text-base">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets ? (
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground text-sm leading-6 sm:text-base">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </article>

          <p className="text-muted-foreground mt-10 text-xs sm:text-sm">
            This document is for transparent platform governance and does not replace formal legal counsel.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
