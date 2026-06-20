import { permanentRedirect } from "next/navigation";

/** Alias legado → rota canónica */
export default function EliminatoriasRedirect() {
  permanentRedirect("/fasefinal");
}
