"""
레이싱 게임 AI 드라이버 - 파이썬 버전
트랙을 따라 자동으로 주행하는 AI 로직을 구현합니다.
"""
import math
import js

class PythonAIDriver:
    """
    파이썬으로 구현한 AI 드라이버 클래스
    """
    def __init__(self):
        """
        AI 드라이버 초기화
        """
        self.car = None
        self.track = None
        
        # AI 제어 속성
        self.controls = {
            "up": False,
            "down": False,
            "left": False,
            "right": False
        }
        
        # AI 설정
        self.look_ahead_distance = 100  # 앞을 내다보는 거리
        self.steering_response = 0.1    # 조향 응답성
        self.throttle_response = 0.8    # 가속 응답성
        self.brake_response = 0.9       # 제동 응답성
        
        # 경로 계획
        self.target_points = []
        self.current_target_index = 0
        
        print("Python AI Driver initialized")
    
    def set_car_and_track(self, car, track):
        """
        차량과 트랙 설정
        """
        self.car = car
        self.track = track
        self.plan_path()
        print("Python AI: Car and track set")
    
    def plan_path(self):
        """
        경로 계획
        """
        # 트랙 경로를 따라 목표 지점 설정
        if not self.track or not hasattr(self.track, "trackPath"):
            print("Python AI: Track not available for path planning")
            return
            
        # JavaScript 배열을 파이썬 리스트로 변환
        self.target_points = list(self.track.trackPath)
        self.current_target_index = 0
        
        print(f"Python AI: Path planned with {len(self.target_points)} points")
    
    def select_next_target(self):
        """
        다음 목표 지점 선택
        """
        if not self.track or not self.car:
            return
            
        # 현재 위치에서 가장 가까운 경로 지점 찾기
        nearest_path = self.track.getNearestPathPoint(self.car.x, self.car.y)
        
        if nearest_path and hasattr(nearest_path, "point"):
            # 가장 가까운 포인트의 인덱스 찾기
            nearest_index = 0
            min_distance = float('inf')
            
            for i in range(len(self.track.trackPath)):
                point = self.track.trackPath[i]
                dx = point.x - nearest_path.point.x
                dy = point.y - nearest_path.point.y
                distance = math.sqrt(dx * dx + dy * dy)
                
                if distance < min_distance:
                    min_distance = distance
                    nearest_index = i
            
            # 속도가 높을수록 더 멀리 내다보기
            look_ahead_steps = max(4, int(abs(self.car.velocity) / 15))
            self.current_target_index = (nearest_index + look_ahead_steps) % len(self.track.trackPath)
            
            # 트랙 이탈 시 더 가까운 지점을 목표로 설정
            if not self.track.isOnTrack(self.car.x, self.car.y):
                self.current_target_index = (nearest_index + 2) % len(self.track.trackPath)
        else:
            # 기본값으로 다음 인덱스 사용
            self.current_target_index = (self.current_target_index + 1) % len(self.track.trackPath)
    
    def calculate_steering(self):
        """
        조향 각도 계산
        """
        # 현재 목표 지점이 유효한지 확인
        if not self.track or not hasattr(self.track, "trackPath") or self.current_target_index >= len(self.track.trackPath):
            return 0
        
        target = self.track.trackPath[self.current_target_index]
        if not target:
            return 0
        
        # 목표 지점까지의 벡터
        dx = target.x - self.car.x
        dy = target.y - self.car.y
        
        # 목표까지의 거리가 너무 가까우면 다음 목표로
        distance = math.sqrt(dx * dx + dy * dy)
        if distance < 30:
            self.current_target_index = (self.current_target_index + 1) % len(self.track.trackPath)
            return self.calculate_steering()  # 재귀 호출로 다음 목표 확인
        
        # 목표 방향 계산
        target_angle = math.atan2(dy, dx)
        
        # 현재 방향과 목표 방향의 차이 계산
        angle_diff = target_angle - self.car.angle
        
        # 각도 차이를 -PI ~ PI 범위로 조정
        while angle_diff > math.pi:
            angle_diff -= math.pi * 2
        while angle_diff < -math.pi:
            angle_diff += math.pi * 2
        
        # 속도에 따른 조향 민감도 조정
        speed_factor = min(abs(self.car.velocity) / 100, 1)
        
        # 트랙 이탈 여부에 따라 조향 민감도 조정
        if not self.track.isOnTrack(self.car.x, self.car.y):
            # 트랙 이탈 시 더 민감하게 반응
            steering_sensitivity = 1.2
        else:
            # 정상 주행 시 속도에 따라 조정
            steering_sensitivity = 1 - speed_factor * 0.3  # 고속에서는 덜 민감하게
        
        # 조향 각도 계산 (-1 ~ 1)
        steering_input = (angle_diff / (math.pi / 3)) * steering_sensitivity
        
        # 트랙 이탈 시 더 강한 조향 적용
        if not self.track.isOnTrack(self.car.x, self.car.y):
            if steering_input > 0:
                steering_input = min(1.0, steering_input * 1.5)
            else:
                steering_input = max(-1.0, steering_input * 1.5)
        
        return max(-1, min(1, steering_input))
    
    def calculate_speed_control(self):
        """
        속도 제어 계산
        """
        # 현재 목표 지점이 유효한지 확인
        if not self.track or not hasattr(self.track, "trackPath") or self.current_target_index >= len(self.track.trackPath):
            return {"throttle": 0.5, "brake": 0}  # 기본적으로 가속
        
        target = self.track.trackPath[self.current_target_index]
        if not target:
            return {"throttle": 0.5, "brake": 0}  # 기본적으로 가속
        
        # 앞쪽 여러 지점을 확인하여 커브 강도 계산
        max_curvature = 0
        look_ahead_points = 10  # 더 멀리 내다보기
        
        for i in range(look_ahead_points):
            idx1 = (self.current_target_index + i) % len(self.track.trackPath)
            idx2 = (self.current_target_index + i + 1) % len(self.track.trackPath)
            idx3 = (self.current_target_index + i + 2) % len(self.track.trackPath)
            
            p1 = self.track.trackPath[idx1]
            p2 = self.track.trackPath[idx2]
            p3 = self.track.trackPath[idx3]
            
            if not p1 or not p2 or not p3:
                continue
            
            # 세 점을 이용한 곡률 계산
            angle1 = math.atan2(p2.y - p1.y, p2.x - p1.x)
            angle2 = math.atan2(p3.y - p2.y, p3.x - p2.x)
            
            angle_diff = abs(angle2 - angle1)
            while angle_diff > math.pi:
                angle_diff = math.pi * 2 - angle_diff
            
            max_curvature = max(max_curvature, angle_diff)
        
        # 커브 강도에 따른 목표 속도 계산
        curve_factor = max_curvature / math.pi
        base_speed = 150  # 기본 속도
        min_speed = 60    # 최소 속도
        target_speed = max(min_speed, base_speed - curve_factor * 100)  # 커브에서 더 감속
        
        # 현재 속도
        current_speed = abs(self.car.velocity)
        
        # 트랙 경계와의 거리 확인
        is_near_boundary = not self.track.isOnTrack(self.car.x, self.car.y)
        
        # 스로틀 및 브레이크 값 계산
        throttle = 0
        brake = 0
        
        if is_near_boundary:
            # 트랙 경계 근처에서는 속도 감소하고 트랙 중앙으로 복귀
            brake = 0.9  # 더 강한 제동
            throttle = 0
            
            # 트랙 중앙으로 복귀 시도
            nearest_path = self.track.getNearestPathPoint(self.car.x, self.car.y)
            if nearest_path and hasattr(nearest_path, "point") and hasattr(nearest_path.point, "index"):
                # 다음 목표 지점을 트랙 중앙으로 설정
                self.current_target_index = nearest_path.point.index
        elif current_speed < target_speed * 0.9:
            # 목표 속도보다 낮으면 가속
            speed_ratio = current_speed / target_speed
            throttle = max(0.6, self.throttle_response * (1 - speed_ratio))
        elif current_speed > target_speed * 1.1:
            # 목표 속도보다 높으면 제동
            excess_speed = (current_speed - target_speed) / target_speed
            brake = min(1, self.brake_response * excess_speed)
        else:
            # 속도 유지
            throttle = 0.7
        
        # 차량이 움직이지 않으면 강제로 가속
        if current_speed < 5:
            throttle = 1.0
            brake = 0
        
        return {"throttle": throttle, "brake": brake}
    
    def update(self, delta):
        """
        AI 업데이트
        """
        # 차량과 트랙이 유효한지 확인
        if not self.car or not self.track or not hasattr(self.track, "trackPath"):
            print("Python AI: Missing required components")
            return
        
        try:
            # 다음 목표 지점 선택
            self.select_next_target()
            
            # 조향 계산
            steering = self.calculate_steering()
            
            # 속도 제어 계산
            speed_control = self.calculate_speed_control()
            
            # 컨트롤 업데이트
            self.controls["left"] = steering < -0.05
            self.controls["right"] = steering > 0.05
            self.controls["up"] = speed_control["throttle"] > 0.05
            self.controls["down"] = speed_control["brake"] > 0.05
            
            # 차량이 움직이지 않는 경우 강제로 가속
            if abs(self.car.velocity) < 1:
                self.controls["up"] = True
                self.controls["down"] = False
                print("Python AI: Forcing acceleration")
            
            # 차량 업데이트
            self.car.update(delta, self.controls)
            
            # 디버깅 정보 출력 (10초마다)
            current_time = js.Date.now()
            if int(current_time / 10000) % 2 == 0 and int(current_time / 1000) % 10 == 0:
                print(f"Python AI position: ({round(self.car.x)}, {round(self.car.y)}), velocity: {round(self.car.velocity)}")
            
        except Exception as e:
            print(f"Python AI update error: {str(e)}")
            # 오류 발생 시 안전한 기본 동작
            self.controls = {
                "up": True,  # 기본적으로 가속
                "down": False,
                "left": False,
                "right": False
            }
            
            # 차량 업데이트 (오류 발생해도 계속 움직이도록)
            if self.car:
                self.car.update(delta, self.controls)

# 전역 인스턴스 생성
python_ai_driver = PythonAIDriver()

# JavaScript에서 호출할 함수들
def set_car_and_track(car, track):
    """JavaScript에서 차량과 트랙 설정"""
    python_ai_driver.set_car_and_track(car, track)
    return True

def update_ai(delta):
    """JavaScript에서 AI 업데이트"""
    python_ai_driver.update(delta)
    return True

# JavaScript에서 접근할 수 있도록 함수 노출
js.window.pythonAI = {
    "setCarAndTrack": set_car_and_track,
    "update": update_ai
}

print("Python AI module loaded successfully")