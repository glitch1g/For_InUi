/* ============================================
   LETTERS
   ============================================ */

  async function saveLetter() {
    const letterText = document.getElementById('generatedLetter');
    if (!letterText) return;
    
    const text = letterText.textContent || letterText.innerText;
    
    if (!text || text === 'Klik tombol untuk generate surat! 💌') {
      showNotification('⚠️ Generate surat dulu!');
      return;
    }
    
    try {
      const newLetterRef = database.ref('loveletters').push();
      await newLetterRef.set({
        text: text,
        timestamp: Date.now(),
        date: new Date().toLocaleDateString('id-ID'),
        dateTime: new Date().toISOString()
      });
      
      showNotification('💾 Surat tersimpan!');
      createConfetti();
      loadSavedLetters();
    } catch (error) {
      console.error('Error saving letter:', error);
      showNotification('❌ Gagal menyimpan surat!');
    }
  }

  // Load saved letters
  function loadSavedLetters() {
    const list = document.getElementById('savedLettersList');
    if (!list) return;
    
    database.ref('loveletters').orderByChild('timestamp').limitToLast(10).once('value', (snapshot) => {
      list.innerHTML = '';
      
      if (!snapshot.exists()) {
        list.innerHTML = '<div style="text-align: center; opacity: 0.6; padding: 20px;">Belum ada surat tersimpan 💌</div>';
        return;
      }
      
      const letters = [];
      snapshot.forEach((childSnapshot) => {
        letters.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      
      // Sort descending
      letters.reverse();
      
      letters.forEach(data => {
        const item = document.createElement('div');
        item.style.cssText = 'background: rgba(16, 16, 28, 0.6); padding: 15px; border-radius: 12px; margin-bottom: 10px; display: flex; gap: 10px; align-items: center; border: 1px solid rgba(122, 162, 255, 0.1); cursor: pointer; transition: all 0.3s ease;';
        item.innerHTML = `
          <div style="flex: 1;" onclick="viewLetter('${data.id}')">
            <div style="font-size: 13px; opacity: 0.8; line-height: 1.5;">${data.text.substring(0, 100)}...</div>
            <div style="font-size: 11px; opacity: 0.5; margin-top: 5px;">${data.date}</div>
          </div>
          <button onclick="event.stopPropagation(); deleteLetter('${data.id}')" style="background: transparent; border: none; cursor: pointer; font-size: 16px; opacity: 0.6; padding: 5px;">🗑️</button>
        `;
        list.appendChild(item);
      });
    });
  }

  // Hapus letter
  async function deleteLetter(id) {
    if (!confirm('Hapus surat ini?')) return;
    
    try {
      await database.ref('loveletters/' + id).remove();
      loadSavedLetters();
      showNotification('🗑️ Surat dihapus!');
    } catch (error) {
      console.error('Error deleting letter:', error);
    }
  }

  // View full letter
  function viewLetter(id) {
    database.ref('loveletters/' + id).once('value', (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Buat popup untuk tampilkan full letter
        const popup = document.createElement('div');
        popup.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;';
        popup.innerHTML = `
          <div style="background: linear-gradient(135deg, #1a1a28, #12121a); padding: 30px; border-radius: 20px; max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto; border: 2px solid rgba(122, 162, 255, 0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h3 style="color: #7aa2ff; margin: 0;">💌 Love Letter</h3>
              <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: transparent; border: none; font-size: 24px; cursor: pointer; color: #fff; opacity: 0.6;">×</button>
            </div>
            <div style="font-size: 15px; line-height: 1.8; white-space: pre-wrap;">${data.text}</div>
            <div style="font-size: 12px; opacity: 0.5; margin-top: 20px; text-align: right;">${data.date}</div>
          </div>
        `;
        document.body.appendChild(popup);
        popup.onclick = (e) => {
          if (e.target === popup) popup.remove();
        };
      }
    });
  }

  // ============================================
  // 4️⃣ GAME SCORES FUNCTIONS
  // ============================================
  
  // Simpan game score
  async function saveGameScore(gameName, score, additionalData = {}) {
    try {
      const newScoreRef = database.ref('gamescores').push();
      await newScoreRef.set({
        game: gameName,
        score: score,
        timestamp: Date.now(),
        date: new Date().toLocaleDateString('id-ID'),
        dateTime: new Date().toISOString(),
        ...additionalData
      });
      
      console.log(`✅ Score saved: ${gameName} - ${score}`);
    } catch (error) {
      console.error('Error saving score:', error);
    }
  }

  // Get high score untuk game tertentu
  function getHighScore(gameName, callback) {
    database.ref('gamescores')
      .orderByChild('game')
      .equalTo(gameName)
      .once('value', (snapshot) => {
        let highScore = 0;
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          if (data.score > highScore) {
            highScore = data.score;
          }
        });
        callback(highScore);
      });
  }

  // Load leaderboard
  function loadLeaderboard(gameName, limit = 10, callback) {
    database.ref('gamescores')
      .orderByChild('game')
      .equalTo(gameName)
      .limitToLast(limit)
      .once('value', (snapshot) => {
        const leaderboard = [];
        snapshot.forEach((childSnapshot) => {
          leaderboard.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        
        // Sort by score descending
        leaderboard.sort((a, b) => b.score - a.score);
        callback(leaderboard);
      });
  }

  // ============================================
  // 5️⃣ CATATAN BERSAMA FUNCTIONS
  // ============================================
  
  // Global variables untuk pagination dan filter
  let allCatatanData = [];
  let displayedCatatanCount = 10; // Jumlah catatan yang ditampilkan per load
  const LOAD_MORE_INCREMENT = 10; // Jumlah tambahan saat load more

      loadSavedLetters();
      loadSavedLetters();
  console.log('  - saveLetter(), loadSavedLetters(), deleteLetter(id), viewLetter(id)');
  console.log('  - saveGameScore(name, score), getHighScore(name, callback)');
