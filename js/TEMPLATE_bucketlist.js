/* ============================================
   BUCKET LIST
   Template lengkap untuk nambahin fitur baru
   ============================================ */

// ============================================
// 1️⃣ GLOBAL VARIABLES (kalau perlu)
// ============================================

let currentBucketFilter = 'all'; // all, completed, pending

// ============================================
// 2️⃣ MAIN FUNCTIONS
// ============================================

/**
 * Tambah bucket list item baru
 */
async function tambahBucketItem() {
  const item = prompt('🎯 Bucket list item:');
  if (!item || !item.trim()) {
    showNotification('⚠️ Item kosong!');
    return;
  }
  
  try {
    const newRef = database.ref('bucketlist').push();
    await newRef.set({
      item: item.trim(),
      completed: false,
      createdAt: Date.now(),
      createdDate: new Date().toLocaleString('id-ID'),
      category: 'general' // bisa: travel, food, activity, dll
    });
    
    showNotification('✅ Bucket list ditambahkan!');
    loadBucketList();
  } catch (error) {
    console.error('Error adding bucket item:', error);
    showNotification('❌ Gagal menambahkan!');
  }
}

/**
 * Load semua bucket list items
 */
function loadBucketList() {
  const container = document.getElementById('bucketListContainer');
  if (!container) return;
  
  database.ref('bucketlist').on('value', (snapshot) => {
    container.innerHTML = '';
    
    if (!snapshot.exists()) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎯</div>
          <p>Belum ada bucket list. Yuk tambahin impian kalian!</p>
        </div>
      `;
      return;
    }
    
    const items = [];
    snapshot.forEach((child) => {
      items.push({
        id: child.key,
        ...child.val()
      });
    });
    
    // Sort: pending dulu, baru completed
    items.sort((a, b) => {
      if (a.completed === b.completed) {
        return b.createdAt - a.createdAt; // terbaru dulu
      }
      return a.completed ? 1 : -1; // pending dulu
    });
    
    // Filter berdasarkan currentBucketFilter
    const filteredItems = items.filter(item => {
      if (currentBucketFilter === 'all') return true;
      if (currentBucketFilter === 'completed') return item.completed;
      if (currentBucketFilter === 'pending') return !item.completed;
      return true;
    });
    
    // Render items
    filteredItems.forEach(item => {
      const itemEl = createBucketItemElement(item);
      container.appendChild(itemEl);
    });
    
    // Update counter
    updateBucketCounter(items);
  });
}

/**
 * Create bucket item element
 */
function createBucketItemElement(item) {
  const div = document.createElement('div');
  div.className = 'bucket-item' + (item.completed ? ' completed' : '');
  
  div.innerHTML = `
    <div class="bucket-checkbox">
      <input type="checkbox" 
        id="bucket-${item.id}" 
        ${item.completed ? 'checked' : ''} 
        onchange="toggleBucketItem('${item.id}', ${!item.completed})">
      <label for="bucket-${item.id}"></label>
    </div>
    
    <div class="bucket-content">
      <div class="bucket-text">${escapeHtml(item.item)}</div>
      <div class="bucket-meta">
        <span class="bucket-date">${item.createdDate}</span>
        ${item.completedDate ? `<span class="bucket-completed-date">✓ ${item.completedDate}</span>` : ''}
      </div>
    </div>
    
    <div class="bucket-actions">
      <button class="btn-icon" onclick="editBucketItem('${item.id}', '${escapeHtml(item.item)}')" title="Edit">
        ✏️
      </button>
      <button class="btn-icon danger" onclick="deleteBucketItem('${item.id}')" title="Hapus">
        🗑️
      </button>
    </div>
  `;
  
  return div;
}

/**
 * Toggle completed status
 */
async function toggleBucketItem(id, completed) {
  try {
    const updates = {
      completed: completed
    };
    
    if (completed) {
      updates.completedDate = new Date().toLocaleString('id-ID');
      updates.completedAt = Date.now();
      
      // Firework effect!
      createFirework();
      showNotification('🎉 Bucket list completed!');
    } else {
      updates.completedDate = null;
      updates.completedAt = null;
    }
    
    await database.ref('bucketlist/' + id).update(updates);
  } catch (error) {
    console.error('Error toggling bucket item:', error);
    showNotification('❌ Gagal update status!');
  }
}

/**
 * Edit bucket item
 */
async function editBucketItem(id, currentText) {
  const newText = prompt('Edit bucket list:', currentText);
  if (!newText || newText.trim() === '') return;
  if (newText.trim() === currentText) return;
  
  try {
    await database.ref('bucketlist/' + id).update({
      item: newText.trim(),
      editedAt: Date.now()
    });
    
    showNotification('✅ Bucket list diupdate!');
  } catch (error) {
    console.error('Error editing bucket item:', error);
    showNotification('❌ Gagal mengedit!');
  }
}

/**
 * Delete bucket item
 */
async function deleteBucketItem(id) {
  if (!confirm('Hapus bucket list item ini?')) return;
  
  try {
    await database.ref('bucketlist/' + id).remove();
    showNotification('🗑️ Bucket list dihapus!');
  } catch (error) {
    console.error('Error deleting bucket item:', error);
    showNotification('❌ Gagal menghapus!');
  }
}

/**
 * Filter bucket list
 */
function filterBucketList(filter) {
  currentBucketFilter = filter;
  
  // Update active button
  document.querySelectorAll('.bucket-filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
  
  loadBucketList();
}

/**
 * Update bucket counter
 */
function updateBucketCounter(items) {
  const total = items.length;
  const completed = items.filter(i => i.completed).length;
  const pending = total - completed;
  
  const counterEl = document.getElementById('bucketCounter');
  if (counterEl) {
    counterEl.innerHTML = `
      <span class="counter-label">Total:</span> ${total} 
      <span class="counter-separator">|</span>
      <span class="counter-completed">✓ ${completed}</span>
      <span class="counter-separator">|</span>
      <span class="counter-pending">⏳ ${pending}</span>
    `;
  }
  
  // Update progress bar
  const progressEl = document.getElementById('bucketProgress');
  if (progressEl && total > 0) {
    const percentage = Math.round((completed / total) * 100);
    progressEl.style.width = percentage + '%';
    progressEl.textContent = percentage + '%';
  }
}

// ============================================
// 3️⃣ VISUAL EFFECTS
// ============================================

/**
 * Create firework effect saat completed
 */
function createFirework() {
  const colors = ['#7aa2ff', '#9b7dff', '#ff6b6b', '#ffd93d'];
  
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'firework-particle';
    particle.style.left = '50%';
    particle.style.top = '50%';
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.setProperty('--tx', `${(Math.random() - 0.5) * 200}px`);
    particle.style.setProperty('--ty', `${(Math.random() - 0.5) * 200}px`);
    
    document.body.appendChild(particle);
    
    setTimeout(() => particle.remove(), 1000);
  }
}

// ============================================
// 4️⃣ AUTO-LOAD
// ============================================

// Load bucket list saat page load
window.addEventListener('load', () => {
  console.log('🎯 Loading bucket list...');
  loadBucketList();
});

// ============================================
// 5️⃣ EXPORT FUNCTIONS (kalau diperlukan)
// ============================================

/**
 * Export bucket list ke text file
 */
function exportBucketList() {
  database.ref('bucketlist').once('value', (snapshot) => {
    if (!snapshot.exists()) {
      showNotification('⚠️ Belum ada bucket list untuk di-export!');
      return;
    }
    
    let text = '🎯 BUCKET LIST KITA\n';
    text += '='.repeat(50) + '\n\n';
    
    const items = [];
    snapshot.forEach(child => items.push(child.val()));
    
    // Sort by status
    items.sort((a, b) => a.completed === b.completed ? 0 : a.completed ? 1 : -1);
    
    items.forEach((item, index) => {
      const status = item.completed ? '✓' : '☐';
      text += `${status} ${item.item}\n`;
      if (item.completed && item.completedDate) {
        text += `   Completed: ${item.completedDate}\n`;
      }
      text += '\n';
    });
    
    // Download as file
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bucket-list-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    
    showNotification('📥 Bucket list berhasil di-export!');
  });
}

console.log('✅ Bucket list module loaded!');
