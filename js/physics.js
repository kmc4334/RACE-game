/**
 * 레이싱 게임 물리 엔진
 * 차량의 움직임, 충돌 감지, 물리적 상호작용을 처리합니다.
 */
class Physics {
    constructor() {
        // 물리 상수
        this.gravity = 9.8;       // 중력 (m/s^2)
        this.airDensity = 1.2;    // 공기 밀도 (kg/m^3)
        this.friction = 0.7;      // 마찰 계수
        
        // 시뮬레이션 설정
        this.timeStep = 1/60;     // 시뮬레이션 시간 단계 (초)
    }
    
    /**
     * 차량 가속도 계산
     * @param {number} force - 적용된 힘 (N)
     * @param {number} mass - 차량 질량 (kg)
     * @returns {number} 가속도 (m/s^2)
     */
    calculateAcceleration(force, mass) {
        return force / mass;
    }
    
    /**
     * 공기 저항 계산
     * @param {number} velocity - 차량 속도 (m/s)
     * @param {number} dragCoefficient - 항력 계수
     * @param {number} frontalArea - 차량 전면적 (m^2)
     * @returns {number} 공기 저항력 (N)
     */
    calculateDrag(velocity, dragCoefficient, frontalArea) {
        return 0.5 * this.airDensity * dragCoefficient * frontalArea * velocity * velocity * Math.sign(velocity);
    }
    
    /**
     * 구름 저항 계산
     * @param {number} mass - 차량 질량 (kg)
     * @param {number} rollingCoefficient - 구름 저항 계수
     * @returns {number} 구름 저항력 (N)
     */
    calculateRollingResistance(mass, rollingCoefficient) {
        return mass * this.gravity * rollingCoefficient;
    }
    
    /**
     * 엔진 힘 계산
     * @param {number} throttle - 스로틀 입력 (0-1)
     * @param {number} maxEnginePower - 최대 엔진 출력 (N)
     * @returns {number} 엔진 힘 (N)
     */
    calculateEngineForce(throttle, maxEnginePower) {
        return throttle * maxEnginePower;
    }
    
    /**
     * 제동력 계산
     * @param {number} brake - 브레이크 입력 (0-1)
     * @param {number} maxBrakeForce - 최대 제동력 (N)
     * @returns {number} 제동력 (N)
     */
    calculateBrakeForce(brake, maxBrakeForce) {
        return brake * maxBrakeForce;
    }
    
    /**
     * 차량 회전 계산
     * @param {number} steeringAngle - 조향각 (라디안)
     * @param {number} velocity - 차량 속도 (m/s)
     * @param {number} wheelbase - 축거 (m)
     * @param {number} dt - 시간 단계 (초)
     * @returns {number} 회전 각도 변화 (라디안)
     */
    calculateRotation(steeringAngle, velocity, wheelbase, dt) {
        // 저속에서는 회전 반응성 향상
        const speedFactor = Math.min(Math.abs(velocity) / 10, 1);
        const baseRotation = (velocity * Math.tan(steeringAngle) / wheelbase) * dt;
        
        // 속도에 따른 회전 조정 (저속에서 더 민감하게)
        return baseRotation * (1 + (1 - speedFactor) * 0.5);
    }
    
    /**
     * 드리프트 계산
     * @param {number} lateralForce - 측면 힘 (N)
     * @param {number} tractionLimit - 접지력 한계 (N)
     * @param {number} velocity - 차량 속도 (m/s)
     * @returns {number} 드리프트 정도 (0-1)
     */
    calculateDrift(lateralForce, tractionLimit, velocity) {
        // 속도가 너무 낮으면 드리프트 없음
        if (Math.abs(velocity) < 5) return 0;
        
        const driftFactor = Math.max(0, Math.min(1, (Math.abs(lateralForce) - tractionLimit) / tractionLimit));
        return driftFactor;
    }
    
    /**
     * 충돌 감지 및 응답
     * @param {Object} car - 차량 객체
     * @param {Object} track - 트랙 객체
     * @returns {boolean} 충돌 여부
     */
    detectCollision(car, track) {
        // 트랙 경계와의 충돌 확인
        const collision = track.checkCollision(car.x, car.y, car.collisionRadius);
        
        if (collision) {
            // 충돌 응답 - 속도 감소
            car.velocity *= 0.5;
            
            // 충돌 지점에서 약간 밀어내기
            const pushDistance = 5;
            const pushAngle = car.rotation + Math.PI; // 차량 방향의 반대 방향
            car.x += Math.cos(pushAngle) * pushDistance;
            car.y += Math.sin(pushAngle) * pushDistance;
            
            return true;
        }
        
        return false;
    }
    
    /**
     * 차량 물리 업데이트
     * @param {Object} car - 차량 객체
     * @param {Object} controls - 컨트롤 입력
     * @param {number} dt - 시간 단계 (초)
     */
    updateVehicle(car, controls, dt) {
        // 입력 처리 - W/S 키와 방향키 모두 작동하도록 수정
        const throttle = controls.up ? 1 : 0;
        const brake = controls.down ? 1 : 0;
        const steering = (controls.left ? -1 : 0) + (controls.right ? 1 : 0);
        
        // 조향각 계산 (최대 25도로 줄여서 더 안정적으로)
        const maxSteeringAngle = Math.PI / 7.2; // 25도
        car.steeringAngle = steering * maxSteeringAngle;
        
        // 브레이크를 누르면 후진하도록 수정
        let brakeForce = 0;
        let reverseForce = 0;
        
        if (brake > 0) {
            if (car.velocity > 0.5) {
                // 전진 중 브레이크 - 감속
                brakeForce = this.calculateBrakeForce(brake, car.brakeForce);
            } else if (car.velocity > -0.5) {
                // 정지 상태 또는 매우 느린 속도 - 후진 시작
                reverseForce = this.calculateEngineForce(brake * 0.5, car.enginePower * 0.3); // 후진은 더 약하게
            } else {
                // 이미 후진 중 - 후진 가속
                reverseForce = this.calculateEngineForce(brake * 0.5, car.enginePower * 0.3);
            }
        }
        
        // 엔진 힘 계산 (출력을 높여서 속도 증가)
        const engineForce = throttle > 0 ? this.calculateEngineForce(throttle, car.enginePower * 0.8) : 0; // 80%로 증가
        
        // 저항력 계산 (저항을 낮춰서 속도 증가)
        const dragForce = this.calculateDrag(car.velocity, car.dragCoefficient * 0.8, car.frontalArea);
        const rollingResistance = this.calculateRollingResistance(car.mass, car.rollingResistance * 0.8);
        
        // 총 종방향 힘 계산 (후진 힘 추가)
        const longitudinalForce = engineForce - brakeForce - reverseForce - dragForce - rollingResistance * Math.sign(car.velocity);
        
        // 가속도 계산
        car.acceleration = this.calculateAcceleration(longitudinalForce, car.mass);
        
        // 속도 업데이트 (최대 속도 제한 추가)
        car.velocity += car.acceleration * dt;
        
        // 후진 처리 - 브레이크를 누르고 있고 속도가 낮으면 후진
        if (brake > 0 && car.velocity > -0.5 && car.velocity < 0.5) {
            car.velocity -= brake * 0.2; // 부드럽게 후진 시작
        }
        
        // 속도 제한
        const maxSpeed = 80; // 최대 속도 제한 (m/s) - 더 높게 설정
        const maxReverseSpeed = 40; // 최대 후진 속도 제한
        car.velocity = Math.min(maxSpeed, Math.max(-maxReverseSpeed, car.velocity));
        
        // 회전 계산 - 속도가 있을 때만 회전하고, 더 현실적으로 조정
        if (Math.abs(car.velocity) > 0.5) {
            // 후진 시 반대 방향으로 조향
            const effectiveSteering = car.velocity < 0 ? -car.steeringAngle : car.steeringAngle;
            const rotationChange = this.calculateRotation(effectiveSteering, Math.abs(car.velocity), car.wheelbase, dt);
            car.rotation += rotationChange;
            
            // 측면 힘 계산 (회전 시)
            const lateralForce = car.mass * Math.abs(car.velocity) * Math.abs(rotationChange) / dt;
            
            // 드리프트 계산
            car.drift = this.calculateDrift(lateralForce, car.tractionLimit, car.velocity);
        } else {
            car.drift = 0;
        }
        
        // 위치 업데이트 - 차량이 앞/뒤로 이동하도록 수정
        if (Math.abs(car.velocity) > 0.01) {
            // 차량의 현재 방향으로 이동 (후진 시 반대 방향)
            const movementAngle = car.velocity >= 0 ? car.rotation : car.rotation + Math.PI;
            
            // 차량 방향으로 이동 (속도 스케일링 조정)
            const speedScale = 1.0; // 속도를 100%로 설정하여 더 빠르게 이동
            const deltaX = Math.cos(movementAngle) * Math.abs(car.velocity) * dt * speedScale;
            const deltaY = Math.sin(movementAngle) * Math.abs(car.velocity) * dt * speedScale;
            
            car.x += deltaX;
            car.y += deltaY;
        }
        
        // 충돌 감지 및 처리 - 더 강력하게 개선
        if (car.track && car.track.checkCollision(car.x, car.y, car.collisionRadius)) {
            // 충돌 시 속도 감소 (더 강하게)
            car.velocity *= 0.2; // 더 강한 감속으로 벽에 끼이는 것 방지
            
            // 트랙 중앙으로 강하게 밀어내기
            const nearestPath = car.track.getNearestPathPoint(car.x, car.y);
            if (nearestPath && nearestPath.point) {
                const pushX = nearestPath.point.x - car.x;
                const pushY = nearestPath.point.y - car.y;
                const pushDistance = Math.sqrt(pushX * pushX + pushY * pushY);
                
                if (pushDistance > 0) {
                    // 더 강한 복귀력으로 끼임 방지
                    const pushForce = Math.min(35, pushDistance * 0.3);
                    car.x += (pushX / pushDistance) * pushForce;
                    car.y += (pushY / pushDistance) * pushForce;
                    
                    // 차량 방향도 트랙 방향으로 조정
                    const trackDirection = Math.atan2(pushY, pushX);
                    const angleDiff = trackDirection - car.rotation;
                    car.rotation += angleDiff * 0.25; // 방향 조정 강화
                }
            }
        }
    }
}