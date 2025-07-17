/**
 * 고스트 모드 클래스
 * 이전 주행 기록을 재생하는 고스트 차량을 관리합니다.
 */
class Ghost {
    /**
     * 고스트 생성자
     * @param {PIXI.Application} app - PIXI 애플리케이션 인스턴스
     * @param {Track} track - 트랙 인스턴스
     */
    constructor(app, track) {
        this.app = app;
        this.track = track;
        
        // 고스트 데이터
        this.ghostData = null;
        this.currentIndex = 0;
        this.startTime = 0;
        
        // 고스트 스프라이트
        this.container = new PIXI.Container();
        this.app.stage.addChild(this.container);
    }
    
    /**
     * 고스트 생성
     * @returns {boolean} 고스트 데이터가 있으면 true
     */
    create() {
        try {
            // 로컬 스토리지에서 고스트 데이터 로드 (window 객체에서 직접 함수 참조)
            // 안전하게 loadFromStorage 함수 확인 및 사용
            if (typeof window.loadFromStorage !== 'function') {
                console.log("loadFromStorage function not available, defining it");
                window.loadFromStorage = function(key) {
                    try {
                        const data = localStorage.getItem(key);
                        return data ? JSON.parse(data) : null;
                    } catch (e) {
                        console.error('Error loading from localStorage:', e);
                        return null;
                    }
                };
            }
            
            try {
                this.ghostData = window.loadFromStorage('ghostData');
            } catch (storageError) {
                console.error("Error loading ghost data:", storageError);
                this.ghostData = null;
            }
            
            if (!this.ghostData || !this.ghostData.positionHistory || this.ghostData.positionHistory.length === 0) {
                console.log("No ghost data available");
                return false;
            }
            
            // 고스트 차량 스프라이트 생성
            this.createGhostSprite();
            
            console.log("Ghost created with", this.ghostData.positionHistory.length, "data points");
            return true;
        } catch (error) {
            console.error("Error creating ghost:", error);
            return false;
        }
    }
    
    /**
     * 고스트 스프라이트 생성
     */
    createGhostSprite() {
        try {
            // 기존 컨테이너 내용 정리
            if (this.container && this.container.children) {
                while (this.container.children.length > 0) {
                    this.container.removeChildAt(0);
                }
            }
            
            // 고스트 차량 본체
            const body = new PIXI.Graphics();
            
            // 반투명 파란색 고스트 차량 (알파값 명확하게 설정)
            body.beginFill(0x00AAFF, 0.6);
            body.drawRoundedRect(-15, -30, 30, 60, 8);
            body.endFill();
            
            // 고스트 차량 창문
            body.beginFill(0x333333, 0.4);
            body.drawRoundedRect(-10, -20, 20, 25, 4);
            body.endFill();
            
            // 고스트 효과 (외곽선)
            body.lineStyle(2, 0x00FFFF, 0.6);
            body.drawRoundedRect(-15, -30, 30, 60, 8);
            
            // 컨테이너에 추가
            if (this.container) {
                this.container.addChild(body);
            }
            
            // 초기 위치 설정 (데이터 유효성 검사)
            if (this.ghostData && this.ghostData.positionHistory && 
                this.ghostData.positionHistory.length > 0 && this.container) {
                const firstPosition = this.ghostData.positionHistory[0];
                if (firstPosition && typeof firstPosition.x === 'number' && 
                    typeof firstPosition.y === 'number' && 
                    typeof firstPosition.rotation === 'number') {
                    this.container.x = firstPosition.x;
                    this.container.y = firstPosition.y;
                    this.container.rotation = firstPosition.rotation;
                }
            }
            
            // 안정된 알파값 유지 (깜빡임 방지)
            if (this.container) {
                this.container.alpha = 0.6;
            }
            
            // 추가적으로 깜빡임 방지를 위해 기존 Tween 제거
            if (typeof gsap !== 'undefined' && this.container) {
                gsap.killTweensOf(this.container);
            }
        } catch (error) {
            console.error("Error creating ghost sprite:", error);
        }
    }
    
    /**
     * 고스트 시작
     */
    start() {
        this.startTime = Date.now();
        this.currentIndex = 0;
    }
    
    /**
     * 고스트 업데이트
     */
    update() {
        try {
            // 필요한 데이터가 없으면 업데이트 건너뛰기
            if (!this.ghostData || !this.ghostData.positionHistory || !this.container) return;
            
            const currentTime = Date.now() - this.startTime;
            const history = this.ghostData.positionHistory;
            
            // 히스토리 데이터가 충분하지 않으면 업데이트 건너뛰기
            if (history.length < 2) return;
            
            // 인덱스 범위 확인 및 조정
            if (this.currentIndex < 0) this.currentIndex = 0;
            if (this.currentIndex >= history.length) this.currentIndex = 0;
            
            // 현재 시간에 맞는 위치 찾기
            try {
                while (this.currentIndex < history.length - 1 && 
                    history[this.currentIndex + 1].time <= currentTime) {
                    this.currentIndex++;
                }
            } catch (indexError) {
                console.error("Error updating ghost index:", indexError);
                this.currentIndex = 0; // 오류 발생 시 인덱스 초기화
            }
            
            // 마지막 위치에 도달했으면 재시작
            if (this.currentIndex >= history.length - 1) {
                this.start();
                return;
            }
            
            // 현재 위치와 다음 위치 가져오기 (유효성 검사)
            const current = history[this.currentIndex];
            const next = history[this.currentIndex + 1];
            
            // 데이터 유효성 확인
            if (!current || !next || typeof current.time !== 'number' || typeof next.time !== 'number') {
                return;
            }
            
            // 두 위치 사이 보간
            if (next.time !== current.time) {
                const t = (currentTime - current.time) / (next.time - current.time);
                
                // 위치 보간 (NaN 방지)
                if (typeof current.x === 'number' && typeof next.x === 'number' && 
                    typeof current.y === 'number' && typeof next.y === 'number') {
                    this.container.x = current.x + (next.x - current.x) * t;
                    this.container.y = current.y + (next.y - current.y) * t;
                }
                
                // 회전 보간 (각도 차이 계산)
                if (typeof current.rotation === 'number' && typeof next.rotation === 'number') {
                    let rotDiff = next.rotation - current.rotation;
                    
                    // 각도 차이를 -PI ~ PI 범위로 조정
                    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
                    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
                    
                    this.container.rotation = current.rotation + rotDiff * t;
                }
            }
        } catch (error) {
            console.error("Error updating ghost:", error);
        }
    }
    
    /**
     * 고스트 제거
     */
    destroy() {
        try {
            if (this.container) {
                if (this.container.parent) {
                    this.container.parent.removeChild(this.container);
                } else if (this.app && this.app.stage) {
                    this.app.stage.removeChild(this.container);
                }
                
                if (typeof gsap !== 'undefined') {
                    gsap.killTweensOf(this.container);
                }
                
                // 컨테이너 내부 정리
                if (this.container.children && this.container.children.length > 0) {
                    while (this.container.children.length > 0) {
                        const child = this.container.children[0];
                        this.container.removeChild(child);
                    }
                }
            }
        } catch (error) {
            console.error("Error destroying ghost:", error);
        }
    }
}