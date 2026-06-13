import type { MatchStatus } from "@/types";

export function getStatusLabel(status: MatchStatus): string {
  switch (status) {
    case "live":
      return "Ao vivo";
    case "finished":
      return "Terminado";
    default:
      return "Por começar";
  }
}

export function getStatusColor(status: MatchStatus): string {
  switch (status) {
    case "live":
      return "bg-red-500 text-white";
    case "finished":
      return "bg-zinc-500 text-white";
    default:
      return "bg-emerald-500 text-white";
  }
}
