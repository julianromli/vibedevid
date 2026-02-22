'use client'

import Link from 'next/link'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import { useAuth } from '@/hooks/useAuth'

const updatedAt = '20 February 2026'
const effectiveAt = '20 February 2026'

const sections = [
  {
    id: 'scope',
    title: '1. Ruang Lingkup',
    body: [
      'Kebijakan Privasi ini berlaku untuk layanan VibeDev ID, termasuk website, fitur komunitas, project showcase, komentar, event, dan akun pengguna.',
      'Dengan menggunakan layanan kami, Anda memahami cara kami memproses data sesuai kebijakan ini.',
    ],
  },
  {
    id: 'data-collected',
    title: '2. Data yang Kami Kumpulkan',
    body: [
      'Kami mengumpulkan data yang Anda berikan langsung, data teknis saat Anda menggunakan layanan, serta data publik yang Anda pilih untuk tampilkan di profil.',
    ],
    bullets: [
      'Data akun: email, username, display name, avatar, dan informasi profil lain yang Anda isi.',
      'Data kontribusi: project, komentar, konten blog, likes, dan interaksi komunitas.',
      'Data teknis: alamat IP terbatas, user agent, device/browser info, log keamanan, dan data performa layanan.',
      'Data komunikasi: pertanyaan, laporan, dan feedback yang Anda kirim ke tim kami.',
    ],
  },
  {
    id: 'purposes',
    title: '3. Tujuan Pemrosesan Data',
    body: ['Kami memproses data untuk menjalankan platform komunitas dengan aman, relevan, dan bermanfaat.'],
    bullets: [
      'Membuat dan mengelola akun pengguna.',
      'Menayangkan project, komentar, dan aktivitas komunitas sesuai pengaturan visibilitas.',
      'Menjaga keamanan sistem, mencegah abuse/spam, dan melakukan moderasi konten.',
      'Menyediakan dukungan pengguna serta update penting layanan.',
      'Menganalisis penggunaan produk untuk meningkatkan fitur dan pengalaman pengguna.',
    ],
  },
  {
    id: 'legal-basis',
    title: '4. Dasar Pemrosesan',
    body: [
      'Kami memproses data berdasarkan kebutuhan kontraktual untuk menjalankan layanan, kepentingan yang sah untuk keamanan dan peningkatan produk, kewajiban hukum jika berlaku, serta persetujuan untuk aktivitas tertentu.',
    ],
  },
  {
    id: 'sharing',
    title: '5. Berbagi Data dan Penyedia Layanan',
    body: [
      'Kami tidak menjual data pribadi Anda. Data dapat dibagikan secara terbatas kepada penyedia layanan tepercaya yang membantu operasional platform, dengan kontrol keamanan yang sesuai.',
    ],
    bullets: [
      'Infrastruktur dan autentikasi (misalnya layanan backend/database).',
      'Penyimpanan file/media dan pemrosesan konten.',
      'Alat analitik dan pemantauan performa produk.',
      'Kepatuhan hukum, bila diminta secara sah oleh otoritas yang berwenang.',
    ],
  },
  {
    id: 'cookies',
    title: '6. Cookies dan Teknologi Serupa',
    body: [
      'Kami menggunakan cookies dan penyimpanan lokal untuk sesi login, preferensi dasar, keamanan, dan pengukuran performa. Anda dapat mengelola preferensi cookie melalui browser Anda.',
    ],
  },
  {
    id: 'retention',
    title: '7. Retensi Data',
    body: [
      'Kami menyimpan data selama diperlukan untuk tujuan layanan, keamanan, penyelesaian sengketa, dan kepatuhan hukum. Masa simpan dapat berbeda sesuai jenis data dan konteks penggunaan.',
    ],
  },
  {
    id: 'rights',
    title: '8. Hak Pengguna',
    body: [
      'Anda dapat meminta akses, koreksi, pembaruan, pembatasan, atau penghapusan data pribadi Anda sesuai hukum yang berlaku.',
    ],
    bullets: [
      'Akses dan pembaruan data profil melalui akun Anda.',
      'Permintaan penghapusan akun dan data terkait yang memenuhi kriteria.',
      'Keberatan atas pemrosesan tertentu bila ada dasar yang sah.',
      'Permintaan salinan data yang kami simpan tentang Anda.',
    ],
  },
  {
    id: 'transfers',
    title: '9. Transfer Data Lintas Wilayah',
    body: [
      'Karena layanan kami menggunakan penyedia cloud global, data dapat diproses di luar negara tempat Anda berada. Kami menerapkan langkah perlindungan kontraktual dan teknis yang wajar untuk menjaga keamanan data.',
    ],
  },
  {
    id: 'security',
    title: '10. Keamanan Data',
    body: [
      'Kami menerapkan kontrol keamanan administratif, teknis, dan operasional untuk mengurangi risiko akses tidak sah, perubahan, atau kebocoran data. Namun, tidak ada sistem yang dapat menjamin keamanan 100%.',
    ],
  },
  {
    id: 'children',
    title: '11. Privasi Anak',
    body: [
      'Layanan ini tidak ditujukan untuk anak di bawah usia minimum yang diizinkan hukum setempat. Jika kami mengetahui adanya data anak tanpa persetujuan yang diperlukan, kami akan mengambil langkah penghapusan yang sesuai.',
    ],
  },
  {
    id: 'changes',
    title: '12. Perubahan Kebijakan',
    body: [
      'Kami dapat memperbarui kebijakan ini dari waktu ke waktu. Untuk perubahan material, kami akan memberikan pemberitahuan yang wajar melalui platform.',
    ],
  },
  {
    id: 'contact',
    title: '13. Kontak',
    body: [
      'Jika Anda memiliki pertanyaan terkait privasi atau ingin mengajukan permintaan hak data, hubungi kami melalui email support@vibedev.id.',
    ],
  },
]

export function PrivacyPolicyClient() {
  const { isLoggedIn, user, authReady } = useAuth()

  return (
    <div className="bg-background min-h-screen">
      {authReady ? (
        <Navbar
          showNavigation={true}
          isLoggedIn={isLoggedIn}
          user={user || undefined}
        />
      ) : (
        <div className="h-16 border-b border-border/40" />
      )}
      <main className="pb-16 pt-28">
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="border-border/70 mb-8 rounded-2xl border bg-gradient-to-b from-sky-500/10 via-cyan-500/5 to-transparent p-6 sm:p-8">
            <p className="text-primary mb-2 text-sm font-medium tracking-wide uppercase">VibeDev ID Legal</p>
            <h1 className="mb-3 font-semibold text-3xl tracking-tight sm:text-4xl">Privacy Policy</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Halaman ini menjelaskan bagaimana VibeDev ID mengumpulkan, menggunakan, dan melindungi data pribadi
              pengguna.
            </p>
            <div className="text-muted-foreground mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm">
              <span>Effective: {effectiveAt}</span>
              <span>Last updated: {updatedAt}</span>
            </div>
          </div>

          <div className="mb-10 grid gap-3 sm:grid-cols-2">
            <Link
              href="/terms-of-service"
              className="border-border/70 hover:bg-accent/40 rounded-xl border p-4 text-sm transition-colors"
            >
              Lihat juga Terms of Service
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
            This policy is provided for transparency and operational clarity for our community platform, and does not
            replace formal legal counsel.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
