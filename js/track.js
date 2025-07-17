/**
 * 레이싱 게임 트랙 클래스
 * 트랙의 시각적 표현과 물리적 속성을 관리합니다.
 */
class Track {
    /**
     * 트랙 생성자
     * @param {PIXI.Application} app - PIXI 애플리케이션 인스턴스
     */
    constructor(app) {
        this.app = app;
        this.container = new PIXI.Container();
        this.app.stage.addChild(this.container);

        // 레이어 생성
        this.backgroundLayer = new PIXI.Container();
        this.trackGraphics = new PIXI.Graphics();
        this.decorationsLayer = new PIXI.Container();
        this.checkpointsGraphics = new PIXI.Graphics();
        this.barriersLayer = new PIXI.Container();
        this.kerbsLayer = new PIXI.Graphics(); // 커브 가장자리 줄무늬 레이어 추가

        // 레이어 추가
        this.container.addChild(this.backgroundLayer);
        this.container.addChild(this.trackGraphics);
        this.container.addChild(this.kerbsLayer);
        this.container.addChild(this.decorationsLayer);
        this.container.addChild(this.checkpointsGraphics);
        this.container.addChild(this.barriersLayer);

        // 트랙 속성 - F1 스타일 트랙으로 수정
        this.outer = { x: this.app.screen.width / 2, y: this.app.screen.height / 2, rx: 350, ry: 250 };
        this.inner = { x: this.app.screen.width / 2, y: this.app.screen.height / 2, rx: 200, ry: 100 };
        
        // 트랙 색상 및 스타일 - F1 트랙 스타일로 수정
        this.trackColor = 0x555555;      // 어두운 회색 아스팔트
        this.backgroundColor = 0x88AA55; // 녹색 잔디 배경
        this.borderColor = 0xFFFFFF;     // 흰색 경계선
        this.borderWidth = 4;            // 경계선 두께 증가
        this.kerbColor1 = 0xFF0000;      // 빨간색 커브
        this.kerbColor2 = 0xFFFFFF;      // 흰색 커브
        
        // 체크포인트 관련 속성
        this.checkpoints = [];
        this.startLine = null;
        
        // 체크포인트 생성
        this.generateCheckpoints();
        
        // 트랙 그리기
        this.drawTrack();
    }
    
    /**
     * 트랙 그리기
     */
    drawTrack() {
        try {
            // 이전 그림 지우기
            this.trackGraphics.clear();
            this.checkpointsGraphics.clear();
            this.backgroundLayer.removeChildren();
            this.kerbsLayer.clear();
            
            // 배경 그리기 (녹색 잔디)
            const bgGraphics = new PIXI.Graphics();
            bgGraphics.beginFill(this.backgroundColor);
            bgGraphics.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
            bgGraphics.endFill();
            this.backgroundLayer.addChild(bgGraphics);
            
            // 직선 트랙 그리기
            this.drawF1Track();
            
            // 체크포인트 그리기
            this.drawCheckpoints();
            
            // 트랙 장식 추가
            this.addTrackDecorations();
        } catch (error) {
            console.error("Error drawing track:", error);
        }
    }
    
    /**
     * F1 스타일 트랙 그리기
     */
    drawF1Track() {
        try {
            const width = this.app.screen.width;
            const height = this.app.screen.height;
            
            // 트랙 경로 정의 (타원형 트랙으로 수정)
            const trackPath = new PIXI.Graphics();
            
            // 트랙 경로 그리기 (회색 아스팔트)
            trackPath.beginFill(this.trackColor);
            
            // 외부 타원 그리기
            const outerOval = new PIXI.Graphics();
            outerOval.beginFill(this.trackColor);
            outerOval.drawEllipse(width / 2, height / 2, width * 0.4, height * 0.3);
            outerOval.endFill();
            
            // 내부 타원 그리기 (잔디 영역)
            const innerOval = new PIXI.Graphics();
            innerOval.beginFill(this.backgroundColor);
            innerOval.drawEllipse(width / 2, height / 2, width * 0.3, height * 0.2);
            innerOval.endFill();
            
            this.trackGraphics.addChild(outerOval);
            this.trackGraphics.addChild(innerOval);
            
            // 트랙 경계선 그리기 (흰색)
            const outerBorder = new PIXI.Graphics();
            outerBorder.lineStyle(3, 0xFFFFFF);
            outerBorder.drawEllipse(width / 2, height / 2, width * 0.4, height * 0.3);
            
            const innerBorder = new PIXI.Graphics();
            innerBorder.lineStyle(3, 0xFFFFFF);
            innerBorder.drawEllipse(width / 2, height / 2, width * 0.3, height * 0.2);
            
            this.trackGraphics.addChild(outerBorder);
            this.trackGraphics.addChild(innerBorder);
            
            // 트랙 경로 포인트 저장 (AI 및 충돌 복구용)
            this.trackPath = [];
            
            // 타원형 트랙 경로 포인트 생성 (더 많은 포인트로 부드러운 곡선 생성)
            const numPoints = 24; // 포인트 수 증가
            for (let i = 0; i < numPoints; i++) {
                const angle = (i / numPoints) * Math.PI * 2;
                // 트랙 중앙 경로 (외부와 내부 타원 사이)
                const x = width / 2 + Math.cos(angle) * width * 0.35;
                const y = height / 2 + Math.sin(angle) * height * 0.25;
                this.trackPath.push({ x, y, index: i });
            }
            
            // 커브 가장자리 줄무늬 추가
            this.drawKerbs();
            
        } catch (error) {
            console.error("Error in drawF1Track:", error);
        }
    }
    
    /**
     * 커브 가장자리 줄무늬 그리기 (F1 트랙 특징)
     */
    drawKerbs() {
        const width = this.app.screen.width;
        const height = this.app.screen.height;
        
        // 커브 위치 정의 (주요 커브 구간)
        const kerbPositions = [
            // 우측 상단 커브
            { x: width * 0.8, y: height * 0.2, width: width * 0.1, height: height * 0.1, angle: 0 },
            // 우측 하단 커브
            { x: width * 0.8, y: height * 0.7, width: width * 0.1, height: height * 0.1, angle: Math.PI / 2 },
            // 좌측 하단 커브
            { x: width * 0.2, y: height * 0.7, width: width * 0.1, height: height * 0.1, angle: Math.PI },
            // 좌측 상단 커브
            { x: width * 0.1, y: height * 0.3, width: width * 0.1, height: height * 0.1, angle: -Math.PI / 2 }
        ];
        
        // 각 커브에 줄무늬 추가
        for (const kerb of kerbPositions) {
            this.drawKerbStripes(kerb.x, kerb.y, kerb.width, kerb.height, kerb.angle);
        }
    }
    
    /**
     * 커브 줄무늬 그리기
     * @param {number} x - 중심 x 좌표
     * @param {number} y - 중심 y 좌표
     * @param {number} width - 너비
     * @param {number} height - 높이
     * @param {number} angle - 회전 각도
     */
    drawKerbStripes(x, y, width, height, angle) {
        const stripes = new PIXI.Graphics();
        const stripeCount = 10;
        const stripeWidth = width / stripeCount;
        
        stripes.position.set(x, y);
        stripes.rotation = angle;
        
        for (let i = 0; i < stripeCount; i++) {
            stripes.beginFill(i % 2 === 0 ? this.kerbColor1 : this.kerbColor2);
            stripes.drawRect(i * stripeWidth - width / 2, -height / 2, stripeWidth, height);
            stripes.endFill();
        }
        
        this.kerbsLayer.addChild(stripes);
    }
    
    /**
     * 체크포인트 그리기
     */
    drawCheckpoints() {
        try {
            // 이전 그림 지우기
            this.checkpointsGraphics.clear();
            
            // 시작/결승선 그리기
            if (this.startLine) {
                this.checkpointsGraphics.lineStyle(5, 0x444444); // 흰색에서 회색으로 변경
                this.checkpointsGraphics.moveTo(this.startLine.start.x, this.startLine.start.y);
                this.checkpointsGraphics.lineTo(this.startLine.end.x, this.startLine.end.y);
                
                // 체크무늬 패턴 추가
                const segments = 10;
                const dx = (this.startLine.end.x - this.startLine.start.x) / segments;
                const dy = (this.startLine.end.y - this.startLine.start.y) / segments;
                
                for (let i = 0; i < segments; i++) {
                    if (i % 2 === 0) {
                        this.checkpointsGraphics.beginFill(0x000000);
                        this.checkpointsGraphics.drawRect(
                            this.startLine.start.x + dx * i,
                            this.startLine.start.y + dy * i,
                            dx,
                            dy
                        );
                        this.checkpointsGraphics.endFill();
                    }
                }
            }
        } catch (error) {
            console.error("Error drawing checkpoints:", error);
        }
    }
    
    /**
     * 체크포인트 생성
     */
    generateCheckpoints() {
        const width = this.app.screen.width;
        const height = this.app.screen.height;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // 타원형 트랙에 맞는 체크포인트 위치 정의
        this.checkpoints = [];
        
        // 8개의 체크포인트를 타원 주위에 균등하게 배치
        const numCheckpoints = 8;
        for (let i = 0; i < numCheckpoints; i++) {
            const angle = (i / numCheckpoints) * Math.PI * 2;
            
            // 외부 타원과 내부 타원 사이의 체크포인트 선 생성
            const outerX = centerX + Math.cos(angle) * width * 0.4;
            const outerY = centerY + Math.sin(angle) * height * 0.3;
            const innerX = centerX + Math.cos(angle) * width * 0.3;
            const innerY = centerY + Math.sin(angle) * height * 0.2;
            
            this.checkpoints.push({
                start: { x: outerX, y: outerY },
                end: { x: innerX, y: innerY },
                id: i
            });
        }
        
        // 시작/결승선 설정 (첫 번째 체크포인트)
        this.startLine = this.checkpoints[0];
        
        // 트랙 경로 포인트 생성 (충돌 시 복구용)
        this.generatePathPoints();
    }
    
    /**
     * 트랙 경로 포인트 생성 (충돌 시 복구용)
     */
    generatePathPoints() {
        const width = this.app.screen.width;
        const height = this.app.screen.height;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // 타원형 트랙에 맞는 경로 포인트 생성
        this.pathPoints = [];
        
        // 트랙 중앙 경로 포인트 (차량이 벽에 부딪혔을 때 복구 지점)
        const numPoints = 24; // 포인트 수 증가
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            // 트랙 중앙 경로 (외부와 내부 타원 사이)
            const x = centerX + Math.cos(angle) * width * 0.35;
            const y = centerY + Math.sin(angle) * height * 0.25;
            
            this.pathPoints.push({ x, y });
        }
        
        // 각 경로 포인트에 방향 정보 추가 (다음 포인트 방향)
        for (let i = 0; i < this.pathPoints.length; i++) {
            const nextIdx = (i + 1) % this.pathPoints.length;
            const dx = this.pathPoints[nextIdx].x - this.pathPoints[i].x;
            const dy = this.pathPoints[nextIdx].y - this.pathPoints[i].y;
            const angle = Math.atan2(dy, dx);
            
            this.pathPoints[i].direction = angle;
        }
    }
    
    /**
     * 트랙 장식 추가
     */
    addTrackDecorations() {
        // 트랙 주변 장식 초기화
        this.decorationsLayer.removeChildren();
        
        // 나무를 삭제하고 대신 간단한 장식만 추가
        const width = this.app.screen.width;
        const height = this.app.screen.height;
        
        // 트랙 주변에 간단한 표시만 추가 (성능 최적화)
        const markers = new PIXI.Graphics();
        markers.beginFill(0xFFFFFF);
        
        // 트랙 외부에 거리 표시 마커 추가
        const numMarkers = 16;
        for (let i = 0; i < numMarkers; i++) {
            const angle = (i / numMarkers) * Math.PI * 2;
            const x = width / 2 + Math.cos(angle) * width * 0.45;
            const y = height / 2 + Math.sin(angle) * height * 0.35;
            
            markers.drawCircle(x, y, 3);
        }
        
        markers.endFill();
        this.decorationsLayer.addChild(markers);
    }
    
    /**
     * 나무 생성
     * @returns {PIXI.Container} 나무 컨테이너
     */
    createTree() {
        const tree = new PIXI.Container();
        
        // 나무 줄기
        const trunk = new PIXI.Graphics();
        trunk.beginFill(0x8B4513);
        trunk.drawRect(-5, -15, 10, 30);
        trunk.endFill();
        
        // 나무 잎
        const leaves = new PIXI.Graphics();
        leaves.beginFill(0x006400);
        leaves.drawCircle(0, -25, 20);
        leaves.endFill();
        
        tree.addChild(trunk);
        tree.addChild(leaves);
        
        return tree;
    }
    
    /**
     * 점이 트랙 위에 있는지 확인
     * @param {number} x - x 좌표
     * @param {number} y - y 좌표
     * @returns {boolean} 트랙 위에 있으면 true
     */
    isOnTrack(x, y) {
        const width = this.app.screen.width;
        const height = this.app.screen.height;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // 타원형 트랙 영역 정의
        const outerRx = width * 0.4;
        const outerRy = height * 0.3;
        const innerRx = width * 0.3;
        const innerRy = height * 0.2;
        
        // 점과 중심 사이의 거리 계산 (타원 방정식에 맞게 조정)
        const dx = x - centerX;
        const dy = y - centerY;
        
        // 외부 타원 내부에 있는지 확인
        const insideOuter = (dx * dx) / (outerRx * outerRx) + (dy * dy) / (outerRy * outerRy) <= 1;
        
        // 내부 타원 내부에 있는지 확인
        const insideInner = (dx * dx) / (innerRx * innerRx) + (dy * dy) / (innerRy * innerRy) <= 1;
        
        // 외부 타원 내부에 있으면서 내부 타원 외부에 있어야 트랙 위에 있음
        return insideOuter && !insideInner;
    }
    
    /**
     * 점이 다각형 내부에 있는지 확인 (Ray Casting 알고리즘)
     * @param {number} x - 점의 x 좌표
     * @param {number} y - 점의 y 좌표
     * @param {Array} polygon - 다각형 꼭지점 배열 [{x, y}, ...]
     * @returns {boolean} 다각형 내부에 있으면 true
     */
    pointInPolygon(x, y, polygon) {
        let inside = false;
        
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x;
            const yi = polygon[i].y;
            const xj = polygon[j].x;
            const yj = polygon[j].y;
            
            const intersect = ((yi > y) !== (yj > y)) && 
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                
            if (intersect) inside = !inside;
        }
        
        return inside;
    }
    
    /**
     * 충돌 감지
     * @param {number} x - 확인할 x 좌표
     * @param {number} y - 확인할 y 좌표
     * @param {number} radius - 충돌 반경
     * @returns {boolean} 충돌하면 true
     */
    checkCollision(x, y, radius = 0) {
        // 간단한 충돌 감지: 점이 트랙 위에 없으면 충돌
        return !this.isOnTrack(x, y);
    }
    
    /**
     * 체크포인트 확인
     * @param {Car} car - 차량 객체
     * @returns {boolean} 체크포인트를 통과했으면 true
     */
    checkCheckpoint(car) {
        // 레이스가 끝났으면 체크포인트 확인 건너뛰기
        if (car.raceFinished) {
            return false;
        }
        
        // 모든 체크포인트 확인
        for (let i = 0; i < this.checkpoints.length; i++) {
            const checkpoint = this.checkpoints[i];
            
            // 이미 통과한 체크포인트는 건너뛰기
            if (car.passedCheckpoints && car.passedCheckpoints.includes(checkpoint.id)) {
                continue;
            }
            
            // 차량이 체크포인트 선을 통과했는지 확인
            if (this.lineIntersectsCircle(
                checkpoint.start.x, checkpoint.start.y,
                checkpoint.end.x, checkpoint.end.y,
                car.x, car.y, car.collisionRadius
            )) {
                // 통과한 체크포인트 추가
                if (!car.passedCheckpoints) {
                    car.passedCheckpoints = [];
                }
                car.passedCheckpoints.push(checkpoint.id);
                
                // 디버깅 정보 출력
                console.log(`${car.isAI ? 'AI' : 'Player'} passed checkpoint ${checkpoint.id}, total checkpoints: ${car.passedCheckpoints.length}`);
                
                // 시작/결승선이고 충분한 체크포인트를 통과했으면
                if (checkpoint.id === 0 && car.passedCheckpoints.length > this.checkpoints.length / 2) {
                    // 랩 완료
                    if (typeof car.completeLap === 'function') {
                        car.completeLap();
                        console.log(`${car.isAI ? 'AI' : 'Player'} completed lap, new lap count: ${car.lap}`);
                    }
                    // 통과한 체크포인트 초기화 (완전히 비우기)
                    car.passedCheckpoints = [];
                }
                
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 선분이 원과 교차하는지 확인
     * @param {number} x1 - 선분 시작점의 x 좌표
     * @param {number} y1 - 선분 시작점의 y 좌표
     * @param {number} x2 - 선분 끝점의 x 좌표
     * @param {number} y2 - 선분 끝점의 y 좌표
     * @param {number} cx - 원의 중심 x 좌표
     * @param {number} cy - 원의 중심 y 좌표
     * @param {number} r - 원의 반지름
     * @returns {boolean} 교차하면 true
     */
    lineIntersectsCircle(x1, y1, x2, y2, cx, cy, r) {
        // 선분과 원 사이의 거리 계산
        const dist = this.distToSegment(cx, cy, x1, y1, x2, y2);
        return dist <= r;
    }
    
    /**
     * 점과 선분 사이의 거리 계산
     * @param {number} x - 점의 x 좌표
     * @param {number} y - 점의 y 좌표
     * @param {number} x1 - 선분 시작점의 x 좌표
     * @param {number} y1 - 선분 시작점의 y 좌표
     * @param {number} x2 - 선분 끝점의 x 좌표
     * @param {number} y2 - 선분 끝점의 y 좌표
     * @returns {number} 점과 선분 사이의 거리
     */
    distToSegment(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = x - xx;
        const dy = y - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * 시작 위치 가져오기
     * @returns {Object} 시작 위치 {x, y, rotation}
     */
    getStartPosition() {
        // 시작선 위치 계산
        if (this.startLine) {
            const midX = (this.startLine.start.x + this.startLine.end.x) / 2;
            const midY = (this.startLine.start.y + this.startLine.end.y) / 2;
            
            // 타원형 트랙에 맞게 시작 방향 계산
            const centerX = this.app.screen.width / 2;
            const centerY = this.app.screen.height / 2;
            const width = this.app.screen.width;
            const height = this.app.screen.height;
            
            // 시작점이 타원의 어느 부분에 있는지에 따라 각도 설정
            // 차량이 트랙을 따라 시계 방향으로 주행하도록 설정
            let angle = 0;
            
            // 시작점과 중심 사이의 벡터
            const dx = midX - centerX;
            const dy = midY - centerY;
            
            // 시작점이 타원의 어느 사분면에 있는지 확인
            if (Math.abs(dx) > Math.abs(dy)) {
                // 좌우 위치에 있을 때
                if (dx > 0) {
                    // 오른쪽에 있을 때 - 아래쪽 방향으로 시작
                    angle = Math.PI / 2;
                } else {
                    // 왼쪽에 있을 때 - 위쪽 방향으로 시작
                    angle = -Math.PI / 2;
                }
            } else {
                // 상하 위치에 있을 때
                if (dy > 0) {
                    // 아래쪽에 있을 때 - 왼쪽 방향으로 시작
                    angle = Math.PI;
                } else {
                    // 위쪽에 있을 때 - 오른쪽 방향으로 시작
                    angle = 0;
                }
            }
            
            console.log(`Start position: (${midX}, ${midY}), angle: ${angle}`);
            
            return {
                x: midX,
                y: midY,
                rotation: angle
            };
        }
        
        // 기본 시작 위치 (트랙 상단)
        return {
            x: this.app.screen.width / 2,
            y: this.app.screen.height * 0.2,
            rotation: Math.PI / 2 // 아래쪽 방향
        };
    }
    
    /**
     * 가장 가까운 트랙 경로 포인트 찾기
     * @param {number} x - 차량 x 좌표
     * @param {number} y - 차량 y 좌표
     * @returns {Object} 가장 가까운 경로 포인트와 거리
     */
    getNearestPathPoint(x, y) {
        if (!this.pathPoints || this.pathPoints.length === 0) {
            return null;
        }
        
        let nearestPoint = null;
        let minDistance = Infinity;
        
        // 모든 경로 포인트를 확인하여 가장 가까운 포인트 찾기
        for (const point of this.pathPoints) {
            const dx = point.x - x;
            const dy = point.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestPoint = point;
            }
        }
        
        return {
            point: nearestPoint,
            distance: minDistance
        };
    }
    
    /**
     * 트랙 크기 설정
     * @param {number} width - 캔버스 너비
     * @param {number} height - 캔버스 높이
     */
    setSize(width, height) {
        // 트랙 크기를 캔버스에 맞게 조정
        this.outer.x = width / 2;
        this.outer.y = height / 2;
        this.inner.x = width / 2;
        this.inner.y = height / 2;
        
        // 타원 반지름 조정
        const minDimension = Math.min(width, height);
        this.outer.rx = minDimension * 0.4;
        this.outer.ry = minDimension * 0.3;
        this.inner.rx = minDimension * 0.25;
        this.inner.ry = minDimension * 0.15;
        
        // 체크포인트 재생성
        this.generateCheckpoints();
        
        // 트랙 다시 그리기
        this.drawTrack();
    }
}

// CommonJS 또는 ES 모듈 내보내기 지원
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Track;
} else if (typeof define === 'function' && define.amd) {
    define([], function() { return Track; });
} else {
    window.Track = Track;
}