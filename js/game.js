class Game {
    constructor() {
        // 전역 오류 핸들러 설정
        window.onerror = (msg, url, line, col, error) => {
            console.error(`Error: ${msg} at ${url}:${line}:${col}`, error);
            return false;
        };
        
        try {
            console.log("Game constructor started");
            this.track = null;
            this.player = null;
            this.ai = null;
            this.ghost = null;
            this.effects = null;
            this.physics = null;
            this.isRunning = false;
            this.controls = { up: false, down: false, left: false, right: false };
            window.game = this;
            
            // 필수 라이브러리 확인
            if (typeof PIXI === 'undefined') {
                console.error("PIXI.js is not loaded!");
                this.showErrorMessage("게임 라이브러리 로드 실패: PIXI.js");
                return;
            }
            
            this.initializePixiApp();
            this.init();
            console.log("Game constructor completed");
        } catch (e) {
            console.error("Critical error in game constructor:", e);
            this.showErrorMessage("게임 초기화 중 오류가 발생했습니다.");
        }
    }
    
    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'absolute';
        errorDiv.style.top = '50%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '20px';
        errorDiv.style.borderRadius = '10px';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.zIndex = '1000';
        errorDiv.innerHTML = `
            <h2>오류 발생</h2>
            <p>${message}</p>
            <p>페이지를 새로고침하거나 나중에 다시 시도해주세요.</p>
            <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 15px; cursor: pointer;">
                새로고침
            </button>
        `;
        document.body.appendChild(errorDiv);
    }

    initializePixiApp() {
        try {
            console.log("Initializing PIXI Application...");
            
            // PIXI가 로드되었는지 확인
            if (typeof PIXI === 'undefined') {
                throw new Error("PIXI is not defined. Library may not be loaded.");
            }
            
            const canvas = document.getElementById('game-canvas');
            if (!canvas) {
                throw new Error("Canvas element not found");
            }
            
            // WebGL 지원 확인
            let type = "WebGL";
            if (!PIXI.utils.isWebGLSupported()) {
                type = "canvas";
                console.warn("WebGL not supported, falling back to Canvas renderer");
            }
            
            // PIXI 렌더러 타입 설정
            PIXI.utils.sayHello(type);
            
            // 더 간단한 설정으로 시작 (Canvas 렌더러 사용)
            const appOptions = {
                width: window.innerWidth,
                height: window.innerHeight,
                backgroundColor: 0x000000,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
                forceCanvas: true, // Canvas 렌더러 강제 사용
                view: canvas
            };
            
            // 기본 설정으로 먼저 시도
            try {
                this.app = new PIXI.Application(appOptions);
                console.log("PIXI Application created with Canvas renderer");
            } catch (pixiError) {
                console.error("Error creating PIXI Application with Canvas renderer:", pixiError);
                
                // 더 간단한 설정으로 다시 시도
                console.log("Trying with minimal PIXI options...");
                this.app = new PIXI.Application({
                    width: window.innerWidth,
                    height: window.innerHeight,
                    forceCanvas: true,
                    view: canvas
                });
            }

            // 캔버스 스타일 설정
            if (this.app && this.app.view) {
                Object.assign(this.app.view.style, {
                    display: 'block', 
                    position: 'absolute', 
                    top: '0', 
                    left: '0', 
                    width: '100%', 
                    height: '100%', 
                    zIndex: '1'
                });
                console.log("PIXI Application initialized successfully");
            } else {
                throw new Error("Failed to create PIXI Application");
            }
        } catch (e) {
            console.error("Failed to initialize PIXI Application:", e);
            this.showErrorMessage("게임 초기화 실패: " + e.message);
            throw e; // 상위 호출자에게 오류 전파
        }
    }

    init() {
        try {
            console.log("Starting game initialization...");
            
            // 초기 오버레이 제거
            const overlay = document.getElementById('initial-black-overlay');
            if (overlay?.parentNode) overlay.parentNode.removeChild(overlay);
            
            // 필수 클래스 확인
            if (typeof Physics !== 'function') {
                console.error("Physics class not available");
                this.showErrorMessage("게임 초기화 실패: Physics 클래스를 찾을 수 없습니다");
                return;
            }
            
            if (typeof Effects !== 'function') {
                console.error("Effects class not available");
                this.showErrorMessage("게임 초기화 실패: Effects 클래스를 찾을 수 없습니다");
                return;
            }
            
            if (typeof Track !== 'function') {
                console.error("Track class not available");
                this.showErrorMessage("게임 초기화 실패: Track 클래스를 찾을 수 없습니다");
                return;
            }
            
            // 물리 엔진 초기화
            try {
                this.physics = new Physics();
                console.log("Physics initialized");
            } catch (physicsError) {
                console.error("Failed to initialize physics:", physicsError);
                this.showErrorMessage("물리 엔진 초기화 실패");
                return;
            }
            
            // 이펙트 초기화
            try {
                this.effects = new Effects(this.app);
                console.log("Effects initialized");
            } catch (effectsError) {
                console.error("Failed to initialize effects:", effectsError);
                // 이펙트는 필수가 아니므로 계속 진행
                this.effects = null;
            }
            
            // 트랙 초기화
            try {
                this.track = new Track(this.app);
                if (this.track.container && this.app.stage) {
                    this.app.stage.addChild(this.track.container);
                    if (this.app.stage.children && this.app.stage.children.length > 0) {
                        this.app.stage.setChildIndex(this.track.container, this.app.stage.children.length - 1);
                    }
                }
                console.log("Track initialized");
            } catch (trackError) {
                console.error("Failed to initialize track:", trackError);
                this.showErrorMessage("트랙 초기화 실패");
                return;
            }
            
            // 오디오 초기화 (선택적)
            try {
                if (typeof GameAudio === 'function') {
                    window.gameAudio = new GameAudio();
                    console.log("Audio initialized");
                } else {
                    console.warn("GameAudio class not available, audio disabled");
                    window.gameAudio = {
                        startEngine: () => {},
                        stopEngine: () => {},
                        startBackgroundMusic: () => {},
                        stopBackgroundMusic: () => {},
                        updateEngineSound: () => {},
                        updateDriftSound: () => {}
                    };
                }
            } catch (audioError) {
                console.warn("Failed to initialize audio:", audioError);
                // 오디오는 필수가 아니므로 계속 진행
            }
            
            // UI 초기화
            try {
                if (typeof GameUI === 'function') {
                    this.ui = new GameUI(this);
                    console.log("UI initialized");
                } else {
                    console.error("GameUI class not available");
                    this.showErrorMessage("UI 초기화 실패");
                    return;
                }
            } catch (uiError) {
                console.error("Failed to initialize UI:", uiError);
                this.showErrorMessage("UI 초기화 실패");
                return;
            }
            
            // 키보드 컨트롤러 초기화
            try {
                if (typeof KeyboardController === 'function') {
                    this.keyboardController = new KeyboardController(this);
                    console.log("Keyboard controller initialized");
                } else {
                    console.warn("KeyboardController class not available");
                    // 키보드 컨트롤러는 필수가 아니므로 계속 진행
                }
            } catch (keyboardError) {
                console.warn("Failed to initialize keyboard controller:", keyboardError);
                // 키보드 컨트롤러는 필수가 아니므로 계속 진행
            }
            
            // 터치 컨트롤 설정
            try {
                this.setupTouchControls();
                console.log("Touch controls initialized");
            } catch (touchError) {
                console.warn("Failed to initialize touch controls:", touchError);
                // 터치 컨트롤은 필수가 아니므로 계속 진행
            }
            
            // 게임 루프 설정
            if (this.app && this.app.ticker) {
                this.app.ticker.add(this.update.bind(this));
                console.log("Game loop initialized");
            } else {
                console.error("PIXI ticker not available");
                this.showErrorMessage("게임 루프 초기화 실패");
                return;
            }
            
            // 이벤트 리스너 설정
            window.addEventListener('resize', this.onResize.bind(this));
            
            // 시작 화면 표시
            if (this.ui && typeof this.ui.showStartScreen === 'function') {
                this.ui.showStartScreen();
            }
            
            console.log("Game initialized successfully");
        } catch (error) {
            console.error("Critical error during game initialization:", error);
            this.showErrorMessage("게임 초기화 중 오류가 발생했습니다: " + error.message);
        }
    }

    setupTouchControls() {
        const touchControls = document.createElement('div');
        touchControls.className = 'touch-controls';
        Object.assign(touchControls.style, {
            position: 'absolute', bottom: '20px', left: '20px', zIndex: '100', display: 'none'
        });

        const createButton = (text, x, y, control) => {
            const button = document.createElement('div');
            button.textContent = text;
            Object.assign(button.style, {
                position: 'absolute', left: `${x}px`, top: `${y}px`, width: '60px', height: '60px',
                backgroundColor: 'rgba(255, 48, 48, 0.5)', border: '2px solid #ff3030', borderRadius: '50%',
                display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', color: '#fff',
                userSelect: 'none'
            });
            button.addEventListener('touchstart', e => { e.preventDefault(); this.controls[control] = true; });
            button.addEventListener('touchend', e => { e.preventDefault(); this.controls[control] = false; });
            return button;
        };

        touchControls.append(
            createButton('↑', 70, 0, 'up'),
            createButton('↓', 70, 140, 'down'),
            createButton('←', 0, 70, 'left'),
            createButton('→', 140, 70, 'right')
        );

        document.getElementById('game-container').appendChild(touchControls);
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            touchControls.style.display = 'block';
        }
    }

    startRace() {
        try {
            // 전역 함수 확인 및 정의 - 게임 시작 전에 필요한 모든 유틸리티 함수 확인
            if (typeof window.loadFromStorage !== 'function') {
                console.log("Defining loadFromStorage function globally");
                window.loadFromStorage = function (key) {
                    try {
                        const data = localStorage.getItem(key);
                        return data ? JSON.parse(data) : null;
                    } catch (e) {
                        console.error('Error loading from localStorage:', e);
                        return null;
                    }
                };
            }

            if (typeof window.saveToStorage !== 'function') {
                console.log("Defining saveToStorage function globally");
                window.saveToStorage = function (key, data) {
                    try {
                        localStorage.setItem(key, JSON.stringify(data));
                        return true;
                    } catch (e) {
                        console.error('Error saving to localStorage:', e);
                        return false;
                    }
                };
            }

            if (typeof window.formatTime !== 'function') {
                console.log("Defining formatTime function globally");
                window.formatTime = function (milliseconds) {
                    if (milliseconds === Infinity) return '--:--.--';

                    const totalSeconds = Math.floor(milliseconds / 1000);
                    const minutes = Math.floor(totalSeconds / 60);
                    const seconds = totalSeconds % 60;
                    const ms = Math.floor((milliseconds % 1000) / 10);

                    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
                };
            }

            this.resetRace();
            this.ui.hideStartScreen();
            this.track.drawTrack();
            this.player = new Car(this.app, this.track);

            this.ui.showCountdown(() => {
                try {
                    this.isRunning = true;
                    this.player.startRace();

                    // 시작 위치에서 충돌 감지 시 위치 조정
                    if (this.track && this.player &&
                        this.track.checkCollision(this.player.x, this.player.y, this.player.collisionRadius)) {
                        const startPos = this.track.getStartPosition();
                        this.player.x = startPos.x;
                        this.player.y = startPos.y;
                        this.player.updatePosition();
                    }

                    if (this.ui.ghostEnabled) {
                        try {
                            // 고스트 생성 전에 필요한 함수가 있는지 확인
                            if (typeof Ghost === 'function') {
                                console.log("Creating ghost car...");
                                this.ghost = new Ghost(this.app, this.track);

                                // 고스트 생성 시도
                                const ghostCreated = this.ghost.create();
                                if (ghostCreated) {
                                    console.log("Ghost car created successfully");
                                    this.ghost.start();
                                } else {
                                    console.log("Failed to create ghost car, no data available");
                                    this.ghost = null;
                                }
                            } else {
                                console.error("Ghost class not available");
                                this.ghost = null;
                            }
                        } catch (e) {
                            console.error("Error creating ghost:", e);
                            this.ghost = null;
                        }
                    }

                    if (this.ui.aiEnabled) {
                        try {
                            console.log("Creating AI opponent...");
                            // AI 차량 생성 (두 번째 매개변수를 true로 설정하여 AI 차량임을 표시)
                            const aiCar = new Car(this.app, this.track, true, 1);

                            // AI 차량 위치 설정 (시작 위치에서 약간 뒤로)
                            const startPos = this.track.getStartPosition();
                            aiCar.x = startPos.x - 20;
                            aiCar.y = startPos.y - 10;
                            aiCar.angle = startPos.rotation;
                            aiCar.updateSpritePosition();

                            // AI 차량 레이스 시작
                            aiCar.startRace();

                            // 파이썬 AI 사용 시도 (오류 발생 시 JavaScript AI로 폴백)
                            let usePythonAI = false;
                            try {
                                if (window.pythonAI && typeof window.pythonAI.setCarAndTrack === 'function') {
                                    console.log("Attempting to use Python AI driver");
                                    window.pythonAI.setCarAndTrack(aiCar, this.track);
                                    usePythonAI = true;
                                }
                            } catch (pyError) {
                                console.error("Python AI initialization error:", pyError);
                                usePythonAI = false;
                            }
                            
                            if (usePythonAI) {
                                console.log("Using Python AI driver");
                                this.ai = {
                                    car: aiCar,
                                    update: (delta) => {
                                        try {
                                            if (window.pythonAI && typeof window.pythonAI.update === 'function') {
                                                window.pythonAI.update(delta);
                                            }
                                        } catch (updateErr) {
                                            console.error("Python AI update error, switching to JS AI:", updateErr);
                                            // 오류 발생 시 JavaScript AI로 전환
                                            this.ai = new AIDriver(aiCar, this.track);
                                        }
                                    }
                                };
                            } else {
                                console.log("Using JavaScript AI driver");
                                // JavaScript AI 드라이버 생성
                                this.ai = new AIDriver(aiCar, this.track);
                            }

                            console.log("AI opponent created successfully");
                        } catch (e) {
                            console.error("Error creating AI:", e);
                            this.ai = null;
                        }
                    }

                    if (window.gameAudio) {
                        try {
                            window.gameAudio.startEngine();
                            window.gameAudio.startBackgroundMusic();
                        } catch (e) { console.error("Error starting audio:", e); }
                    }

                    window.gameRunning = true;
                    console.log("Race started successfully");
                } catch (e) {
                    console.error("Error starting race:", e);
                    this.resetRace();
                    alert("게임 시작 중 오류가 발생했습니다. 페이지를 새로고침하고 다시 시도해주세요.");
                }
            });
        } catch (e) {
            console.error("Critical error in startRace:", e);
            alert("게임 시작 중 오류가 발생했습니다. 페이지를 새로고침하고 다시 시도해주세요.");
        }
    }

    resetRace() {
        if (this.player) { this.player.destroy(); this.player = null; }
        if (this.ghost) { this.ghost.destroy(); this.ghost = null; }
        if (this.ai) { if (this.ai.car) this.ai.car.destroy(); this.ai = null; }

        this.controls = { up: false, down: false, left: false, right: false };
        this.isRunning = false;
        window.gameRunning = false;

        if (window.gameAudio) {
            window.gameAudio.stopEngine();
            window.gameAudio.stopBackgroundMusic();
        }
        if (this.keyboardController) this.keyboardController.resetKeys();
        if (this.ui) this.ui.hideGameUI();
    }

    update(delta) {
        try {
            // 프레임 간 시간 제한 (너무 큰 delta 값은 물리 계산에 문제를 일으킬 수 있음)
            // 더 엄격한 제한 적용 (최대 0.1초)
            const safeDelta = Math.min(delta, 0.1) / 60;

            // 게임이 실행 중이 아니면 업데이트 건너뛰기
            if (!this.isRunning) return;

            // 플레이어 업데이트
            if (this.player) {
                try {
                    // 플레이어가 화면 밖으로 너무 멀리 나가면 시작 위치로 복귀 (게임 꺼짐 방지)
                    const screenWidth = this.app.screen.width;
                    const screenHeight = this.app.screen.height;

                    // 화면 밖으로 나가는 경우 더 빠르게 감지하여 복구
                    if (this.player.x < -screenWidth * 0.5 || this.player.x > screenWidth * 1.5 ||
                        this.player.y < -screenHeight * 0.5 || this.player.y > screenHeight * 1.5) {
                        console.log("Player out of bounds, resetting position");

                        // 트랙 위의 안전한 위치로 복귀
                        const startPos = this.track.getStartPosition();
                        this.player.setPosition(startPos.x, startPos.y, startPos.rotation);

                        // 속도와 가속도 초기화
                        this.player.speed = 0;
                        this.player.velocity = 0;
                        this.player.drift = 0;
                    }

                    // 플레이어 업데이트 (NaN 값 방지)
                    if (isNaN(this.player.x) || isNaN(this.player.y) || isNaN(this.player.angle)) {
                        console.error("Player position contains NaN, resetting");
                        const startPos = this.track.getStartPosition();
                        this.player.setPosition(startPos.x, startPos.y, startPos.rotation);
                        this.player.speed = 0;
                        this.player.velocity = 0;
                    } else {
                        this.player.update(safeDelta, this.controls);
                    }

                    // 시각 효과 업데이트 (최적화) - 파티클 효과 줄이기
                    if (this.effects) {
                        // 파티클 생성 빈도 제한 (성능 최적화)
                        const particleChance = Math.min(0.001, 0.002 * (60 / this.app.ticker.FPS));

                        // 먼지 효과 (고속 주행 시) - 속도 조건 높이기
                        if (Math.abs(this.player.velocity) > 90 && Math.random() < particleChance) {
                            this.effects.createDustTrail(this.player.x, this.player.y, this.player.angle, Math.abs(this.player.velocity));
                        }

                        // 스키드 마크 효과 (드리프트 시) - 드리프트 조건 높이기
                        if (Math.abs(this.player.drift) > 0.7 && Math.random() < particleChance) {
                            this.effects.createSkidMarks(this.player.x, this.player.y, this.player.angle, Math.abs(this.player.drift));
                        }

                        // 효과 업데이트 (성능 최적화를 위해 10프레임마다 한 번씩)
                        if (Math.floor(this.app.ticker.lastTime / 60) % 10 === 0) {
                            this.effects.update(safeDelta);

                            // 파티클 수 제한 (메모리 누수 방지)
                            if (this.effects.particles && this.effects.particles.length > 100) {
                                // 가장 오래된 파티클 50개 제거
                                const removeCount = Math.min(50, this.effects.particles.length - 50);
                                for (let i = 0; i < removeCount; i++) {
                                    const oldParticle = this.effects.particles.shift();
                                    if (oldParticle && oldParticle.parent) {
                                        oldParticle.parent.removeChild(oldParticle);
                                    }
                                }
                            }
                        }
                    }

                    // 오디오 업데이트 (오류 방지) - 업데이트 빈도 줄이기
                    if (window.gameAudio && Math.floor(this.app.ticker.lastTime / 60) % 3 === 0) {
                        try {
                            window.gameAudio.updateEngineSound(this.player.velocity, this.player.acceleration);
                            window.gameAudio.updateDriftSound(this.player.drift);
                        } catch (audioErr) {
                            // 오디오 오류는 게임 플레이에 영향을 주지 않도록 함
                        }
                    }
                } catch (e) {
                    console.error("Error updating player:", e);
                    // 심각한 오류 발생 시 플레이어 위치만 초기화하고 계속 진행
                    if (this.player && this.track) {
                        const startPos = this.track.getStartPosition();
                        this.player.setPosition(startPos.x, startPos.y, startPos.rotation);
                        this.player.speed = 0;
                        this.player.velocity = 0;
                    }
                }
            }

            // AI 업데이트 (오류 처리 강화) - 플레이어보다 먼저 업데이트하여 우선순위 높이기
            if (this.ai) {
                try {
                    this.ai.update(safeDelta);

                    // AI 차량이 움직이지 않는 경우 강제로 위치 조정
                    if (this.ai.car && Math.abs(this.ai.car.velocity) < 0.1) {
                        // 5초마다 위치 재설정 시도
                        if (Math.floor(Date.now() / 5000) % 2 === 0) {
                            console.log("AI car stuck, repositioning");
                            const startPos = this.track.getStartPosition();
                            this.ai.car.setPosition(startPos.x + 10, startPos.y + 10, startPos.rotation);
                            this.ai.car.speed = 1;
                            this.ai.car.velocity = 10;
                        }
                    }
                } catch (e) {
                    console.error("Error updating AI:", e);
                    // AI 오류 시 안전하게 제거하지 않고 재시도
                    if (this.ai && this.ai.car) {
                        try {
                            // AI 차량 위치 재설정
                            const startPos = this.track.getStartPosition();
                            this.ai.car.setPosition(startPos.x + 10, startPos.y + 10, startPos.rotation);
                            this.ai.car.speed = 1;
                            this.ai.car.velocity = 10;

                            // 기본 컨트롤 설정
                            this.ai.controls = {
                                up: true,
                                down: false,
                                left: false,
                                right: false
                            };
                        } catch (resetErr) {
                            console.warn("AI reset error:", resetErr);
                        }
                    }
                }
            }

            // 고스트 업데이트 (오류 처리 강화)
            if (this.ghost) {
                try {
                    this.ghost.update();
                } catch (e) {
                    console.error("Error updating ghost:", e);
                    // 고스트 오류 시 안전하게 제거
                    try {
                        if (this.ghost.destroy) {
                            this.ghost.destroy();
                        } else if (this.ghost.container && this.ghost.container.parent) {
                            this.ghost.container.parent.removeChild(this.ghost.container);
                        }
                    } catch (cleanupErr) {
                        console.warn("Ghost cleanup error:", cleanupErr);
                    }
                    this.ghost = null;
                }
            }

            // UI 업데이트 (오류 처리 강화) - 업데이트 빈도 줄이기
            if (this.ui && Math.floor(this.app.ticker.lastTime / 60) % 2 === 0) {
                try {
                    this.ui.update();
                } catch (e) {
                    console.error("Error updating UI:", e);
                    // UI 오류는 게임 플레이에 영향을 주지 않도록 함
                }
            }

        } catch (e) {
            console.error("Critical error in game update loop:", e);
            // 치명적인 오류 발생 시 게임 상태 복구 시도
            try {
                // 게임 상태 복구
                if (this.player && this.track) {
                    const startPos = this.track.getStartPosition();
                    this.player.setPosition(startPos.x, startPos.y, startPos.rotation);
                    this.player.speed = 0;
                    this.player.velocity = 0;
                }
            } catch (recoveryErr) {
                console.error("Recovery attempt failed:", recoveryErr);
                // 복구 실패 시 게임을 계속 실행하되 다음 프레임에서 다시 시도
            }
        }
    }

    onResize() {
        this.app.renderer.resize(window.innerWidth, window.innerHeight);
        if (this.effects) {
            this.effects.postProcessing.removeChildren();
            this.effects.createVignette();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
