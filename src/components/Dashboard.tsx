import { useMemo } from "react";
import { Guest, GuestStats } from "@/types/guest";
import { StatsCard } from "./StatsCard";
import { Users, UserCheck, UserX, Clock, Home, CalendarDays } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface DashboardProps {
  guests: Guest[];
}

const COLORS = [
  "hsl(38, 70%, 50%)",
  "hsl(220, 70%, 50%)",
  "hsl(142, 71%, 45%)",
  "hsl(280, 65%, 60%)",
  "hsl(0, 72%, 51%)",
  "hsl(180, 60%, 45%)",
];

export function Dashboard({ guests }: DashboardProps) {
  const stats: GuestStats = useMemo(() => {
    const confirmed = guests.filter((g) => g.status === "Confirmado").length;
    const notAttending = guests.filter((g) => g.status === "Não comparecerá").length;
    const pending = guests.length - confirmed - notAttending;

    const byGroup: Record<string, number> = {};
    const byAccommodation: Record<string, number> = {};
    const byAgeGroup: Record<string, number> = {};
    let fridayConfirmed = 0;

    guests.forEach((guest) => {
      if (guest.status !== "Confirmado") return;

      byGroup[guest.group] = (byGroup[guest.group] || 0) + 1;

      if (guest.accommodation) {
        byAccommodation[guest.accommodation] =
          (byAccommodation[guest.accommodation] || 0) + 1;
      }

      const age = guest.ageGroup || "Adulto";
      byAgeGroup[age] = (byAgeGroup[age] || 0) + 1;

      if (guest.friday === "sim" || guest.friday === "Aye") {
        fridayConfirmed++;
      }
    });

    return {
      total: guests.length,
      confirmed,
      pending,
      notAttending,
      byGroup: byGroup as Record<"Família" | "Amigos", number>,
      byAccommodation,
      byAgeGroup,
      fridayConfirmed,
    };
  }, [guests]);

  const accommodationData = Object.entries(stats.byAccommodation)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const groupData = Object.entries(stats.byGroup).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-6 pb-20">
      <header className="space-y-1">
        <h1 className="text-2xl font-display font-bold gradient-gold-text">
          Isola 70
        </h1>
        <p className="text-sm text-muted-foreground">
          Controle de convidados da festa
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StatsCard
          title="Total"
          value={stats.total}
          subtitle="convidados"
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="Confirmados"
          value={stats.confirmed}
          subtitle="para sábado"
          icon={UserCheck}
          variant="success"
        />
        <StatsCard
          title="Sexta"
          value={stats.fridayConfirmed}
          subtitle="confirmados"
          icon={CalendarDays}
          variant="primary"
        />
        <StatsCard
          title="Ausentes"
          value={stats.notAttending}
          subtitle="não vão"
          icon={UserX}
          variant="danger"
        />
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-display font-semibold text-foreground">
          Por Hospedagem
        </h2>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={accommodationData}
                layout="vertical"
                margin={{ left: 0, right: 16, top: 8, bottom: 8 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  fill="hsl(var(--primary))"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-display font-semibold text-foreground">
          Por Grupo
        </h2>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-center gap-8">
            <div className="h-32 w-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={groupData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    dataKey="value"
                    strokeWidth={2}
                  >
                    {groupData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {groupData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {entry.name}
                  </span>
                  <span className="text-sm font-semibold">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-display font-semibold text-foreground">
          Por Faixa Etária
        </h2>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(stats.byAgeGroup).map(([age, count], index) => (
              <div
                key={age}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <span className="text-sm text-muted-foreground">{age}</span>
                <span
                  className="text-lg font-bold"
                  style={{ color: COLORS[index % COLORS.length] }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
