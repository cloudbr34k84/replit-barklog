import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  Plus,
  CalendarDays,
  Stethoscope,
  Syringe,
  Activity,
  Filter,
  Trash2,
  MapPin,
} from "lucide-react";
import type { Pet, EventWithPets } from "@shared/schema";
import { format, parseISO } from "date-fns";

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

function EventFormDialog({
  open,
  onOpenChange,
  pets,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pets: Pet[];
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("vet_visit");
  const [eventDate, setEventDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reminderDate, setReminderDate] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedPetIds, setSelectedPetIds] = useState<number[]>([]);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/events", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pets"] });
      toast({ title: "Event logged successfully" });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setTitle("");
    setCategory("vet_visit");
    setEventDate(format(new Date(), "yyyy-MM-dd"));
    setReminderDate("");
    setLocation("");
    setNotes("");
    setSelectedPetIds([]);
  };

  const togglePet = (petId: number) => {
    setSelectedPetIds((prev) =>
      prev.includes(petId) ? prev.filter((id) => id !== petId) : [...prev, petId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log New Event</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedPetIds.length === 0) {
              toast({ title: "Please select at least one pet", variant: "destructive" });
              return;
            }
            mutation.mutate({
              title,
              category,
              eventDate,
              reminderDate: reminderDate || null,
              location: location || null,
              notes: notes || null,
              petIds: selectedPetIds,
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="event-title">Title *</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual checkup"
              required
              data-testid="input-event-title"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="select-event-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vet_visit">Vet Visit</SelectItem>
                  <SelectItem value="medication">Medication</SelectItem>
                  <SelectItem value="vaccination">Vaccination</SelectItem>
                  <SelectItem value="appointment">Appointment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-date">Event Date *</Label>
              <Input
                id="event-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                data-testid="input-event-date"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="reminder-date">Reminder Date</Label>
              <Input
                id="reminder-date"
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                data-testid="input-reminder-date"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-location">Location</Label>
              <Input
                id="event-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. City Vet Clinic"
                data-testid="input-event-location"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Pets *</Label>
            <div className="grid grid-cols-2 gap-2">
              {pets.map((pet) => (
                <label
                  key={pet.id}
                  className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover-elevate"
                  data-testid={`checkbox-pet-${pet.id}`}
                >
                  <Checkbox
                    checked={selectedPetIds.includes(pet.id)}
                    onCheckedChange={() => togglePet(pet.id)}
                  />
                  <span className="text-sm">{pet.name}</span>
                </label>
              ))}
            </div>
            {pets.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No pets available. Add a pet first.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <RichTextEditor content={notes} onChange={setNotes} placeholder="Add detailed notes about this event..." />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
            data-testid="button-submit-event"
          >
            {mutation.isPending ? "Saving..." : "Log Event"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function EventsPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [deleteEventId, setDeleteEventId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: events = [], isLoading: eventsLoading } = useQuery<EventWithPets[]>({
    queryKey: ["/api/events"],
  });

  const { data: pets = [] } = useQuery<Pet[]>({
    queryKey: ["/api/pets"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pets"] });
      toast({ title: "Event deleted" });
      setDeleteEventId(null);
    },
  });

  const filteredEvents =
    filterCategory === "all"
      ? events
      : events.filter((e) => e.category === filterCategory);

  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  );

  if (eventsLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-events-title">Events</h1>
          <p className="text-sm text-muted-foreground">
            Track medical and care events for your pets
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} data-testid="button-log-event">
          <Plus className="h-4 w-4 mr-1" />
          Log Event
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Button
          variant={filterCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterCategory("all")}
          data-testid="button-filter-all"
        >
          All
        </Button>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <Button
            key={key}
            variant={filterCategory === key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterCategory(key)}
            data-testid={`button-filter-${key}`}
          >
            {label}
          </Button>
        ))}
      </div>

      {sortedEvents.length > 0 ? (
        <div className="space-y-3">
          {sortedEvents.map((event) => {
            const CatIcon = categoryIcons[event.category] || CalendarDays;
            return (
              <Card key={event.id} data-testid={`card-event-${event.id}`}>
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
                        <Badge variant="secondary" className="text-xs">
                          {categoryLabels[event.category]}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {format(parseISO(event.eventDate), "MMM d, yyyy")}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {event.location}
                          </span>
                        )}
                      </div>
                      {event.pets && event.pets.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {event.pets.map((p) => (
                            <Badge key={p.id} variant="outline" className="text-xs">
                              {p.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {event.notes && (
                        <div
                          className="mt-2 text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: event.notes }}
                        />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteEventId(event.id)}
                      data-testid={`button-delete-event-${event.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mb-3 opacity-30" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              {filterCategory === "all" ? "No events logged yet" : "No events in this category"}
            </h3>
            <p className="text-sm mb-4">
              {filterCategory === "all"
                ? "Start logging vet visits, medications, and more"
                : "Try a different filter or log a new event"}
            </p>
            <Button onClick={() => setShowDialog(true)} data-testid="button-log-first-event">
              <Plus className="h-4 w-4 mr-1" />
              Log Your First Event
            </Button>
          </CardContent>
        </Card>
      )}

      <EventFormDialog open={showDialog} onOpenChange={setShowDialog} pets={pets} />

      <AlertDialog open={deleteEventId !== null} onOpenChange={() => setDeleteEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this event. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEventId && deleteMutation.mutate(deleteEventId)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
