// 간단한 게임 클래스
class SimpleGame {
    constructor() {
        console.log("SimpleGame constructor called");
        this.isRunning = false;
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 캔버스 크기 설정
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // 게임 상태
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            angle: 0,
            speed: 0,
            maxSpeed: 5,
            acceleration: 0.2,
            deceleration: 0.05,
            rotationSpeed: 0.05,
            width: 30,
            height: 60
        };
        
        // 컨트롤 상태
        this.controls = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        
        // 키보드 이벤트 리스너 설정
        this.setupKeyboardControls();
        
        // UI 요소
        this.ui = {
            ghostEnabled: false,
            aiEnabled: false,
            hideStartScreen: () => {
                const startScreen = document.getElementById('start-screen');
                if (startScreen) {
                    startScreen.style.display = 'none';
                }
            },
            showCountdown: (callback) => {
                // 간단한 카운트다운 표시
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
                overlay.style.zIndex = '100';
                overlay.textContent = '3';
                
                document.getElementById('game-container').appendChild(overlay);
                
                setTimeout(() => {
                    overlay.textContent = '2';
                }, 1000);
                
                setTimeout(() => {
                    overlay.textContent = '1';
                }, 2000);
                
                setTimeout(() => {
                    overlay.textContent = '출발!';
                }, 3000);
                
                setTimeout(() => {
                    overlay.remove();
                    if (callback) callback();
                }, 4000);
            }
        };
        
        console.log("SimpleGame initialized");
    }
    
    setupKeyboardControls() {
        // 키 다운 이벤트
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.controls.up = true;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.controls.down = true;
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.controls.left = true;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.controls.right = true;
                    break;
                case ' ':
                    this.controls.up = true;
                    break;
            }
        });
        
        // 키 업 이벤트
        window.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.controls.up = false;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.controls.down = false;
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.controls.left = false;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.controls.right = false;
                    break;
                case ' ':
                    this.controls.up = false;
                    break;
            }
        });
    }
    
    startRace() {
        console.log("SimpleGame.startRace() called");
        this.ui.hideStartScreen();
        
        this.ui.showCountdown(() => {
            this.isRunning = true;
            this.gameLoop();
        });
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        // 화면 지우기
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 플레이어 업데이트
        this.updatePlayer();
        
        // 플레이어 그리기
        this.drawPlayer();
        
        // 다음 프레임 요청
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updatePlayer() {
        // 가속/감속
        if (this.controls.up) {
            this.player.speed += this.player.acceleration;
            if (this.player.speed > this.player.maxSpeed) {
                this.player.speed = this.player.maxSpeed;
            }
        } else if (this.controls.down) {
            this.player.speed -= this.player.acceleration;
            if (this.player.speed < -this.player.maxSpeed / 2) {
                this.player.speed = -this.player.maxSpeed / 2;
            }
        } else {
            // 자연 감속
            if (this.player.speed > 0) {
                this.player.speed -= this.player.deceleration;
                if (this.player.speed < 0) this.player.speed = 0;
            } else if (this.player.speed < 0) {
                this.player.speed += this.player.deceleration;
                if (this.player.speed > 0) this.player.speed = 0;
            }
        }
        
        // 회전
        if (this.player.speed !== 0) {
            const direction = this.player.speed > 0 ? 1 : -1;
            if (this.controls.left) {
                this.player.angle -= this.player.rotationSpeed * direction;
            }
            if (this.controls.right) {
                this.player.angle += this.player.rotationSpeed * direction;
            }
        }
        
        // 위치 업데이트
        this.player.x += Math.cos(this.player.angle) * this.player.speed;
        this.player.y += Math.sin(this.player.angle) * this.player.speed;
        
        // 화면 경계 처리
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x > this.canvas.width) this.player.x = this.canvas.width;
        if (this.player.y < 0) this.player.y = 0;
        if (this.player.y > this.canvas.height) this.player.y = this.canvas.height;
    }
    
    drawPlayer() {
        this.ctx.save();
        
        // 플레이어 위치로 이동 및 회전
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.rotate(this.player.angle);
        
        // 차량 본체 그리기
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(-this.player.width / 2, -this.player.height / 2, this.player.width, this.player.height);
        
        // 차량 앞부분 표시
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(-this.player.width / 2, -this.player.height / 2, this.player.width, 10);
        
        this.ctx.restore();
        
        // 속도계 업데이트
        const speedElement = document.querySelector('.speed-value');
        if (speedElement) {
            speedElement.textContent = Math.abs(Math.round(this.player.speed * 20));
        }
    }
}

// 게임 객체 생성
console.log("Creating simple game object");
window.game = new SimpleGame();
console.log("Simple game object created:", window.game);