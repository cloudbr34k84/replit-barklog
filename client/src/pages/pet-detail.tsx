import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Scale,
  CalendarDays,
  Stethoscope,
  Syringe,
  Activity,
  Camera,
  PawPrint,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Pet, WeightEntry, EventWithPets } from "@shared/schema";
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

function WeightDialog({
  open,
  onOpenChange,
  petId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: number;
}) {
  const { toast } = useToast();
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("lbs");
  const [recordedAt, setRecordedAt] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/weight-entries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pets", petId, "weights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weight-entries"] });
      toast({ title: "Weight recorded" });
      onOpenChange(false);
      setWeight("");
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record Weight</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate({
              petId,
              weight: parseFloat(weight),
              unit,
              recordedAt,
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="weight">Weight *</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.0"
                required
                data-testid="input-weight"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger data-testid="select-weight-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lbs">lbs</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="recorded-at">Date</Label>
            <Input
              id="recorded-at"
              type="date"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              data-testid="input-weight-date"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
            data-testid="button-submit-weight"
          >
            {mutation.isPending ? "Saving..." : "Record Weight"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditPetDialog({
  open,
  onOpenChange,
  pet,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pet: Pet;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(pet.name);
  const [breed, setBreed] = useState(pet.breed);
  const [species, setSpecies] = useState(pet.species);
  const [gender, setGender] = useState(pet.gender || "");
  const [color, setColor] = useState(pet.color || "");
  const [dateOfBirth, setDateOfBirth] = useState(pet.dateOfBirth || "");
  const [avatarUrl, setAvatarUrl] = useState(pet.avatarUrl || "");

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      setAvatarUrl(response.objectPath);
      toast({ title: "Photo uploaded" });
    },
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("PATCH", `/api/pets/${pet.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pets", pet.id] });
      toast({ title: "Pet updated" });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {pet.name}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate({
              name,
              breed,
              species,
              gender: gender || null,
              color: color || null,
              dateOfBirth: dateOfBirth || null,
              avatarUrl: avatarUrl || null,
            });
          }}
          className="space-y-4"
        >
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Camera className="h-3.5 w-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFile(file);
                  }}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-edit-pet-name" />
            </div>
            <div className="space-y-1.5">
              <Label>Breed *</Label>
              <Input value={breed} onChange={(e) => setBreed(e.target.value)} required data-testid="input-edit-pet-breed" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Species</Label>
              <Select value={species} onValueChange={setSpecies}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog">Dog</SelectItem>
                  <SelectItem value="cat">Cat</SelectItem>
                  <SelectItem value="bird">Bird</SelectItem>
                  <SelectItem value="rabbit">Rabbit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Color</Label>
              <Input value={color} onChange={(e) => setColor(e.target.value)} data-testid="input-edit-pet-color" />
            </div>
            <div className="space-y-1.5">
              <Label>Date of Birth</Label>
              <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending || isUploading} data-testid="button-update-pet">
            {mutation.isPending ? "Saving..." : "Update Pet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PetDetailPage() {
  const [, params] = useRoute("/pets/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const petId = params?.id ? parseInt(params.id) : 0;

  const [showWeightDialog, setShowWeightDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: pet, isLoading: petLoading } = useQuery<Pet>({
    queryKey: ["/api/pets", petId],
    enabled: !!petId,
  });

  const { data: weights = [], isLoading: weightsLoading } = useQuery<WeightEntry[]>({
    queryKey: ["/api/pets", petId, "weights"],
    enabled: !!petId,
  });

  const { data: petEvents = [], isLoading: eventsLoading } = useQuery<EventWithPets[]>({
    queryKey: ["/api/pets", petId, "events"],
    enabled: !!petId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/pets/${petId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pets"] });
      toast({ title: "Pet removed" });
      setLocation("/pets");
    },
  });

  if (petLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <PawPrint className="h-12 w-12 text-muted-foreground mb-3 opacity-30" />
        <p className="text-muted-foreground">Pet not found</p>
        <Button variant="outline" className="mt-3" asChild>
          <Link href="/pets">Back to Pets</Link>
        </Button>
      </div>
    );
  }

  const sortedWeights = [...weights].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );
  const weightChartData = sortedWeights.map((w) => ({
    date: format(parseISO(w.recordedAt), "MMM dd"),
    weight: w.weight,
  }));

  const latestWeight = sortedWeights.length > 0 ? sortedWeights[sortedWeights.length - 1] : null;

  const sortedEvents = [...petEvents].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pets" data-testid="button-back-pets">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold flex-1" data-testid="text-pet-detail-name">
          {pet.name}
        </h1>
        <Button variant="outline" size="icon" onClick={() => setShowEditDialog(true)} data-testid="button-edit-pet">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setShowDeleteConfirm(true)} data-testid="button-delete-pet">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar className="h-20 w-20">
              <AvatarImage src={pet.avatarUrl || undefined} alt={pet.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                {pet.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold">{pet.name}</h2>
              <p className="text-muted-foreground">{pet.breed}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <Badge variant="secondary">{pet.species}</Badge>
                {pet.gender && <Badge variant="outline">{pet.gender}</Badge>}
                {pet.color && <Badge variant="outline">{pet.color}</Badge>}
                {pet.dateOfBirth && (
                  <Badge variant="outline">
                    Born {format(parseISO(pet.dateOfBirth), "MMM d, yyyy")}
                  </Badge>
                )}
              </div>
            </div>
            {latestWeight && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Current Weight</p>
                <p className="text-2xl font-bold">
                  {latestWeight.weight} {latestWeight.unit}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base font-semibold">Weight History</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowWeightDialog(true)} data-testid="button-add-weight">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Record
            </Button>
          </CardHeader>
          <CardContent>
            {weightChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={weightChartData}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--chart-1))"
                    fill="url(#weightGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground">
                <Scale className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No weight records yet</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => setShowWeightDialog(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add First Entry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base font-semibold">Event History</CardTitle>
            <Button size="sm" variant="outline" asChild>
              <Link href="/events" data-testid="link-log-event">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Log Event
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {sortedEvents.length > 0 ? (
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {sortedEvents.map((event) => {
                  const CatIcon = categoryIcons[event.category] || CalendarDays;
                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-2 rounded-md"
                      data-testid={`card-pet-event-${event.id}`}
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
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(event.eventDate), "MMM d, yyyy")} &middot;{" "}
                          {categoryLabels[event.category]}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground">
                <CalendarDays className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No events logged for {pet.name}</p>
                <Button size="sm" variant="outline" className="mt-2" asChild>
                  <Link href="/events">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Log First Event
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <WeightDialog open={showWeightDialog} onOpenChange={setShowWeightDialog} petId={petId} />
      {pet && <EditPetDialog open={showEditDialog} onOpenChange={setShowEditDialog} pet={pet} />}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pet.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {pet.name} and all their associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
