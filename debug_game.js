// 디버깅용 게임 클래스
class DebugGame {
    constructor() {
        console.log("DebugGame constructor called");
        this.isRunning = false;
        this.ui = {
            ghostEnabled: false,
            aiEnabled: false,
            hideStartScreen: function() {
                console.log("Hiding start screen");
                const startScreen = document.getElementById('start-screen');
                if (startScreen) {
                    startScreen.style.display = 'none';
                }
            },
            showCountdown: function(callback) {
                console.log("Showing countdown");
                setTimeout(function() {
                    console.log("Countdown finished, calling callback");
                    if (callback) callback();
                }, 1000);
            }
        };
    }
    
    startRace() {
        console.log("DebugGame.startRace() called");
        this.isRunning = true;
        this.ui.hideStartScreen();
        
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
        overlay.textContent = '출발!';
        
        document.getElementById('game-container').appendChild(overlay);
        
        setTimeout(function() {
            overlay.remove();
        }, 2000);
        
        console.log("Race started!");
    }
}

// 디버깅용 게임 객체 생성
console.log("Creating debug game object");
window.game = new DebugGame();
console.log("Debug game object created:", window.game);