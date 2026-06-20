import { getChannelHref } from "@/lib/channels";

const BASE_BADGE =
  "inline-flex items-center rounded-lg px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide";

export function channelBadgeClass(channel: string) {
  const upper = channel.toUpperCase();

  if (upper.startsWith("RTP")) {
    return `${BASE_BADGE} bg-[#3565f2] text-white`;
  }

  if (/SPORT\.?\s*TV/i.test(channel)) {
    return `${BASE_BADGE} bg-[#0f1a3a] text-[#ffd230] border border-[#ffd230]/30`;
  }

  if (upper === "SIC") {
    return `${BASE_BADGE} bg-[#e8000d] text-white`;
  }

  if (upper === "TVI") {
    return `${BASE_BADGE} bg-[#f04e23] text-white`;
  }

  if (upper === "DAZN") {
    return `${BASE_BADGE} bg-black text-[#f5f500] border border-[#f5f500]/20`;
  }

  if (upper === "LV") {
    return `${BASE_BADGE} bg-[#ff0000] text-white`;
  }

  return `${BASE_BADGE} bg-surface-2 text-foreground border border-border-base`;
}

interface MatchChannelsProps {
  channels: string[] | undefined;
  emptyLabel: string;
}

export function MatchChannels({ channels, emptyLabel }: MatchChannelsProps) {
  if (!channels?.length) {
    return <span className="text-xs text-muted">{emptyLabel}</span>;
  }

  return (
    <>
      {channels.map((channel) => {
        const href = getChannelHref(channel);
        const cls = channelBadgeClass(channel);
        return href ? (
          <a
            key={channel}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${cls} transition hover:brightness-110`}
          >
            {channel}
          </a>
        ) : (
          <span key={channel} className={cls}>
            {channel}
          </span>
        );
      })}
    </>
  );
}
