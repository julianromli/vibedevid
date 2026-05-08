-- Seed the active Mini Vibeathon competition and categories.

INSERT INTO public.competitions (
  slug,
  title,
  tagline,
  description,
  prize_text,
  starts_at,
  ends_at,
  status,
  rules_markdown,
  judging_criteria_markdown,
  faq_items,
  timeline_items,
  hero_primary_cta_label,
  hero_secondary_cta_label,
  judging_vote_weight,
  judging_judge_weight
)
VALUES (
  'mini-vibeathon-2026',
  'Mini Vibeathon',
  'Dari ide ke demo, dalam 7 hari',
  'Kompetisi mini untuk builder Indonesia yang ingin mengubah ide menjadi demo yang bisa dipamerkan dalam waktu singkat.',
  'Cursor Credits',
  '2026-05-09T00:00:00Z',
  '2026-05-16T23:59:59Z',
  'active',
  E'## Syarat utama\n- Kirim karya buatan sendiri.\n- Gunakan AI secara eksplisit dalam proses pembuatan.\n- Entry yang dipublikasikan tidak bisa diedit.\n- Maksimal 3 submission per peserta selama kompetisi aktif.\n- Entry yang melanggar aturan dapat disembunyikan atau didiskualifikasi.',
  E'## Kriteria penilaian\n- Eksekusi dan kualitas demo.\n- Kreativitas ide dan implementasi.\n- Pemanfaatan AI dalam proses build.\n- UX dan presentasi.\n- Kelengkapan submission.',
  '[
    {"question":"Siapa saja yang boleh ikut?","answer":"Semua member komunitas yang sudah login ke VibeDev ID."},
    {"question":"Boleh submit lebih dari satu entry?","answer":"Boleh, maksimal tiga entry selama kompetisi masih aktif."},
    {"question":"Boleh edit submission setelah dikirim?","answer":"Tidak. Kamu hanya bisa menghapus entry sendiri saat kompetisi masih aktif lalu submit ulang."},
    {"question":"Vote dibuka sampai kapan?","answer":"Vote dibuka selama kompetisi aktif dan membutuhkan akun yang login."}
  ]'::jsonb,
  '[
    {"label":"Pendaftaran & submit dibuka","description":"Mulai kirim ide terbaikmu dan bangun demo secepat mungkin.","date":"2026-05-09"},
    {"label":"Voting publik berjalan","description":"Ajak komunitas untuk mencoba dan vote entry favorit mereka.","date":"2026-05-09"},
    {"label":"Batas akhir submission","description":"Submission dan voting ditutup di akhir hari terakhir kompetisi.","date":"2026-05-16"},
    {"label":"Review juri & pengumuman","description":"Tim admin merapikan shortlist, juri memberi skor, lalu pemenang diumumkan.","date":"2026-05-17"}
  ]'::jsonb,
  'Kirim Entry',
  'Lihat Semua Entry',
  0.30,
  0.70
)
ON CONFLICT (slug) DO UPDATE
SET
  title = EXCLUDED.title,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  prize_text = EXCLUDED.prize_text,
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at,
  status = EXCLUDED.status,
  rules_markdown = EXCLUDED.rules_markdown,
  judging_criteria_markdown = EXCLUDED.judging_criteria_markdown,
  faq_items = EXCLUDED.faq_items,
  timeline_items = EXCLUDED.timeline_items,
  hero_primary_cta_label = EXCLUDED.hero_primary_cta_label,
  hero_secondary_cta_label = EXCLUDED.hero_secondary_cta_label,
  judging_vote_weight = EXCLUDED.judging_vote_weight,
  judging_judge_weight = EXCLUDED.judging_judge_weight,
  updated_at = now();

WITH target_competition AS (
  SELECT id
  FROM public.competitions
  WHERE slug = 'mini-vibeathon-2026'
)
INSERT INTO public.competition_categories (competition_id, slug, label, description, sort_order)
SELECT
  target_competition.id,
  seeded.slug,
  seeded.label,
  seeded.description,
  seeded.sort_order
FROM target_competition
CROSS JOIN (
  VALUES
    ('ai-apps', 'AI Apps', 'Produk AI untuk use case nyata.', 1),
    ('developer-tools', 'Developer Tools', 'Tooling untuk bantu workflow developer.', 2),
    ('productivity', 'Productivity', 'App untuk bantu kerja lebih cepat.', 3),
    ('education', 'Education', 'Produk belajar, latihan, atau simulasi.', 4),
    ('automation', 'Automation', 'Workflow, bot, atau agent automation.', 5),
    ('creative-tools', 'Creative Tools', 'Tool kreatif untuk desain, konten, atau eksperimen.', 6),
    ('saas', 'SaaS', 'Software-as-a-Service untuk masalah spesifik.', 7),
    ('consumer', 'Consumer', 'Produk consumer untuk kebutuhan harian.', 8)
) AS seeded(slug, label, description, sort_order)
ON CONFLICT (competition_id, slug) DO UPDATE
SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = true;
