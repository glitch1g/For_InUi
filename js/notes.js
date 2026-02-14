/* ============================================
   NOTES
   ============================================ */

  // Folder-view state
  let currentCatatanView = 'folder'; // 'folder' | 'all'
  let activeFolderId = null;         // null = tampil grid folder, string = tampil isi folder
  let activeFolderName = '';
  let folderFilteredData = [];       // data catatan dalam folder yang sedang aktif
  let displayedFolderCount = 10;
  
  // Tambah catatan baru
  async function addCatatan() {
    const textarea = document.getElementById('catatanText');
    const folderSelect = document.getElementById('catatanFolder');
    const text = textarea.value.trim();
    const author = currentUser || localStorage.getItem('selectedUser'); // Auto dari user yang login
    const folderId = folderSelect.value;
    
    if (!author) {
      showNotification('⚠️ Silakan login terlebih dahulu!');
      return;
    }
    
    if (!text) {
      showNotification('⚠️ Tulis catatan dulu!');
      return;
    }
    
    if (text.length > 2000) {
      showNotification('⚠️ Catatan terlalu panjang! Maksimal 2000 karakter.');
      return;
    }
    
    try {
      const now = new Date();
      const newCatatanRef = database.ref('catatan').push();
      await newCatatanRef.set({
        text: text,
        author: author,
        folderId: folderId || null,
        timestamp: Date.now(),
        date: now.toLocaleDateString('id-ID'),
        dateTime: now.toISOString(),
        time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        month: String(now.getMonth() + 1).padStart(2, '0'),
        year: String(now.getFullYear())
      });
      
      // Clear textarea
      textarea.value = '';
      
      // Reset character counter
      const charCount = document.getElementById('catatanCharCount');
      const charCounter = document.getElementById('catatanCharCounter');
      if (charCount) charCount.textContent = '0';
      if (charCounter) charCounter.classList.remove('warning', 'danger');
      
      showNotification('✅ Catatan berhasil ditambahkan!');
      createConfetti();
    } catch (error) {
      console.error('Error adding catatan:', error);
      showNotification('❌ Gagal menambahkan catatan!');
    }
  }
  
  // Load catatan dengan real-time listener + pagination + filter
  function loadCatatan() {
    const list = document.getElementById('catatanList');
    if (!list) return;
    
    // Load folders first (for badge display)
    database.ref('folders').once('value', (folderSnapshot) => {
      const folders = {};
      if (folderSnapshot.exists()) {
        folderSnapshot.forEach((child) => {
          folders[child.key] = child.val();
        });
      }
      
      // Set up real-time listener for catatan
      database.ref('catatan').orderByChild('timestamp').on('value', (snapshot) => {
        allCatatanData = [];
        
        if (!snapshot.exists()) {
          list.innerHTML = `
            <div class="catatan-empty">
              <div class="catatan-empty-icon">📭</div>
              <p>Belum ada catatan. Yuk tulis catatan pertama!</p>
            </div>
          `;
          
          updateCatatanCounter(0);
          hideLoadMoreButton();
          return;
        }
        
        // Collect all data and attach folder name
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          allCatatanData.push({
            id: childSnapshot.key,
            ...data,
            folderName: data.folderId && folders[data.folderId] ? folders[data.folderId].name : null
          });
        });
        
        // Sort descending (newest first)
        allCatatanData.reverse();
        
        // Populate year filter
        populateYearFilter();
        
        // Populate folder filter
        populateFolderFilter();
        
        // Render sesuai view aktif
        if (currentCatatanView === 'all') {
          applyFilters();
        } else {
          refreshCurrentView();
        }
      });
    });
  }
  
  // ============================================
  // 📁 FOLDER VIEW FUNCTIONS
  // ============================================

  // Switch antara view Folder dan view Semua Catatan
  function switchCatatanView(view) {
    currentCatatanView = view;
    const folderArea = document.getElementById('folderViewArea');
    const allArea = document.getElementById('allCatatanArea');
    const btnFolder = document.getElementById('btnViewFolder');
    const btnAll = document.getElementById('btnViewAll');

    if (view === 'folder') {
      folderArea.style.display = 'block';
      allArea.style.display = 'none';
      btnFolder.classList.add('active');
      btnAll.classList.remove('active');
      // Reset ke grid folder saat switch ke view ini
      if (!activeFolderId) renderFolderGrid();
    } else {
      folderArea.style.display = 'none';
      allArea.style.display = 'block';
      btnFolder.classList.remove('active');
      btnAll.classList.add('active');
      applyFilters();
    }
  }

  // Render grid kartu folder
  function renderFolderGrid() {
    const grid = document.getElementById('folderViewGrid');
    const folderCatatanArea = document.getElementById('folderCatatanArea');
    const breadcrumb = document.getElementById('catatanBreadcrumb');
    if (!grid) return;

    // Sembunyikan catatan-dalam-folder, tampilkan grid
    folderCatatanArea.style.display = 'none';
    breadcrumb.style.display = 'none';
    grid.style.display = 'grid';
    activeFolderId = null;

    // Hitung catatan per folder
    const folderCountMap = {};
    let noneCount = 0;
    allCatatanData.forEach(c => {
      if (c.folderId) {
        folderCountMap[c.folderId] = (folderCountMap[c.folderId] || 0) + 1;
      } else {
        noneCount++;
      }
    });

    // Ambil data folder dari Firebase (sudah di-cache di allFoldersData)
    database.ref('folders').once('value', (snap) => {
      const folders = [];
      if (snap.exists()) {
        snap.forEach(child => {
          folders.push({ id: child.key, ...child.val() });
        });
        folders.sort((a, b) => a.name.localeCompare(b.name));
      }

      grid.innerHTML = '';

      // Render folder cards
      folders.forEach(folder => {
        const count = folderCountMap[folder.id] || 0;
        const card = document.createElement('div');
        card.className = 'folder-view-card';
        card.innerHTML = `
          <span class="folder-view-icon">📁</span>
          <div class="folder-view-name">${escapeHtml(folder.name)}</div>
          <span class="folder-view-count">${count} catatan</span>
        `;
        card.onclick = () => openFolderView(folder.id, folder.name);
        grid.appendChild(card);
      });

      // Card "Tanpa Folder"
      if (noneCount > 0 || folders.length === 0) {
        const noneCard = document.createElement('div');
        noneCard.className = 'folder-view-card no-folder';
        noneCard.innerHTML = `
          <span class="folder-view-icon">📂</span>
          <div class="folder-view-name">Random</div>
          <span class="folder-view-count">${noneCount} catatan</span>
        `;
        noneCard.onclick = () => openFolderView('__none__', 'Random');
        grid.appendChild(noneCard);
      }

      // Jika sama sekali tidak ada folder dan tidak ada catatan
      if (folders.length === 0 && noneCount === 0) {
        grid.innerHTML = `
          <div style="grid-column:1/-1; text-align:center; padding:50px 20px; opacity:0.5;">
            <div style="font-size:48px; margin-bottom:12px;">📭</div>
            <p>Belum ada catatan. Tulis catatan pertama!</p>
          </div>
        `;
      }
    });
  }

  // Buka isi catatan dalam satu folder
  function openFolderView(folderId, folderName) {
    activeFolderId = folderId;
    activeFolderName = folderName;
    displayedFolderCount = LOAD_MORE_INCREMENT;

    const grid = document.getElementById('folderViewGrid');
    const folderCatatanArea = document.getElementById('folderCatatanArea');
    const breadcrumb = document.getElementById('catatanBreadcrumb');
    const breadcrumbName = document.getElementById('breadcrumbFolderName');

    // Sembunyikan grid, tampilkan isi folder
    grid.style.display = 'none';
    folderCatatanArea.style.display = 'block';
    breadcrumb.style.display = 'flex';
    breadcrumbName.textContent = folderName;

    // Filter data sesuai folder
    if (folderId === '__none__') {
      folderFilteredData = allCatatanData.filter(c => !c.folderId);
    } else {
      folderFilteredData = allCatatanData.filter(c => c.folderId === folderId);
    }

    renderFolderCatatanList();
  }

  // Render catatan di dalam folder yang aktif
  function renderFolderCatatanList() {
    const list = document.getElementById('folderCatatanList');
    list.innerHTML = '';

    if (folderFilteredData.length === 0) {
      list.innerHTML = `
        <div class="catatan-empty">
          <div class="catatan-empty-icon">📭</div>
          <p>Folder ini masih kosong.</p>
        </div>
      `;
      document.getElementById('loadMoreContainerFolder').style.display = 'none';
      return;
    }

    const displayData = folderFilteredData.slice(0, displayedFolderCount);
    displayData.forEach(catatan => {
      const item = document.createElement('div');
      item.className = 'catatan-item';
      const authorIcon = catatan.author === 'BF' ? '👨' : '👩';
      item.innerHTML = `
        <div class="catatan-header">
          <div style="display:flex;align-items:center;flex-wrap:wrap;gap:8px;">
            <div class="catatan-author-badge">${authorIcon} ${escapeHtml(catatan.author || 'Anonymous')}</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="catatan-timestamp">${catatan.date} • ${catatan.time}</div>
            <div class="catatan-menu">
              <button class="catatan-menu-btn" onclick="toggleCatatanMenu('${catatan.id}')">⋮</button>
              <div class="catatan-dropdown" id="menu-${catatan.id}">
                <div class="catatan-dropdown-item" onclick="copyCatatan('${catatan.id}')">📋 Copy</div>
                <div class="catatan-dropdown-item has-submenu" onclick="toggleSubmenu(event,'${catatan.id}')">
                  ✏️ Edit <span style="margin-left:auto;">▶</span>
                  <div class="catatan-submenu" id="submenu-${catatan.id}">
                    <div class="catatan-submenu-item" onclick="editCatatanAuthor('${catatan.id}')">👤 Edit Penulis</div>
                    <div class="catatan-submenu-item" onclick="editCatatanText('${catatan.id}')">📝 Edit Catatan</div>
                    <div class="catatan-submenu-item" onclick="editCatatanFolder('${catatan.id}')">📁 Edit Folder</div>
                  </div>
                </div>
                <div class="catatan-dropdown-item delete" onclick="deleteCatatan('${catatan.id}')">🗑️ Hapus</div>
              </div>
            </div>
          </div>
        </div>
        <div class="catatan-text">${escapeHtml(catatan.text)}</div>
      `;
      list.appendChild(item);
    });

    // Load more
    const lmContainer = document.getElementById('loadMoreContainerFolder');
    const lmInfo = document.getElementById('loadMoreInfoFolder');
    if (displayedFolderCount < folderFilteredData.length) {
      lmContainer.style.display = 'block';
      document.getElementById('loadMoreBtnFolder').disabled = false;
      lmInfo.textContent = `Menampilkan ${displayedFolderCount} dari ${folderFilteredData.length} catatan`;
    } else {
      lmContainer.style.display = 'none';
    }
  }

  // Load more catatan dalam folder
  function loadMoreFolderCatatan() {
    displayedFolderCount += LOAD_MORE_INCREMENT;
    renderFolderCatatanList();
  }

  // Kembali ke grid folder dari dalam folder
  function backToFolderView() {
    activeFolderId = null;
    activeFolderName = '';
    renderFolderGrid();
  }

  // Apply filters juga refresh folder grid jika sedang di view folder
  // (dipanggil saat data real-time update)
  function refreshCurrentView() {
    if (currentCatatanView === 'folder') {
      if (activeFolderId) {
        // Refresh isi folder yang sedang dibuka
        openFolderView(activeFolderId, activeFolderName);
      } else {
        renderFolderGrid();
      }
    }
    // View 'all' di-refresh via applyFilters() yang sudah dipanggil di loadCatatan
  }

  // Apply filters
  function applyFilters() {
    const monthFilter = document.getElementById('filterMonth').value;
    const yearFilter = document.getElementById('filterYear').value;
    const authorFilter = document.getElementById('filterAuthor').value;
    const folderFilter = document.getElementById('filterFolder').value;
    
    // Filter data
    let filteredData = allCatatanData.filter(catatan => {
      const matchMonth = !monthFilter || catatan.month === monthFilter;
      const matchYear = !yearFilter || catatan.year === yearFilter;
      const matchAuthor = !authorFilter || catatan.author === authorFilter;
      
      // Handle folder filter
      let matchFolder = true;
      if (folderFilter) {
        if (folderFilter === '__none__') {
          // Show only catatan without folder
          matchFolder = !catatan.folderId;
        } else {
          matchFolder = catatan.folderId === folderFilter;
        }
      }
      
      return matchMonth && matchYear && matchAuthor && matchFolder;
    });
    
    // Reset displayed count
    displayedCatatanCount = LOAD_MORE_INCREMENT;
    
    // Render filtered data
    renderCatatan(filteredData);
  }
  
  // Reset filters
  function resetFilters() {
    document.getElementById('filterMonth').value = '';
    document.getElementById('filterYear').value = '';
    document.getElementById('filterAuthor').value = '';
    document.getElementById('filterFolder').value = '';
    applyFilters();
  }
  
  // Render catatan dengan pagination
  function renderCatatan(data) {
    const list = document.getElementById('catatanList');
    list.innerHTML = '';
    
    if (data.length === 0) {
      list.innerHTML = `
        <div class="catatan-empty">
          <div class="catatan-empty-icon">🔍</div>
          <p>Tidak ada catatan yang sesuai filter.</p>
        </div>
      `;
      updateCatatanCounter(0);
      hideLoadMoreButton();
      return;
    }
    
    // Display only up to displayedCatatanCount
    const displayData = data.slice(0, displayedCatatanCount);
    
    displayData.forEach(catatan => {
      const item = document.createElement('div');
      item.className = 'catatan-item';
      
      // Tentukan icon berdasarkan author
      const authorIcon = catatan.author === 'BF' ? '👨' : '👩';
      
      // Folder badge (jika ada)
      const folderBadge = catatan.folderName 
        ? `<span class="catatan-folder-badge">📁 ${escapeHtml(catatan.folderName)}</span>`
        : '';
      
      item.innerHTML = `
        <div class="catatan-header">
          <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div class="catatan-author-badge">
              ${authorIcon} ${escapeHtml(catatan.author || 'Anonymous')}
            </div>
            ${folderBadge}
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="catatan-timestamp">${catatan.date} • ${catatan.time}</div>
            <div class="catatan-menu">
              <button class="catatan-menu-btn" onclick="toggleCatatanMenu('${catatan.id}')">⋮</button>
              <div class="catatan-dropdown" id="menu-${catatan.id}">
                <div class="catatan-dropdown-item" onclick="copyCatatan('${catatan.id}')">
                  📋 Copy
                </div>
                <div class="catatan-dropdown-item has-submenu" onclick="toggleSubmenu(event, '${catatan.id}')">
                  ✏️ Edit
                  <span style="margin-left: auto;">▶</span>
                  <div class="catatan-submenu" id="submenu-${catatan.id}">
                    <div class="catatan-submenu-item" onclick="editCatatanAuthor('${catatan.id}')">
                      👤 Edit Penulis
                    </div>
                    <div class="catatan-submenu-item" onclick="editCatatanText('${catatan.id}')">
                      📝 Edit Catatan
                    </div>
                    <div class="catatan-submenu-item" onclick="editCatatanFolder('${catatan.id}')">
                      📁 Edit Folder
                    </div>
                  </div>
                </div>
                <div class="catatan-dropdown-item delete" onclick="deleteCatatan('${catatan.id}')">
                  🗑️ Hapus
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="catatan-text">${escapeHtml(catatan.text)}</div>
      `;
      list.appendChild(item);
    });
    
    // Update counter
    updateCatatanCounter(data.length);
    
    // Show/hide load more button
    if (displayedCatatanCount < data.length) {
      showLoadMoreButton(displayedCatatanCount, data.length);
    } else {
      hideLoadMoreButton();
    }
  }
  
  // Load more catatan
  function loadMoreCatatan() {
    displayedCatatanCount += LOAD_MORE_INCREMENT;
    applyFilters();
  }
  
  // Show load more button
  function showLoadMoreButton(displayed, total) {
    const container = document.getElementById('loadMoreContainer');
    const btn = document.getElementById('loadMoreBtn');
    const info = document.getElementById('loadMoreInfo');
    
    container.style.display = 'block';
    btn.disabled = false;
    info.textContent = `Menampilkan ${displayed} dari ${total} catatan`;
  }
  
  // Hide load more button
  function hideLoadMoreButton() {
    const container = document.getElementById('loadMoreContainer');
    if (container) container.style.display = 'none';
  }
  
  // Update catatan counter
  function updateCatatanCounter(count) {
    const counterEl = document.getElementById('totalCatatan');
    if (counterEl) counterEl.textContent = count;
  }
  
  // Populate year filter dynamically
  function populateYearFilter() {
    const yearSelect = document.getElementById('filterYear');
    const currentYear = new Date().getFullYear();
    const years = new Set();
    
    // Collect unique years from data
    allCatatanData.forEach(catatan => {
      if (catatan.year) years.add(catatan.year);
    });
    
    // Add current year if not exists
    years.add(String(currentYear));
    
    // Sort years descending
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    
    // Clear and populate
    yearSelect.innerHTML = '<option value="">Semua Tahun</option>';
    sortedYears.forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    });
  }
  
  // Populate folder filter dropdown
  function populateFolderFilter() {
    const folderSelect = document.getElementById('filterFolder');
    if (!folderSelect) return;
    
    database.ref('folders').on('value', (snapshot) => {
      folderSelect.innerHTML = '<option value="">Semua Folder</option>';
      folderSelect.innerHTML += '<option value="__none__">📂 Random</option>';
      
      if (snapshot.exists()) {
        const folders = [];
        snapshot.forEach((child) => {
          folders.push({
            id: child.key,
            ...child.val()
          });
        });
        
        folders.sort((a, b) => a.name.localeCompare(b.name));
        
        folders.forEach(folder => {
          const option = document.createElement('option');
          option.value = folder.id;
          option.textContent = `📁 ${folder.name}`;
          folderSelect.appendChild(option);
        });
      }
    });
  }
  
  // Toggle catatan menu (three dots)
  function toggleCatatanMenu(id) {
    const menu = document.getElementById('menu-' + id);
    const allMenus = document.querySelectorAll('.catatan-dropdown');
    
    // Close all other menus
    allMenus.forEach(m => {
      if (m.id !== 'menu-' + id) {
        m.classList.remove('show');
      }
    });
    
    // Toggle current menu
    menu.classList.toggle('show');
  }
  
  // Toggle submenu untuk Edit (untuk mobile)
  function toggleSubmenu(event, id) {
    // Untuk desktop, hover sudah handle submenu
    // Untuk mobile, kita perlu toggle manual
    if (window.innerWidth <= 768) {
      event.stopPropagation();
      const submenuParent = event.currentTarget;
      submenuParent.classList.toggle('active');
    }
  }
  
  // Close menus when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.catatan-menu')) {
      document.querySelectorAll('.catatan-dropdown').forEach(menu => {
        menu.classList.remove('show');
      });
      document.querySelectorAll('.has-submenu').forEach(item => {
        item.classList.remove('active');
      });
    }
  });
  
  // Copy catatan to clipboard
  async function copyCatatan(id) {
    // Close menu
    toggleCatatanMenu(id);
    
    // Get catatan data
    database.ref('catatan/' + id).once('value', async (snapshot) => {
      if (!snapshot.exists()) return;
      
      const data = snapshot.val();
      const textToCopy = data.text;
      
      try {
        // Try modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(textToCopy);
          showNotification('📋 Catatan berhasil dicopy!');
        } else {
          // Fallback for older browsers
          const textarea = document.createElement('textarea');
          textarea.value = textToCopy;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          showNotification('📋 Catatan berhasil dicopy!');
        }
      } catch (error) {
        console.error('Error copying:', error);
        showNotification('❌ Gagal copy catatan!');
      }
    });
  }
  
  // Edit catatan AUTHOR (Penulis)
  function editCatatanAuthor(id) {
    // Close all menus
    document.querySelectorAll('.catatan-dropdown').forEach(menu => {
      menu.classList.remove('show');
    });
    
    // Get catatan data
    database.ref('catatan/' + id).once('value', (snapshot) => {
      if (!snapshot.exists()) return;
      
      const data = snapshot.val();
      
      // Create edit modal for author
      const modal = document.createElement('div');
      modal.className = 'edit-modal';
      modal.innerHTML = `
        <div class="edit-modal-content">
          <div class="edit-modal-header">
            <h3>👤 Edit Penulis</h3>
            <button class="edit-modal-close" onclick="this.closest('.edit-modal').remove()">×</button>
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 10px; font-size: 14px; opacity: 0.8;">Pilih Penulis:</label>
            <select id="editAuthor-${id}" class="catatan-author-select" style="width: 100%; padding: 12px 15px; font-size: 15px;">
              <option value="BF" ${data.author === 'BF' ? 'selected' : ''}>BF (Boyfriend)</option>
              <option value="GF" ${data.author === 'GF' ? 'selected' : ''}>GF (Girlfriend)</option>
            </select>
          </div>
          <div class="edit-modal-actions">
            <button class="edit-modal-btn cancel" onclick="this.closest('.edit-modal').remove()">Batal</button>
            <button class="edit-modal-btn save" onclick="saveCatatanAuthor('${id}')">💾 Simpan</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Focus select
      document.getElementById('editAuthor-' + id).focus();
      
      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
    });
  }
  
  // Save catatan author edit
  async function saveCatatanAuthor(id) {
    const select = document.getElementById('editAuthor-' + id);
    const newAuthor = select.value;
    
    if (!newAuthor) {
      showNotification('⚠️ Pilih penulis!');
      return;
    }
    
    try {
      await database.ref('catatan/' + id).update({
        author: newAuthor,
        editedAt: Date.now(),
        editedDate: new Date().toLocaleString('id-ID')
      });
      
      // Close modal
      document.querySelector('.edit-modal').remove();
      
      showNotification('✅ Penulis berhasil diupdate!');
    } catch (error) {
      console.error('Error updating author:', error);
      showNotification('❌ Gagal mengupdate penulis!');
    }
  }
  
  // Edit catatan TEXT (Isi Catatan)
  function editCatatanText(id) {
    // Close all menus
    document.querySelectorAll('.catatan-dropdown').forEach(menu => {
      menu.classList.remove('show');
    });
    
    // Get catatan data
    database.ref('catatan/' + id).once('value', (snapshot) => {
      if (!snapshot.exists()) return;
      
      const data = snapshot.val();
      
      // Create edit modal
      const modal = document.createElement('div');
      modal.className = 'edit-modal';
      modal.innerHTML = `
        <div class="edit-modal-content">
          <div class="edit-modal-header">
            <h3>📝 Edit Catatan</h3>
            <button class="edit-modal-close" onclick="this.closest('.edit-modal').remove()">×</button>
          </div>
          <textarea class="edit-modal-textarea" id="editText-${id}" maxlength="2000">${escapeHtml(data.text)}</textarea>
          <div class="char-counter" id="editCharCounter-${id}">
            <span id="editCharCount-${id}">${data.text.length}</span> / 2000 karakter
          </div>
          <div class="edit-modal-actions">
            <button class="edit-modal-btn cancel" onclick="this.closest('.edit-modal').remove()">Batal</button>
            <button class="edit-modal-btn save" onclick="saveCatatanText('${id}')">💾 Simpan</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Focus textarea
      const editTextarea = document.getElementById('editText-' + id);
      const editCharCount = document.getElementById('editCharCount-' + id);
      const editCharCounter = document.getElementById('editCharCounter-' + id);
      
      editTextarea.focus();
      
      // Add character counter update
      editTextarea.addEventListener('input', () => {
        const length = editTextarea.value.length;
        editCharCount.textContent = length;
        
        // Change color based on length
        if (length >= 1800) {
          editCharCounter.classList.add('danger');
          editCharCounter.classList.remove('warning');
        } else if (length >= 1500) {
          editCharCounter.classList.add('warning');
          editCharCounter.classList.remove('danger');
        } else {
          editCharCounter.classList.remove('warning', 'danger');
        }
      });
      
      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
    });
  }
  
  // Save catatan text edit
  async function saveCatatanText(id) {
    const textarea = document.getElementById('editText-' + id);
    const newText = textarea.value.trim();
    
    if (!newText) {
      showNotification('⚠️ Catatan tidak boleh kosong!');
      return;
    }
    
    if (newText.length > 2000) {
      showNotification('⚠️ Catatan terlalu panjang! Maksimal 2000 karakter.');
      return;
    }
    
    try {
      await database.ref('catatan/' + id).update({
        text: newText,
        editedAt: Date.now(),
        editedDate: new Date().toLocaleString('id-ID')
      });
      
      // Close modal
      document.querySelector('.edit-modal').remove();
      
      showNotification('✅ Catatan berhasil diupdate!');
    } catch (error) {
      console.error('Error updating catatan:', error);
      showNotification('❌ Gagal mengupdate catatan!');
    }
  }
  
  // Edit catatan FOLDER
  function editCatatanFolder(id) {
    // Close all menus
    document.querySelectorAll('.catatan-dropdown').forEach(menu => {
      menu.classList.remove('show');
    });
    
    // Get catatan data and folders
    Promise.all([
      database.ref('catatan/' + id).once('value'),
      database.ref('folders').once('value')
    ]).then(([catatanSnapshot, foldersSnapshot]) => {
      if (!catatanSnapshot.exists()) return;
      
      const data = catatanSnapshot.val();
      
      // Build folder options
      let folderOptions = '<option value="">-- Tidak ada folder --</option>';
      if (foldersSnapshot.exists()) {
        const folders = [];
        foldersSnapshot.forEach((child) => {
          folders.push({
            id: child.key,
            ...child.val()
          });
        });
        
        folders.sort((a, b) => a.name.localeCompare(b.name));
        
        folders.forEach(folder => {
          const selected = data.folderId === folder.id ? 'selected' : '';
          folderOptions += `<option value="${folder.id}" ${selected}>📁 ${escapeHtml(folder.name)}</option>`;
        });
      }
      
      // Create edit modal for folder
      const modal = document.createElement('div');
      modal.className = 'edit-modal';
      modal.innerHTML = `
        <div class="edit-modal-content">
          <div class="edit-modal-header">
            <h3>📁 Edit Folder</h3>
            <button class="edit-modal-close" onclick="this.closest('.edit-modal').remove()">×</button>
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 10px; font-size: 14px; opacity: 0.8;">Pilih Folder:</label>
            <select id="editFolder-${id}" class="catatan-folder-select" style="width: 100%; padding: 12px 15px; font-size: 15px;">
              ${folderOptions}
            </select>
            <div style="margin-top: 10px; font-size: 13px; opacity: 0.6;">
              💡 Tip: Kelola folder di tombol ⚙️ pada form input catatan
            </div>
          </div>
          <div class="edit-modal-actions">
            <button class="edit-modal-btn cancel" onclick="this.closest('.edit-modal').remove()">Batal</button>
            <button class="edit-modal-btn save" onclick="saveCatatanFolder('${id}')">💾 Simpan</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Focus select
      document.getElementById('editFolder-' + id).focus();
      
      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
    });
  }
  
  // Save catatan folder edit
  async function saveCatatanFolder(id) {
    const select = document.getElementById('editFolder-' + id);
    const newFolderId = select.value || null;
    
    try {
      await database.ref('catatan/' + id).update({
        folderId: newFolderId,
        editedAt: Date.now(),
        editedDate: new Date().toLocaleString('id-ID')
      });
      
      // Close modal
      document.querySelector('.edit-modal').remove();
      
      showNotification('✅ Folder berhasil diupdate!');
    } catch (error) {
      console.error('Error updating folder:', error);
      showNotification('❌ Gagal mengupdate folder!');
    }
  }
  
  // Hapus catatan
  async function deleteCatatan(id) {
    // Close menu
    const menu = document.getElementById('menu-' + id);
    if (menu) menu.classList.remove('show');
    
    if (!confirm('Hapus catatan ini?')) return;
    
    try {
      await database.ref('catatan/' + id).remove();
      showNotification('🗑️ Catatan dihapus!');
    } catch (error) {
      console.error('Error deleting catatan:', error);
      showNotification('❌ Gagal menghapus catatan!');
    }
  }
  
  // ============================================
  // 📁 FOLDER MANAGEMENT FUNCTIONS
  // ============================================
  
  // Load folders untuk dropdown dan filter
  function loadFolders() {
    const folderSelect = document.getElementById('catatanFolder');
    if (!folderSelect) return;
    
    database.ref('folders').on('value', (snapshot) => {
      // Keep default option
      folderSelect.innerHTML = '<option value="">-- Random --</option>';
      
      if (snapshot.exists()) {
        const folders = [];
        snapshot.forEach((child) => {
          folders.push({
            id: child.key,
            ...child.val()
          });
        });
        
        // Sort by name
        folders.sort((a, b) => a.name.localeCompare(b.name));
        
        folders.forEach(folder => {
          const option = document.createElement('option');
          option.value = folder.id;
          option.textContent = `📁 ${folder.name}`;
          folderSelect.appendChild(option);
        });
      }
    });
  }
  
  // ============================================
  // 🔧 QUICK FOLDER ADD FUNCTIONS
  // ============================================
  
  function toggleQuickFolderAdd() {
    const quickAdd = document.getElementById('quickFolderAdd');
    const input = document.getElementById('quickFolderName');
    
    if (quickAdd.style.display === 'none') {
      quickAdd.style.display = 'flex';
      input.focus();
    } else {
      quickAdd.style.display = 'none';
      input.value = '';
    }
  }
  
  async function createFolderQuick() {
    const input = document.getElementById('quickFolderName');
    const name = input.value.trim();
    
    if (!name) {
      showNotification('⚠️ Masukkan nama folder!');
      return;
    }
    
    if (name.length > 30) {
      showNotification('⚠️ Nama folder maksimal 30 karakter!');
      return;
    }
    
    try {
      const newFolderRef = database.ref('folders').push();
      const folderId = newFolderRef.key;
      
      await newFolderRef.set({
        name: name,
        createdAt: Date.now(),
        createdDate: new Date().toLocaleString('id-ID')
      });
      
      // Clear input and hide
      input.value = '';
      toggleQuickFolderAdd();
      
      // Auto-select the new folder (wait for real-time update)
      setTimeout(() => {
        document.getElementById('catatanFolder').value = folderId;
      }, 300);
      
      showNotification('✅ Folder "' + name + '" berhasil dibuat!');
    } catch (error) {
      console.error('Error creating folder:', error);
      showNotification('❌ Gagal membuat folder!');
    }
  }
  
  // Enter key untuk quick folder add
  document.addEventListener('DOMContentLoaded', () => {
    const quickInput = document.getElementById('quickFolderName');
    if (quickInput) {
      quickInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          createFolderQuick();
        } else if (e.key === 'Escape') {
          toggleQuickFolderAdd();
        }
      });
    }
  });

  // ============================================
  // 📁 FOLDER MANAGER FUNCTIONS (Original)
  // ============================================
  
  function openFolderManager() {
    const modal = document.createElement('div');
    modal.className = 'folder-manager-modal';
    modal.id = 'folderManager';
    modal.innerHTML = `
      <div class="folder-manager-content">
        <div class="folder-manager-header">
          <h3>📁 Kelola Folder</h3>
          <button class="folder-manager-close" onclick="closeFolderManager()">×</button>
        </div>
        
        <div class="folder-create-area">
          <h4>➕ Buat Folder Baru</h4>
          <div class="folder-create-form">
            <input 
              type="text" 
              id="newFolderName" 
              class="folder-name-input" 
              placeholder="Nama folder (misal: Liburan Bali)"
              maxlength="50"
            />
            <button class="folder-create-btn" onclick="createFolder()">
              Buat
            </button>
          </div>
        </div>
        
        <div class="folder-list">
          <h4>📂 Folder Tersedia</h4>
          <div id="folderListContainer"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load existing folders
    loadFolderList();
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeFolderManager();
    });
    
    // Focus input
    document.getElementById('newFolderName').focus();
    
    // Enter to create
    document.getElementById('newFolderName').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        createFolder();
      }
    });
  }
  
  // Close folder manager
  function closeFolderManager() {
    const modal = document.getElementById('folderManager');
    if (modal) modal.remove();
  }
  
  // Create new folder
  async function createFolder() {
    const input = document.getElementById('newFolderName');
    const name = input.value.trim();
    
    if (!name) {
      showNotification('⚠️ Masukkan nama folder!');
      return;
    }
    
    if (name.length > 50) {
      showNotification('⚠️ Nama folder terlalu panjang! Maksimal 50 karakter.');
      return;
    }
    
    try {
      const newFolderRef = database.ref('folders').push();
      await newFolderRef.set({
        name: name,
        createdAt: Date.now(),
        createdDate: new Date().toLocaleString('id-ID')
      });
      
      input.value = '';
      showNotification('✅ Folder berhasil dibuat!');
      loadFolderList();
    } catch (error) {
      console.error('Error creating folder:', error);
      showNotification('❌ Gagal membuat folder!');
    }
  }
  
  // Load folder list for manager
  function loadFolderList() {
    const container = document.getElementById('folderListContainer');
    if (!container) return;
    
    database.ref('folders').once('value', async (snapshot) => {
      if (!snapshot.exists()) {
        container.innerHTML = `
          <div class="folder-empty-state">
            <div class="folder-empty-state-icon">📂</div>
            <div>Belum ada folder. Buat folder baru di atas!</div>
          </div>
        `;
        return;
      }
      
      const folders = [];
      snapshot.forEach((child) => {
        folders.push({
          id: child.key,
          ...child.val()
        });
      });
      
      // Sort by name
      folders.sort((a, b) => a.name.localeCompare(b.name));
      
      // Get catatan count for each folder
      const catatanSnapshot = await database.ref('catatan').once('value');
      const catatanCounts = {};
      
      if (catatanSnapshot.exists()) {
        catatanSnapshot.forEach((child) => {
          const data = child.val();
          if (data.folderId) {
            catatanCounts[data.folderId] = (catatanCounts[data.folderId] || 0) + 1;
          }
        });
      }
      
      container.innerHTML = '';
      folders.forEach(folder => {
        const count = catatanCounts[folder.id] || 0;
        const item = document.createElement('div');
        item.className = 'folder-item';
        item.innerHTML = `
          <div class="folder-item-info">
            <div class="folder-item-icon">📁</div>
            <div class="folder-item-details">
              <div class="folder-item-name">${escapeHtml(folder.name)}</div>
              <div class="folder-item-count">${count} catatan</div>
            </div>
          </div>
          <div class="folder-item-actions">
            <button class="folder-action-btn" onclick="renameFolder('${folder.id}', '${escapeHtml(folder.name)}')">
              ✏️ Edit
            </button>
            <button class="folder-action-btn delete" onclick="deleteFolder('${folder.id}', '${escapeHtml(folder.name)}')">
              🗑️ Hapus
            </button>
          </div>
        `;
        container.appendChild(item);
      });
    });
  }
  
  // Rename folder
  async function renameFolder(id, currentName) {
    const newName = prompt('Nama folder baru:', currentName);
    if (!newName || newName.trim() === '') return;
    if (newName.trim() === currentName) return;
    
    if (newName.length > 50) {
      showNotification('⚠️ Nama folder terlalu panjang! Maksimal 50 karakter.');
      return;
    }
    
    try {
      await database.ref('folders/' + id).update({
        name: newName.trim(),
        editedAt: Date.now()
      });
      
      showNotification('✅ Folder berhasil diubah!');
      loadFolderList();
    } catch (error) {
      console.error('Error renaming folder:', error);
      showNotification('❌ Gagal mengubah folder!');
    }
  }
  
  // Delete folder
  async function deleteFolder(id, name) {
    // Check if folder has catatan
    const catatanSnapshot = await database.ref('catatan').orderByChild('folderId').equalTo(id).once('value');
    const count = catatanSnapshot.numChildren();
    
    let confirmMsg = `Hapus folder "${name}"?`;
    if (count > 0) {
      confirmMsg = `Folder "${name}" memiliki ${count} catatan. Catatan tidak akan dihapus, hanya folder-nya. Lanjutkan?`;
    }
    
    if (!confirm(confirmMsg)) return;
    
    try {
      // Remove folder
      await database.ref('folders/' + id).remove();
      
      // Remove folderId from all catatan in this folder
      if (count > 0) {
        const updates = {};
        catatanSnapshot.forEach((child) => {
          updates[`catatan/${child.key}/folderId`] = null;
        });
        await database.ref().update(updates);
      }
      
      showNotification('🗑️ Folder dihapus!');
      loadFolderList();
    } catch (error) {
      console.error('Error deleting folder:', error);
      showNotification('❌ Gagal menghapus folder!');
    }
  }
  
  // Helper function untuk escape HTML (mencegah XSS)
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Enter key untuk submit catatan
  document.addEventListener('DOMContentLoaded', () => {
    const catatanTextarea = document.getElementById('catatanText');
    const charCount = document.getElementById('catatanCharCount');
    const charCounter = document.getElementById('catatanCharCounter');
    
    if (catatanTextarea) {
      // Update character counter
      catatanTextarea.addEventListener('input', () => {
        const length = catatanTextarea.value.length;
        charCount.textContent = length;
        
        // Change color based on length
        if (length >= 1800) {
          charCounter.classList.add('danger');
          charCounter.classList.remove('warning');
        } else if (length >= 1500) {
          charCounter.classList.add('warning');
          charCounter.classList.remove('danger');
        } else {
          charCounter.classList.remove('warning', 'danger');
        }
      });
      
      // Ctrl/Cmd + Enter untuk submit
      catatanTextarea.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter untuk submit
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          addCatatan();
        }
      });
    }
  });

  // ============================================
  // 6️⃣ AUTO-LOAD SAAT PAGE LOAD
  // ============================================
  
  // Load data ketika page selesai load
  window.addEventListener('load', () => {
    console.log('🚀 Loading Firebase data...');
    
    setTimeout(() => {
      loadCatatan(); // Load catatan bersama
      loadFolders(); // Load folders untuk dropdown
      // Default: tampilkan view folder
      switchCatatanView('folder');
    }, 1000);
  });

  // ============================================
  // 6️⃣ HELPER FUNCTIONS
  // ============================================
  
  // Clear all data (untuk testing)
  async function clearAllData() {
    if (!confirm('⚠️ Hapus SEMUA data? Ini tidak bisa di-undo!')) return;
    if (!confirm('Yakin banget?')) return;
    
    try {
      await database.ref('memories').remove();
      await database.ref('loveletters').remove();
      await database.ref('gamescores').remove();
      await database.ref('catatan').remove();
      await database.ref('folders').remove();
      
      showNotification('🗑️ Semua data dihapus!');
      loadCatatan();
      loadFolders();
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  console.log('✅ Firebase integration loaded!');
  console.log('💡 Available functions:');
  console.log('  - addCatatan(), loadCatatan(), deleteCatatan(id)');
  console.log('  - clearAllData()');

