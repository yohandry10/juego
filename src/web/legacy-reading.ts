import type { LegacyProfile } from '../domain/career-types.js';
export function historicalReading(legacy: LegacyProfile, years: 5 | 15 | 30) {
  const d = legacy.dimensions;
  const score = years === 5 ? legacy.reevaluationAt5 : years === 15 ? legacy.reevaluationAt15 : legacy.reevaluationAt30 ?? legacy.reevaluationAt15;
  const angle = years === 5 ? 'Todavía pesan los resultados inmediatos y la confianza con que terminó tu carrera.' : years === 15 ? 'Con distancia, la lectura pone más atención en las reglas que sostuviste y en la continuidad de tu trabajo.' : 'La proyección de largo plazo observa cuánto quedó construido más allá de tu presencia personal.';
  const assessment = years === 5 ? (d.publicTrust >= 60 ? 'La confianza pública es uno de los puntos fuertes del expediente.' : 'La confianza pública limita la valoración inicial, aunque no borra el resto de tu trayectoria.') : years === 15 ? (d.integrity >= 60 ? 'La integridad aporta un argumento duradero a favor de tu trayectoria.' : 'El indicador de integridad sigue pesando sobre la interpretación de tus decisiones.') : (d.continuity >= 60 ? 'La continuidad hace que el expediente conserve peso con el paso del tiempo.' : 'Una continuidad limitada obliga a distinguir influencia personal de resultados que perduran.');
  const counterpoint = d.influence > d.governance + 15 ? 'Tu influencia fue mayor que tu evaluación de gobernanza: ocupar espacio y dejar resultados fueron cosas distintas.' : d.governance > d.influence + 15 ? 'Tu evaluación de gobernanza supera tu influencia: el trabajo registrado pesa más que el alcance de tus redes.' : 'Gobernanza e influencia forman una lectura mixta; ninguna cifra resume por sí sola tu carrera.';
  return { score, angle, assessment, counterpoint };
}
