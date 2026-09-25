/**
 * Estilo de condução a partir do acelerômetro do celular (expo-sensors).
 * O celular, preso ao painel, funciona como um sensor inercial: picos de aceleração
 * indicam frenagens/arrancadas bruscas, que aceleram o desgaste de freios e pneus.
 *
 * Filtro passa-alta: a gravidade é estimada por um passa-baixa exponencial e removida
 * da leitura, sobrando só a aceleração linear — independente da posição do aparelho.
 */
export type Vec3 = { x: number; y: number; z: number };
export type AccelSample = Vec3 & { t: number };

export type DrivingState = {
  samples: number;
  harshEvents: number;
  lastEventAt: number;
  peakG: number;
  currentG: number;
  gravity: Vec3 | null;
};

export const HARSH_THRESHOLD_G = 0.35;
const DEBOUNCE_MS = 1500;
const ALPHA = 0.8;

export const initialDriving: DrivingState = { samples: 0, harshEvents: 0, lastEventAt: Number.NEGATIVE_INFINITY, peakG: 0, currentG: 0, gravity: null };

/** Módulo de um vetor de aceleração, em g */
export function magnitude({ x, y, z }: Vec3): number {
  return Math.sqrt(x * x + y * y + z * z);
}

export function reduceDriving(state: DrivingState, sample: AccelSample): DrivingState {
  const prev = state.gravity || { x: sample.x, y: sample.y, z: sample.z };
  const gravity = {
    x: ALPHA * prev.x + (1 - ALPHA) * sample.x,
    y: ALPHA * prev.y + (1 - ALPHA) * sample.y,
    z: ALPHA * prev.z + (1 - ALPHA) * sample.z
  };
  const g = state.gravity ? magnitude({ x: sample.x - gravity.x, y: sample.y - gravity.y, z: sample.z - gravity.z }) : 0;
  const isHarsh = g >= HARSH_THRESHOLD_G && sample.t - state.lastEventAt > DEBOUNCE_MS;
  return {
    samples: state.samples + 1,
    harshEvents: state.harshEvents + (isHarsh ? 1 : 0),
    lastEventAt: isHarsh ? sample.t : state.lastEventAt,
    peakG: Math.max(state.peakG, g),
    currentG: g,
    gravity
  };
}

export function drivingScore(state: DrivingState): number {
  return Math.max(0, 100 - state.harshEvents * 8);
}

export function drivingLabel(score: number): string {
  if (score >= 85) return "Condução suave";
  if (score >= 60) return "Condução moderada";
  return "Condução agressiva";
}
