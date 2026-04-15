import { useEffect, useRef, useCallback } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { useBoxingStore } from '@/store/useBoxingStore';

// Резкое изменение Z-координаты. Чем больше по модулю (минус), тем резче удар
const PUNCH_VELOCITY_THRESHOLD = -0.05; 
const PUNCH_COOLDOWN_MS = 400;

export const usePunchDetection = (videoRef: React.RefObject<HTMLVideoElement | null>) => {
  const setStatus = useBoxingStore((state) => state.setStatus);
  const registerPunch = useBoxingStore((state) => state.registerPunch);
  
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  const lastZRef = useRef<{ left: number; right: number }>({ left: 0, right: 0 });
  const lastPunchTime = useRef<number>(0);

  // Инициализация модели
  useEffect(() => {
    const initModel = async () => {
      setStatus('loading_model');
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/models/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        });
        setStatus('ready');
      } catch (err) {
        console.error("Failed to load Mediapipe model", err);
      }
    };
    initModel();

    return () => {
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [setStatus]);

  // Game Loop: Анализ каждого фрейма
  const detectPunches = useCallback(() => {
    if (!videoRef.current || !landmarkerRef.current) return;
    
    // Не анализируем, если видео не готово
    if (videoRef.current.readyState < 2) {
      requestRef.current = requestAnimationFrame(detectPunches);
      return;
    }

    const startTimeMs = performance.now();
    try {
      const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

      if (results.landmarks && results.landmarks.length > 0) {
        results.landmarks.forEach((hand, index) => {
          // Берем костяшку указательного пальца (landmark 0 - wrist, 5 - index finger mcp)
          if (!hand[5]) return;
          const currentZ = hand[5].z; 
          
          let isLeft = true;
          if (results.handedness && results.handedness[index] && results.handedness[index][0]) {
            const category = results.handedness[index][0].categoryName; // 'Left' или 'Right'
            isLeft = category === 'Left';
          } // fallback if undefined
          
          const previousZ = isLeft ? lastZRef.current.left : lastZRef.current.right;
          const velocityZ = currentZ - previousZ;

          // Если движение по Z (вглубь/от камеры) супер-резкое и прошел кулдаун
          if (velocityZ < PUNCH_VELOCITY_THRESHOLD && (startTimeMs - lastPunchTime.current) > PUNCH_COOLDOWN_MS) {
            // Нормализация силы
            const power = Math.min(Math.abs(velocityZ) * 15, 1.0); 
            
            // Вычисляем очки до обновления стейта, чтобы передать в событие
            const currentCombo = useBoxingStore.getState().combo;
            const earned = Math.round(10 * (currentCombo + 1) * power);
            
            registerPunch(parseFloat(power.toFixed(2)));
            lastPunchTime.current = startTimeMs;
            
            // Custom Event для анимации UI компонентов
            window.dispatchEvent(new CustomEvent('on-punch-hit', { detail: { power, isLeft, earned }}));
          }

          // Обновляем Z
          if (isLeft) lastZRef.current.left = currentZ;
          else lastZRef.current.right = currentZ;
        });
      }
    } catch (e) {
      // suppress occasional video issues
    }

    requestRef.current = requestAnimationFrame(detectPunches);
  }, [videoRef, registerPunch]);

  // Запуск петли когда видео начинает играть
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handlePlay = () => {
        requestRef.current = requestAnimationFrame(detectPunches);
      };
      video.addEventListener('play', handlePlay);
      return () => {
        video.removeEventListener('play', handlePlay);
      };
    }
  }, [detectPunches, videoRef]);
};