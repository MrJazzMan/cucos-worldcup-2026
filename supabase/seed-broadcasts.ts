import { seedPortugalBroadcasts } from "@/lib/matches";

// Dados iniciais de broadcasts para jogos Portugal (após sync)
// Executar via POST /api/seed-broadcasts

export const PORTUGAL_BROADCAST_SEED = [
  { teams: ["Portugal", "DR Congo"], channels: ["RTP1"] },
  { teams: ["Portugal", "Uzbequistão"], channels: ["RTP1"] },
  { teams: ["Colômbia", "Portugal"], channels: ["RTP1", "Sport TV"] },
];

export async function runSeed() {
  return seedPortugalBroadcasts();
}
