import { formatDuration, formatPrice } from "@/lib/format";
import { parisLongDate, parisTime } from "@/lib/paris-time";
import { serviceTotals, type PublicService } from "@/lib/public-studio";

type Props = { service: PublicService; withAddon: boolean; startsAt: string };

export function BookingSummary({ service, withAddon, startsAt }: Props) {
  const { duration, priceCents } = serviceTotals(service, withAddon);
  return (
    <div className="mb-3.5 rounded-card border border-line bg-surface px-4 py-3.5">
      <div className="flex justify-between gap-3 py-0.5">
        <b className="font-semibold">
          {service.name}
          {withAddon && service.addon_name && ` + ${service.addon_name}`}
        </b>
        <span className="font-semibold tabular-nums">{formatPrice(priceCents)}</span>
      </div>
      <div className="flex justify-between gap-3 py-0.5 text-sm text-mute">
        <span>
          {parisLongDate(startsAt)} à {parisTime(startsAt)}
        </span>
        <span>{formatDuration(duration)}</span>
      </div>
    </div>
  );
}
