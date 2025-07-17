/**
 * 효과 시스템 클래스
 * 게임의 시각적 효과를 관리합니다.
 */
class Effects {
    /**
     * 효과 시스템 생성자
     * @param {PIXI.Application} app - PIXI 애플리케이션 인스턴스
     */
    constructor(app) {
        this.app = app;
        this.container = new PIXI.Container();
        this.app.stage.addChild(this.container);

        // 파티클 컨테이너
        this.particles = [];
        this.particleContainer = new PIXI.ParticleContainer(1000, {
            scale: true,
            position: true,
            rotation: true,
            alpha: true
        });
        this.container.addChild(this.particleContainer);

        // 광원 효과 컨테이너
        this.lightEffects = new PIXI.Container();
        this.container.addChild(this.lightEffects);

        // 후처리 효과
        this.postProcessing = new PIXI.Container();
        this.app.stage.addChild(this.postProcessing);

        // 모션 블러 효과 (비활성화)
        this.motionBlur = new PIXI.Graphics();
        // 모션 블러를 비활성화하여 화면 덮임 문제 해결
        // this.motionBlur.beginFill(0xFFFFFF, 0.1);
        // this.motionBlur.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        // this.motionBlur.endFill();
        this.motionBlur.alpha = 0;
        // this.postProcessing.addChild(this.motionBlur);

        // 비네트 효과
        this.createVignette();
    }

    /**
     * 비네트 효과 생성 (완전 비활성화)
     */
    createVignette() {
        // 비네트 효과를 완전히 비활성화하여 화면 덮임 문제 해결
        // 아무것도 생성하지 않음
    }

    /**
     * 파티클 생성
     * @param {number} x - x 좌표
     * @param {number} y - y 좌표
     * @param {Object} options - 파티클 옵션
     * @returns {PIXI.Graphics} 생성된 파티클
     */
    createParticle(x, y, options = {}) {
        // 기본 옵션
        const defaults = {
            color: 0xFFFFFF,
            size: 5,
            speed: 2,
            lifetime: 1,
            alpha: 1,
            gravity: 0,
            rotation: 0,
            rotationSpeed: 0,
            direction: Math.random() * Math.PI * 2
        };

        // 옵션 병합
        const settings = { ...defaults, ...options };

        // 파티클 스프라이트 생성
        let particle;

        if (settings.texture) {
            particle = new PIXI.Sprite(settings.texture);
            particle.anchor.set(0.5);
            particle.width = settings.size;
            particle.height = settings.size;
        } else {
            particle = new PIXI.Graphics();
            particle.beginFill(settings.color, settings.alpha);

            if (settings.shape === 'circle') {
                particle.drawCircle(0, 0, settings.size / 2);
            } else {
                particle.drawRect(-settings.size / 2, -settings.size / 2, settings.size, settings.size);
            }

            particle.endFill();
        }

        // 위치 설정
        particle.x = x;
        particle.y = y;

        // 속성 설정
        particle.vx = Math.cos(settings.direction) * settings.speed;
        particle.vy = Math.sin(settings.direction) * settings.speed;
        particle.gravity = settings.gravity;
        particle.lifetime = settings.lifetime;
        particle.alpha = settings.alpha;
        particle.rotation = settings.rotation;
        particle.rotationSpeed = settings.rotationSpeed;
        particle.scaleSpeed = settings.scaleSpeed || 0;
        particle.fadeSpeed = settings.fadeSpeed || (1 / settings.lifetime);

        // 컨테이너에 추가
        this.particleContainer.addChild(particle);
        this.particles.push(particle);

        return particle;
    }

    /**
     * 폭발 효과 생성
     * @param {number} x - x 좌표
     * @param {number} y - y 좌표
     * @param {Object} options - 폭발 옵션
     */
    createExplosion(x, y, options = {}) {
        // 기본 옵션
        const defaults = {
            particleCount: 20,
            colors: [0xFF0000, 0xFF7700, 0xFFFF00],
            minSize: 3,
            maxSize: 8,
            minSpeed: 1,
            maxSpeed: 5,
            lifetime: 1,
            spread: Math.PI * 2
        };

        // 옵션 병합
        const settings = { ...defaults, ...options };

        // 모든 방향으로 파티클 생성
        for (let i = 0; i < settings.particleCount; i++) {
            const direction = (settings.baseDirection || 0) + (Math.random() - 0.5) * settings.spread;
            const color = settings.colors[Math.floor(Math.random() * settings.colors.length)];
            const size = randomRange(settings.minSize, settings.maxSize);
            const speed = randomRange(settings.minSpeed, settings.maxSpeed);
            const lifetime = settings.lifetime * (0.7 + Math.random() * 0.6); // 수명 약간 변화

            this.createParticle(x, y, {
                color,
                size,
                speed,
                lifetime,
                direction,
                shape: 'circle',
                alpha: 0.8,
                fadeSpeed: 1 / lifetime,
                scaleSpeed: -size / (lifetime * 60) // 수명에 따라 크기 감소
            });
        }

        // 플래시 효과
        const flash = new PIXI.Graphics();
        flash.beginFill(0xFFFFFF, 0.8);
        flash.drawCircle(0, 0, 30);
        flash.endFill();
        flash.x = x;
        flash.y = y;
        this.lightEffects.addChild(flash);

        // 플래시 애니메이션
        gsap.to(flash, {
            alpha: 0,
            scale: 2,
            duration: 0.5,
            ease: 'power2.out',
            onComplete: () => {
                this.lightEffects.removeChild(flash);
            }
        });
    }

    /**
     * 먼지 흔적 생성
     * @param {number} x - x 좌표
     * @param {number} y - y 좌표
     * @param {number} direction - 방향 (라디안)
     * @param {number} speed - 속도
     */
    createDustTrail(x, y, direction, speed) {
        // 속도가 충분히 빠를 때만 먼지 생성
        if (speed < 50) return;

        // 속도에 따른 먼지 파티클 수
        const particleCount = Math.floor(speed / 50);

        for (let i = 0; i < particleCount; i++) {
            // 먼지는 차량 뒤에 나타나야 함
            const offsetDirection = direction + Math.PI + (Math.random() - 0.5) * 0.5;
            const offsetDistance = randomRange(10, 20);
            const offsetX = x + Math.cos(offsetDirection) * offsetDistance;
            const offsetY = y + Math.sin(offsetDirection) * offsetDistance;

            // 먼지 파티클 생성
            this.createParticle(offsetX, offsetY, {
                color: 0xCCCCCC,
                size: randomRange(3, 8),
                speed: randomRange(0.5, 1.5),
                lifetime: randomRange(0.5, 1.5),
                direction: Math.random() * Math.PI * 2,
                shape: 'circle',
                alpha: 0.3,
                fadeSpeed: 0.05
            });
        }
    }

    /**
     * 스키드 마크 생성
     * @param {number} x - x 좌표
     * @param {number} y - y 좌표
     * @param {number} direction - 방향 (라디안)
     * @param {number} intensity - 강도
     */
    createSkidMarks(x, y, direction, intensity) {
        // 강도가 충분히 높을 때만 스키드 마크 생성
        if (intensity < 0.3) return;

        // 강도에 따른 스키드 마크 파티클 수
        const particleCount = Math.floor(intensity * 3);

        for (let i = 0; i < particleCount; i++) {
            // 스키드 마크는 바퀴에 나타나야 함
            const wheelOffset = (i % 2 === 0) ? -10 : 10; // 왼쪽 또는 오른쪽 바퀴
            const offsetX = x + Math.cos(direction + Math.PI / 2) * wheelOffset;
            const offsetY = y + Math.sin(direction + Math.PI / 2) * wheelOffset;

            // 스키드 마크 파티클 생성
            this.createParticle(offsetX, offsetY, {
                color: 0x333333,
                size: randomRange(3, 6),
                speed: 0.1,
                lifetime: randomRange(3, 5),
                direction: direction + Math.PI + (Math.random() - 0.5) * 0.2,
                shape: 'circle',
                alpha: 0.7,
                fadeSpeed: 0.01
            });
        }
    }

    /**
     * 스피드 라인 생성
     * @param {number} x - x 좌표
     * @param {number} y - y 좌표
     * @param {number} direction - 방향 (라디안)
     * @param {number} speed - 속도
     */
    createSpeedLines(x, y, direction, speed) {
        // 속도가 충분히 빠를 때만 스피드 라인 생성
        if (speed < 150) return;

        // 속도에 따른 스피드 라인 수
        const particleCount = Math.floor(speed / 100);

        for (let i = 0; i < particleCount; i++) {
            // 스피드 라인은 화면 가장자리에 나타나야 함
            const screenEdgeDistance = 100;
            const screenX = this.app.screen.width / 2;
            const screenY = this.app.screen.height / 2;

            // 화면 가장자리의 랜덤 위치 계산
            const angle = Math.random() * Math.PI * 2;
            const edgeX = screenX + Math.cos(angle) * screenEdgeDistance;
            const edgeY = screenY + Math.sin(angle) * screenEdgeDistance;

            // 스피드 라인 파티클 생성
            const lineLength = randomRange(20, 50);
            const lineWidth = randomRange(1, 3);

            const speedLine = new PIXI.Graphics();
            speedLine.lineStyle(lineWidth, 0xFFFFFF, 0.3);
            speedLine.moveTo(0, 0);
            speedLine.lineTo(lineLength, 0);

            speedLine.x = edgeX;
            speedLine.y = edgeY;
            speedLine.rotation = Math.atan2(y - edgeY, x - edgeX);

            // 컨테이너에 추가
            this.container.addChild(speedLine);

            // 스피드 라인 애니메이션
            gsap.to(speedLine, {
                alpha: 0,
                x: x,
                y: y,
                duration: randomRange(0.2, 0.5),
                ease: 'power1.in',
                onComplete: () => {
                    this.container.removeChild(speedLine);
                }
            });
        }
    }

    /**
     * 모션 블러 업데이트 (비활성화)
     * @param {number} speed - 속도
     */
    updateMotionBlur(speed) {
        // 모션 블러를 완전히 비활성화하여 화면 덮임 문제 해결
        if (this.motionBlur) {
            this.motionBlur.alpha = 0;
        }
    }

    /**
     * 효과 업데이트
     * @param {number} delta - 프레임 델타 시간
     */
    update(delta) {
        try {
            // 파티클 배열이 없으면 초기화
            if (!this.particles) {
                this.particles = [];
                return;
            }
            
            // 파티클 컨테이너가 없으면 초기화
            if (!this.particleContainer) {
                this.particleContainer = new PIXI.ParticleContainer(1000, {
                    scale: true,
                    position: true,
                    rotation: true,
                    alpha: true
                });
                this.container.addChild(this.particleContainer);
                return;
            }
            
            // 파티클 업데이트
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const particle = this.particles[i];
                
                // 유효하지 않은 파티클 건너뛰기
                if (!particle) {
                    this.particles.splice(i, 1);
                    continue;
                }

                // 위치 업데이트
                particle.x += particle.vx * delta;
                particle.y += particle.vy * delta;

                // 중력 적용
                if (particle.gravity) {
                    particle.vy += particle.gravity * delta;
                }

                // 회전 업데이트
                if (particle.rotationSpeed) {
                    particle.rotation += particle.rotationSpeed * delta;
                }

                // 크기 업데이트
                if (particle.scaleSpeed && particle.scale) {
                    particle.scale.x += particle.scaleSpeed * delta;
                    particle.scale.y += particle.scaleSpeed * delta;

                    // 최소 크기 보장
                    if (particle.scale.x < 0.01) particle.scale.x = 0.01;
                    if (particle.scale.y < 0.01) particle.scale.y = 0.01;
                }

                // 알파값 업데이트
                if (particle.fadeSpeed) {
                    particle.alpha -= particle.fadeSpeed * delta;
                }

                // 수명 업데이트
                particle.lifetime -= delta / 60;

                // 죽은 파티클 제거
                if (particle.lifetime <= 0 || particle.alpha <= 0) {
                    try {
                        if (particle.parent) {
                            particle.parent.removeChild(particle);
                        } else if (this.particleContainer) {
                            this.particleContainer.removeChild(particle);
                        }
                    } catch (e) {
                        console.warn("Error removing particle:", e);
                    }
                    this.particles.splice(i, 1);
                }
            }
        } catch (error) {
            console.error("Error updating effects:", error);
            // 오류 발생 시 파티클 배열 초기화
            this.particles = [];
        }
    }

    /**
     * 효과 시스템 제거
     */
    destroy() {
        // 모든 파티클 제거
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            this.particleContainer.removeChild(particle);
        }
        this.particles = [];

        // 파티클 컨테이너 비우기
        this.particleContainer.removeChildren();

        // 광원 효과 컨테이너 비우기
        this.lightEffects.removeChildren();

        // 후처리 효과 비우기
        this.postProcessing.removeChildren();

        // 메인 컨테이너에서 제거
        if (this.app && this.app.stage) {
            this.app.stage.removeChild(this.container);
            this.app.stage.removeChild(this.postProcessing);
        }
    }
}