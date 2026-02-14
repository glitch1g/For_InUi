/* ============================================
   STATS
   Statistik hubungan & hitungan hari bersama
   ============================================ */

// Calculate days together
function calculateDays() {
  // Tanggal mulai relationship (sesuaikan dengan tanggal lo!)
  const startDate = new Date('2024-01-01'); // GANTI DENGAN TANGGAL MULAI LO!
  const today = new Date();
  
  const diffTime = Math.abs(today - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

// Update stats display
function updateStats() {
  const daysEl = document.getElementById('daysTogether');
  if (daysEl) {
    daysEl.textContent = calculateDays();
  }
  
  // Update memories count
  database.ref('memories').once('value', (snapshot) => {
    const count = snapshot.numChildren();
    const memoriesEl = document.getElementById('memoriesCount');
    if (memoriesEl) {
      memoriesEl.textContent = count;
    }
  });
  
  // Update love level (based on milestones)
  const days = calculateDays();
  const loveLevelEl = document.getElementById('loveLevel');
  if (loveLevelEl) {
    const level = Math.min(100, Math.floor((days / 365) * 100));
    loveLevelEl.textContent = level + '%';
  }
}

// Auto-update stats when page loads
window.addEventListener('load', () => {
  updateStats();
});

console.log('✅ Stats module loaded!');
