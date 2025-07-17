// 유틸리티 함수

// 시간 포맷팅 함수 (밀리초를 MM:SS.mm 형식으로 변환 - 소수점 2자리로 줄임)
function formatTime(milliseconds) {
    if (milliseconds === Infinity) return '--:--.--';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    // 밀리초를 2자리로 줄임 (10ms 단위로 표시)
    const ms = Math.floor((milliseconds % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

// 로컬 스토리지에 데이터 저장
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Error saving to localStorage:', e);
        return false;
    }
}

// 로컬 스토리지에서 데이터 로드
function loadFromStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Error loading from localStorage:', e);
        return null;
    }
}

// 값을 최소/최대 범위 내로 제한
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// 최소값과 최대값 사이의 랜덤 값 생성
function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

// 두 점 사이의 거리 계산
function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// 점이 다각형 내부에 있는지 확인 (Ray casting algorithm)
function pointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        
        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}