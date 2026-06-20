import { Client, Receiver } from "@upstash/qstash";
import { getSiteUrl } from "@/lib/site-url";

export function getQStashClient(): Client | null {
  const token = process.env.QSTASH_TOKEN;
  if (!token) return null;
  return new Client({
    token,
    ...(process.env.QSTASH_URL ? { baseUrl: process.env.QSTASH_URL } : {}),
  });
}

export function getQStashReceiver(): Receiver | null {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey) return null;
  return new Receiver({ currentSigningKey, nextSigningKey });
}

export function getLiveSyncCallbackUrl(): string {
  return `${getSiteUrl()}/api/sync/live`;
}

export async function verifyQStashRequest(
  request: Request,
  body: string
): Promise<boolean> {
  const receiver = getQStashReceiver();
  if (!receiver) return false;

  const signature = request.headers.get("upstash-signature");
  if (!signature) return false;

  try {
    return await receiver.verify({
      signature,
      body,
      url: getLiveSyncCallbackUrl(),
    });
  } catch {
    return false;
  }
}
