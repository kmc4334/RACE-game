/**
 * 게임 오디오 클래스
 * 게임의 모든 사운드 효과와 음악을 관리합니다.
 */
class GameAudio {
    constructor() {
        // Tone.js 초기화
        this.initialized = false;
        this.musicEnabled = true;
        this.soundEnabled = true;
        
        // 엔진 사운드
        this.engineSound = null;
        this.engineVolume = null;
        
        // 드리프트 사운드
        this.driftSound = null;
        this.driftVolume = null;
        
        // 배경 음악
        this.backgroundMusic = null;
        
        // 초기화
        this.init();
    }
    
    /**
     * 오디오 시스템 초기화
     */
    async init() {
        try {
            // Tone.js 시작
            await Tone.start();
            this.initialized = true;
            
            // 엔진 사운드 생성
            this.engineVolume = new Tone.Volume(-10).toDestination();
            this.engineSound = new Tone.Oscillator({
                frequency: 200,
                type: "sawtooth",
                volume: -20
            }).connect(this.engineVolume);
            
            // 엔진 사운드에 필터 추가
            this.engineFilter = new Tone.Filter({
                frequency: 800,
                type: "lowpass",
                rolloff: -24
            }).connect(this.engineVolume);
            
            this.engineSound.connect(this.engineFilter);
            
            // 드리프트 사운드 생성
            this.driftVolume = new Tone.Volume(-20).toDestination();
            this.driftSound = new Tone.Noise({
                type: "pink",
                volume: -30
            }).connect(this.driftVolume);
            
            // 드리프트 사운드에 필터 추가
            this.driftFilter = new Tone.Filter({
                frequency: 1000,
                type: "bandpass",
                Q: 2
            }).connect(this.driftVolume);
            
            this.driftSound.connect(this.driftFilter);
            
            // 배경 음악 생성
            this.createBackgroundMusic();
            
            console.log("Audio system initialized");
        } catch (e) {
            console.error("Error initializing audio system:", e);
            this.initialized = false;
        }
    }
    
    /**
     * 배경 음악 생성
     */
    createBackgroundMusic() {
        // 신스 생성
        const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "triangle"
            },
            envelope: {
                attack: 0.1,
                decay: 0.3,
                sustain: 0.4,
                release: 0.8
            }
        });
        
        // 이펙트 체인
        const reverb = new Tone.Reverb(1.5);
        const delay = new Tone.FeedbackDelay("8n", 0.3);
        const volume = new Tone.Volume(-15);
        
        // 이펙트 연결
        synth.chain(delay, reverb, volume, Tone.Destination);
        
        // 시퀀서 생성
        const notes = ["C3", "G3", "A#3", "F3"];
        const durations = ["8n", "8n", "8n", "8n"];
        
        this.backgroundMusic = new Tone.Sequence((time, note, index) => {
            synth.triggerAttackRelease(note, durations[index], time);
        }, notes, "4n");
        
        // 템포 설정
        Tone.Transport.bpm.value = 120;
    }
    
    /**
     * 엔진 사운드 시작
     */
    startEngine() {
        if (!this.initialized || !this.soundEnabled) return;
        
        try {
            this.engineSound.start();
        } catch (e) {
            console.error("Error starting engine sound:", e);
        }
    }
    
    /**
     * 엔진 사운드 정지
     */
    stopEngine() {
        if (!this.initialized) return;
        
        try {
            this.engineSound.stop();
        } catch (e) {
            console.error("Error stopping engine sound:", e);
        }
    }
    
    /**
     * 배경 음악 시작
     */
    startBackgroundMusic() {
        if (!this.initialized || !this.musicEnabled) return;
        
        try {
            Tone.Transport.start();
            this.backgroundMusic.start();
        } catch (e) {
            console.error("Error starting background music:", e);
        }
    }
    
    /**
     * 배경 음악 정지
     */
    stopBackgroundMusic() {
        if (!this.initialized) return;
        
        try {
            this.backgroundMusic.stop();
            Tone.Transport.stop();
        } catch (e) {
            console.error("Error stopping background music:", e);
        }
    }
    
    /**
     * 엔진 사운드 업데이트
     * @param {number} velocity - 차량 속도
     * @param {number} acceleration - 차량 가속도
     */
    updateEngineSound(velocity, acceleration) {
        if (!this.initialized || !this.soundEnabled) return;
        
        try {
            // 속도에 따른 엔진 소리 주파수 변경
            const baseFreq = 200;
            const speedFactor = Math.abs(velocity) / 100;
            const accelFactor = Math.max(0, acceleration / 10);
            
            // 주파수 계산 (속도가 높을수록 높은 소리)
            const frequency = baseFreq + (speedFactor * 400) + (accelFactor * 200);
            
            // 볼륨 계산 (가속도가 높을수록 큰 소리)
            const volume = -20 + (speedFactor * 5) + (accelFactor * 10);
            
            // 필터 주파수 계산
            const filterFreq = 800 + (speedFactor * 1200);
            
            // 값 적용
            this.engineSound.frequency.rampTo(frequency, 0.1);
            this.engineVolume.volume.rampTo(volume, 0.1);
            this.engineFilter.frequency.rampTo(filterFreq, 0.1);
        } catch (e) {
            console.error("Error updating engine sound:", e);
        }
    }
    
    /**
     * 드리프트 사운드 업데이트
     * @param {number} driftAmount - 드리프트 정도
     */
    updateDriftSound(driftAmount) {
        if (!this.initialized || !this.soundEnabled) return;
        
        try {
            // 드리프트 정도에 따른 소리 조절
            if (driftAmount > 0.2) {
                // 드리프트 중이면 소리 켜기
                if (!this.driftSound.state === "started") {
                    this.driftSound.start();
                }
                
                // 드리프트 정도에 따른 볼륨 조절
                const volume = -30 + (driftAmount * 20);
                this.driftVolume.volume.rampTo(volume, 0.1);
                
                // 드리프트 정도에 따른 필터 주파수 조절
                const filterFreq = 1000 + (driftAmount * 2000);
                this.driftFilter.frequency.rampTo(filterFreq, 0.1);
            } else {
                // 드리프트 중이 아니면 소리 끄기
                if (this.driftSound.state === "started") {
                    this.driftVolume.volume.rampTo(-60, 0.2);
                    setTimeout(() => {
                        if (this.driftSound) {
                            this.driftSound.stop();
                        }
                    }, 200);
                }
            }
        } catch (e) {
            console.error("Error updating drift sound:", e);
        }
    }
    
    /**
     * UI 사운드 재생
     * @param {string} note - 재생할 음표
     */
    playUISound(note = "C4") {
        if (!this.initialized || !this.soundEnabled) return;
        
        try {
            const synth = new Tone.Synth({
                oscillator: {
                    type: "triangle"
                },
                envelope: {
                    attack: 0.01,
                    decay: 0.1,
                    sustain: 0.2,
                    release: 0.5
                }
            }).toDestination();
            
            synth.volume.value = -10;
            synth.triggerAttackRelease(note, "16n");
            
            // 자동 정리
            setTimeout(() => {
                synth.dispose();
            }, 1000);
        } catch (e) {
            console.error("Error playing UI sound:", e);
        }
    }
    
    /**
     * 카운트다운 사운드 재생
     */
    playCountdown() {
        if (!this.initialized || !this.soundEnabled) return;
        
        try {
            const synth = new Tone.Synth({
                oscillator: {
                    type: "triangle"
                },
                envelope: {
                    attack: 0.01,
                    decay: 0.1,
                    sustain: 0.2,
                    release: 0.5
                }
            }).toDestination();
            
            synth.volume.value = -10;
            
            // 3, 2, 1 카운트다운
            setTimeout(() => synth.triggerAttackRelease("G3", "16n"), 0);
            setTimeout(() => synth.triggerAttackRelease("G3", "16n"), 1000);
            setTimeout(() => synth.triggerAttackRelease("G3", "16n"), 2000);
            
            // 출발 사운드
            setTimeout(() => {
                synth.triggerAttackRelease("C4", "8n");
                
                // 자동 정리
                setTimeout(() => {
                    synth.dispose();
                }, 1000);
            }, 3000);
        } catch (e) {
            console.error("Error playing countdown sound:", e);
        }
    }
    
    /**
     * 음악 토글
     * @param {boolean} enabled - 활성화 여부
     */
    toggleMusic(enabled) {
        this.musicEnabled = enabled;
        
        if (this.initialized) {
            if (enabled) {
                this.startBackgroundMusic();
            } else {
                this.stopBackgroundMusic();
            }
        }
    }
    
    /**
     * 효과음 토글
     * @param {boolean} enabled - 활성화 여부
     */
    toggleSound(enabled) {
        this.soundEnabled = enabled;
        
        if (this.initialized) {
            if (!enabled) {
                // 모든 효과음 끄기
                if (this.engineSound && this.engineSound.state === "started") {
                    this.engineSound.stop();
                }
                
                if (this.driftSound && this.driftSound.state === "started") {
                    this.driftSound.stop();
                }
            } else {
                // 게임이 실행 중이면 효과음 다시 시작
                if (window.gameRunning) {
                    this.startEngine();
                }
            }
        }
    }
}