/**
 * 게임 UI 클래스
 * 게임의 모든 UI 요소를 관리합니다.
 */
class GameUI {
    /**
     * UI 생성자
     * @param {Game} game - 게임 인스턴스
     */
    constructor(game) {
        this.game = game;

        // UI 요소
        this.speedometer = document.querySelector('.speed-value');
        this.lapInfo = document.querySelector('.current-lap');
        this.lapTime = document.querySelector('.lap-time');
        this.bestLap = document.querySelector('.best-lap');
        this.ghostInfo = document.getElementById('ghost-info');

        // 메뉴 요소
        this.menu = document.getElementById('menu');
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over');
        this.finalTimeDisplay = document.getElementById('final-time');
        this.aiAnalysisDisplay = document.getElementById('ai-analysis');

        // 버튼 - 기존 메뉴
        this.startButton = document.getElementById('start-game');
        this.ghostButton = document.getElementById('toggle-ghost');
        this.aiButton = document.getElementById('toggle-ai');
        this.restartButton = document.getElementById('restart-game');
        this.menuButton = document.getElementById('back-to-menu');

        // 새로운 시작 화면 버튼
        this.playButton = document.getElementById('play-button');
        this.ghostModeButton = document.getElementById('ghost-mode-button');
        this.aiRaceButton = document.getElementById('ai-race-button');
        this.optionsButton = document.getElementById('options-button');
        this.howToPlayButton = document.getElementById('how-to-play-button');
        this.musicToggleButton = document.getElementById('music-toggle');
        this.soundToggleButton = document.getElementById('sound-toggle');
        this.moreGamesButton = document.getElementById('more-games-button'); // 이 버튼은 HTML에 없을 수 있음

        // UI 상태
        this.ghostEnabled = false;
        this.aiEnabled = false;
        this.musicEnabled = true;
        this.soundEnabled = true;

        // UI 초기화
        this.initUI();
    }

    /**
     * UI 초기화
     */
    initUI() {
        // 새로운 시작 화면 버튼 이벤트 리스너
        this.playButton.addEventListener('click', () => {
            // 일반 모드 - 고스트와 AI 모두 비활성화
            this.ghostEnabled = false;
            this.aiEnabled = false;
            this.game.startRace();

            // UI 사운드 재생
            if (window.gameAudio) {
                window.gameAudio.playUISound('G4');
            }
        });
        
        // 고스트 모드 버튼 이벤트 리스너
        if (this.ghostModeButton) {
            this.ghostModeButton.addEventListener('click', () => {
                try {
                    // 고스트 모드 활성화, AI 비활성화
                    this.ghostEnabled = true;
                    this.aiEnabled = false;
                    
                    // 고스트 데이터 확인 (window 객체에서 직접 함수 참조)
                    const ghostData = typeof window.loadFromStorage === 'function' ? 
                        window.loadFromStorage('ghostData') : null;
                    if (!ghostData) {
                        alert('고스트 데이터가 없습니다. 먼저 일반 모드로 한 번 플레이해주세요.');
                        return;
                    }
                    
                    this.game.startRace();
                    
                    // UI 사운드 재생
                    if (window.gameAudio) {
                        window.gameAudio.playUISound('E4');
                    }
                } catch (error) {
                    console.error("Error in ghost mode button click:", error);
                    alert('고스트 모드 시작 중 오류가 발생했습니다.');
                }
            });
        }
        
        // AI 경쟁 모드 버튼 이벤트 리스너
        if (this.aiRaceButton) {
            this.aiRaceButton.addEventListener('click', () => {
                // AI 모드 활성화, 고스트 비활성화
                this.ghostEnabled = false;
                this.aiEnabled = true;
                this.game.startRace();
                
                // UI 사운드 재생
                if (window.gameAudio) {
                    window.gameAudio.playUISound('A4');
                }
            });
        }

        this.optionsButton.addEventListener('click', () => {
            // 옵션 화면 표시 (간단한 알림으로 대체)
            alert('옵션 기능은 개발 중입니다.');
            
            // UI 사운드 재생
            if (window.gameAudio) {
                window.gameAudio.playUISound('E4');
            }
        });

        this.howToPlayButton.addEventListener('click', () => {
            // 게임 방법 표시 (간단한 알림으로 대체)
            alert('방향키 또는 WASD로 차량을 조작하세요. 스페이스바로 가속할 수 있습니다.');
            
            // UI 사운드 재생
            if (window.gameAudio) {
                window.gameAudio.playUISound('A4');
            }
        });

        // 더 많은 게임 버튼이 있는 경우에만 이벤트 리스너 추가
        if (this.moreGamesButton) {
            this.moreGamesButton.addEventListener('click', () => {
                // 더 많은 게임 링크 (간단한 알림으로 대체)
                alert('더 많은 게임은 준비 중입니다.');
                
                // UI 사운드 재생
                if (window.gameAudio) {
                    window.gameAudio.playUISound('C4');
                }
            });
        }

        this.musicToggleButton.addEventListener('click', () => {
            this.musicEnabled = !this.musicEnabled;
            this.updateSoundButtons();
            
            // 음악 토글
            if (window.gameAudio) {
                window.gameAudio.toggleMusic(this.musicEnabled);
                window.gameAudio.playUISound('C5');
            }
        });

        this.soundToggleButton.addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            this.updateSoundButtons();
            
            // 효과음 토글
            if (window.gameAudio) {
                window.gameAudio.toggleSound(this.soundEnabled);
                window.gameAudio.playUISound('E5');
            }
        });

        // 기존 메뉴 버튼 이벤트 리스너
        this.startButton.addEventListener('click', () => {
            this.hideMenu();
            this.game.startRace();

            // UI 사운드 재생
            if (window.gameAudio) {
                window.gameAudio.playUISound('G4');
            }
        });

        this.ghostButton.addEventListener('click', () => {
            this.ghostEnabled = !this.ghostEnabled;
            this.ghostButton.textContent = this.ghostEnabled ? '고스트 모드 끄기' : '고스트 모드 켜기';

            // UI 사운드 재생
            if (window.gameAudio) {
                window.gameAudio.playUISound('E4');
            }
        });

        this.aiButton.addEventListener('click', () => {
            this.aiEnabled = !this.aiEnabled;
            this.aiButton.textContent = this.aiEnabled ? '솔로 레이스' : 'AI 상대와 경주';

            // UI 사운드 재생
            if (window.gameAudio) {
                window.gameAudio.playUISound('A4');
            }
        });

        this.restartButton.addEventListener('click', () => {
            this.hideGameOver();
            this.game.startRace();

            // UI 사운드 재생
            if (window.gameAudio) {
                window.gameAudio.playUISound('G4');
            }
        });

        this.menuButton.addEventListener('click', () => {
            this.hideGameOver();
            this.showStartScreen();

            // UI 사운드 재생
            if (window.gameAudio) {
                window.gameAudio.playUISound('C4');
            }
        });

        // 레이스 완료 이벤트 리스너
        document.addEventListener('raceComplete', (event) => {
            this.showGameOver(event.detail);
        });

        // 저장된 고스트 데이터 확인
        try {
            const ghostData = typeof window.loadFromStorage === 'function' ? 
                window.loadFromStorage('ghostData') : null;
            if (!ghostData) {
                this.ghostButton.disabled = true;
                this.ghostButton.textContent = '고스트 데이터 없음';
            }
        } catch (error) {
            console.error("Error checking ghost data:", error);
            this.ghostButton.disabled = true;
            this.ghostButton.textContent = '고스트 데이터 오류';
        }
        
        // 사운드 버튼 초기 상태 설정
        this.updateSoundButtons();
    }
    
    /**
     * 사운드 버튼 업데이트
     */
    updateSoundButtons() {
        // 음악 버튼 아이콘 업데이트
        if (this.musicEnabled) {
            this.musicToggleButton.innerHTML = '<i class="fas fa-music"></i>';
        } else {
            this.musicToggleButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
        }
        
        // 효과음 버튼 아이콘 업데이트
        if (this.soundEnabled) {
            this.soundToggleButton.innerHTML = '<i class="fas fa-volume-up"></i>';
        } else {
            this.soundToggleButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
        }
    }

    /**
     * UI 업데이트
     */
    update() {
        if (!this.game.player) return;

        // 속도계 업데이트
        if (this.speedometer) {
            this.speedometer.textContent = this.game.player.getSpeed();
        }

        // 랩 정보 업데이트
        if (this.lapInfo) {
            this.lapInfo.textContent = `랩: ${this.game.player.lap}/${this.game.player.totalLaps}`;
        }

        // 랩 타임 업데이트
        if (this.lapTime) {
            const currentLapTime = this.game.player.getCurrentLapTime();
            this.lapTime.textContent = `시간: ${formatTime(currentLapTime)}`;
        }

        // 최고 랩 타임 업데이트
        if (this.bestLap) {
            if (this.game.player.bestLapTime < Infinity) {
                this.bestLap.textContent = `최고기록: ${formatTime(this.game.player.bestLapTime)}`;
            } else {
                this.bestLap.textContent = '최고기록: --:--:---';
            }
        }

        // 고스트 정보 업데이트
        if (this.ghostInfo) {
            if (this.game.ghost) {
                this.ghostInfo.classList.remove('hidden');
            } else {
                this.ghostInfo.classList.add('hidden');
            }
        }
    }

    /**
     * 메뉴 표시
     */
    showMenu() {
        this.menu.classList.add('active');
        this.menu.classList.remove('hidden');

        // 입장 애니메이션 추가
        gsap.fromTo(this.menu,
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out' }
        );
    }

    /**
     * 메뉴 숨기기
     */
    hideMenu() {
        // 퇴장 애니메이션 추가
        gsap.to(this.menu, {
            scale: 1.1,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                this.menu.classList.remove('active');
                this.menu.classList.add('hidden');
            }
        });
    }

    /**
     * 게임 오버 화면 표시
     * @param {Object} raceStats - 레이스 통계
     */
    showGameOver(raceStats) {
        this.gameOverScreen.classList.remove('hidden');

        // 최종 시간 설정
        this.finalTimeDisplay.textContent = `총 시간: ${formatTime(raceStats.totalTime)}`;
        this.finalTimeDisplay.textContent += `\n최고 랩 타임: ${formatTime(raceStats.bestLapTime)}`;

        // AI 분석 생성
        this.generateAIAnalysis(raceStats);

        // 입장 애니메이션 추가
        gsap.fromTo(this.gameOverScreen,
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out' }
        );
    }

    /**
     * 게임 오버 화면 숨기기
     */
    hideGameOver() {
        // 퇴장 애니메이션 추가
        gsap.to(this.gameOverScreen, {
            scale: 1.1,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                this.gameOverScreen.classList.add('hidden');
            }
        });
    }

    /**
     * AI 분석 생성
     * @param {Object} raceStats - 레이스 통계
     */
    generateAIAnalysis(raceStats) {
        // 플레이어 성능에 대한 간단한 AI 분석 생성
        let analysis = '';

        try {
            // 고스트와 비교 (가능한 경우)
            const ghostData = typeof window.loadFromStorage === 'function' ? 
                window.loadFromStorage('ghostData') : null;
                
            if (ghostData && ghostData.bestLapTime) {
                const timeDiff = raceStats.bestLapTime - ghostData.bestLapTime;

                if (timeDiff < 0) {
                    analysis += `이전 최고 기록보다 ${formatTime(Math.abs(timeDiff))} 빨라졌습니다! `;
                    analysis += '훌륭한 발전입니다! ';
                } else if (timeDiff > 0) {
                    analysis += `이전 최고 기록보다 ${formatTime(timeDiff)} 느렸습니다. `;
                    analysis += '계속 연습하세요! ';
                } else {
                    analysis += '최고 기록과 정확히 같은 시간입니다! ';
                }
            }
        } catch (error) {
            console.error("Error comparing with ghost data:", error);
            analysis += '기록 비교 중 오류가 발생했습니다. ';
        }

        // 랜덤 팁 추가
        const tips = [
            '급커브 전에 미리 브레이크를 밟아보세요.',
            '코너를 빠져나올 때 서서히 가속하면 더 좋은 컨트롤이 가능합니다.',
            '레이싱 라인을 따라 주행하면 최적의 경로로 달릴 수 있습니다.',
            '직선 구간에서는 드리프트를 너무 많이 하지 마세요.',
            '앞을 내다보고 다가오는 커브를 예측하세요.'
        ];

        analysis += tips[Math.floor(Math.random() * tips.length)];

        this.aiAnalysisDisplay.textContent = analysis;
    }

    /**
     * 시작 화면 표시
     */
    showStartScreen() {
        // 게임 UI 숨기기
        this.hideGameUI();
        
        this.startScreen.style.display = 'flex';
        
        // 애니메이션 효과 추가
        gsap.fromTo(this.startScreen,
            { opacity: 0 },
            { opacity: 1, duration: 0.5 }
        );
        
        // 게임 타이틀 애니메이션
        gsap.fromTo('#game-title',
            { y: -50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'back.out' }
        );
        
        // 자동차 이미지 애니메이션
        gsap.fromTo('#car-image',
            { x: -100, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: 'back.out' }
        );
        
        // 메뉴 버튼 애니메이션
        gsap.fromTo('.menu-button',
            { x: 100, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.5, stagger: 0.1, delay: 0.4, ease: 'back.out' }
        );
    }
    
    /**
     * 시작 화면 숨기기
     */
    hideStartScreen() {
        // 애니메이션 효과 추가
        gsap.to(this.startScreen, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                this.startScreen.style.display = 'none';
                
                // 시작 화면이 사라진 후 게임 UI 표시
                this.showGameUI();
            }
        });
    }
    
    /**
     * 게임 UI 표시
     */
    showGameUI() {
        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) {
            uiOverlay.style.display = 'block';
        }
    }
    
    /**
     * 게임 UI 숨기기
     */
    hideGameUI() {
        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) {
            uiOverlay.style.display = 'none';
        }
    }

    /**
     * 카운트다운 표시
     * @param {Function} callback - 카운트다운 완료 후 콜백
     */
    showCountdown(callback) {
        // 카운트다운 오버레이 생성
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.fontSize = '120px';
        overlay.style.fontWeight = 'bold';
        overlay.style.color = '#ffffff';
        overlay.style.textShadow = '0 0 20px rgba(255, 255, 255, 0.7)';
        overlay.style.zIndex = '100';
        overlay.style.backgroundColor = 'transparent';
        overlay.style.pointerEvents = 'none';

        document.getElementById('game-container').appendChild(overlay);
        
        // 기존 검은색 오버레이 제거
        const blackOverlay = document.getElementById('black-overlay');
        if (blackOverlay) {
            blackOverlay.parentNode.removeChild(blackOverlay);
        }

        // 카운트다운 시작
        overlay.textContent = '3';

        // 카운트다운 사운드 재생
        if (window.gameAudio) {
            window.gameAudio.playCountdown();
        }

        setTimeout(() => {
            overlay.textContent = '2';
            gsap.fromTo(overlay, { scale: 1.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5 });
        }, 1000);

        setTimeout(() => {
            overlay.textContent = '1';
            gsap.fromTo(overlay, { scale: 1.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5 });
        }, 2000);

        setTimeout(() => {
            overlay.textContent = '출발!';
            gsap.fromTo(overlay, { scale: 1.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5 });
        }, 3000);

        setTimeout(() => {
            // 카운트다운 오버레이 제거
            gsap.to(overlay, {
                scale: 1.5,
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                    overlay.remove();
                    if (callback) callback();
                }
            });
        }, 4000);
    }
}