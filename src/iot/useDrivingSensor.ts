import { Accelerometer } from "expo-sensors";
import { useCallback, useEffect, useRef, useState } from "react";
import { initialDriving, reduceDriving, type DrivingState } from "@/domain/driving";

/**
 * Sensor: acelerômetro do celular (expo-sensors).
 * Amostragem de 5 Hz (200 ms) — suficiente para detectar frenagens bruscas
 * sem exigir a permissão HIGH_SAMPLING_RATE_SENSORS do Android 12+.
 */
export function useDrivingSensor() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState<DrivingState>(initialDriving);
  const stateRef = useRef(initialDriving);

  useEffect(() => {
    Accelerometer.isAvailableAsync()
      .then(setAvailable)
      .catch(() => setAvailable(false));
  }, []);

  useEffect(() => {
    if (!enabled || !available) return;
    Accelerometer.setUpdateInterval(200);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      stateRef.current = reduceDriving(stateRef.current, { x, y, z, t: Date.now() });
      setState(stateRef.current);
    });
    return () => sub.remove();
  }, [enabled, available]);

  const reset = useCallback(() => {
    stateRef.current = initialDriving;
    setState(initialDriving);
  }, []);

  return { available, enabled, setEnabled, state, reset };
}
