/**
 * 레이싱 게임 차량 클래스
 * 차량의 물리적 속성과 렌더링을 관리합니다.
 */
class Car {
    /**
     * 차량 생성자
     * @param {PIXI.Application} app - PIXI 애플리케이션 인스턴스
     * @param {Track} track - 트랙 객체
     * @param {boolean} isAI - AI 차량 여부
     */
    constructor(app, track, isAI = false, carIndex = 0) {
        this.app = app;
        this.track = track;
        this.isAI = isAI;

        // 시작 위치 가져오기
        const startPos = track.getStartPosition();

        // 위치 및 회전
        this.x = startPos.x;
        this.y = startPos.y;
        this.angle = startPos.rotation;

        // 물리 속성
        this.speed = 0;
        this.maxSpeed = 10; // 최대 속도 증가
        this.acceleration = 0.3; // 가속도 증가
        this.friction = 0.05;
        this.rotationSpeed = 0.05; // 회전 속도 증가
        this.velocity = 0;
        this.drift = 0;

        // F1 차량 물리 속성 추가
        this.mass = 740; // kg
        this.enginePower = 12000; // N
        this.brakeForce = 15000; // N
        this.dragCoefficient = 0.7;
        this.frontalArea = 1.5; // m^2
        this.rollingResistance = 0.015;
        this.wheelbase = 3.0; // m
        this.tractionLimit = 9000; // N

        // 시각적 속성
        this.width = 40;
        this.height = 70;

        // F1 차량 색상 (이미지에 맞게 다양한 색상 설정)
        const carColors = [
            "#FF0000", // 빨강
            "#0000FF", // 파랑
            "#FFFF00", // 노랑
            "#FF00FF", // 핑크
            "#00FFFF", // 청록
            "#FF8000", // 주황
            "#FFFFFF", // 흰색
            "#00FF00"  // 녹색
        ];

        // 플레이어는 빨간색, AI는 다양한 색상
        this.color = isAI ? carColors[carIndex % carColors.length] : "#FF0000";

        // 충돌 감지용
        this.collisionRadius = Math.max(this.width, this.height) / 2;

        // 레이싱 관련 속성
        this.lap = 0; // 0랩부터 시작
        this.totalLaps = 3; // 3랩에서 종료
        this.passedCheckpoints = [];
        this.lapTime = 0;
        this.bestLapTime = Infinity;
        this.raceStartTime = 0;
        this.isRacing = false;
        this.raceFinished = false; // 레이스 완료 여부

        // 스프라이트 생성
        this.sprite = null;
        this.container = new PIXI.Container();
        this.app.stage.addChild(this.container);
        this.createSprite();
    }

    /**
     * 차량 스프라이트 생성
     */
    createSprite() {
        // PIXI.js 사용 시 스프라이트 생성
        if (window.PIXI) {
            this.sprite = new PIXI.Container();

            // F1 스타일 차체 - 차량이 오른쪽을 향하도록 수정
            const body = new PIXI.Graphics();
            body.beginFill(parseInt(this.color.replace('#', '0x')) || 0xFF0000);

            // 차체 본체 (좀 더 날렵한 F1 형태) - 가로로 눕힘
            body.drawRoundedRect(-this.height / 2, -this.width / 2, this.height, this.width, 8);

            // 앞부분 노즈콘 (뾰족한 부분) - 오른쪽을 향하도록 수정
            body.drawPolygon([
                this.height / 2, -10,
                this.height / 2, 10,
                this.height / 2 + 10, 5,
                this.height / 2 + 10, -5
            ]);

            body.endFill();

            // 콕핏 (운전석) - 가로로 눕힘
            const cockpit = new PIXI.Graphics();
            cockpit.beginFill(0x333333);
            cockpit.drawRoundedRect(-10, -12, 30, 24, 5);
            cockpit.endFill();

            // 앞 날개 - 오른쪽을 향하도록 수정
            const frontWing = new PIXI.Graphics();
            frontWing.beginFill(this.color === 'red' ? 0xFFFFFF : 0xDDDDDD);
            frontWing.drawRect(this.height / 2 - 15, -this.width / 2 - 5, 8, this.width + 10);
            frontWing.endFill();

            // 뒷 날개 - 오른쪽을 향하도록 수정
            const rearWing = new PIXI.Graphics();
            rearWing.beginFill(this.color === 'red' ? 0xFFFFFF : 0xDDDDDD);
            rearWing.drawRect(-this.height / 2 + 5, -this.width / 2 - 5, 8, this.width + 10);
            rearWing.endFill();

            // 뒷 날개 지지대 - 가로로 눕힘
            const rearWingSupport = new PIXI.Graphics();
            rearWingSupport.beginFill(0x333333);
            rearWingSupport.drawRect(-this.height / 2 + 20, -5, 15, 10);
            rearWingSupport.endFill();

            // 타이어 - 가로로 눕힘
            const tires = new PIXI.Graphics();
            tires.beginFill(0x000000);

            // 앞 타이어 (더 넓게) - 오른쪽을 향하도록 수정
            tires.drawRoundedRect(this.height / 2 - 30, -this.width / 2 - 8, 22, 16, 3);
            tires.drawRoundedRect(this.height / 2 - 30, this.width / 2 - 8, 22, 16, 3);

            // 뒤 타이어 (더 넓게) - 오른쪽을 향하도록 수정
            tires.drawRoundedRect(-this.height / 2 + 10, -this.width / 2 - 8, 22, 16, 3);
            tires.drawRoundedRect(-this.height / 2 + 10, this.width / 2 - 8, 22, 16, 3);
            tires.endFill();

            // 타이어 림 (휠) - 가로로 눕힘
            const rims = new PIXI.Graphics();
            rims.beginFill(0xCCCCCC);

            // 앞 타이어 림 - 오른쪽을 향하도록 수정
            rims.drawCircle(this.height / 2 - 19, -this.width / 2, 6);
            rims.drawCircle(this.height / 2 - 19, this.width / 2, 6);

            // 뒤 타이어 림 - 오른쪽을 향하도록 수정
            rims.drawCircle(-this.height / 2 + 21, -this.width / 2, 6);
            rims.drawCircle(-this.height / 2 + 21, this.width / 2, 6);
            rims.endFill();

            // 스프라이트에 추가
            this.sprite.addChild(body);
            this.sprite.addChild(cockpit);
            this.sprite.addChild(frontWing);
            this.sprite.addChild(rearWing);
            this.sprite.addChild(rearWingSupport);
            this.sprite.addChild(tires);
            this.sprite.addChild(rims);

            // 스프라이트를 컨테이너에 추가
            this.container.addChild(this.sprite);

            // 스프라이트 위치 및 회전 설정
            this.updateSpritePosition();
        }
    }

    /**
     * 스프라이트 위치 및 회전 업데이트
     */
    updateSpritePosition() {
        if (this.sprite) {
            this.sprite.x = this.x;
            this.sprite.y = this.y;
            this.sprite.rotation = this.angle;
        }
    }

    /**
     * 차량 업데이트
     * @param {number} deltaTime - 프레임 간 경과 시간 (초)
     * @param {Object} controls - 컨트롤 상태 객체
     */
    update(deltaTime, controls = {}) {
        // 레이싱 타이머 업데이트
        if (this.isRacing) {
            this.lapTime += deltaTime;
        }

        // 가속 / 감속
        if (controls.up) {
            this.speed += this.acceleration;
            this.velocity += this.acceleration * 20; // 속도계 표시용
        }
        if (controls.down) {
            this.speed -= this.acceleration;
            this.velocity -= this.acceleration * 20; // 속도계 표시용
        }

        // 속도 제한
        this.speed = Math.max(-this.maxSpeed, Math.min(this.speed, this.maxSpeed));
        this.velocity = Math.max(-100, Math.min(this.velocity, 100)); // 속도계 제한

        // 회전
        if (this.speed !== 0) {
            const flip = this.speed > 0 ? 1 : -1;
            if (controls.left) {
                this.angle -= this.rotationSpeed * flip;
                this.drift = Math.min(this.drift + 0.1, 1); // 드리프트 효과
            } else if (controls.right) {
                this.angle += this.rotationSpeed * flip;
                this.drift = Math.min(this.drift + 0.1, 1); // 드리프트 효과
            } else {
                this.drift *= 0.9; // 드리프트 감소
            }
        }

        // 이전 위치 저장 (충돌 시 복원용)
        const prevX = this.x;
        const prevY = this.y;

        // 위치 업데이트 - 차량이 오른쪽을 향하도록 수정된 스프라이트에 맞게 조정
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // 트랙과 충돌 감지
        if (this.track && this.track.checkCollision(this.x, this.y, this.collisionRadius)) {
            // 충돌 시 이전 위치로 복원
            this.x = prevX;
            this.y = prevY;
            // 속도 감소
            this.speed *= 0.5;
            this.velocity *= 0.5;
        }

        // 체크포인트 확인
        if (this.track) {
            this.track.checkCheckpoint(this);
        }

        // 마찰
        if (this.speed > 0) {
            this.speed -= this.friction;
        }
        if (this.speed < 0) {
            this.speed += this.friction;
        }
        if (Math.abs(this.speed) < this.friction) {
            this.speed = 0;
        }

        // 속도계 값 감소
        if (this.velocity > 0) {
            this.velocity -= this.friction * 10;
        }
        if (this.velocity < 0) {
            this.velocity += this.friction * 10;
        }
        if (Math.abs(this.velocity) < this.friction * 10) {
            this.velocity = 0;
        }

        // 스프라이트 위치 업데이트
        this.updateSpritePosition();
    }

    /**
     * Canvas API를 사용한 차량 그리기
     * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
     */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // 차체 그리기
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // 앞 표시
        ctx.fillStyle = "white";
        ctx.fillRect(-10, -this.height / 2, 20, 10);

        // 타이어 그리기
        ctx.fillStyle = "black";
        // 앞 타이어
        ctx.fillRect(-this.width / 2 - 5, -this.height / 2 + 10, 10, 20);
        ctx.fillRect(this.width / 2 - 5, -this.height / 2 + 10, 10, 20);
        // 뒤 타이어
        ctx.fillRect(-this.width / 2 - 5, this.height / 2 - 30, 10, 20);
        ctx.fillRect(this.width / 2 - 5, this.height / 2 - 30, 10, 20);

        ctx.restore();
    }

    /**
     * 레이스 시작
     */
    startRace() {
        this.isRacing = true;
        this.raceStartTime = Date.now();
        this.lapTime = 0;
        this.lapCount = 0;
        this.passedCheckpoints = [];
    }

    /**
     * 랩 완료
     */
    completeLap() {
        // 랩 카운트 증가
        this.lap++;

        // 베스트 랩 타임 업데이트
        if (this.lapTime < this.bestLapTime) {
            this.bestLapTime = this.lapTime;
        }

        // 랩 타임 초기화
        this.lapTime = 0;

        console.log(`${this.isAI ? 'AI' : 'Player'} completed lap ${this.lap}`);

        // 3랩 완료 시 레이스 종료
        if (this.lap >= this.totalLaps) {
            this.raceFinished = true;
            this.isRacing = false;
            
            // 플레이어 차량인 경우에만 게임 종료 이벤트 발생
            if (!this.isAI) {
                console.log("Race finished! Dispatching race complete event");
                
                // 레이스 완료 이벤트 발생
                const raceCompleteEvent = new CustomEvent('raceComplete', {
                    detail: {
                        totalTime: (Date.now() - this.raceStartTime) / 1000,
                        bestLapTime: this.bestLapTime * 1000,
                        laps: this.lap
                    }
                });
                document.dispatchEvent(raceCompleteEvent);
            }
        }

        // 이벤트 발생
        if (typeof this.onLapComplete === 'function') {
            this.onLapComplete(this.lap, this.bestLapTime);
        }
    }

    /**
     * 차량 위치 설정
     * @param {number} x - x 좌표
     * @param {number} y - y 좌표
     * @param {number} angle - 각도 (라디안)
     */
    setPosition(x, y, angle = 0) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 0;
        this.updateSpritePosition();
    }

    /**
     * 차량 색상 변경
     * @param {string} color - 새 색상
     */
    setColor(color) {
        this.color = color;
        this.createSprite(); // 스프라이트 재생성
    }

    /**
     * 차량 위치 업데이트 (게임 엔진에서 호출)
     */
    updatePosition() {
        this.updateSpritePosition();
    }

    /**
     * 차량 속도 가져오기 (UI 표시용)
     * @returns {number} 현재 속도 (km/h)
     */
    getSpeed() {
        return Math.abs(Math.round(this.velocity));
    }

    /**
     * 현재 랩 타임 가져오기
     * @returns {number} 현재 랩 타임 (밀리초)
     */
    getCurrentLapTime() {
        return this.lapTime * 1000;
    }

    /**
     * 차량 제거 (메모리 정리)
     */
    destroy() {
        if (this.container && this.container.parent) {
            this.container.parent.removeChild(this.container);
        }

        if (this.sprite) {
            this.sprite.removeChildren();
            this.sprite = null;
        }

        if (this.container) {
            this.container.removeChildren();
            this.container = null;
        }
    }
}

// CommonJS 또는 ES 모듈 내보내기 지원
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Car;
} else if (typeof define === 'function' && define.amd) {
    define([], function () { return Car; });
} else {
    window.Car = Car;
}