/* ============================================
   MEMORIES
   ============================================ */

  async function addMemory() {
    const input = document.getElementById('newMemory');
    const text = input.value.trim();
    
    if (!text) {
      showNotification('⚠️ Memory tidak boleh kosong!');
      return;
    }
    
    try {
      const newMemoryRef = database.ref('memories').push();
      await newMemoryRef.set({
        text: text,
        timestamp: Date.now(),
        date: new Date().toLocaleDateString('id-ID'),
        dateTime: new Date().toISOString()
      });
      
      input.value = '';
      loadMemories();
      showNotification('✨ Memory tersimpan!');
      createConfetti();
    } catch (error) {
      console.error('Error adding memory:', error);
      showNotification('❌ Gagal menyimpan memory!');
    }
  }

  // Load semua memories
  function loadMemories() {
    const list = document.getElementById('memoryList');
    if (!list) return;
    
    database.ref('memories').orderByChild('timestamp').once('value', (snapshot) => {
      list.innerHTML = '';
      
      if (!snapshot.exists()) {
        list.innerHTML = '<div style="text-align: center; opacity: 0.6; padding: 20px;">Belum ada memory. Yuk tambahkan! 💭</div>';
        return;
      }
      
      const memories = [];
      snapshot.forEach((childSnapshot) => {
        memories.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      
      // Sort descending (newest first)
      memories.reverse();
      
      memories.forEach(data => {
        const item = document.createElement('div');
        item.className = 'memory-item';
        item.style.cssText = 'background: rgba(16, 16, 28, 0.6); padding: 15px; border-radius: 12px; margin-bottom: 10px; display: flex; gap: 10px; align-items: center; border: 1px solid rgba(122, 162, 255, 0.1); transition: all 0.3s ease;';
        item.innerHTML = `
          <div style="flex: 1;">
            <div style="font-size: 14px; margin-bottom: 5px; line-height: 1.5;">${data.text}</div>
            <div style="font-size: 11px; opacity: 0.6;">${data.date}</div>
          </div>
          <button onclick="deleteMemory('${data.id}')" style="background: transparent; border: none; cursor: pointer; font-size: 18px; opacity: 0.6; transition: opacity 0.3s; padding: 5px;">🗑️</button>
        `;
        list.appendChild(item);
      });
      
      // Update counter jika ada
      const counterEl = document.getElementById('totalMemories');
      if (counterEl) counterEl.textContent = memories.length;
    });
  }

  // Hapus memory
  async function deleteMemory(id) {
    if (!confirm('Hapus memory ini?')) return;
    
    try {
      await database.ref('memories/' + id).remove();
      loadMemories();
      showNotification('🗑️ Memory dihapus!');
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  }

  // ============================================
  // 3️⃣ LOVE LETTER FUNCTIONS
  // ============================================
  
  // Simpan love letter
      loadMemories();
      loadMemories();
  console.log('  - addMemory(), loadMemories(), deleteMemory(id)');
