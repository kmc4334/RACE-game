/**
 * 키보드 컨트롤러 클래스
 * 키보드 입력을 처리하고 게임 컨트롤을 관리합니다.
 */
class KeyboardController {
    /**
     * 키보드 컨트롤러 생성자
     * @param {Game} game - 게임 인스턴스
     */
    constructor(game) {
        this.game = game;
        
        // 키 상태
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            w: false,
            a: false,
            s: false,
            d: false,
            ' ': false // 스페이스바
        };
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        console.log("Keyboard controller initialized");
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 키 다운 이벤트
        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
                this.updateGameControls();
                e.preventDefault();
            }
        });
        
        // 키 업 이벤트
        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
                this.updateGameControls();
                e.preventDefault();
            }
        });
        
        // 창 포커스 잃을 때 모든 키 초기화
        window.addEventListener('blur', () => {
            this.resetKeys();
        });
    }
    
    /**
     * 게임 컨트롤 업데이트
     */
    updateGameControls() {
        // 방향키 또는 WASD 키 매핑
        this.game.controls.up = this.keys.ArrowUp || this.keys.w || this.keys[' '];
        this.game.controls.down = this.keys.ArrowDown || this.keys.s;
        this.game.controls.left = this.keys.ArrowLeft || this.keys.a;
        this.game.controls.right = this.keys.ArrowRight || this.keys.d;
    }
    
    /**
     * 모든 키 초기화
     */
    resetKeys() {
        for (const key in this.keys) {
            this.keys[key] = false;
        }
        this.updateGameControls();
    }
    
    /**
     * 컨트롤러 제거
     */
    destroy() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('blur', this.resetKeys);
    }
}