import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Bell,
  CalendarDays,
  Stethoscope,
  Syringe,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
} from "lucide-react";
import type { EventWithPets } from "@shared/schema";
import { format, parseISO, isBefore, isAfter, differenceInDays, addDays } from "date-fns";

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

const categoryColors: Record<string, string> = {
  vet_visit: "hsl(var(--chart-1))",
  medication: "hsl(var(--chart-2))",
  vaccination: "hsl(var(--chart-3))",
  appointment: "hsl(var(--chart-4))",
};

type ReminderStatus = "overdue" | "today" | "upcoming" | "soon";

function getStatus(eventDate: string): { status: ReminderStatus; label: string; daysUntil: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = parseISO(eventDate);
  const daysUntil = differenceInDays(date, today);

  if (daysUntil < 0) return { status: "overdue", label: `${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? "" : "s"} overdue`, daysUntil };
  if (daysUntil === 0) return { status: "today", label: "Today", daysUntil };
  if (daysUntil <= 3) return { status: "soon", label: `In ${daysUntil} day${daysUntil === 1 ? "" : "s"}`, daysUntil };
  return { status: "upcoming", label: `In ${daysUntil} days`, daysUntil };
}

const statusConfig: Record<ReminderStatus, { icon: React.ElementType; badgeClass: string }> = {
  overdue: { icon: AlertTriangle, badgeClass: "bg-destructive/10 text-destructive border-destructive/20" },
  today: { icon: Bell, badgeClass: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  soon: { icon: Clock, badgeClass: "bg-chart-2/10 text-chart-2 border-chart-2/20" },
  upcoming: { icon: CalendarDays, badgeClass: "bg-muted text-muted-foreground" },
};

export default function RemindersPage() {
  const { data: events = [], isLoading } = useQuery<EventWithPets[]>({
    queryKey: ["/api/events"],
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = events
    .filter((e) => {
      const eventDate = parseISO(e.eventDate);
      return isAfter(eventDate, addDays(today, -7)) && isBefore(eventDate, addDays(today, 90));
    })
    .map((e) => ({ ...e, ...getStatus(e.eventDate) }))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const overdueCount = upcomingEvents.filter((e) => e.status === "overdue").length;
  const todayCount = upcomingEvents.filter((e) => e.status === "today").length;
  const soonCount = upcomingEvents.filter((e) => e.status === "soon").length;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-reminders-title">Reminders</h1>
          <p className="text-sm text-muted-foreground">
            Upcoming and overdue events for your pets
          </p>
        </div>
        <Button asChild>
          <Link href="/events" data-testid="link-log-event-reminder">
            <Plus className="h-4 w-4 mr-1" />
            Log Event
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-overdue-count">{overdueCount}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: "hsl(var(--chart-4) / 0.1)" }}>
              <Bell className="h-5 w-5" style={{ color: "hsl(var(--chart-4))" }} />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-today-count">{todayCount}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: "hsl(var(--chart-2) / 0.1)" }}>
              <Clock className="h-5 w-5" style={{ color: "hsl(var(--chart-2))" }} />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-soon-count">{soonCount}</p>
              <p className="text-xs text-muted-foreground">Within 3 Days</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {upcomingEvents.length > 0 ? (
        <div className="space-y-3">
          {upcomingEvents.map((event) => {
            const CatIcon = categoryIcons[event.category] || CalendarDays;
            const config = statusConfig[event.status];
            const StatusIcon = config.icon;
            return (
              <Card key={event.id} data-testid={`card-reminder-${event.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md mt-0.5"
                      style={{
                        backgroundColor: (categoryColors[event.category] || "hsl(var(--muted))") + "18",
                        color: categoryColors[event.category] || "hsl(var(--foreground))",
                      }}
                    >
                      <CatIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{event.title}</h3>
                        <Badge variant="outline" className={`text-xs ${config.badgeClass}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {event.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(parseISO(event.eventDate), "EEEE, MMMM d, yyyy")} &middot; {categoryLabels[event.category]}
                      </p>
                      {event.pets && event.pets.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {event.pets.map((p) => (
                            <Badge key={p.id} variant="secondary" className="text-xs">
                              {p.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mb-3 opacity-30" />
            <h3 className="text-lg font-medium text-foreground mb-1">All caught up</h3>
            <p className="text-sm mb-4">No upcoming or overdue reminders</p>
            <Button variant="outline" asChild>
              <Link href="/events">
                <Plus className="h-4 w-4 mr-1" />
                Log an Event
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
