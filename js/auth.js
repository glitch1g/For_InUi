/* ============================================
   AUTH
   ============================================ */

    const overlay = document.getElementById('overlay');
    const passwordInput = document.getElementById('passwordInput');
    const errorMsg = document.getElementById('errorMsg');
    const bgMusic = document.getElementById('bgMusic');
    const musicControl = document.getElementById('musicControl');
    const notification = document.getElementById('notification');
    const secretMsg = document.getElementById('secretMsg');
    const mainTitle = document.getElementById('mainTitle');

    // ============ AUTO-UPDATE DAYS COUNTER ============
    function updateDaysCounter() {
      const now = new Date();
      const diffTime = Math.abs(now - RELATIONSHIP_START_DATE);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const daysElement = document.querySelector('[data-stat="days"] .stat-number');
      if (daysElement) {
        daysElement.textContent = diffDays;
      }
    }
    
    // Update immediately and then every hour
    updateDaysCounter();
    setInterval(updateDaysCounter, 3600000); // Update setiap 1 jam

    // ============ BACKGROUND PARTICLES ============
    function createParticles() {
      const particlesContainer = document.getElementById('particles');
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.width = Math.random() * 8 + 4 + 'px';
        particle.style.height = particle.style.width;
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 8 + 's';
        particle.style.animationDuration = Math.random() * 4 + 6 + 's';
        particlesContainer.appendChild(particle);
      }
    }

    // ============ STARS ============
    function createStars() {
      const starsContainer = document.getElementById('stars');
      for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsContainer.appendChild(star);
      }
    }

    // ============ FLOATING HEARTS ============
    function createBgHearts() {
      const hearts = ['❤️', '💕', '💖', '💗', '💝', '💘'];
      for (let i = 0; i < 15; i++) {
        const heart = document.createElement('div');
        heart.className = 'bg-heart';
        heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        heart.style.left = Math.random() * 100 + '%';
        heart.style.top = Math.random() * 100 + '%';
        heart.style.animationDelay = Math.random() * 15 + 's';
        heart.style.animationDuration = Math.random() * 5 + 12 + 's';
        document.body.appendChild(heart);
      }
    }

    // ============ TOGGLE PASSWORD VISIBILITY ============
    function togglePasswordVisibility(inputId, iconElement) {
      const input = document.getElementById(inputId);
      
      if (input.type === 'password') {
        input.type = 'text';
        iconElement.textContent = '🙈'; // Mata tertutup = sedang show password
        iconElement.style.animation = 'pulse 0.3s ease';
        setTimeout(() => {
          iconElement.style.animation = '';
        }, 300);
      } else {
        input.type = 'password';
        iconElement.textContent = '👁️'; // Mata terbuka = password hidden
        iconElement.style.animation = 'pulse 0.3s ease';
        setTimeout(() => {
          iconElement.style.animation = '';
        }, 300);
      }
    }

    // ============ PASSWORD CHECK ============
    // ============ USER SELECTION ============
    let currentUser = null;

    function selectUser(user) {
      currentUser = user;
      
      // Save to localStorage
      localStorage.setItem('selectedUser', user);
      
      // Update UI
      document.querySelectorAll('.user-card').forEach(card => {
        card.classList.remove('selected');
      });
      document.getElementById('user' + user).classList.add('selected');
      
      // Show password section
      document.getElementById('passwordSection').style.display = 'block';
      document.getElementById('selectedUserName').textContent = user === 'BF' ? 'Boyfriend' : 'Girlfriend';
      
      // Focus password input
      setTimeout(() => {
        document.getElementById('passwordInput').focus();
      }, 300);
    }

    function backToUserSelection() {
      currentUser = null;
      document.getElementById('passwordSection').style.display = 'none';
      document.getElementById('passwordInput').value = '';
      document.querySelectorAll('.user-card').forEach(card => {
        card.classList.remove('selected');
      });
    }

    function checkPassword() {
      if (!currentUser) {
        showNotification('⚠️ Pilih user terlebih dahulu!');
        return;
      }

      const input = passwordInput.value.toLowerCase().trim();
      
      if (input === PASSWORD) {
        overlay.style.animation = 'fadeOut 0.8s ease forwards';
        setTimeout(() => {
          overlay.style.display = 'none';
        }, 800);
        
        const userName = currentUser === 'BF' ? 'Boyfriend' : 'Girlfriend';
        showNotification(`🎉 Welcome, ${userName}! 💕`);
        createConfetti();
        
        // Try to auto-play music after unlock (mobile-friendly)
        tryAutoPlayAfterUnlock();
      } else {
        errorMsg.classList.add('show');
        passwordInput.value = '';
        passwordInput.style.animation = 'shake 0.5s ease';
        
        setTimeout(() => {
          errorMsg.classList.remove('show');
          passwordInput.style.animation = '';
        }, 2000);
      }
    }

    // Enter key untuk password
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') checkPassword();
    });

    // ============ NOTIFICATION ============
    function showNotification(message) {
      notification.textContent = message;
      notification.classList.add('show');
      
      setTimeout(() => {
        notification.classList.remove('show');
      }, 3000);
    }

    // ============ MUSIC CONTROL ============
    let isMusicPlaying = false;
    let audioInitialized = false;

    // Initialize audio on first user interaction (mobile-friendly)
    function initAudio() {
      if (!audioInitialized) {
        try {
          bgMusic.load();
          bgMusic.volume = 0.3; // Set volume to 30% (lebih kecil)
          audioInitialized = true;
          console.log('Audio initialized successfully');
        } catch (e) {
          console.error('Audio initialization failed:', e);
          showNotification('⚠️ Audio tidak dapat dimuat');
        }
      }
    }

    function toggleMusic() {
      // Make sure audio is initialized
      initAudio();
      
      if (isMusicPlaying) {
        bgMusic.pause();
        musicControl.classList.remove('playing');
        musicControl.innerHTML = '<span class="music-icon">🔇</span><span class="music-text">Musik</span>';
        isMusicPlaying = false;
        showNotification('🎵 Musik di-pause');
      } else {
        // Try to play with better error handling and user feedback
        showNotification('🎵 Memuat musik...');
        const playPromise = bgMusic.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            musicControl.classList.add('playing');
            musicControl.innerHTML = '<span class="music-icon">🎵</span><span class="music-text">Playing</span>';
            isMusicPlaying = true;
            showNotification('🎵 Musik diputar!');
            console.log('Music playing successfully');
          }).catch(err => {
            console.error('Audio play failed:', err);
            showNotification('⚠️ Klik tombol musik sekali lagi untuk memutar');
            // Reset state
            isMusicPlaying = false;
            musicControl.classList.remove('playing');
            
            // Auto-retry once after user gesture
            setTimeout(() => {
              const retryPromise = bgMusic.play();
              if (retryPromise !== undefined) {
                retryPromise.then(() => {
                  musicControl.classList.add('playing');
                  musicControl.innerHTML = '<span class="music-icon">🎵</span><span class="music-text">Playing</span>';
                  isMusicPlaying = true;
                  showNotification('🎵 Musik berhasil diputar!');
                }).catch(e => {
                  console.error('Retry failed:', e);
                });
              }
            }, 500);
          });
        }
      }
    }

    // Multiple trigger points for mobile compatibility
    let musicAttempted = false;
    
    // Try on any click
    document.addEventListener('click', function autoPlayClick() {
      if (!musicAttempted) {
        musicAttempted = true;
        initAudio();
        
        // Small delay then try to play
        setTimeout(() => {
          bgMusic.play().then(() => {
            musicControl.classList.add('playing');
            musicControl.innerHTML = '<span class="music-icon">🎵</span><span class="music-text">Playing</span>';
            isMusicPlaying = true;
          }).catch(() => {
            console.log('Autoplay blocked - user needs to click music button');
          });
        }, 100);
      }
    }, { once: true });
    
    // Try on touchstart for mobile
    document.addEventListener('touchstart', function autoPlayTouch() {
      initAudio();
    }, { once: true, passive: true });
    
    // Try after password unlock
    function tryAutoPlayAfterUnlock() {
      initAudio();
      setTimeout(() => {
        if (!isMusicPlaying) {
          bgMusic.play().then(() => {
            musicControl.classList.add('playing');
            musicControl.innerHTML = '<span class="music-icon">🎵</span><span class="music-text">Playing</span>';
            isMusicPlaying = true;
          }).catch(() => {
            console.log('Need manual music start');
          });
        }
      }, 500);
    }

    // ============ EASTER EGGS ============
    let clickCount = 0;
    let cursorTrailEnabled = false;
    let rainbowEnabled = false;

    document.addEventListener('click', (e) => {
      clickCount++;

      // Clicks sama dengan jumlah hari bersama
      const now = new Date();
      const diffTime = Math.abs(now - RELATIONSHIP_START_DATE);
      const currentDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (clickCount === currentDays) {
        showNotification(`🎊 ${currentDays} Clicks = ${currentDays} Hari Bersama! 💕`);
        createMassiveConfetti();
      }

      // 50 clicks = cursor trail
      if (clickCount === 50) {
        cursorTrailEnabled = true;
        showNotification('✨ Cursor trail activated! 🌟');
      }

      // 100 clicks = rainbow mode (toggle on/off)
      if (clickCount === 100) {
        rainbowEnabled = !rainbowEnabled;
        if (rainbowEnabled) {
          document.body.classList.add('rainbow-mode');
          showNotification('🌈 RAINBOW MODE ACTIVATED! 🎨');
        } else {
          document.body.classList.remove('rainbow-mode');
          showNotification('⚪ Rainbow mode OFF');
        }
        clickCount = 0; // Reset untuk bisa toggle lagi
      }

      // Cursor trail
      if (cursorTrailEnabled) {
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        trail.style.left = e.pageX + 'px';
        trail.style.top = e.pageY + 'px';
        document.body.appendChild(trail);
        
        setTimeout(() => trail.remove(), 1000);
      }
    });

    // ============ KONAMI CODE ============
    let konamiCode = [];
    const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 
                            'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 
                            'b', 'a'];

    document.addEventListener('keydown', (e) => {
      konamiCode.push(e.key);
      konamiCode = konamiCode.slice(-10);
      
      if (konamiCode.join('') === konamiSequence.join('')) {
        secretMsg.classList.add('show');
        createMassiveConfetti();
        showNotification('🎮 KONAMI CODE! Extra love unlocked! 💕');
        konamiCode = [];
      }
    });

    // ============ TITLE EASTER EGG ============
    let titleClickCount = 0;
    mainTitle.addEventListener('click', () => {
      titleClickCount++;
      
      if (titleClickCount === 5) {
        mainTitle.textContent = 'Aku Sayang Banget Sama Kamu! 💕';
        createConfetti();
        setTimeout(() => {
          mainTitle.textContent = 'Untuk Kamu, Sayangku ❤';
          titleClickCount = 0;
        }, 3000);
      }
    });

    // ============ STATS EASTER EGG ============
    document.querySelectorAll('.stat').forEach(stat => {
      stat.addEventListener('click', function() {
        const type = this.dataset.stat;
        
        // Get current days dynamically
        const now = new Date();
        const diffTime = Math.abs(now - RELATIONSHIP_START_DATE);
        const currentDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const messages = {
          days: `📅 ${currentDays} hari yang unforgettable!`,
          memories: '💭 Setiap detik bersamamu adalah kenangan!',
          love: '❤️ Love meter: MAXIMUM!'
        };
        showNotification(messages[type]);
        this.style.animation = 'pulse 0.5s ease';
        createHeartBurst(this);
        setTimeout(() => {
          this.style.animation = '';
        }, 500);
      });
    });

    // ============ NEW EASTER EGGS ============
    
    // Triple Click anywhere
    let tripleClickTimer;
    let tripleClickCount = 0;
    document.addEventListener('click', (e) => {
      tripleClickCount++;
      clearTimeout(tripleClickTimer);
      
      if (tripleClickCount === 3) {
        createHeartAnimation(e.pageX, e.pageY);
        showNotification('💖 Triple Love! 💖');
        tripleClickCount = 0;
      }
      
      tripleClickTimer = setTimeout(() => {
        tripleClickCount = 0;
      }, 500);
    });

    // Shake device/window
    let shakeCount = 0;
    let lastX = 0, lastY = 0, lastZ = 0;
    
    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', (e) => {
        const acc = e.accelerationIncludingGravity;
        const deltaX = Math.abs(acc.x - lastX);
        const deltaY = Math.abs(acc.y - lastY);
        const deltaZ = Math.abs(acc.z - lastZ);
        
        if (deltaX + deltaY + deltaZ > 30) {
          shakeCount++;
          if (shakeCount >= 3) {
            createMassiveConfetti();
            showNotification('📳 Shake detected! Love is in the air! 💕');
            shakeCount = 0;
          }
        }
        
        lastX = acc.x;
        lastY = acc.y;
        lastZ = acc.z;
      });
    }

    // Secret word typing
    let typedWord = '';
    const secretWords = {
      'iloveyou': '💕 I Love You Too! Forever and always! 💕',
      'sayang': '❤️ Sayang banget sama kamu juga! ❤️',
      'journey': '✨ Perjalanan indah kita bersama! 🎊',
      'forever': '♾️ Forever and ever, my love! ♾️',
      'kiss': '💋 *Sending virtual kisses* 💋',
      'hug': '🤗 *Big warm hug for you* 🫂'
    };

    // Toggle rainbow mode dengan ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        rainbowEnabled = !rainbowEnabled;
        if (rainbowEnabled) {
          document.body.classList.add('rainbow-mode');
          showNotification('🌈 RAINBOW MODE ON! (Press ESC to toggle) 🎨');
        } else {
          document.body.classList.remove('rainbow-mode');
          showNotification('⚪ Rainbow mode OFF (Press ESC to toggle)');
        }
      }
    });

    document.addEventListener('keypress', (e) => {
      typedWord += e.key.toLowerCase();
      typedWord = typedWord.slice(-20);
      
      for (let word in secretWords) {
        if (typedWord.includes(word)) {
          showNotification(secretWords[word]);
          createConfetti();
          typedWord = '';
          break;
        }
      }
    });

    // Long press on title
    let pressTimer;
    mainTitle.addEventListener('mousedown', () => {
      pressTimer = setTimeout(() => {
        mainTitle.style.animation = 'heartBeat 1s ease infinite';
        showNotification('💓 You\'re holding my heart! 💓');
      }, 2000);
    });

    mainTitle.addEventListener('mouseup', () => {
      clearTimeout(pressTimer);
      mainTitle.style.animation = '';
    });

    mainTitle.addEventListener('touchstart', () => {
      pressTimer = setTimeout(() => {
        mainTitle.style.animation = 'heartBeat 1s ease infinite';
        showNotification('💓 You\'re holding my heart! 💓');
      }, 2000);
    });

    mainTitle.addEventListener('touchend', () => {
      clearTimeout(pressTimer);
      mainTitle.style.animation = '';
    });

    // Scroll Easter Egg
    let scrollCount = 0;
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (Math.abs(scrollTop - lastScrollTop) > 100) {
        scrollCount++;
        if (scrollCount >= 10) {
          showNotification('🎢 Scrolling through our memories! 💫');
          createConfetti();
          scrollCount = 0;
        }
      }
      lastScrollTop = scrollTop;
    });

    // Time-based Easter Eggs
    const now = new Date();
    const hour = now.getHours();
    
    setTimeout(() => {
      if (hour >= 0 && hour < 6) {
        showNotification('🌙 Masih begadang? Sweet dreams my love! 😴');
      } else if (hour >= 6 && hour < 12) {
        showNotification('☀️ Good morning sayang! Have a great day! 💕');
      } else if (hour >= 12 && hour < 18) {
        showNotification('🌤️ Good afternoon! Hope you\'re having a wonderful day! 💖');
      } else {
        showNotification('🌆 Good evening! Thinking of you! 💕');
      }
    }, 5000);

    // Click all stats in sequence
    let statsSequence = [];
    document.querySelectorAll('.stat').forEach((stat, index) => {
      stat.addEventListener('click', () => {
        statsSequence.push(index);
        statsSequence = statsSequence.slice(-3);
        
        if (statsSequence.join('') === '012') {
          showNotification('🎯 Perfect sequence! Days → Memories → Love! 💝');
          createMassiveConfetti();
          statsSequence = [];
        }
      });
    });

    // Hover over subtitle
    const subtitle = document.querySelector('.subtitle');
    let hoverCount = 0;
    if (subtitle) {
      subtitle.addEventListener('mouseenter', () => {
        hoverCount++;
        if (hoverCount === 3) {
          subtitle.textContent = '✨ You found me! ✨';
          createConfetti();
          setTimeout(() => {
            subtitle.textContent = 'Setiap Hari Adalah Petualangan Baru';
            hoverCount = 0;
          }, 2000);
        }
      });
    }

    // Double click on date
    const dateEl = document.querySelector('.date');
    if (dateEl) {
      dateEl.addEventListener('dblclick', () => {
        dateEl.style.animation = 'rainbow 3s linear infinite';
        showNotification('📅 Best day of my life! 💕');
        setTimeout(() => {
          dateEl.style.animation = '';
        }, 3000);
      });
    }

    // Click speed test
    let speedClicks = [];
    document.addEventListener('click', () => {
      const now = Date.now();
      speedClicks.push(now);
      speedClicks = speedClicks.filter(time => now - time < 1000);
      
      if (speedClicks.length >= 10) {
        showNotification('⚡ WOW! Super fast clicker! You\'re amazing! 🌟');
        createMassiveConfetti();
        speedClicks = [];
      }
    });

    // Midnight surprise
    const checkMidnight = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        showNotification('🌟 It\'s midnight! Another day to love you! 💕');
        createMassiveConfetti();
      }
    };
    setInterval(checkMidnight, 60000);

    // Random surprise every 5 minutes
    setInterval(() => {
      const surprises = [
        '💝 Random love reminder: You\'re amazing!',
        '✨ Just thinking about you! 💭',
        '🌟 You make every day special! 💖',
        '💕 Missing you right now! 🥰',
        '🎈 Surprise! You\'re the best! 💫'
      ];
      const randomSurprise = surprises[Math.floor(Math.random() * surprises.length)];
      showNotification(randomSurprise);
    }, 300000);


    function createHeartBurst(element) {
      const rect = element.getBoundingClientRect();
      for (let i = 0; i < 5; i++) {
        const heart = document.createElement('div');
        heart.textContent = '❤️';
        heart.style.cssText = `
          position: fixed;
          left: ${rect.left + rect.width/2}px;
          top: ${rect.top}px;
          font-size: 20px;
          pointer-events: none;
          z-index: 1000;
          animation: burstUp${i} 1.5s ease forwards;
        `;
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 1500);
      }
    }

    const burstStyle = document.createElement('style');
    burstStyle.textContent = `
      @keyframes burstUp0 { to { transform: translate(-30px, -80px); opacity: 0; } }
      @keyframes burstUp1 { to { transform: translate(-15px, -100px); opacity: 0; } }
      @keyframes burstUp2 { to { transform: translate(0px, -110px); opacity: 0; } }
      @keyframes burstUp3 { to { transform: translate(15px, -100px); opacity: 0; } }
      @keyframes burstUp4 { to { transform: translate(30px, -80px); opacity: 0; } }
    `;
    document.head.appendChild(burstStyle);

    // ============ RIPPLE EFFECT ============
    document.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', createRipple);
    });

    function createRipple(e) {
      const button = e.currentTarget;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      
      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    }

    // ============ SECTION NAVIGATION ============
    // Navigation history stack
    const navigationHistory = [];

    function openSection(id) {
      // Save current view to history
      const currentView = document.querySelector('.section.active, #menu[style*="display: grid"]');
      if (currentView) {
        if (currentView.id === 'menu') {
          navigationHistory.push('menu');
        } else {
          navigationHistory.push(currentView.id);
        }
      }

      // Hide current view
      if (document.getElementById('menu').style.display !== 'none') {
        document.getElementById('menu').style.animation = 'fadeOut 0.4s ease forwards';
      }
      document.querySelectorAll('.section.active').forEach(s => {
        s.style.animation = 'fadeOut 0.4s ease forwards';
      });
      
      setTimeout(() => {
        document.getElementById('menu').style.display = 'none';
        document.querySelectorAll('.section').forEach(s => {
          s.style.display = 'none';
          s.classList.remove('active');
        });
        
        const sec = document.getElementById(id);
        sec.style.display = 'block';
        sec.classList.add('active');
        
        setTimeout(() => {
          const firstEl = sec.querySelector('p, .memory-card, .milestone-header');
          if (firstEl) firstEl.classList.add('show');
        }, 400);
      }, 400);
    }

    function goBack() {
      // Get previous view from history
      const previousView = navigationHistory.pop();
      
      // Hide current view
      document.querySelectorAll('.section').forEach(s => {
        s.style.animation = 'fadeOut 0.4s ease forwards';
      });
      
      setTimeout(() => {
        document.querySelectorAll('.section').forEach(s => {
          s.style.display = 'none';
          s.style.animation = '';
          s.classList.remove('active');
          s.querySelectorAll('p, h3, .quote, .love-list li, .timeline-item, .gallery-item, .memory-card').forEach(el => el.classList.remove('show'));
        });
        
        // Show previous view
        if (previousView === 'menu' || !previousView) {
          const menu = document.getElementById('menu');
          menu.style.display = 'grid';
          menu.style.animation = 'fadeInUp 0.6s ease forwards';
        } else {
          const sec = document.getElementById(previousView);
          sec.style.display = 'block';
          sec.classList.add('active');
          sec.style.animation = 'fadeInUp 0.6s ease forwards';
        }
      }, 400);
    }

    function reveal(btn) {
      const section = btn.parentElement;
      const elements = section.querySelectorAll('p, h3, .quote, .love-list li, .timeline-item, .gallery-item, .memory-card');
      
      elements.forEach((el, index) => {
        setTimeout(() => {
          el.classList.add('show');
        }, index * 120);
      });
      
      btn.style.animation = 'pulse 0.6s ease';
      setTimeout(() => {
        btn.style.animation = '';
      }, 600);
    }

    // ============ FINAL LETTER UNLOCK ============
    let letterAttempts = 0;
    const LETTER_PASSWORD = 'inginnya'; // Kata kunci untuk membuka surat
    
    function unlockFinalLetter() {
      const input = document.getElementById('letterPassword');
      const password = input.value.toLowerCase().trim();
      const hintElement = document.getElementById('letterHint');
      
      if (password === LETTER_PASSWORD) {
        // Password benar - buka surat
        document.getElementById('letterLocked').style.display = 'none';
        document.getElementById('letterUnlocked').style.display = 'block';
        
        // Animasi reveal
        const letterContent = document.querySelector('.letter-content');
        letterContent.style.animation = 'fadeInUp 1s ease';
        
        // Confetti celebration
        createConfetti();
        showNotification('💌 Surat berhasil dibuka!');
        
        // Scroll to letter
        setTimeout(() => {
          document.getElementById('letterUnlocked').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
        
      } else {
        // Password salah
        letterAttempts++;
        input.value = '';
        input.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
          input.style.animation = '';
        }, 500);
        
        if (letterAttempts === 1) {
          showNotification('❌ Kata kunci salah! Coba lagi...');
        } else if (letterAttempts === 2) {
          showNotification('💭 Hmm... Pikirkan kata yang ada di surat ini');
          hintElement.style.opacity = '0.6';
        } else if (letterAttempts >= 3) {
          showNotification('💡 Hint: Kata yang sering dipakai saat menyampaikan keinginan');
          hintElement.style.opacity = '1';
          hintElement.style.animation = 'pulse 2s infinite';
        }
      }
    }

    function showHeart() {
      const heart = document.getElementById('heart');
      heart.classList.add('show');
      
      const heartRect = heart.getBoundingClientRect();
      const heartCenterX = heartRect.left + heartRect.width / 2;
      const heartCenterY = heartRect.top + heartRect.height / 2;
      
      for (let i = 0; i < 20; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        const angle = (i * 18) * Math.PI / 180;
        const distance = 80;
        sparkle.style.left = (heartCenterX + Math.cos(angle) * distance) + 'px';
        sparkle.style.top = (heartCenterY + Math.sin(angle) * distance) + 'px';
        sparkle.style.animationDelay = (i * 0.08) + 's';
        document.body.appendChild(sparkle);
        
        setTimeout(() => sparkle.remove(), 2000);
      }
      
      createMassiveConfetti();
      showNotification('❤️ I LOVE YOU TOO! Selamanya! 🎉');
    }

    function createConfetti() {
      const colors = ['#7aa2ff', '#9b7dff', '#ff6b6b', '#ffd93d', '#6bcf7f'];
      
      for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
          position: fixed;
          width: 10px;
          height: 10px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          top: -10px;
          left: ${Math.random() * 100}%;
          opacity: 1;
          transform: rotate(${Math.random() * 360}deg);
          animation: confettiFall ${2 + Math.random() * 2}s ease-out forwards;
          z-index: 1000;
          pointer-events: none;
        `;
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 4000);
      }
    }

    function createMassiveConfetti() {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => createConfetti(), i * 300);
      }
    }

    const style = document.createElement('style');
    style.textContent = `
      @keyframes confettiFall {
        to {
          top: 100vh;
          transform: rotate(${Math.random() * 720}deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    function closeSecret() {
      secretMsg.classList.remove('show');
    }

    // ============ GALLERY INTERACTION ============
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', function() {
        this.style.animation = 'heartBeat 0.8s ease';
        const emoji = this.textContent;
        showNotification(`${emoji} ${this.title}`);
        createConfetti();
        
        setTimeout(() => {
          this.style.animation = '';
        }, 800);
      });
    });

    // ============ DOUBLE TAP ============
    let lastTap = 0;
    document.addEventListener('touchend', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < 300 && tapLength > 0) {
        createHeartAnimation(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
      }
      lastTap = currentTime;
    });

    function createHeartAnimation(x, y) {
      const heart = document.createElement('div');
      heart.textContent = '❤️';
      heart.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        font-size: 30px;
        pointer-events: none;
        animation: floatUp 2s ease forwards;
        z-index: 1000;
      `;
      document.body.appendChild(heart);
      
      setTimeout(() => heart.remove(), 2000);
    }

    const floatUpStyle = document.createElement('style');
    floatUpStyle.textContent = `
      @keyframes floatUp {
        to {
          transform: translateY(-100px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(floatUpStyle);

    // ============ GAME NAVIGATION ============
    function openGame(gameId) {
      document.getElementById('game').style.animation = 'fadeOut 0.4s ease forwards';
      
      setTimeout(() => {
        document.getElementById('game').style.display = 'none';
        const gameSection = document.getElementById(gameId);
        gameSection.style.display = 'block';
        gameSection.classList.add('active');
        gameSection.style.animation = 'fadeInUp 0.6s ease forwards';
        
        // Auto-start quiz when opened
        if (gameId === 'quiz') {
          setTimeout(() => startQuiz(), 100);
        }
        
        // Init wheel when spinwheel opened
        if (gameId === 'spinwheel') {
          setTimeout(() => initWheel(), 100);
        }
      }, 400);
    }

    function backToGames() {
      document.querySelectorAll('#heartcatcher, #memory, #quiz').forEach(s => {
        s.style.animation = 'fadeOut 0.4s ease forwards';
      });
      
      setTimeout(() => {
        document.querySelectorAll('#heartcatcher, #memory, #quiz').forEach(s => {
          s.style.display = 'none';
          s.style.animation = '';
          s.classList.remove('active');
        });
        
        const gameMenu = document.getElementById('game');
        gameMenu.style.display = 'block';
        gameMenu.style.animation = 'fadeInUp 0.6s ease forwards';
      }, 400);
    }

    // ============ HEART CATCHER GAME ============
