/**
 * TensorFlow.js를 활용한 AI 드라이버 클래스
 * 딥러닝을 통해 최적의 주행 경로를 학습합니다.
 */
class TensorFlowAI {
    /**
     * TensorFlow AI 드라이버 생성자
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
        
        // 센서 설정
        this.sensorCount = 7;  // 센서 개수
        this.sensorLength = 150; // 센서 길이
        this.sensorSpread = Math.PI / 2; // 센서 각도 범위
        this.sensorData = [];
        
        // 학습 데이터
        this.trainingData = [];
        this.maxTrainingSize = 1000;
        this.recordingData = false;
        
        // 모델 설정
        this.model = null;
        this.trained = false;
        this.learningRate = 0.001;
        this.epochs = 10;
        
        // 초기화
        this.initSensors();
        this.initModel();
        
        console.log("TensorFlow AI Driver initialized");
    }
    
    /**
     * 센서 초기화
     */
    initSensors() {
        this.sensorData = new Array(this.sensorCount).fill(1);
    }
    
    /**
     * TensorFlow 모델 초기화
     */
    async initModel() {
        try {
            if (!window.tf) {
                console.error("TensorFlow.js not loaded");
                return;
            }
            
            // 간단한 신경망 모델 생성
            this.model = tf.sequential();
            
            // 입력층: 센서 데이터 + 현재 속도
            this.model.add(tf.layers.dense({
                inputShape: [this.sensorCount + 1],
                units: 10,
                activation: 'relu'
            }));
            
            // 은닉층
            this.model.add(tf.layers.dense({
                units: 8,
                activation: 'relu'
            }));
            
            // 출력층: [가속, 제동, 좌회전, 우회전]
            this.model.add(tf.layers.dense({
                units: 4,
                activation: 'sigmoid'
            }));
            
            // 모델 컴파일
            this.model.compile({
                optimizer: tf.train.adam(this.learningRate),
                loss: 'meanSquaredError'
            });
            
            console.log("TensorFlow model initialized");
        } catch (e) {
            console.error("Error initializing TensorFlow model:", e);
        }
    }
    
    /**
     * 센서 업데이트
     */
    updateSensors() {
        // 센서 각도 계산
        const angles = [];
        for (let i = 0; i < this.sensorCount; i++) {
            const offset = this.sensorSpread * (i / (this.sensorCount - 1) - 0.5);
            angles.push(this.car.angle + offset);
        }
        
        // 각 센서에 대해 트랙 경계까지의 거리 계산
        for (let i = 0; i < this.sensorCount; i++) {
            const angle = angles[i];
            let sensorValue = 1; // 기본값: 최대 거리 (정규화된 값)
            
            // 센서 끝점 계산
            const endX = this.car.x + Math.cos(angle) * this.sensorLength;
            const endY = this.car.y + Math.sin(angle) * this.sensorLength;
            
            // 센서 선과 트랙 경계 사이의 교차점 찾기
            let minDistance = this.sensorLength;
            
            // 트랙 경계와의 충돌 검사
            for (let step = 0; step < this.sensorLength; step += 5) {
                const checkX = this.car.x + Math.cos(angle) * step;
                const checkY = this.car.y + Math.sin(angle) * step;
                
                if (this.track.checkCollision(checkX, checkY, 1)) {
                    // 충돌 발견, 거리 계산
                    const distance = Math.sqrt(
                        Math.pow(checkX - this.car.x, 2) + 
                        Math.pow(checkY - this.car.y, 2)
                    );
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                    }
                    
                    break;
                }
            }
            
            // 거리를 0-1 사이로 정규화
            sensorValue = minDistance / this.sensorLength;
            this.sensorData[i] = sensorValue;
        }
    }
    
    /**
     * 학습 데이터 기록 시작
     */
    startRecording() {
        this.trainingData = [];
        this.recordingData = true;
        console.log("Started recording training data");
    }
    
    /**
     * 학습 데이터 기록 중지
     */
    stopRecording() {
        this.recordingData = false;
        console.log(`Stopped recording. Collected ${this.trainingData.length} samples`);
    }
    
    /**
     * 현재 상태를 학습 데이터로 기록
     * @param {Object} controls - 현재 컨트롤 입력
     */
    recordTrainingData(controls) {
        if (!this.recordingData) return;
        
        // 입력 데이터: 센서 값 + 현재 속도
        const input = [...this.sensorData, Math.abs(this.car.velocity) / 100];
        
        // 출력 데이터: 컨트롤 입력
        const output = [
            controls.up ? 1 : 0,
            controls.down ? 1 : 0,
            controls.left ? 1 : 0,
            controls.right ? 1 : 0
        ];
        
        // 학습 데이터에 추가
        this.trainingData.push({ input, output });
        
        // 최대 크기 제한
        if (this.trainingData.length > this.maxTrainingSize) {
            this.trainingData.shift();
        }
    }
    
    /**
     * 모델 학습
     */
    async trainModel() {
        if (!this.model || this.trainingData.length < 50) {
            console.log("Not enough training data or model not initialized");
            return false;
        }
        
        try {
            console.log(`Training model with ${this.trainingData.length} samples...`);
            
            // 학습 데이터 준비
            const inputs = tf.tensor2d(
                this.trainingData.map(data => data.input)
            );
            
            const outputs = tf.tensor2d(
                this.trainingData.map(data => data.output)
            );
            
            // 모델 학습
            await this.model.fit(inputs, outputs, {
                epochs: this.epochs,
                batchSize: 32,
                shuffle: true,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}`);
                    }
                }
            });
            
            // 메모리 정리
            inputs.dispose();
            outputs.dispose();
            
            this.trained = true;
            console.log("Model training completed");
            return true;
        } catch (e) {
            console.error("Error training model:", e);
            return false;
        }
    }
    
    /**
     * 모델을 사용하여 컨트롤 예측
     * @returns {Object} 예측된 컨트롤 입력
     */
    async predictControls() {
        if (!this.model || !this.trained) {
            return null;
        }
        
        try {
            // 입력 데이터 준비
            const input = tf.tensor2d(
                [[...this.sensorData, Math.abs(this.car.velocity) / 100]]
            );
            
            // 예측 실행
            const prediction = await this.model.predict(input);
            const values = await prediction.data();
            
            // 메모리 정리
            input.dispose();
            prediction.dispose();
            
            // 예측 결과를 컨트롤로 변환
            return {
                up: values[0] > 0.5,
                down: values[1] > 0.5,
                left: values[2] > 0.5,
                right: values[3] > 0.5
            };
        } catch (e) {
            console.error("Error predicting controls:", e);
            return null;
        }
    }
    
    /**
     * 모델 저장
     */
    async saveModel() {
        if (!this.model) return;
        
        try {
            await this.model.save('localstorage://racing-ai-model');
            console.log("Model saved to localStorage");
        } catch (e) {
            console.error("Error saving model:", e);
        }
    }
    
    /**
     * 모델 로드
     */
    async loadModel() {
        try {
            this.model = await tf.loadLayersModel('localstorage://racing-ai-model');
            this.trained = true;
            console.log("Model loaded from localStorage");
            return true;
        } catch (e) {
            console.error("Error loading model:", e);
            return false;
        }
    }
    
    /**
     * AI 업데이트
     * @param {number} delta - 프레임 델타 시간
     * @param {Object} playerControls - 플레이어 컨트롤 (학습 모드에서 사용)
     */
    async update(delta, playerControls = null) {
        // 센서 업데이트
        this.updateSensors();
        
        // 학습 모드: 플레이어 컨트롤 기록
        if (playerControls && this.recordingData) {
            this.recordTrainingData(playerControls);
        }
        
        // 예측 모드: AI 컨트롤 예측
        if (this.trained && !playerControls) {
            const predictedControls = await this.predictControls();
            if (predictedControls) {
                this.controls = predictedControls;
            }
        } else {
            // 기본 AI 로직 (학습 전 또는 예측 실패 시)
            this.updateBasicAI();
        }
        
        // 차량 업데이트
        if (this.car) {
            this.car.update(delta, this.controls);
        }
    }
    
    /**
     * 기본 AI 로직 (학습 전 또는 예측 실패 시)
     */
    updateBasicAI() {
        // 가장 가까운 경로 지점 찾기
        const nearestPath = this.track.getNearestPathPoint(this.car.x, this.car.y);
        if (!nearestPath || !nearestPath.point) return;
        
        // 다음 목표 지점 (앞쪽으로 몇 개 건너뛰기)
        const lookAheadSteps = Math.max(3, Math.floor(Math.abs(this.car.velocity) / 20));
        const nextIndex = (nearestPath.point.index + lookAheadSteps) % this.track.trackPath.length;
        const target = this.track.trackPath[nextIndex];
        
        if (!target) return;
        
        // 목표 방향 계산
        const dx = target.x - this.car.x;
        const dy = target.y - this.car.y;
        const targetAngle = Math.atan2(dy, dx);
        
        // 현재 방향과 목표 방향의 차이 계산
        let angleDiff = targetAngle - this.car.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // 조향 입력 설정
        this.controls.left = angleDiff < -0.05;
        this.controls.right = angleDiff > 0.05;
        
        // 가속/제동 입력 설정
        const distance = Math.sqrt(dx * dx + dy * dy);
        const currentSpeed = Math.abs(this.car.velocity);
        
        // 커브 감지 (센서 데이터 사용)
        const leftSensor = this.sensorData[0];
        const rightSensor = this.sensorData[this.sensorCount - 1];
        const frontSensor = this.sensorData[Math.floor(this.sensorCount / 2)];
        
        const isCurve = leftSensor < 0.5 || rightSensor < 0.5;
        const isObstacleAhead = frontSensor < 0.3;
        
        // 속도 조절
        if (isObstacleAhead) {
            // 장애물이 가까우면 제동
            this.controls.up = false;
            this.controls.down = true;
        } else if (isCurve && currentSpeed > 60) {
            // 커브에서 속도 줄이기
            this.controls.up = false;
            this.controls.down = currentSpeed > 80;
        } else {
            // 직선에서 가속
            this.controls.up = true;
            this.controls.down = false;
        }
        
        // 트랙 이탈 시 속도 줄이기
        if (!this.track.isOnTrack(this.car.x, this.car.y)) {
            this.controls.up = false;
            this.controls.down = true;
        }
    }
    
    /**
     * 디버그 정보 렌더링
     * @param {PIXI.Graphics} graphics - PIXI 그래픽 객체
     */
    renderDebug(graphics) {
        if (!graphics) return;
        
        // 센서 시각화
        graphics.lineStyle(1, 0xFFFF00);
        
        // 센서 각도 계산
        for (let i = 0; i < this.sensorCount; i++) {
            const offset = this.sensorSpread * (i / (this.sensorCount - 1) - 0.5);
            const angle = this.car.angle + offset;
            
            // 센서 거리 계산
            const distance = this.sensorData[i] * this.sensorLength;
            
            // 센서 선 그리기
            graphics.moveTo(this.car.x, this.car.y);
            graphics.lineTo(
                this.car.x + Math.cos(angle) * distance,
                this.car.y + Math.sin(angle) * distance
            );
        }
        
        // 학습 상태 표시
        if (this.recordingData) {
            graphics.lineStyle(2, 0xFF0000);
            graphics.drawCircle(this.car.x, this.car.y - 40, 5);
        }
        
        if (this.trained) {
            graphics.lineStyle(2, 0x00FF00);
            graphics.drawCircle(this.car.x, this.car.y - 50, 5);
        }
    }
}

// 전역 객체로 등록
window.TensorFlowAI = TensorFlowAI;