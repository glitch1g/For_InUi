/* ============================================
   GAMES
   ============================================ */

    let gameScore = 0;
    let gameTime = 30;
    let gameLives = 3;
    let gameActive = false;
    let gameTimer = null;
    let heartTimer = null;
    let currentHearts = [];
    let gameLevel = 1;
    let gameSpawnSpeed = 800;
    let gameHighScore = localStorage.getItem('heartCatcherHighScore') || 0;
    let gamePowerUps = { shield: false, doublePoints: false, slowTime: false };
    let gameCombo = 0;

    const gameScoreEl = document.getElementById('gameScore');
    const gameTimeEl = document.getElementById('gameTime');
    const gameLivesEl = document.getElementById('gameLives');
    const gameBoard = document.getElementById('gameBoard');
    const gameStartBtn = document.getElementById('gameStartBtn');
    const gameResetBtn = document.getElementById('gameResetBtn');
    const gameMessage = document.getElementById('gameMessage');
    const gameHoles = document.querySelectorAll('.game-hole');

    function startGame() {
      gameScore = 0;
      gameTime = 30;
      gameLives = 3;
      gameActive = true;
      currentHearts = [];
      gameLevel = 1;
      gameSpawnSpeed = 800;
      gamePowerUps = { shield: false, doublePoints: false, slowTime: false };
      gameCombo = 0;
      
      updateGameUI();
      gameStartBtn.style.display = 'none';
      gameResetBtn.style.display = 'none';
      gameMessage.innerHTML = `Catch the hearts! 💕<br><small>High Score: ${gameHighScore}</small>`;
      
      gameHoles.forEach(hole => {
        hole.innerHTML = '';
      });
      
      gameTimer = setInterval(() => {
        gameTime--;
        gameTimeEl.textContent = gameTime;
        
        // Level up every 10 seconds
        if (gameTime % 10 === 0 && gameTime > 0) {
          gameLevel++;
          gameSpawnSpeed = Math.max(400, gameSpawnSpeed - 100);
          clearInterval(heartTimer);
          heartTimer = setInterval(spawnHeart, gameSpawnSpeed);
          showNotification(`🆙 Level ${gameLevel}! Speed increased!`);
        }
        
        if (gameTime <= 0 || gameLives <= 0) {
          endGame();
        }
      }, 1000);
      
      spawnHeart();
      heartTimer = setInterval(spawnHeart, gameSpawnSpeed);
    }

    function spawnHeart() {
      if (!gameActive) return;
      
      const randomHole = Math.floor(Math.random() * gameHoles.length);
      const hole = gameHoles[randomHole];
      
      if (hole.querySelector('.game-heart')) return;
      
      // 15% broken heart, 5% power-up
      const rand = Math.random();
      let heartEmoji, heartType;
      
      if (rand < 0.05 && !gamePowerUps.doublePoints) {
        heartEmoji = '⭐'; // Double points power-up
        heartType = 'powerup-double';
      } else if (rand < 0.08 && !gamePowerUps.shield) {
        heartEmoji = '🛡️'; // Shield power-up
        heartType = 'powerup-shield';
      } else if (rand < 0.10) {
        heartEmoji = '💎'; // Bonus points
        heartType = 'bonus';
      } else if (rand < 0.25) {
        heartEmoji = '💔'; // Broken heart
        heartType = 'broken';
      } else {
        heartEmoji = '💕'; // Normal heart
        heartType = 'normal';
      }
      
      const heart = document.createElement('div');
      heart.className = 'game-heart';
      heart.textContent = heartEmoji;
      heart.dataset.type = heartType;
      
      heart.addEventListener('click', () => {
        if (!gameActive) return;
        
        heart.classList.add('clicked');
        
        if (heartType === 'broken') {
          if (gamePowerUps.shield) {
            gamePowerUps.shield = false;
            showNotification('🛡️ Shield protected you!');
          } else {
            gameLives--;
            updateGameUI();
            showNotification('💔 Ouch! Kena broken heart!');
            gameCombo = 0;
          }
          
          if (gameLives <= 0) {
            endGame();
          }
        } else if (heartType === 'powerup-double') {
          gamePowerUps.doublePoints = true;
          showNotification('⭐ DOUBLE POINTS for 5 seconds!');
          setTimeout(() => {
            gamePowerUps.doublePoints = false;
            showNotification('⭐ Double points ended!');
          }, 5000);
        } else if (heartType === 'powerup-shield') {
          gamePowerUps.shield = true;
          showNotification('🛡️ SHIELD activated! Protected from next hit!');
        } else if (heartType === 'bonus') {
          const bonusPoints = 50;
          gameScore += bonusPoints;
          gameScoreEl.textContent = gameScore;
          showNotification('💎 +50 BONUS!');
          createConfetti();
        } else {
          // Normal heart
          gameCombo++;
          let points = 10;
          if (gamePowerUps.doublePoints) points *= 2;
          if (gameCombo >= 5) points += 5; // Combo bonus
          
          gameScore += points;
          gameScoreEl.textContent = gameScore;
          
          if (gameCombo >= 5) {
            showNotification(`🔥 ${gameCombo}x COMBO! +${points} points!`);
          }
          
          if (gameScore % 100 === 0) {
            showNotification('🎉 100 points milestone! +1 Life!');
            gameLives = Math.min(3, gameLives + 1);
            updateGameUI();
          }
        }
        
        setTimeout(() => {
          heart.remove();
        }, 400);
      });
      
      hole.appendChild(heart);
      
      setTimeout(() => {
        if (heart.parentElement && !heart.classList.contains('clicked')) {
          heart.remove();
          if (heartType === 'normal') {
            gameCombo = 0; // Reset combo if missed
          }
        }
      }, 1500);
    }

    function updateGameUI() {
      gameScoreEl.textContent = gameScore;
      gameTimeEl.textContent = gameTime;
      
      let livesDisplay = '';
      for (let i = 0; i < gameLives; i++) {
        livesDisplay += '❤️';
      }
      for (let i = gameLives; i < 3; i++) {
        livesDisplay += '🖤';
      }
      
      // Add power-up indicators
      if (gamePowerUps.shield) livesDisplay += ' 🛡️';
      if (gamePowerUps.doublePoints) livesDisplay += ' ⭐';
      
      gameLivesEl.textContent = livesDisplay;
    }

    function endGame() {
      gameActive = false;
      clearInterval(gameTimer);
      clearInterval(heartTimer);
      
      gameHoles.forEach(hole => {
        hole.innerHTML = '';
      });
      
      // Update high score
      let isNewHighScore = false;
      if (gameScore > gameHighScore) {
        gameHighScore = gameScore;
        localStorage.setItem('heartCatcherHighScore', gameHighScore);
        isNewHighScore = true;
      }
      
      let resultMessage = '';
      if (gameLives <= 0) {
        resultMessage = `💔 Game Over! Score: ${gameScore}<br>High Score: ${gameHighScore}`;
      } else if (isNewHighScore) {
        resultMessage = `🏆 NEW HIGH SCORE! ${gameScore}! 🎉<br>Previous: ${gameHighScore}`;
        createMassiveConfetti();
      } else if (gameScore >= 200) {
        resultMessage = `🏆 AMAZING! Score: ${gameScore}!<br>High Score: ${gameHighScore} 😍💕`;
        createMassiveConfetti();
      } else if (gameScore >= 150) {
        resultMessage = `⭐ Great Job! Score: ${gameScore}!<br>High Score: ${gameHighScore} 🎉`;
        createConfetti();
      } else if (gameScore >= 100) {
        resultMessage = `👍 Good! Score: ${gameScore}!<br>High Score: ${gameHighScore} 💖`;
      } else {
        resultMessage = `💪 Score: ${gameScore}<br>High Score: ${gameHighScore}. Keep trying! 😊`;
      }
      
      gameMessage.innerHTML = resultMessage;
      gameResetBtn.style.display = 'inline-block';
      
      showNotification(resultMessage.replace(/<br>/g, ' '));
    }

    function resetGame() {
      gameResetBtn.style.display = 'none';
      gameStartBtn.style.display = 'inline-block';
      gameMessage.innerHTML = `Click Start to Play!<br><small>High Score: ${gameHighScore}</small>`;
      gameScore = 0;
      gameTime = 30;
      gameLives = 3;
      updateGameUI();
    }

    // ============ MEMORY CARD GAME ============
    const memoryEmojis = {
      easy: ['❤️', '💕', '💖', '💗'],
      medium: ['❤️', '💕', '💖', '💗', '💝', '💘'],
      hard: ['❤️', '💕', '💖', '💗', '💝', '💘', '🌹', '💐']
    };
    let memoryCards = [];
    let memoryFlipped = [];
    let memoryMatches = 0;
    let memoryMoves = 0;
    let memoryActive = false;
    let memoryStartTime = 0;
    let memoryTimerInterval = null;
    let memoryDifficulty = 'medium';
    let memoryBestTimes = JSON.parse(localStorage.getItem('memoryBestTimes')) || { easy: null, medium: null, hard: null };
    let memoryAchievements = JSON.parse(localStorage.getItem('memoryAchievements')) || {
      perfectEasy: false,
      perfectMedium: false,
      perfectHard: false,
      speedster: false,
      master: false
    };

    function startMemoryGame(difficulty = 'medium') {
      // Get elements when function is called
      const memoryBoard = document.getElementById('memoryBoard');
      const memoryMovesEl = document.getElementById('memoryMoves');
      const memoryMatchesEl = document.getElementById('memoryMatches');
      const memoryTimeEl = document.getElementById('memoryTime');
      const memoryStartBtn = document.getElementById('memoryStartBtn');
      const memoryResetBtn = document.getElementById('memoryResetBtn');
      const memoryMessage = document.getElementById('memoryMessage');
      
      if (!memoryBoard) {
        console.error('memoryBoard not found');
        return;
      }
      
      memoryDifficulty = difficulty;
      memoryMatches = 0;
      memoryMoves = 0;
      memoryFlipped = [];
      memoryActive = true;
      memoryStartTime = Date.now();
      
      const emojiSet = memoryEmojis[difficulty];
      const totalPairs = emojiSet.length;
      
      if (memoryMovesEl) memoryMovesEl.textContent = '0';
      if (memoryMatchesEl) memoryMatchesEl.textContent = `0/${totalPairs}`;
      if (memoryTimeEl) memoryTimeEl.textContent = '0s';
      if (memoryMessage) {
        const bestTime = memoryBestTimes[difficulty];
        memoryMessage.innerHTML = `Difficulty: ${difficulty.toUpperCase()} 🃏<br>${bestTime ? `Best: ${bestTime}s` : 'No record yet'}`;
      }
      
      if (memoryStartBtn) memoryStartBtn.style.display = 'none';
      if (memoryResetBtn) memoryResetBtn.style.display = 'none';
      
      // Show difficulty selector
      const diffSelector = document.getElementById('memoryDifficultySelector');
      if (diffSelector) diffSelector.style.display = 'none';
      
      // Create card pairs
      memoryCards = [...emojiSet, ...emojiSet]
        .sort(() => Math.random() - 0.5)
        .map((emoji, index) => ({
          id: index,
          emoji: emoji,
          matched: false
        }));
      
      // Render cards
      memoryBoard.innerHTML = '';
      memoryCards.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'memory-card';
        cardEl.dataset.id = index;
        cardEl.innerHTML = `
          <div class="memory-card-front">❓</div>
          <div class="memory-card-back">${card.emoji}</div>
        `;
        cardEl.addEventListener('click', () => flipMemoryCard(index));
        memoryBoard.appendChild(cardEl);
      });
      
      // Adjust grid columns based on difficulty
      if (difficulty === 'easy') {
        memoryBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
      } else if (difficulty === 'medium') {
        memoryBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
      } else {
        memoryBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
      }
      
      // Start timer
      memoryTimerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - memoryStartTime) / 1000);
        if (memoryTimeEl) memoryTimeEl.textContent = elapsed + 's';
      }, 1000);
    }

    function flipMemoryCard(index) {
      const memoryBoard = document.getElementById('memoryBoard');
      const memoryMovesEl = document.getElementById('memoryMoves');
      const memoryMatchesEl = document.getElementById('memoryMatches');
      
      if (!memoryActive) return;
      if (memoryFlipped.length >= 2) return;
      if (memoryFlipped.includes(index)) return;
      if (memoryCards[index].matched) return;
      if (!memoryBoard) return;
      
      const cardEl = memoryBoard.children[index];
      if (!cardEl) return;
      
      cardEl.classList.add('flipped');
      memoryFlipped.push(index);
      
      if (memoryFlipped.length === 2) {
        memoryMoves++;
        if (memoryMovesEl) memoryMovesEl.textContent = memoryMoves;
        
        const [first, second] = memoryFlipped;
        const firstCard = memoryCards[first];
        const secondCard = memoryCards[second];
        
        if (firstCard.emoji === secondCard.emoji) {
          // Match!
          setTimeout(() => {
            memoryCards[first].matched = true;
            memoryCards[second].matched = true;
            if (memoryBoard.children[first]) memoryBoard.children[first].classList.add('matched');
            if (memoryBoard.children[second]) memoryBoard.children[second].classList.add('matched');
            memoryFlipped = [];
            
            memoryMatches++;
            const totalPairs = memoryEmojis[memoryDifficulty].length;
            if (memoryMatchesEl) memoryMatchesEl.textContent = memoryMatches + '/' + totalPairs;
            showNotification('💖 Match! Bagus!');
            
            if (memoryMatches === totalPairs) {
              endMemoryGame();
            }
          }, 500);
        } else {
          // No match
          setTimeout(() => {
            if (memoryBoard.children[first]) memoryBoard.children[first].classList.remove('flipped');
            if (memoryBoard.children[second]) memoryBoard.children[second].classList.remove('flipped');
            memoryFlipped = [];
          }, 1000);
        }
      }
    }

    function endMemoryGame() {
      const memoryMessage = document.getElementById('memoryMessage');
      const memoryResetBtn = document.getElementById('memoryResetBtn');
      const diffSelector = document.getElementById('memoryDifficultySelector');
      
      memoryActive = false;
      clearInterval(memoryTimerInterval);
      
      const totalTime = Math.floor((Date.now() - memoryStartTime) / 1000);
      const totalPairs = memoryEmojis[memoryDifficulty].length;
      const perfectMoves = totalPairs; // Perfect = minimum moves
      
      // Check for new best time
      let isNewBest = false;
      if (!memoryBestTimes[memoryDifficulty] || totalTime < memoryBestTimes[memoryDifficulty]) {
        memoryBestTimes[memoryDifficulty] = totalTime;
        localStorage.setItem('memoryBestTimes', JSON.stringify(memoryBestTimes));
        isNewBest = true;
      }
      
      // Check achievements
      let achievementUnlocked = '';
      if (memoryMoves === perfectMoves && !memoryAchievements[`perfect${memoryDifficulty.charAt(0).toUpperCase() + memoryDifficulty.slice(1)}`]) {
        memoryAchievements[`perfect${memoryDifficulty.charAt(0).toUpperCase() + memoryDifficulty.slice(1)}`] = true;
        achievementUnlocked = `🏆 Achievement: Perfect ${memoryDifficulty.toUpperCase()}!`;
      }
      
      if (totalTime < 30 && !memoryAchievements.speedster) {
        memoryAchievements.speedster = true;
        achievementUnlocked = '⚡ Achievement: SPEEDSTER!';
      }
      
      if (memoryAchievements.perfectEasy && memoryAchievements.perfectMedium && memoryAchievements.perfectHard && !memoryAchievements.master) {
        memoryAchievements.master = true;
        achievementUnlocked = '👑 Achievement: MEMORY MASTER!';
      }
      
      localStorage.setItem('memoryAchievements', JSON.stringify(memoryAchievements));
      
      let resultMessage = '';
      if (isNewBest) {
        resultMessage = `🏆 NEW BEST TIME! ${totalTime}s!<br>Moves: ${memoryMoves}`;
        createMassiveConfetti();
      } else if (memoryMoves <= perfectMoves + 2) {
        resultMessage = `🏆 PERFECT! Moves: ${memoryMoves}, Time: ${totalTime}s!<br>Best: ${memoryBestTimes[memoryDifficulty]}s 🌟`;
        createMassiveConfetti();
      } else if (memoryMoves <= perfectMoves + 5) {
        resultMessage = `⭐ Great! Moves: ${memoryMoves}, Time: ${totalTime}s!<br>Best: ${memoryBestTimes[memoryDifficulty]}s 🎉`;
        createConfetti();
      } else {
        resultMessage = `👍 Good! Moves: ${memoryMoves}, Time: ${totalTime}s!<br>Best: ${memoryBestTimes[memoryDifficulty]}s 💪`;
      }
      
      if (achievementUnlocked) {
        resultMessage += `<br><br>${achievementUnlocked}`;
        createConfetti();
      }
      
      if (memoryMessage) memoryMessage.innerHTML = resultMessage;
      if (memoryResetBtn) memoryResetBtn.style.display = 'inline-block';
      if (diffSelector) diffSelector.style.display = 'flex';
      
      showNotification(resultMessage.replace(/<br>/g, ' ').replace(/<[^>]*>/g, ''));
    }

    function resetMemoryGame() {
      const memoryBoard = document.getElementById('memoryBoard');
      const memoryStartBtn = document.getElementById('memoryStartBtn');
      const memoryResetBtn = document.getElementById('memoryResetBtn');
      const memoryMessage = document.getElementById('memoryMessage');
      
      if (memoryResetBtn) memoryResetBtn.style.display = 'none';
      if (memoryStartBtn) memoryStartBtn.style.display = 'inline-block';
      if (memoryMessage) memoryMessage.innerHTML = 'Select difficulty and click Start!';
      if (memoryBoard) memoryBoard.innerHTML = '';
    }

    // ============ LOVE QUIZ GAME ============
    const quizAllQuestions = [
      {
        question: "Apa yang paling aku suka dari kamu?",
        options: ["Senyumanmu yang selalu indah 😊", "Kelucuanmu yang menggemaskan 🥰", "Cara kamu dengerin aku serius 💙", "Perhatianmu yang selalu detail 💫", "Literally semua yang di atas wkwk 💕"],
        correct: 4
      },
      {
        question: "Kapan aku paling senang?",
        options: ["Pas kita ngobrol sampai lupa waktu 💬", "Pas liat kamu ketawa lepas 😄", "Pas kita bareng & ngelakuin hal random 🎉", "Pas kamu cerita tentang harimu 🥰", "Semua momen itu lah, males milih 😂💕"],
        correct: 4
      },
      {
        question: "Apa yang paling bikin aku suka sama kamu?",
        options: ["Cara kamu ngomong yang ekspresif 😄", "Tingkah random kamu yang menghibur 🤪", "Energi positif yang kamu punya 🌟", "Ya kamu lucu aja sih 😂💕"],
        correct: 3
      },
      {
        question: "Hal favorit yang kita lakuin bareng?",
        options: ["Ngobrol sambil makan bareng 🍜", "Ngobrol sampai larut malam 🌙", "Becanda & ketawa garing bareng 😄", "Ya semuanya dong, paket komplit 💯😎"],
        correct: 3
      },
      {
        question: "Harapan aku buat kita ke depannya?",
        options: ["Makin kenal satu sama lain 💙", "Bisa traveling bareng kemana-mana ✈️", "Bisa lewatin semua naik turun bareng 🤝", "Build future bareng step by step 💫"],
        correct: 3
      },
      {
        question: "Apa yang bikin kamu special di mataku?",
        options: ["Cara kamu treat orang sekitar 🤗", "Kamu genuine & nggak pernah fake 💯", "Cara kamu ngerti tanpa aku jelasin 💫", "Ambisi & passion kamu ke goals 🎯"],
        correct: 1
      },
      {
        question: "Kapan aku pertama kali sadar aku suka kamu?",
        options: ["Pas kamu do something sweet tanpa disuruh 😍", "Pas kita ngobrol dalam tentang life 💬", "Pas aku ngerasa paling nyaman sama kamu 💗", "Pas kamu nunjukin support ke aku 🥰", "Dari dulu kali, cuma baru sadar aja 🤡💕"],
        correct: 4
      },
      {
        question: "Apa yang paling aku appreciate dari kamu?",
        options: ["Kamu selalu honest sama aku 💙", "Kamu supportive di semua hal 🤝", "Cara kamu effort buat aku 🌟", "Kamu ngerti boundaries & respect aku 💚"],
        correct: 1
      },
      {
        question: "Kenapa aku pilih kamu?",
        options: ["Vibe kita yang instantly click 🏆", "Kamu bikin aku jadi versi terbaik 💖", "Chemistry kita yang undeniable 😊", "Kamu get my weird side 💙"],
        correct: 1
      },
      {
        question: "Apa mimpi aku buat kita berdua?",
        options: ["Grow bareng jadi orang sukses 💕", "Grow together sambil tetep fun 🌱", "Build something meaningful bareng 💼", "Travel the world bareng someday ✈️"],
        correct: 1
      }
    ];

    let quizQuestions = [];
    let quizCurrentQuestion = 0;
    let quizScore = 0;
    let quizAnswered = false;
    let quizHighScores = JSON.parse(localStorage.getItem('quizHighScores')) || [];
    let quizStreak = 0;

    const quizContainer = document.getElementById('quizContainer');
    const quizProgress = document.getElementById('quizProgress');
    const quizCurrent = document.getElementById('quizCurrent');
    const quizTotal = document.getElementById('quizTotal');
    const quizQuestion = document.getElementById('quizQuestion');
    const quizOptions = document.getElementById('quizOptions');
    const quizResult = document.getElementById('quizResult');
    const quizResultTitle = document.getElementById('quizResultTitle');
    const quizResultMessage = document.getElementById('quizResultMessage');
    const quizScoreDisplay = document.getElementById('quizScoreDisplay');

    function startQuiz() {
      if (!quizQuestion || !quizOptions) return;
      
      // Select random 5 questions from all questions
      quizQuestions = [...quizAllQuestions]
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);
      
      quizCurrentQuestion = 0;
      quizScore = 0;
      quizAnswered = false;
      quizStreak = 0;
      
      if (quizTotal) quizTotal.textContent = quizQuestions.length;
      showQuizQuestion();
    }

    function showQuizQuestion() {
      if (!quizQuestion || !quizOptions) return;
      
      if (quizCurrentQuestion >= quizQuestions.length) {
        showQuizResult();
        return;
      }
      
      if (quizResult) quizResult.style.display = 'none';
      const q = quizQuestions[quizCurrentQuestion];
      
      if (quizCurrent) quizCurrent.textContent = quizCurrentQuestion + 1;
      quizQuestion.textContent = q.question;
      
      quizOptions.innerHTML = '';
      q.options.forEach((option, index) => {
        const optionEl = document.createElement('div');
        optionEl.className = 'quiz-option';
        optionEl.textContent = option;
        optionEl.addEventListener('click', () => selectQuizAnswer(index));
        quizOptions.appendChild(optionEl);
      });
      
      quizAnswered = false;
    }

    function selectQuizAnswer(selectedIndex) {
      if (quizAnswered) return;
      
      quizAnswered = true;
      const q = quizQuestions[quizCurrentQuestion];
      const options = quizOptions.querySelectorAll('.quiz-option');
      
      options.forEach((opt, idx) => {
        opt.classList.add('disabled');
        if (idx === q.correct) {
          opt.classList.add('correct');
        }
        if (idx === selectedIndex && idx !== q.correct) {
          opt.classList.add('wrong');
        }
      });
      
      if (selectedIndex === q.correct) {
        quizScore++;
        quizStreak++;
        let message = '✅ Benar! Kamu kenal aku banget! 💕';
        if (quizStreak >= 3) {
          message = `🔥 ${quizStreak}x STREAK! Amazing! ✨`;
        }
        showNotification(message);
      } else {
        quizStreak = 0;
        showNotification('❌ Hmm, belum tepat. Belajar lagi ya! 😊');
      }
      
      setTimeout(() => {
        quizCurrentQuestion++;
        showQuizQuestion();
      }, 2000);
    }

    function showQuizResult() {
      if (!quizQuestion || !quizOptions || !quizResult) return;
      
      quizQuestion.style.display = 'none';
      quizOptions.style.display = 'none';
      if (quizProgress) quizProgress.style.display = 'none';
      quizResult.style.display = 'block';
      
      // Save high score
      const percentage = Math.round((quizScore / quizQuestions.length) * 100);
      quizHighScores.push({ score: quizScore, total: quizQuestions.length, percentage, date: new Date().toLocaleDateString() });
      quizHighScores.sort((a, b) => b.percentage - a.percentage);
      quizHighScores = quizHighScores.slice(0, 5); // Keep top 5
      localStorage.setItem('quizHighScores', JSON.stringify(quizHighScores));
      
      if (quizScoreDisplay) quizScoreDisplay.textContent = `${quizScore}/${quizQuestions.length} (${percentage}%)`;
      
      let rank = '';
      if (percentage === 100) {
        if (quizResultTitle) quizResultTitle.textContent = '🏆 PERFECT SCORE!';
        if (quizResultMessage) quizResultMessage.innerHTML = `Kamu kenal aku banget! Kita emang soulmate! 💕✨<br><small>Top Score: ${quizHighScores[0].percentage}%</small>`;
        createMassiveConfetti();
        rank = 'Soulmate 💕';
      } else if (quizScore >= 4) {
        if (quizResultTitle) quizResultTitle.textContent = '⭐ Hebat!';
        if (quizResultMessage) quizResultMessage.innerHTML = `Kamu udah kenal aku dengan baik! Makin sayang deh! 💖<br><small>Top Score: ${quizHighScores[0].percentage}%</small>`;
        createConfetti();
        rank = 'Sweet Heart ❤️';
      } else if (quizScore >= 3) {
        if (quizResultTitle) quizResultTitle.textContent = '👍 Lumayan!';
        if (quizResultMessage) quizResultMessage.innerHTML = `Kita masih belajar kenal satu sama lain ya! 😊<br><small>Top Score: ${quizHighScores[0].percentage}%</small>`;
        rank = 'Getting There 💫';
      } else {
        if (quizResultTitle) quizResultTitle.textContent = '💪 Keep Learning!';
        if (quizResultMessage) quizResultMessage.innerHTML = `Gapapa, kita masih punya banyak waktu buat kenal lebih dalam! 💕<br><small>Top Score: ${quizHighScores[0].percentage}%</small>`;
        rank = 'Newbie 🌱';
      }
      
      showNotification(`Quiz selesai! Rank: ${rank} 🎉`);
    }

    function resetQuiz() {
      if (!quizQuestion || !quizOptions || !quizResult) return;
      
      quizQuestion.style.display = 'flex';
      quizOptions.style.display = 'grid';
      if (quizProgress) quizProgress.style.display = 'block';
      quizResult.style.display = 'none';
      startQuiz();
    }

    // ============ TRUTH OR DARE GAME ============
    const truthQuestions = [
      "Apa hal paling romantis yang pernah kamu bayangkan kita lakukan bareng?",
      "Kapan pertama kali kamu sadar kamu suka sama aku?",
      "Apa yang paling kamu suka dari relationship kita?",
      "Cerita satu hal tentang aku yang bikin kamu jatuh cinta",
      "Apa yang kamu harapkan untuk kita 5 tahun ke depan?",
      "Hal apa yang paling bikin kamu kangen sama aku?",
      "Apa momen paling berkesan kita berdua?",
      "Cerita tentang mimpi yang melibatkan aku",
      "Apa yang pertama kali kamu notice dari aku?",
      "Kalau bisa ngulang satu momen bareng aku, momen apa?",
      "Apa lagu yang mengingatkan kamu sama aku?",
      "Hal apa yang pengen kamu bilang ke aku tapi belum?",
      "Apa nickname favorit kamu buat aku?",
      "Kapan kamu merasa paling dekat sama aku?",
      "Apa yang bikin kamu yakin aku orangnya?",
      "Cerita satu secret yang cuma kamu dan aku yang tau",
      "Apa date impian kamu sama aku?",
      "Hal apa tentang aku yang bikin kamu tersenyum?",
      "Apa yang paling kamu appreciate dari aku?",
      "Kalau bisa, kamu mau ngubah apa dari relationship kita?",
      "Cerita momen ketika kamu proud sama aku",
      "Apa kebiasaan aku yang paling kamu suka?",
      "Kapan terakhir kali kamu ngerasa super happy karena aku?",
      "Apa hal termanis yang pernah aku lakukan menurutmu?",
      "Cerita satu sifat aku yang bikin kamu kagum",
      "Apa yang kamu suka dari cara aku ngomong?",
      "Kapan kamu ngerasa paling nyaman sama aku?",
      "Apa gift terbaik yang pernah kamu dapet dari aku?",
      "Cerita tentang hal kecil yang aku lakukan yang kamu remember",
      "Apa yang bikin kamu yakin kita cocok?",
      "Kalau ada 3 wish buat relationship kita, apa aja?",
      "Apa yang paling kamu suka dari personality aku?",
      "Cerita momen kita yang bikin kamu ketawa paling keras",
      "Apa yang kamu pelajari dari relationship sama aku?",
      "Hal apa yang pengen kamu lakuin bareng aku?",
      "Apa quotes atau kata-kata yang menggambarkan perasaanmu ke aku?",
      "Cerita satu hal random tentang aku yang kamu inget",
      "Apa yang bikin aku beda dari orang lain di hidupmu?",
      "Kapan kamu ngerasa 'this is it, this is my person'?",
      "Apa arti aku dalam hidupmu sekarang?"
    ];

    const dareChallenges = [
      "Kirim voice note bilang 'I love you' dengan 3 bahasa berbeda!",
      "Screenshot chat favorit kita dan explain kenapa!",
      "Bikin playlist 5 lagu yang menggambarkan perasaan kamu",
      "Tulis puisi pendek (4 baris) tentang kita",
      "Kirim foto kamu lagi senyum sekarang!",
      "Cerita joke paling garing kamu ke aku",
      "Dance challenge! Record dan kirim ke aku",
      "Gambar potret aku (stick figure juga boleh) dan kirim!",
      "Nyanyi lagu romantis 30 detik dan record",
      "Bikin video bilang 3 hal yang kamu suka dari aku",
      "Share satu hal embarrassing yang pernah kamu alami",
      "Pose romantic dan kirim fotonya!",
      "Buat caption Instagram tentang kita (sweet caption!)",
      "Tirukan suara aku sebaik mungkin dan record",
      "Kirim selfie dengan ekspresi paling romantic",
      "Text 'Good morning sayang' dalam 5 bahasa",
      "Bikin daftar 10 alasan kenapa kamu sayang sama aku",
      "Record kamu bilang 'Kamu yang terbaik!' 5x",
      "Kirim meme couple yang relate sama kita",
      "Compliment aku dengan cara paling kreatif!",
      "Bikin TikTok/Reels couple challenge dan tag aku",
      "Tulis surat cinta singkat dengan tulisan tangan",
      "Kirim foto makanan favorit kamu dan bilang 'tapi kamu lebih sweet'",
      "Record kamu nyanyi lagu favorit kita",
      "Bikin video editan foto kita berdua (simple aja)",
      "Kirim 10 emoji yang menggambarkan perasaanmu ke aku",
      "Screenshot lockscreen HP kamu dan kirim",
      "Bikin status romantis tentang aku di sosmed",
      "Record kamu bilang compliment dalam bahasa Inggris",
      "Kirim foto childhood kamu dan ceritain kenangan lucu",
      "Bikin acrostic poem dari namaku",
      "Voice note kamu cerita kenapa kamu sayang aku (1 menit)",
      "Kirim playlist workout/study kamu buat aku",
      "Screenshot profile sosmed kamu yang ada fotonya aku",
      "Bikin video 'a day in my life missing you'",
      "Kirim quote romantis favorit kamu",
      "Record kamu nge-rap tentang kita (freestyle!)",
      "Bikin collage dari 9 foto kenangan kita",
      "Kirim voice note kamu ketawa selama 10 detik (genuine!)",
      "Text 'Aku cinta kamu' dengan emoji yang creative"
    ];

    let todCompleted = 0;
    let todSkipped = 0;

    function selectTruthOrDare(type) {
      const choiceScreen = document.getElementById('todChoiceScreen');
      const resultScreen = document.getElementById('todResultScreen');
      const typeBadge = document.getElementById('todTypeBadge');
      const challenge = document.getElementById('todChallenge');
      
      choiceScreen.style.display = 'none';
      resultScreen.style.display = 'block';
      
      let selectedChallenge;
      if (type === 'truth') {
        selectedChallenge = truthQuestions[Math.floor(Math.random() * truthQuestions.length)];
        typeBadge.textContent = '💬 TRUTH';
        typeBadge.className = 'tod-type-badge truth';
      } else {
        selectedChallenge = dareChallenges[Math.floor(Math.random() * dareChallenges.length)];
        typeBadge.textContent = '⚡ DARE';
        typeBadge.className = 'tod-type-badge dare';
      }
      
      challenge.textContent = selectedChallenge;
    }

    function completeTod() {
      todCompleted++;
      document.getElementById('todCompleted').textContent = todCompleted;
      showNotification('🎉 Great job! Challenge completed!');
      createConfetti();
      backToTodChoice();
    }

    function skipTod() {
      todSkipped++;
      document.getElementById('todSkipped').textContent = todSkipped;
      showNotification('⏭️ Skipped! Try the next one!');
      backToTodChoice();
    }

    function backToTodChoice() {
      document.getElementById('todChoiceScreen').style.display = 'block';
      document.getElementById('todResultScreen').style.display = 'none';
    }

    // ============ SPIN THE WHEEL GAME ============
    const wheelOptions = [
      { text: "Kirim voice note manis 💌", color: "#FF6B9D" },
      { text: "Share playlist lagu 🎵", color: "#9B7DFF" },
      { text: "Video call 5 menit 📱", color: "#FF6B9D" },
      { text: "Kirim 3 foto tersenyum 😊", color: "#9B7DFF" },
      { text: "Cerita momen favorit 💭", color: "#FF6B9D" },
      { text: "Compliment challenge 💖", color: "#9B7DFF" },
      { text: "Dance video 30 detik 💃", color: "#FF6B9D" },
      { text: "Nyanyi lagu romantis 🎤", color: "#9B7DFF" },
      { text: "Bikin poem 4 baris ✍️", color: "#FF6B9D" },
      { text: "Screenshot chat sweet 💬", color: "#9B7DFF" },
      { text: "Gambar portrait aku 🎨", color: "#FF6B9D" },
      { text: "List 10 hal manis 📝", color: "#9B7DFF" },
      { text: "Kirim childhood photo 👶", color: "#FF6B9D" },
      { text: "Voice note 1 menit ❤️", color: "#9B7DFF" },
      { text: "Selfie dengan pose lucu 🤪", color: "#FF6B9D" },
      { text: "Share meme couple 😂", color: "#9B7DFF" },
      { text: "Bikin status romantis 💕", color: "#FF6B9D" },
      { text: "Record joke garing 🥴", color: "#9B7DFF" },
      { text: "Kirim lockscreen kamu 📱", color: "#FF6B9D" },
      { text: "3 alasan sayang aku 💗", color: "#9B7DFF" },
      { text: "Tiru suara aku 🗣️", color: "#FF6B9D" },
      { text: "Quote romantis favorit 📖", color: "#9B7DFF" },
      { text: "Video mukbang bareng 🍜", color: "#FF6B9D" },
      { text: "Kirim good morning 5 bahasa 🌍", color: "#9B7DFF" }
    ];

    let wheelSpinCount = {};
    let wheelSpinning = false;
    let wheelCanvas, wheelCtx;
    let wheelAngle = 0;

    function initWheel() {
      wheelCanvas = document.getElementById('wheelCanvas');
      if (!wheelCanvas) return;
      
      wheelCtx = wheelCanvas.getContext('2d');
      wheelOptions.forEach(opt => {
        if (!wheelSpinCount[opt.text]) wheelSpinCount[opt.text] = 0;
      });
      
      drawWheel();
      updateWheelStats();
    }

    function drawWheel() {
      if (!wheelCtx || !wheelCanvas) return;
      
      const centerX = wheelCanvas.width / 2;
      const centerY = wheelCanvas.height / 2;
      const radius = 180;
      const sliceAngle = (2 * Math.PI) / wheelOptions.length;
      
      wheelCtx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
      
      wheelOptions.forEach((option, i) => {
        const startAngle = wheelAngle + i * sliceAngle;
        const endAngle = startAngle + sliceAngle;
        
        // Draw slice
        wheelCtx.beginPath();
        wheelCtx.arc(centerX, centerY, radius, startAngle, endAngle);
        wheelCtx.lineTo(centerX, centerY);
        wheelCtx.fillStyle = option.color;
        wheelCtx.fill();
        wheelCtx.strokeStyle = '#fff';
        wheelCtx.lineWidth = 2;
        wheelCtx.stroke();
        
        // Draw text
        wheelCtx.save();
        wheelCtx.translate(centerX, centerY);
        wheelCtx.rotate(startAngle + sliceAngle / 2);
        wheelCtx.textAlign = 'center';
        wheelCtx.fillStyle = '#fff';
        wheelCtx.font = 'bold 12px Arial';
        wheelCtx.fillText(option.text, radius / 1.5, 0);
        wheelCtx.restore();
      });
      
      // Draw pointer
      wheelCtx.beginPath();
      wheelCtx.moveTo(centerX, 20);
      wheelCtx.lineTo(centerX - 15, 0);
      wheelCtx.lineTo(centerX + 15, 0);
      wheelCtx.closePath();
      wheelCtx.fillStyle = '#FFD93D';
      wheelCtx.fill();
      wheelCtx.strokeStyle = '#333';
      wheelCtx.lineWidth = 2;
      wheelCtx.stroke();
    }

    function spinWheel() {
      if (wheelSpinning) return;
      
      wheelSpinning = true;
      document.getElementById('wheelSpinBtn').disabled = true;
      document.getElementById('wheelResult').textContent = 'Spinning... 🎡';
      
      const spinDuration = 3000;
      const spinRotations = 5 + Math.random() * 3;
      const finalAngle = spinRotations * 2 * Math.PI + Math.random() * 2 * Math.PI;
      const startTime = Date.now();
      
      function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        wheelAngle = finalAngle * easeOut;
        drawWheel();
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          wheelSpinning = false;
          document.getElementById('wheelSpinBtn').disabled = false;
          determineWinner();
        }
      }
      
      animate();
    }

    function determineWinner() {
      const normalizedAngle = (2 * Math.PI - (wheelAngle % (2 * Math.PI))) % (2 * Math.PI);
      const sliceAngle = (2 * Math.PI) / wheelOptions.length;
      const winningIndex = Math.floor(normalizedAngle / sliceAngle);
      const winner = wheelOptions[winningIndex];
      
      wheelSpinCount[winner.text]++;
      
      document.getElementById('wheelResult').innerHTML = `
        <div style="font-size: 28px; margin-bottom: 10px;">🎉</div>
        <div>${winner.text}</div>
      `;
      
      updateWheelStats();
      showNotification(`🎡 ${winner.text}`);
      createConfetti();
    }

    function updateWheelStats() {
      const statsDisplay = document.getElementById('wheelStatsDisplay');
      if (!statsDisplay) return;
      
      statsDisplay.innerHTML = '';
      
      // Filter: cuma tampilkan yang udah pernah didapet (count > 0)
      const unlockedChallenges = wheelOptions.filter(opt => wheelSpinCount[opt.text] > 0);
      
      if (unlockedChallenges.length === 0) {
        statsDisplay.innerHTML = '<div style="text-align: center; opacity: 0.6; padding: 20px;">Spin the wheel to unlock challenges! 🎡</div>';
        return;
      }
      
      unlockedChallenges.forEach(opt => {
        const div = document.createElement('div');
        div.className = 'wheel-stat-item';
        div.innerHTML = `<div style="font-size: 12px; opacity: 0.8;">${opt.text}</div><div style="font-size: 18px; font-weight: bold;">${wheelSpinCount[opt.text]}x</div>`;
        statsDisplay.appendChild(div);
      });
      
      // Tambah info berapa yang udah didapet
      const totalUnlocked = unlockedChallenges.length;
      const totalChallenges = wheelOptions.length;
      const infoDiv = document.createElement('div');
      infoDiv.style.cssText = 'text-align: center; margin-top: 15px; opacity: 0.7; font-size: 13px;';
      infoDiv.textContent = `🏆 Unlocked: ${totalUnlocked}/${totalChallenges} challenges`;
      statsDisplay.appendChild(infoDiv);
    }

    function resetWheelStats() {
      wheelOptions.forEach(opt => {
        wheelSpinCount[opt.text] = 0;
      });
      updateWheelStats();
      document.getElementById('wheelResult').textContent = 'Stats reset! Spin the wheel! 🎡';
      showNotification('📊 Statistics reset!');
    }

    // Auto-init wheel when section opens
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        if (document.getElementById('wheelCanvas')) {
          initWheel();
        }
      }, 500);
    });

    // ============ INITIALIZATION ============
    createParticles();
    createStars();
    createBgHearts();

    // Enable audio after first user interaction (untuk bypass autoplay restriction)
    const enableAudioOnInteraction = () => {
      initAudio();
      // Remove listener after first interaction
      document.removeEventListener('click', enableAudioOnInteraction);
      document.removeEventListener('touchstart', enableAudioOnInteraction);
    };
    document.addEventListener('click', enableAudioOnInteraction);
    document.addEventListener('touchstart', enableAudioOnInteraction);

    console.log('%c✨ OUR JOURNEY TOGETHER! ✨', 'color: #ff6b6b; font-size: 20px; font-weight: bold;');
    console.log('%cEaster eggs:', 'color: #7aa2ff; font-size: 14px;');
    console.log('1. 🖱️ Klik judul 5x');
    console.log('2. 🖱️ Klik sesuai hari bersama untuk surprise!');
    console.log('3. 🖱️ Klik 50x untuk cursor trail');
    console.log('4. 🖱️ Klik 100x untuk rainbow mode (klik 100x lagi untuk off)');
    console.log('5. ⌨️ Konami code: ↑↑↓↓←→←→BA');
    console.log('6. 📱 Double tap anywhere');
    console.log('7. 📊 Click stats untuk surprise');
    console.log('8. 🖼️ Click gallery items');
    console.log('9. 🖱️ Triple click anywhere');
    console.log('10. 📳 Shake device (mobile)');
    console.log('11. ⌨️ Type: iloveyou, sayang, journey, forever, kiss, hug');
    console.log('12. 🖱️ Long press on title (2 detik)');
    console.log('13. 📜 Scroll banyak-banyak');
    console.log('14. 🎯 Click stats urut: Days → Memories → Love');
    console.log('15. 🖱️ Hover subtitle 3x');
    console.log('16. 🖱️ Double click tanggal');
    console.log('17. ⚡ Klik 10x dalam 1 detik');
    console.log('18. 🕛 Auto-greeting based on time');
    console.log('19. 🌟 Random surprise tiap 5 menit');
    console.log('20. 💌 Surat Terakhir dengan password di menu Penutup');
    console.log('%c⌨️ SHORTCUT: Tekan ESC untuk toggle Rainbow Mode ON/OFF', 'color: #ffd93d; font-weight: bold;');
    console.log('%c💌 SPECIAL: Cari Surat Terakhir di menu Penutup - butuh kata kunci!', 'color: #ff6b9d; font-weight: bold;');
    console.log('%cDibuat dengan ❤️ untuk perjalanan kita bersama', 'color: #9b7dff; font-style: italic;');


  </script>

<!-- ========================================== -->
<!-- 🔥 FIREBASE INTEGRATION -->
<!-- ========================================== -->

<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-check-compat.js"></script>

<script>
  // ============================================
  // 1️⃣ FIREBASE CONFIGURATION
  // ============================================
