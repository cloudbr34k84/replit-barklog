import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  PawPrint,
  CalendarDays,
  Bell,
  Syringe,
  Stethoscope,
  TrendingUp,
  Activity,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import type { Pet, EventWithPets, WeightEntry } from "@shared/schema";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1" data-testid={`text-stat-${title.toLowerCase().replace(/\s/g, "-")}`}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: color + "18", color }}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const categoryColors: Record<string, string> = {
  vet_visit: "hsl(var(--chart-1))",
  medication: "hsl(var(--chart-2))",
  vaccination: "hsl(var(--chart-3))",
  appointment: "hsl(var(--chart-4))",
};

const categoryLabels: Record<string, string> = {
  vet_visit: "Vet Visit",
  medication: "Medication",
  vaccination: "Vaccination",
  appointment: "Appointment",
};

const categoryIcons: Record<string, React.ElementType> = {
  vet_visit: Stethoscope,
  medication: Syringe,
  vaccination: Activity,
  appointment: CalendarDays,
};

export default function Dashboard() {
  const { data: pets = [], isLoading: petsLoading } = useQuery<Pet[]>({
    queryKey: ["/api/pets"],
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<EventWithPets[]>({
    queryKey: ["/api/events"],
  });

  const { data: allWeights = [], isLoading: weightsLoading } = useQuery<
    (WeightEntry & { petName: string })[]
  >({
    queryKey: ["/api/weight-entries"],
  });

  const isLoading = petsLoading || eventsLoading || weightsLoading;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  const today = new Date();
  const upcomingEvents = events.filter(
    (e) => isAfter(parseISO(e.eventDate), today) && isBefore(parseISO(e.eventDate), addDays(today, 30))
  );
  const overdueReminders = events.filter(
    (e) => e.reminderDate && isBefore(parseISO(e.reminderDate), today) && isAfter(parseISO(e.eventDate), today)
  );
  const recentEvents = [...events]
    .filter((e) => isBefore(parseISO(e.eventDate), today))
    .sort((a, b) => parseISO(b.eventDate).getTime() - parseISO(a.eventDate).getTime())
    .slice(0, 5);

  const categoryCounts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});

  const eventChartData = Object.entries(categoryCounts).map(([key, count]) => ({
    name: categoryLabels[key] || key,
    count,
    fill: categoryColors[key] || "hsl(var(--chart-1))",
  }));

  const weightChartData = allWeights
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .reduce<Record<string, Record<string, number>>>((acc, w) => {
      const dateKey = format(parseISO(w.recordedAt), "MMM dd");
      if (!acc[dateKey]) acc[dateKey] = { date: dateKey } as any;
      acc[dateKey][w.petName] = w.weight;
      return acc;
    }, {});

  const weightData = Object.values(weightChartData);
  const petNames = [...new Set(allWeights.map((w) => w.petName))];
  const chartColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your pets' health and care
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/pets" data-testid="link-add-pet">
              <Plus className="h-4 w-4 mr-1" />
              Add Pet
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/events" data-testid="link-log-event">
              <CalendarDays className="h-4 w-4 mr-1" />
              Log Event
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Pets"
          value={pets.length}
          subtitle={pets.length === 1 ? "1 furry friend" : `${pets.length} furry friends`}
          icon={PawPrint}
          color="#22c55e"
        />
        <StatCard
          title="Upcoming Events"
          value={upcomingEvents.length}
          subtitle="In the next 30 days"
          icon={CalendarDays}
          color="#3b82f6"
        />
        <StatCard
          title="Active Reminders"
          value={overdueReminders.length}
          subtitle={overdueReminders.length > 0 ? "Needs attention" : "All caught up"}
          icon={Bell}
          color="#f59e0b"
        />
        <StatCard
          title="Total Events"
          value={events.length}
          subtitle="Logged to date"
          icon={Activity}
          color="#8b5cf6"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base font-semibold">Weight Trends</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {weightData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={weightData}>
                  <defs>
                    {petNames.map((name, i) => (
                      <linearGradient
                        key={name}
                        id={`color-${i}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={chartColors[i % chartColors.length]}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={chartColors[i % chartColors.length]}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="date"
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  {petNames.map((name, i) => (
                    <Area
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={chartColors[i % chartColors.length]}
                      fill={`url(#color-${i})`}
                      strokeWidth={2}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground">
                <TrendingUp className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No weight data recorded yet</p>
                <p className="text-xs mt-1">Add weight entries to see trends</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base font-semibold">Events by Category</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {eventChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={eventChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="name"
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[4, 4, 0, 0]}
                    fill="hsl(var(--primary))"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground">
                <CalendarDays className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No events logged yet</p>
                <p className="text-xs mt-1">Start logging events to see statistics</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base font-semibold">Your Pets</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/pets" data-testid="link-view-all-pets">
                View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pets.length > 0 ? (
              <div className="space-y-3">
                {pets.slice(0, 4).map((pet) => (
                  <Link key={pet.id} href={`/pets/${pet.id}`}>
                    <div
                      className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer"
                      data-testid={`card-pet-${pet.id}`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={pet.avatarUrl || undefined} alt={pet.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                          {pet.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{pet.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{pet.breed}</p>
                      </div>
                      {pet.gender && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {pet.gender}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <PawPrint className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No pets added yet</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/pets" data-testid="link-add-first-pet">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Your First Pet
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/events" data-testid="link-view-all-events">
                View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentEvents.length > 0 ? (
              <div className="space-y-3">
                {recentEvents.map((event) => {
                  const CatIcon = categoryIcons[event.category] || CalendarDays;
                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-2 rounded-md"
                      data-testid={`card-event-${event.id}`}
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md mt-0.5"
                        style={{
                          backgroundColor: (categoryColors[event.category] || "hsl(var(--muted))") + "18",
                          color: categoryColors[event.category] || "hsl(var(--foreground))",
                        }}
                      >
                        <CatIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(event.eventDate), "MMM d, yyyy")}
                          </span>
                          {event.pets && event.pets.length > 0 && (
                            <>
                              <span className="text-xs text-muted-foreground">for</span>
                              {event.pets.map((p) => (
                                <Badge key={p.id} variant="secondary" className="text-xs">
                                  {p.name}
                                </Badge>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CalendarDays className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs mt-1">Events will show up here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
