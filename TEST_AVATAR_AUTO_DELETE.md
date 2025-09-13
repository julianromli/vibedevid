# 🔥 Test Avatar Auto-Delete Implementation

## Fitur yang Diimplement

✅ **Auto-delete avatar lama** pas user upload foto profil baru  
✅ **Delay 10 detik** sebelum delete file lama dari storage  
✅ **Smart filtering** - cuma delete file dari storage sendiri, skip external URL  
✅ **Console logging** yang informatif buat monitoring

## Cara Test Manual

### 1. Start Development Server

```bash
npm run dev
# atau
pnpm dev
# atau
bun dev
```

### 2. Login ke Account Lo

- Buka browser ke `http://localhost:3000`
- Login dengan account lo

### 3. Upload Avatar Pertama

- Ke profile page lo
- Click "Edit Profile"
- Upload foto avatar pertama
- Save changes
- Catat URL avatar yang muncul di console: `[v0] Updated user state with new avatar: [URL]`

### 4. Upload Avatar Kedua (Test Auto-Delete)

- Masih di edit profile dialog
- Upload foto avatar yang berbeda
- **Perhatikan console logs**:
  ```
  [v0] Starting avatar upload for file: new-avatar.jpg
  [v0] Scheduling deletion of old avatar: [OLD_URL]
  [Avatar Utils] Scheduling deletion of old avatar: [FILE_PATH] in 10000ms
  [v0] Updated formData with avatar: [NEW_URL]
  ```
- Save changes

### 5. Monitor Auto-Delete Process

- Tunggu 10 detik
- Check console untuk message:
  ```
  [Avatar Utils] ✅ Old avatar deleted successfully: [FILE_PATH]
  ```
- Atau jika gagal:
  ```
  [Avatar Utils] ❌ Failed to delete old avatar: [FILE_PATH]
  ```

### 6. Verify di Supabase Storage

- Buka Supabase dashboard
- Go to Storage > avatars bucket
- Check apakah file avatar lama udah terhapus
- File avatar baru masih ada

## Expected Behavior

### ✅ Yang Akan Terhapus:

- File dari Supabase storage bucket 'avatars'
- URL format: `https://[project].supabase.co/storage/v1/object/public/avatars/[path]`
- Avatar lama setelah delay 10 detik

### ❌ Yang TIDAK Akan Terhapus:

- External URLs (Dicebear, Gravatar, dll.)
- URL yang bukan dari storage bucket kita
- Avatar yang sedang aktif digunakan

## Console Logs untuk Monitor

### Upload Success + Scheduling Deletion:

```
[v0] Starting avatar upload for file: new-photo.jpg
[v0] Scheduling deletion of old avatar: https://xxx.supabase.co/storage/v1/object/public/avatars/user-id/old-file.jpg
[Avatar Utils] Scheduling deletion of old avatar: user-id/old-file.jpg in 10000ms
[v0] Updated formData with avatar: https://xxx.supabase.co/storage/v1/object/public/avatars/user-id/new-file.jpg
```

### Deletion Success (After 10 seconds):

```
[Avatar Utils] ✅ Old avatar deleted successfully: user-id/old-file.jpg
```

### Skipping External URLs:

```
[v0] Skipping deletion - not our storage URL: https://api.dicebear.com/7.x/identicon/svg?seed=abc123
[Avatar Utils] Skipping deletion - not our storage file or invalid URL: https://api.dicebear.com/7.x/identicon/svg?seed=abc123
```

## Edge Cases yang Dihandle

1. **No Previous Avatar**: Skip deletion jika belum ada avatar sebelumnya
2. **External URLs**: Skip deletion untuk Dicebear, Gravatar, atau URL lain
3. **Upload Error**: Tidak schedule deletion jika upload gagal
4. **Same Avatar**: Tidak schedule deletion jika user upload file yang sama
5. **Invalid URLs**: Handle gracefully tanpa crash

## File Structure

```
lib/
├── avatar-utils.ts          # Utility functions untuk manage avatar
└── supabase/               # Supabase client config

components/ui/
└── profile-edit-dialog.tsx # Updated dengan auto-delete logic
```

## Implementation Details

### Utility Functions (avatar-utils.ts):

- `extractStoragePathFromUrl()` - Extract file path dari URL
- `deleteStorageFile()` - Delete file dari storage bucket
- `scheduleOldAvatarDeletion()` - Schedule deletion dengan delay
- `isOurStorageUrl()` - Check apakah URL dari storage kita

### Modified Components:

- `ProfileEditDialog.handleAvatarUpload()` - Added auto-delete logic
- Import avatar utils functions
- Track old avatar URL sebelum upload
- Schedule deletion setelah upload berhasil

## Troubleshooting

### Jika Auto-Delete Tidak Jalan:

1. Check console untuk error messages
2. Pastikan old avatar adalah dari Supabase storage (bukan external)
3. Check Supabase permissions untuk delete files
4. Verify bucket name dan file path

### Performance Impact:

- **Minimal**: Deletion berjalan asynchronous dengan setTimeout
- **Storage Optimized**: Cegah bloat storage dari avatar lama
- **User Experience**: Tidak blocking UI, berjalan background

---

🚀 **Ready untuk production!** Implementasi ini aman, efficient, dan handle edge cases dengan baik.
