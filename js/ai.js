/**
 * AI 드라이버 클래스
 * 인공지능 차량 제어를 담당합니다.
 */
class AIDriver {
    /**
     * AI 드라이버 생성자
     * @param {Car} car - AI가 제어할 차량
     * @param {Track} track - 레이싱 트랙
     */
    constructor(car, track) {
        this.car = car;
        this.track = track;
        
        // AI 제어 속성
        this.controls = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        
        // AI 설정
        this.lookAheadDistance = 100;  // 앞을 내다보는 거리
        this.steeringResponse = 0.1;   // 조향 응답성
        this.throttleResponse = 0.8;   // 가속 응답성
        this.brakeResponse = 0.9;      // 제동 응답성
        
        // 경로 계획
        this.targetPoints = [];
        this.currentTargetIndex = 0;
        
        // 경로 계획 초기화
        this.planPath();
        
        console.log("AI Driver initialized");
    }
    
    /**
     * 경로 계획
     */
    planPath() {
        // 트랙 경로를 따라 목표 지점 설정
        this.targetPoints = [];
        
        // 트랙 경로의 모든 지점을 목표로 사용 (더 정확한 경로 추적)
        this.targetPoints = [...this.track.trackPath];
        
        // 첫 번째 목표 지점 설정
        this.currentTargetIndex = 0;
        
        console.log(`AI path planned with ${this.targetPoints.length} points`);
    }
    
    /**
     * 다음 목표 지점 선택
     */
    selectNextTarget() {
        // 현재 위치에서 가장 가까운 경로 지점 찾기
        const nearestPath = this.track.getNearestPathPoint(this.car.x, this.car.y);
        
        if (nearestPath && nearestPath.point) {
            // 가장 가까운 포인트의 인덱스 찾기
            let nearestIndex = 0;
            let minDistance = Infinity;
            
            for (let i = 0; i < this.track.trackPath.length; i++) {
                const point = this.track.trackPath[i];
                const dx = point.x - nearestPath.point.x;
                const dy = point.y - nearestPath.point.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = i;
                }
            }
            
            // 현재 위치에서 앞쪽의 목표 지점 선택 (더 멀리 내다보기)
            // 속도가 높을수록 더 멀리 내다보기
            const lookAheadSteps = Math.max(4, Math.floor(Math.abs(this.car.velocity) / 15));
            this.currentTargetIndex = (nearestIndex + lookAheadSteps) % this.track.trackPath.length;
            
            // 트랙 이탈 시 더 가까운 지점을 목표로 설정
            if (!this.track.isOnTrack(this.car.x, this.car.y)) {
                this.currentTargetIndex = (nearestIndex + 2) % this.track.trackPath.length;
            }
        } else {
            // 기본값으로 다음 인덱스 사용
            this.currentTargetIndex = (this.currentTargetIndex + 1) % this.track.trackPath.length;
        }
    }
    
    /**
     * 조향 각도 계산
     * @returns {number} 조향 각도 (-1 ~ 1)
     */
    calculateSteering() {
        // 현재 목표 지점이 유효한지 확인
        if (!this.track.trackPath || this.currentTargetIndex >= this.track.trackPath.length) {
            return 0;
        }
        
        const target = this.track.trackPath[this.currentTargetIndex];
        if (!target) return 0;
        
        // 목표 지점까지의 벡터
        const dx = target.x - this.car.x;
        const dy = target.y - this.car.y;
        
        // 목표까지의 거리가 너무 가까우면 다음 목표로
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 30) {
            this.currentTargetIndex = (this.currentTargetIndex + 1) % this.track.trackPath.length;
            return this.calculateSteering(); // 재귀 호출로 다음 목표 확인
        }
        
        // 목표 방향 계산
        const targetAngle = Math.atan2(dy, dx);
        
        // 현재 방향과 목표 방향의 차이 계산
        let angleDiff = targetAngle - this.car.angle;
        
        // 각도 차이를 -PI ~ PI 범위로 조정
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // 속도에 따른 조향 민감도 조정
        const speedFactor = Math.min(Math.abs(this.car.velocity) / 100, 1);
        const steeringSensitivity = 1 - speedFactor * 0.3; // 고속에서는 덜 민감하게
        
        // 조향 각도 계산 (-1 ~ 1)
        const steeringInput = (angleDiff / (Math.PI / 3)) * steeringSensitivity;
        return Math.max(-1, Math.min(1, steeringInput));
    }
    
    /**
     * 속도 제어 계산
     * @returns {Object} 스로틀 및 브레이크 값 {throttle, brake}
     */
    calculateSpeedControl() {
        // 현재 목표 지점이 유효한지 확인
        if (!this.track.trackPath || this.currentTargetIndex >= this.track.trackPath.length) {
            return { throttle: 0.5, brake: 0 }; // 기본적으로 가속
        }
        
        const target = this.track.trackPath[this.currentTargetIndex];
        if (!target) return { throttle: 0.5, brake: 0 }; // 기본적으로 가속
        
        // 앞쪽 여러 지점을 확인하여 커브 강도 계산
        let maxCurvature = 0;
        const lookAheadPoints = 10; // 더 멀리 내다보기
        
        for (let i = 0; i < lookAheadPoints; i++) {
            const idx1 = (this.currentTargetIndex + i) % this.track.trackPath.length;
            const idx2 = (this.currentTargetIndex + i + 1) % this.track.trackPath.length;
            const idx3 = (this.currentTargetIndex + i + 2) % this.track.trackPath.length;
            
            const p1 = this.track.trackPath[idx1];
            const p2 = this.track.trackPath[idx2];
            const p3 = this.track.trackPath[idx3];
            
            if (!p1 || !p2 || !p3) continue;
            
            // 세 점을 이용한 곡률 계산
            const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
            
            let angleDiff = Math.abs(angle2 - angle1);
            while (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
            
            maxCurvature = Math.max(maxCurvature, angleDiff);
        }
        
        // 커브 강도에 따른 목표 속도 계산 (더 빠르게 주행)
        const curveFactor = maxCurvature / Math.PI;
        const baseSpeed = 150; // 기본 속도 증가
        const minSpeed = 60;   // 최소 속도 증가
        const targetSpeed = Math.max(minSpeed, baseSpeed - curveFactor * 100); // 커브에서 더 감속
        
        // 현재 속도
        const currentSpeed = Math.abs(this.car.velocity);
        
        // 트랙 경계와의 거리 확인
        const isNearBoundary = !this.track.isOnTrack(this.car.x, this.car.y);
        
        // 스로틀 및 브레이크 값 계산
        let throttle = 0;
        let brake = 0;
        
        if (isNearBoundary) {
            // 트랙 경계 근처에서는 속도 감소하고 트랙 중앙으로 복귀
            brake = 0.9; // 더 강한 제동
            throttle = 0;
            
            // 트랙 중앙으로 복귀 시도
            const nearestPath = this.track.getNearestPathPoint(this.car.x, this.car.y);
            if (nearestPath && nearestPath.point) {
                // 다음 목표 지점을 트랙 중앙으로 설정
                this.currentTargetIndex = nearestPath.point.index;
            }
        } else if (currentSpeed < targetSpeed * 0.9) {
            // 목표 속도보다 낮으면 가속 (더 강하게)
            const speedRatio = currentSpeed / targetSpeed;
            throttle = Math.max(0.6, this.throttleResponse * (1 - speedRatio));
        } else if (currentSpeed > targetSpeed * 1.1) {
            // 목표 속도보다 높으면 제동
            const excessSpeed = (currentSpeed - targetSpeed) / targetSpeed;
            brake = Math.min(1, this.brakeResponse * excessSpeed);
        } else {
            // 속도 유지 (더 높게)
            throttle = 0.7;
        }
        
        // 차량이 움직이지 않으면 강제로 가속
        if (currentSpeed < 5) {
            throttle = 1.0;
            brake = 0;
        }
        
        return { throttle, brake };
    }
    
    /**
     * AI 업데이트
     * @param {number} delta - 프레임 델타 시간
     */
    update(delta) {
        // 차량과 트랙이 유효한지 확인
        if (!this.car || !this.track || !this.track.trackPath) {
            console.log("AI missing required components");
            return;
        }
        
        try {
            // 다음 목표 지점 선택
            this.selectNextTarget();
            
            // 조향 계산
            const steering = this.calculateSteering();
            
            // 속도 제어 계산
            const speedControl = this.calculateSpeedControl();
            
            // 컨트롤 업데이트 (더 부드러운 제어)
            this.controls.left = steering < -0.05;
            this.controls.right = steering > 0.05;
            this.controls.up = speedControl.throttle > 0.05;
            this.controls.down = speedControl.brake > 0.05;
            
            // 차량이 움직이지 않는 경우 강제로 가속
            if (Math.abs(this.car.velocity) < 1) {
                this.controls.up = true;
                this.controls.down = false;
                console.log("AI forcing acceleration");
            }
            
            // 차량 업데이트
            this.car.update(delta, this.controls);
            
            // 디버깅 정보 출력 (10초마다)
            if (Math.floor(Date.now() / 10000) % 2 === 0 && Math.floor(Date.now() / 1000) % 10 === 0) {
                console.log(`AI position: (${Math.round(this.car.x)}, ${Math.round(this.car.y)}), velocity: ${Math.round(this.car.velocity)}, controls: ${JSON.stringify(this.controls)}`);
            }
            
        } catch (error) {
            console.error("AI update error:", error);
            // 오류 발생 시 안전한 기본 동작
            this.controls = {
                up: true,  // 기본적으로 가속
                down: false,
                left: false,
                right: false
            };
            
            // 차량 업데이트 (오류 발생해도 계속 움직이도록)
            if (this.car) {
                this.car.update(delta, this.controls);
            }
        }
    }
}