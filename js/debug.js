// 디버깅 도우미 함수
function debugCanvas() {
    console.log('Running canvas debug...');
    
    // 캔버스 요소 찾기
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    // 캔버스 정보 출력
    console.log('Canvas found:', canvas);
    console.log('Canvas dimensions:', canvas.width, canvas.height);
    console.log('Canvas style:', canvas.style.width, canvas.style.height);
    
    // 게임 컨테이너 확인
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        console.log('Game container found:', gameContainer);
        console.log('Game container children:', gameContainer.children.length);
    } else {
        console.error('Game container not found!');
    }
    
    // 테스트용 사각형 그리기
    try {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'red';
        ctx.fillRect(100, 100, 200, 200);
        console.log('Test rectangle drawn on canvas');
    } catch (e) {
        console.error('Error drawing on canvas:', e);
    }
    
    // PIXI 애플리케이션 확인
    if (window.game && window.game.app) {
        console.log('PIXI Application found:', window.game.app);
        console.log('PIXI Stage children:', window.game.app.stage.children.length);
    } else {
        console.error('PIXI Application not found!');
    }
}

// 페이지 로드 후 디버깅 함수 실행
window.addEventListener('load', function() {
    console.log('Page loaded, waiting for game initialization...');
    setTimeout(debugCanvas, 2000); // 2초 후 디버깅 실행
});

// 콘솔에서 수동으로 실행할 수 있는 함수
window.debugGame = function() {
    console.log('Manual debug triggered');
    debugCanvas();
    
    // 게임 객체 확인
    if (window.game) {
        console.log('Game object:', window.game);
        console.log('Game running:', window.game.isRunning);
        console.log('Game track:', window.game.track);
        console.log('Game player:', window.game.player);
    } else {
        console.error('Game object not found!');
    }
};