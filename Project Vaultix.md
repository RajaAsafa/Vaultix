# PRODUCT REQUIREMENTS DOCUMENT (PRD)

# VAULTIX --- YOUR DIGITAL SAFE

  Informasi              Detail
  ---------------------- -------------------------
  Nama Produk            Vaultix
  Versi PRD              1.2
  Status                 Ready for Development
  Platform               Android
  Kategori               Productivity / Security
  Frontend               React Native
  Programming Language   TypeScript
  Database               SQLite Lokal
  Architecture           Local-First
  Tagline                Your Digital Safe.

------------------------------------------------------------------------

# 1. Product Overview

## 1.1 Deskripsi Produk

Vaultix adalah aplikasi Password Manager berbasis Android yang dirancang
untuk membantu pengguna menyimpan, mengelola, dan melindungi informasi
akun digital dalam satu tempat.

Pengguna dapat menyimpan nama layanan, username atau ID, email,
password, kategori, dan catatan tambahan. **Vaultix tidak menyediakan
field URL website** agar proses penambahan akun tetap sederhana.

Seluruh data disimpan secara lokal pada perangkat menggunakan SQLite dan
dilindungi dengan sistem enkripsi. Aplikasi dapat digunakan tanpa
koneksi internet.

## 1.2 Product Vision

Menjadi aplikasi pengelola password pribadi yang aman, sederhana, dan
mudah digunakan dengan memberikan kendali penuh kepada pengguna atas
data digital mereka.

## 1.3 Product Mission

1.  Menyediakan penyimpanan informasi akun yang aman.
2.  Mempermudah pengelolaan berbagai akun digital.
3.  Mengurangi risiko lupa password.
4.  Membantu pengguna membuat password yang kuat.
5.  Memberikan informasi mengenai kondisi keamanan password.
6.  Menjaga privasi melalui penyimpanan lokal dan enkripsi.

## 1.4 Target Pengguna

-   Pelajar dan mahasiswa.
-   Pengguna media sosial.
-   Gamer dengan banyak akun.
-   Pengguna berbagai layanan digital.
-   Pengguna yang ingin mengelola password secara terorganisir.

------------------------------------------------------------------------

# 2. Product Objectives

Tujuan utama Vaultix:

1.  Pengguna dapat menyimpan informasi akun dalam satu aplikasi.
2.  Pengguna dapat mengelola akun dengan mudah.
3.  Pengguna dapat mencari informasi akun dengan cepat.
4.  Pengguna dapat membuat password secara otomatis.
5.  Pengguna dapat mengetahui kekuatan password.
6.  Pengguna dapat melindungi Vault menggunakan Master Password dan
    biometrik.
7.  Pengguna dapat melakukan backup dan restore data secara aman.
8.  Aplikasi dapat berjalan sepenuhnya secara offline.

## 2.1 Success Metrics

  -----------------------------------------------------------------------
  Indikator                           Target
  ----------------------------------- -----------------------------------
  Keberhasilan penyimpanan akun       100% operasi valid

  Keberhasilan pencarian              Hasil sesuai kata kunci

  Keberhasilan autentikasi            Sesuai mekanisme keamanan

  Kecepatan membuka Vault             Target di bawah 2 detik pada
                                      perangkat yang mendukung

  Password plaintext dalam database   0

  Ketergantungan koneksi internet     Tidak ada

  Crash aplikasi                      Serendah mungkin
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 3. Technology Stack

  Komponen               Teknologi
  ---------------------- ---------------------------
  Mobile Framework       React Native
  Programming Language   TypeScript
  Framework Tooling      Expo
  Database               SQLite
  SQLite Library         Expo SQLite
  Secure Storage         Expo SecureStore
  Biometric              Expo Local Authentication
  Navigation             React Navigation
  State Management       Zustand
  Encryption             AES-256-GCM
  Key Derivation         Argon2id
  Platform Security      Android Keystore
  Version Control        Git & GitHub

**Catatan implementasi:** - Argon2id memerlukan implementasi atau modul
native yang kompatibel dengan Expo. - Android Keystore digunakan untuk
perlindungan material kunci melalui integrasi native yang sesuai. -
Tidak menggunakan Express.js, Supabase, atau database cloud pada versi
ini. - Gunakan development build Expo apabila modul keamanan memerlukan
kode native tambahan.

------------------------------------------------------------------------

# 4. Application Architecture

Vaultix menggunakan **Local-First Architecture**.

Komponen utama:

-   Presentation Layer: React Native dan TypeScript.
-   Navigation Layer: React Navigation.
-   State Management: Zustand.
-   Business Logic: Services dan Hooks.
-   Security Layer: Encryption dan Key Management.
-   Data Layer: Repository Pattern.
-   Local Database: SQLite.

### Data Flow

`User Interface → Business Logic → Security Layer → SQLite Database`

Data sensitif harus dienkripsi sebelum ditulis ke database dan
didekripsi setelah autentikasi berhasil.

Tidak ada server eksternal untuk penyimpanan atau pengambilan password.

------------------------------------------------------------------------

# 5. Functional Requirements

## FR-01. Authentication & Master Password

Pengguna harus membuat Master Password sebelum menggunakan Vaultix.

Fitur: - Create Master Password. - Confirm Master Password. - Unlock
Vault. - PIN Unlock sebagai opsi tambahan. - Biometric Unlock. - Auto
Lock. - Change Master Password.

Ketentuan: - Master Password tidak disimpan dalam bentuk plaintext. -
Master Password tidak dikirim ke internet. - Master Password digunakan
untuk memperoleh akses ke kunci enkripsi Vault. - Sistem harus menangani
percobaan password yang salah secara aman. - Tidak tersedia reset Master
Password melalui server karena aplikasi tidak menggunakan backend.

## FR-02. Dashboard (Home)

Dashboard merupakan halaman utama setelah Vault berhasil dibuka.

Informasi: - Total akun tersimpan. - Total kategori. - Total password
lemah. - Total password duplikat. - Total akun favorit. - Akun terakhir
ditambahkan.

Quick Actions: - Add Password. - Generate Password. - View Vault. -
Security Check.

## FR-03. My Vault

My Vault merupakan tempat penyimpanan seluruh informasi akun pengguna.

Data akun:

  Field           Keterangan                   Ketentuan
  --------------- ---------------------------- ---------------
  Account Name    Nama aplikasi atau layanan   Wajib
  Username / ID   Username atau ID akun        Opsional
  Email           Email akun                   Opsional
  Password        Password akun                Wajib
  Category        Kategori akun                Opsional
  Notes           Catatan tambahan             Opsional
  Favorite        Status favorit               Default false
  Created At      Waktu dibuat                 Otomatis
  Updated At      Waktu diperbarui             Otomatis

Fitur: - Add Account. - Edit Account. - Delete Account. - View
Account. - Show / Hide Password. - Copy Username. - Copy Email. - Copy
Password. - Add Favorite. - Search Account. - Filter Account. - Sort
Account.

Ketentuan: - Password disembunyikan secara default. - Akses informasi
sensitif hanya tersedia ketika Vault terbuka. - Clipboard dibersihkan
otomatis setelah waktu tertentu. - Data sensitif tidak boleh muncul
dalam application logs.

## FR-04. Add Account

Pengguna dapat menambahkan akun baru melalui form sederhana.

Field: - Account Name (wajib). - Username / ID (opsional). - Email
(opsional). - Password (wajib). - Category (opsional). - Notes
(opsional).

Validasi: - Account Name wajib diisi. - Password wajib diisi. - Username
dan email boleh kosong. - Pengguna dapat memilih kategori yang
tersedia. - Data sensitif dienkripsi sebelum disimpan. - Pengguna
mendapatkan notifikasi ketika data berhasil disimpan.

**Tidak ada field Website URL.** Tidak ada validasi, penyimpanan, atau
fitur pencarian berdasarkan URL website.

## FR-05. Edit & Delete Account

Pengguna dapat memperbarui dan menghapus informasi akun.

Ketentuan: - Perubahan data harus tersimpan secara konsisten. -
Penghapusan harus meminta konfirmasi. - Penghapusan akun juga harus
memperbarui relasi data terkait. - Penghapusan tidak boleh meninggalkan
data sensitif yang dapat diakses melalui aplikasi.

## FR-06. Password Generator

Fitur untuk membuat password acak.

Pengaturan: - Panjang password 8--64 karakter. - Uppercase. -
Lowercase. - Numbers. - Symbols. - Exclude ambiguous characters.

Fitur tambahan: - Generate Password. - Copy Password. - Regenerate
Password. - Password Strength Indicator. - Use Password for Account.

Generator harus menggunakan cryptographically secure random number
generator.

## FR-07. Password Strength Checker

Menganalisis kekuatan password secara lokal.

Kategori: - Weak. - Medium. - Strong. - Very Strong.

Pemeriksaan: - Panjang password. - Keragaman karakter. - Pola password
umum. - Password yang mudah ditebak. - Password yang digunakan berulang.

Sistem harus memberikan rekomendasi peningkatan keamanan. Analisis
dilakukan secara lokal dan tidak mengirim password ke internet.

## FR-08. Category Management

Kategori default: - Gaming. - Email. - Social Media. - Finance. -
Work. - Shopping. - Education. - Others.

Fitur: - Add Category. - Edit Category. - Delete Category. - Select
Category. - Category Icon.

Penghapusan kategori tidak boleh menghapus akun yang terkait. Akun yang
sebelumnya menggunakan kategori tersebut dapat dipindahkan ke kategori
Others atau menjadi tanpa kategori.

## FR-09. Favorites

Pengguna dapat menandai akun sebagai favorit.

Fitur: - Add Favorite. - Remove Favorite. - View Favorites. - Quick
Access.

## FR-10. Search & Filter

Pencarian akun berdasarkan: - Account Name. - Username. - Email. -
Category.

Filter: - Favorites. - Recently Added. - Alphabetical. - Category. -
Password Strength.

Pencarian data sensitif dilakukan di memori aplikasi setelah Vault
dibuka, bukan dengan menyimpan indeks plaintext yang berisi password
atau email.

## FR-11. Security Dashboard

Menampilkan ringkasan keamanan seluruh akun.

Informasi: - Total Password. - Weak Password. - Medium Password. -
Strong Password. - Duplicate Password. - Accounts Requiring Review.

Rekomendasi: - Mengganti password yang lemah. - Menghindari penggunaan
password berulang. - Menggunakan password yang lebih panjang. -
Memeriksa akun secara berkala.

## FR-12. Password Reminder

Pengguna dapat membuat pengingat lokal.

Fitur: - Create Reminder. - Set Reminder Date. - Edit Reminder. - Delete
Reminder. - Enable / Disable Reminder.

Pengingat dapat digunakan untuk meninjau atau mengganti password.
Notifikasi menggunakan sistem notifikasi lokal Android.

## FR-13. Auto Lock

Aplikasi mengunci Vault secara otomatis setelah tidak digunakan.

Pilihan: - Immediately. - 30 Seconds. - 1 Minute. - 5 Minutes. - 10
Minutes.

Vault juga harus dikunci ketika pengguna keluar dari aplikasi sesuai
kebijakan keamanan yang diterapkan.

## FR-14. Backup & Restore

Pengguna dapat mencadangkan dan memulihkan data.

Fitur: - Export Backup. - Import Backup. - Encrypted Backup. - Restore
Vault. - Backup Validation.

Ketentuan: - Backup wajib terenkripsi. - File backup harus memiliki
validasi integritas. - Proses restore tidak boleh menimpa data sebelum
validasi berhasil. - Pengguna harus mengetahui bahwa kehilangan Master
Password dapat menyebabkan backup tidak dapat dipulihkan. - Backup tidak
boleh menyimpan data sensitif dalam bentuk plaintext.

------------------------------------------------------------------------

# 6. User Interface & User Experience

## 6.1 Design Concept

Vaultix menggunakan desain: - Modern. - Minimalist. - Professional. -
Clean. - Security-focused.

## 6.2 Color Palette

  Element          Hex Color
  ---------------- -----------
  Primary          #17243A
  Secondary        #263750
  Accent           #4C8DDF
  Background       #101827
  Surface          #1D2A3D
  Success          #35B779
  Warning          #F0B64D
  Error            #E45B63
  Text Primary     #FFFFFF
  Text Secondary   #AAB8CA

## 6.3 Typography

Font utama: Inter.

-   Heading: Bold.
-   Subheading: SemiBold.
-   Body: Regular.
-   Caption: Regular.

## 6.4 Navigation

Bottom Navigation: 1. Home. 2. Vault. 3. Generator. 4. Security. 5.
Settings.

------------------------------------------------------------------------

# 7. Application Pages

  Page                    Description
  ----------------------- ---------------------------
  Splash Screen           Identitas Vaultix
  Onboarding              Pengenalan aplikasi
  Master Password Setup   Pembuatan Master Password
  Unlock Screen           Membuka Vault
  Biometric Setup         Pengaturan biometrik
  Home                    Dashboard
  My Vault                Daftar akun
  Add Account             Tambah akun
  Edit Account            Edit akun
  Account Details         Detail akun
  Generator               Password Generator
  Security Dashboard      Analisis keamanan
  Categories              Pengelolaan kategori
  Favorites               Daftar favorit
  Reminder                Pengingat password
  Backup & Restore        Pencadangan data
  Settings                Pengaturan
  About Vaultix           Informasi aplikasi

------------------------------------------------------------------------

# 8. Database Design

Database menggunakan SQLite lokal melalui Expo SQLite.

## 8.1 Table: accounts

  Column                   Type
  ------------------------ -------------------
  id                       TEXT PRIMARY KEY
  account_name_encrypted   BLOB NOT NULL
  username_encrypted       BLOB
  email_encrypted          BLOB
  password_encrypted       BLOB NOT NULL
  category_id              TEXT
  notes_encrypted          BLOB
  is_favorite              INTEGER DEFAULT 0
  created_at               TEXT NOT NULL
  updated_at               TEXT NOT NULL

**Kolom website URL tidak digunakan dan tidak boleh ditambahkan ke tabel
accounts.**

## 8.2 Table: categories

  Column           Type
  ---------------- ------------------
  id               TEXT PRIMARY KEY
  name_encrypted   BLOB
  icon             TEXT
  created_at       TEXT

## 8.3 Table: reminders

  Column          Type
  --------------- ------------------
  id              TEXT PRIMARY KEY
  account_id      TEXT
  reminder_date   TEXT
  is_enabled      INTEGER

## 8.4 Table: settings

  Column               Type
  -------------------- ---------------------
  id                   INTEGER PRIMARY KEY
  auto_lock_duration   INTEGER
  biometric_enabled    INTEGER
  theme                TEXT
  clipboard_timeout    INTEGER

## 8.5 Security Metadata

Informasi keamanan seperti salt, parameter KDF, versi kunci, dan wrapped
Vault Encryption Key harus dikelola dengan mekanisme secure storage.

Field sensitif tidak boleh disimpan dalam bentuk plaintext.

Database harus menggunakan: - Foreign Keys. - Transactions. - Database
Migrations. - Validasi integritas data.

------------------------------------------------------------------------

# 9. Security Requirements

Keamanan merupakan prioritas tertinggi Vaultix.

Persyaratan: 1. AES-256-GCM untuk enkripsi data. 2. Argon2id untuk key
derivation. 3. Android Keystore untuk perlindungan kunci. 4. Biometric
Authentication. 5. Auto Lock. 6. Clipboard Auto Clear. 7. Secure Backup.
8. No Plaintext Password. 9. No Password Logging. 10. Secure Random
Generator.

## 9.1 Encryption Workflow

1.  Pengguna membuat Master Password.
2.  Sistem menghasilkan salt unik.
3.  Argon2id menghasilkan key-encryption key.
4.  Sistem membuat Vault Encryption Key secara acak.
5.  Vault Encryption Key dilindungi menggunakan key-encryption key.
6.  Data sensitif dienkripsi menggunakan AES-256-GCM.
7.  Ciphertext disimpan di SQLite.
8.  Ketika pengguna membuka Vault, sistem memverifikasi Master Password
    dan membuka Vault Encryption Key.
9.  Data didekripsi hanya ketika diperlukan.

Gunakan nonce unik untuk setiap operasi enkripsi dengan kunci yang sama.

## 9.2 Biometric Security

Biometrik menjadi metode autentikasi tambahan.

Integrasi biometrik harus menggunakan mekanisme kriptografi dan Android
Keystore yang sesuai. Status autentikasi biometrik saja tidak boleh
dianggap sebagai perlindungan kunci enkripsi.

## 9.3 Data Privacy

-   Tidak ada pengiriman password ke server.
-   Tidak ada cloud storage.
-   Tidak ada analytics yang mengandung informasi sensitif.
-   Tidak ada penyimpanan password dalam log.
-   Tidak ada akses pihak ketiga terhadap database Vault.

------------------------------------------------------------------------

# 10. Non-Functional Requirements

## Performance

-   Navigasi responsif.
-   Pencarian akun cepat.
-   Penyimpanan menggunakan transaksi SQLite.
-   Proses enkripsi tidak menghambat interaksi UI.

## Reliability

-   Data tidak boleh rusak ketika aplikasi ditutup tiba-tiba.
-   Backup dapat diverifikasi.
-   Database migration harus aman.

## Usability

-   Navigasi mudah dipahami.
-   Form sederhana.
-   Pesan error jelas.
-   Desain konsisten.

## Compatibility

-   Mendukung Android sesuai minimum SDK yang ditentukan saat
    implementasi.
-   Mendukung berbagai ukuran layar.
-   Mendukung orientasi portrait.

## Offline Capability

-   Semua fitur utama bekerja tanpa internet.
-   Tidak ada ketergantungan pada server eksternal.

------------------------------------------------------------------------

# 11. Project Structure

``` text
Vaultix/
│
├── src/
│   ├── components/
│   ├── screens/
│   │   ├── onboarding/
│   │   ├── auth/
│   │   ├── home/
│   │   ├── vault/
│   │   ├── generator/
│   │   ├── security/
│   │   └── settings/
│   │
│   ├── navigation/
│   ├── database/
│   │   ├── migrations/
│   │   ├── schema/
│   │   └── repositories/
│   │
│   ├── security/
│   │   ├── encryption.ts
│   │   ├── keyManager.ts
│   │   ├── biometric.ts
│   │   └── passwordGenerator.ts
│   │
│   ├── services/
│   ├── hooks/
│   ├── store/
│   ├── types/
│   ├── utils/
│   └── constants/
│
├── assets/
├── app.json
├── package.json
└── README.md
```

------------------------------------------------------------------------

# 12. Development Roadmap

## Phase 1 --- Project Setup

-   Setup React Native.
-   Setup Expo.
-   Setup TypeScript.
-   Setup navigation.
-   Setup design system.

## Phase 2 --- Database

-   Setup SQLite.
-   Create database schema.
-   Implement migrations.
-   Implement repository pattern.

## Phase 3 --- Security

-   Master Password.
-   Argon2id.
-   AES-256-GCM.
-   Key Management.
-   Biometric Authentication.
-   Auto Lock.

## Phase 4 --- Core Features

-   Dashboard.
-   My Vault.
-   Add Account.
-   Edit Account.
-   Delete Account.
-   Account Details.
-   Search.
-   Categories.
-   Favorites.

## Phase 5 --- Advanced Features

-   Password Generator.
-   Password Strength Checker.
-   Security Dashboard.
-   Password Reminder.
-   Clipboard Auto Clear.

## Phase 6 --- Backup

-   Export Backup.
-   Import Backup.
-   Backup Encryption.
-   Restore Validation.

## Phase 7 --- Testing & Release

-   Unit Testing.
-   UI Testing.
-   Security Testing.
-   Performance Testing.
-   Bug Fixing.
-   Android APK Build.
-   Release Preparation.

------------------------------------------------------------------------

# 13. Testing Requirements

  Test Case                Expected Result
  ------------------------ ------------------------------------------
  First Launch             Onboarding muncul
  Create Master Password   Vault berhasil dibuat
  Unlock Vault             Vault terbuka
  Wrong Password           Akses ditolak
  Add Account              Data tersimpan
  Edit Account             Data diperbarui
  Delete Account           Data terhapus
  Search Account           Hasil sesuai
  Generate Password        Password acak dihasilkan
  Biometric                Autentikasi berjalan
  Auto Lock                Vault terkunci
  Encryption               Database tidak berisi plaintext sensitif
  Backup                   File backup terenkripsi
  Restore                  Data berhasil dipulihkan
  Offline                  Fitur utama tetap berjalan
  Database Migration       Data lama tetap terjaga

------------------------------------------------------------------------

# 14. MVP Scope

Fitur wajib untuk rilis pertama:

-   Splash Screen.
-   Onboarding.
-   Master Password.
-   Unlock Screen.
-   Biometric Authentication.
-   Dashboard.
-   My Vault.
-   Add Account.
-   Edit Account.
-   Delete Account.
-   Account Details.
-   Search.
-   Categories.
-   Favorites.
-   Show / Hide Password.
-   Copy Password.
-   Password Generator.
-   SQLite Database.
-   Local Encryption.
-   Auto Lock.

Fitur lanjutan: - Security Dashboard. - Password Reminder. - Duplicate
Checker. - Backup & Restore. - Password History.

------------------------------------------------------------------------

# 15. Product Constraints

1.  Seluruh data utama disimpan di perangkat.
2.  Tidak ada backend atau cloud database.
3.  Tidak ada sinkronisasi antarperangkat.
4.  Data sensitif wajib dienkripsi.
5.  Master Password yang hilang tidak dapat di-reset melalui server.
6.  Pengguna bertanggung jawab menjaga backup.
7.  Penghapusan data aplikasi dapat menyebabkan kehilangan seluruh Vault
    jika tidak ada backup.
8.  Aplikasi tidak boleh mengklaim aman sebelum pengujian keamanan
    dilakukan.
9.  Tidak ada field URL website dalam form, database, maupun fitur
    pencarian.

------------------------------------------------------------------------

# 16. Acceptance Criteria

Vaultix dinyatakan siap dirilis sebagai MVP apabila:

-   Pengguna dapat membuat Vault.
-   Pengguna dapat membuka Vault menggunakan Master Password.
-   Pengguna dapat menyimpan, mengedit, dan menghapus akun.
-   Form akun tidak meminta URL website.
-   Seluruh informasi sensitif dienkripsi.
-   Database tidak mengandung password plaintext.
-   Pengguna dapat mencari akun.
-   Password Generator bekerja.
-   Biometric Authentication berjalan.
-   Auto Lock bekerja.
-   Aplikasi berjalan tanpa internet.
-   Backup dan Restore telah diuji.
-   Tidak ada bug kritis pada fitur utama.

------------------------------------------------------------------------

# 17. Final Product Vision

Vaultix adalah aplikasi Password Manager berbasis Android yang
mengutamakan keamanan, privasi, dan kemudahan penggunaan.

Dengan pendekatan Local-First Architecture, seluruh informasi akun
digital disimpan langsung di perangkat pengguna dan dilindungi
menggunakan sistem enkripsi.

Vaultix memberikan kendali penuh kepada pengguna tanpa ketergantungan
pada server eksternal.

**VAULTIX --- YOUR DIGITAL SAFE.**

One Vault. All Your Accounts. Total Control.
