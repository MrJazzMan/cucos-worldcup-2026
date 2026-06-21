import { T } from "@/components/Display";
import { GroupStandingsTable } from "@/components/GroupStandingsTable";
import { getGroupStandings } from "@/lib/matches";

export default async function GruposPage() {
  const groups = await getGroupStandings();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          <T k="groups.title" />
        </h1>
        <p className="mt-1 text-muted">
          <T k="groups.subtitle" />
        </p>
      </div>

      {groups.map((group) => (
        <section
          key={group.group_name}
          className="overflow-hidden rounded-2xl border border-border-base bg-surface shadow-sm"
        >
          <h2 className="border-b border-border-base px-4 py-3 text-lg font-semibold text-foreground">
            {group.group_name}
          </h2>
          <GroupStandingsTable group={group} variant="full" />
        </section>
      ))}
    </div>
  );
}

export const revalidate = 60;
