# 💑 Web Perjalanan Kami - Struktur File

File HTML lo yang awalnya **7,915 baris** udah gua pisahin jadi struktur yang rapi dan gampang di-maintain!

## 📁 Struktur Folder

```
project/
├── index.html              # HTML utama (struktur saja, ~500 baris)
├── css/
│   ├── base.css           # Variables, reset, body styles
│   ├── animations.css     # Semua @keyframes animations
│   ├── components.css     # Buttons, cards, modals, forms
│   └── layout.css         # Containers, sections, grid
├── js/
│   ├── config.js          # Firebase configuration
│   ├── auth.js            # Password gate & authentication
│   ├── stats.js           # Statistik hubungan
│   ├── memories.js        # Timeline memories fitur
│   ├── letters.js         # Love letters fitur
│   ├── games.js           # Semua mini games (tebak lagu, trivia, dll)
│   ├── notes.js           # Catatan & folder system
│   └── utils.js           # Helper functions
└── assets/
    └── images/            # Gambar (kalau ada)
```

## 🎯 Cara Nambahin Menu/Fitur Baru

### Contoh: Mau nambahin menu "Bucket List"

#### 1️⃣ Edit `index.html` - Tambah Button Menu
Cari bagian `<div class="menu-grid">` lalu tambah:

```html
<div class="menu-card" onclick="showSection('bucketlist')">
  <div class="menu-icon">🎯</div>
  <div class="menu-label">Bucket List</div>
</div>
```

#### 2️⃣ Edit `index.html` - Tambah Section Baru
Tambah section di bawah section lainnya:

```html
<section id="bucketlist" class="section">
  <h2>🎯 Bucket List Kita</h2>
  <div class="content-area">
    <button class="btn primary" onclick="tambahBucketItem()">
      ➕ Tambah Item
    </button>
    <div id="bucketListContainer"></div>
  </div>
</section>
```

#### 3️⃣ Bikin File JS Baru `js/bucketlist.js`

```javascript
/* ============================================
   BUCKET LIST
   Fitur untuk bucket list couple
   ============================================ */

// Tambah bucket list item
async function tambahBucketItem() {
  const item = prompt('Bucket list item:');
  if (!item || !item.trim()) return;
  
  try {
    const newRef = database.ref('bucketlist').push();
    await newRef.set({
      item: item.trim(),
      completed: false,
      createdAt: Date.now(),
      createdDate: new Date().toLocaleString('id-ID')
    });
    
    showNotification('✅ Item ditambahkan!');
    loadBucketList();
  } catch (error) {
    console.error('Error:', error);
    showNotification('❌ Gagal menambahkan!');
  }
}

// Load bucket list
function loadBucketList() {
  const container = document.getElementById('bucketListContainer');
  
  database.ref('bucketlist').on('value', (snapshot) => {
    container.innerHTML = '';
    
    if (!snapshot.exists()) {
      container.innerHTML = '<p>Belum ada bucket list. Yuk tambahin!</p>';
      return;
    }
    
    snapshot.forEach((child) => {
      const data = child.val();
      const item = document.createElement('div');
      item.className = 'bucket-item ' + (data.completed ? 'completed' : '');
      item.innerHTML = `
        <input type="checkbox" 
          ${data.completed ? 'checked' : ''} 
          onchange="toggleBucketItem('${child.key}', ${!data.completed})">
        <span>${data.item}</span>
        <button onclick="deleteBucketItem('${child.key}')">🗑️</button>
      `;
      container.appendChild(item);
    });
  });
}

// Toggle completed
async function toggleBucketItem(id, completed) {
  await database.ref('bucketlist/' + id).update({ completed });
}

// Delete item
async function deleteBucketItem(id) {
  if (!confirm('Hapus item ini?')) return;
  await database.ref('bucketlist/' + id).remove();
  showNotification('🗑️ Item dihapus!');
}

// Auto-load saat page load
window.addEventListener('load', () => {
  loadBucketList();
});
```

#### 4️⃣ (Opsional) Tambah Style di `css/components.css`

```css
/* Bucket List Item */
.bucket-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: var(--card-bg);
  border-radius: 12px;
  margin-bottom: 10px;
}

.bucket-item.completed span {
  text-decoration: line-through;
  opacity: 0.5;
}
```

#### 5️⃣ Import di `index.html`
Tambah di bagian bawah (sebelum `</body>`):

```html
<script src="js/bucketlist.js"></script>
```

---

## 📝 Lokasi File untuk Edit Spesifik

### Mau ubah warna/tema?
👉 Edit `css/base.css` bagian `:root { ... }`

### Mau tambah animasi baru?
👉 Edit `css/animations.css`, tambah `@keyframes` baru

### Mau ubah Firebase config?
👉 Edit `js/config.js`

### Mau ubah password gate?
👉 Edit `js/auth.js`

### Mau edit fitur memories/timeline?
👉 Edit `js/memories.js`

### Mau edit fitur love letters?
👉 Edit `js/letters.js`

### Mau edit/tambah game?
👉 Edit `js/games.js`

### Mau edit catatan & folder?
👉 Edit `js/notes.js`

---

## ✅ Keuntungan Struktur Baru

1. **Gampang dicari** - Tau fitur ada di file mana
2. **Gampang di-edit** - File lebih kecil, nggak overwhelming
3. **Gampang debugging** - Error langsung ketahuan di file mana
4. **Team-friendly** - Kalau ada orang lain bantuin, nggak bentrok
5. **Maintainable** - Lebih profesional dan sustainable

---

## 🚀 Cara Pakai

1. Upload semua file ke hosting (maintain struktur folder)
2. Buka `index.html` di browser
3. Done! ✅

**PENTING:** Pastikan struktur folder tetap sama kayak di atas, jangan diacak-acak!

---

Made with ❤️ by Claude
