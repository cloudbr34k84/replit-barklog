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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
  Shield,
  Pill,
  AlertTriangle,
  Clock,
  CheckCircle2,
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
import type { Pet, WeightEntry, EventWithPets, Vaccination, Medication } from "@shared/schema";
import { format, parseISO, differenceInDays, addYears } from "date-fns";

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

function getVaccinationStatus(vax: Vaccination): { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType } {
  if (!vax.nextDueDate) return { label: "Recorded", variant: "secondary", icon: CheckCircle2 };
  const daysUntilDue = differenceInDays(parseISO(vax.nextDueDate), new Date());
  if (daysUntilDue < 0) return { label: "Overdue", variant: "destructive", icon: AlertTriangle };
  if (daysUntilDue <= 30) return { label: `Due in ${daysUntilDue} days`, variant: "default", icon: Clock };
  return { label: "Current", variant: "secondary", icon: CheckCircle2 };
}

function ProfileField({ label, value, testId }: { label: string; value: string | null | undefined; testId: string }) {
  return (
    <div className="py-2.5 border-b last:border-b-0" data-testid={testId}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value || <span className="text-muted-foreground italic">Not set</span>}</p>
    </div>
  );
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
      <div>{children}</div>
    </div>
  );
}

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
  const [recordedAt, setRecordedAt] = useState(format(new Date(), "yyyy-MM-dd"));

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
            mutation.mutate({ petId, weight: parseFloat(weight), unit, recordedAt });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="weight">Weight *</Label>
              <Input id="weight" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0.0" required data-testid="input-weight" />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger data-testid="select-weight-unit"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lbs">lbs</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="recorded-at">Date</Label>
            <Input id="recorded-at" type="date" value={recordedAt} onChange={(e) => setRecordedAt(e.target.value)} data-testid="input-weight-date" />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-submit-weight">
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
  const [microchipNumber, setMicrochipNumber] = useState(pet.microchipNumber || "");
  const [microchipLocation, setMicrochipLocation] = useState(pet.microchipLocation || "");
  const [vetName, setVetName] = useState(pet.vetName || "");
  const [fatherName, setFatherName] = useState(pet.fatherName || "");
  const [motherName, setMotherName] = useState(pet.motherName || "");
  const [hairLength, setHairLength] = useState(pet.hairLength || "");
  const [desexed, setDesexed] = useState(pet.desexed || "");
  const [foodBrand, setFoodBrand] = useState(pet.foodBrand || "");
  const [perMealAmount, setPerMealAmount] = useState(pet.perMealAmount || "");
  const [mealsPerDay, setMealsPerDay] = useState(pet.mealsPerDay || "");
  const [yearlyVaccinationDate, setYearlyVaccinationDate] = useState(pet.yearlyVaccinationDate || "");
  const [foodBowlColour, setFoodBowlColour] = useState(pet.foodBowlColour || "");
  const [traits, setTraits] = useState(pet.traits || "");

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
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {pet.name}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate({
              name, breed, species,
              gender: gender || null,
              color: color || null,
              dateOfBirth: dateOfBirth || null,
              avatarUrl: avatarUrl || null,
              microchipNumber: microchipNumber || null,
              microchipLocation: microchipLocation || null,
              vetName: vetName || null,
              fatherName: fatherName || null,
              motherName: motherName || null,
              hairLength: hairLength || null,
              desexed: desexed || null,
              foodBrand: foodBrand || null,
              perMealAmount: perMealAmount || null,
              mealsPerDay: mealsPerDay || null,
              yearlyVaccinationDate: yearlyVaccinationDate || null,
              foodBowlColour: foodBowlColour || null,
              traits: traits || null,
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
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadFile(file); }} disabled={isUploading} />
              </label>
            </div>
          </div>

          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Basic Info</p>
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
              <Label>Hair Colour</Label>
              <Input value={color} onChange={(e) => setColor(e.target.value)} data-testid="input-edit-pet-color" />
            </div>
            <div className="space-y-1.5">
              <Label>Hair Length</Label>
              <Input value={hairLength} onChange={(e) => setHairLength(e.target.value)} placeholder="e.g. Short, Long" data-testid="input-edit-pet-hair-length" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date of Birth</Label>
              <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} data-testid="input-edit-pet-dob" />
            </div>
            <div className="space-y-1.5">
              <Label>Desexed</Label>
              <Select value={desexed} onValueChange={setDesexed}>
                <SelectTrigger data-testid="select-edit-pet-desexed"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider pt-2">Microchip & Vet</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Microchip #</Label>
              <Input value={microchipNumber} onChange={(e) => setMicrochipNumber(e.target.value)} placeholder="Chip number" data-testid="input-edit-pet-microchip" />
            </div>
            <div className="space-y-1.5">
              <Label>Microchip Location</Label>
              <Input value={microchipLocation} onChange={(e) => setMicrochipLocation(e.target.value)} placeholder="e.g. Back of Neck" data-testid="input-edit-pet-microchip-location" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Vet Name</Label>
              <Input value={vetName} onChange={(e) => setVetName(e.target.value)} placeholder="Regular vet" data-testid="input-edit-pet-vet" />
            </div>
            <div className="space-y-1.5">
              <Label>Yearly Vaccination Date</Label>
              <Input value={yearlyVaccinationDate} onChange={(e) => setYearlyVaccinationDate(e.target.value)} placeholder="e.g. 23 November" data-testid="input-edit-pet-yearly-vax" />
            </div>
          </div>

          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider pt-2">Family</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Father's Name</Label>
              <Input value={fatherName} onChange={(e) => setFatherName(e.target.value)} data-testid="input-edit-pet-father" />
            </div>
            <div className="space-y-1.5">
              <Label>Mother's Name</Label>
              <Input value={motherName} onChange={(e) => setMotherName(e.target.value)} data-testid="input-edit-pet-mother" />
            </div>
          </div>

          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider pt-2">Feeding</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Food Brand</Label>
              <Input value={foodBrand} onChange={(e) => setFoodBrand(e.target.value)} data-testid="input-edit-pet-food-brand" />
            </div>
            <div className="space-y-1.5">
              <Label>Per Meal Amount</Label>
              <Input value={perMealAmount} onChange={(e) => setPerMealAmount(e.target.value)} placeholder="e.g. 150g - 200g" data-testid="input-edit-pet-meal-amount" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Meals Per Day</Label>
              <Input value={mealsPerDay} onChange={(e) => setMealsPerDay(e.target.value)} placeholder="e.g. 2 meals (Breakfast & Dinner)" data-testid="input-edit-pet-meals-per-day" />
            </div>
            <div className="space-y-1.5">
              <Label>Food Bowl Colour</Label>
              <Input value={foodBowlColour} onChange={(e) => setFoodBowlColour(e.target.value)} data-testid="input-edit-pet-bowl-colour" />
            </div>
          </div>

          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider pt-2">Personality</p>
          <div className="space-y-1.5">
            <Label>Traits</Label>
            <Textarea value={traits} onChange={(e) => setTraits(e.target.value)} placeholder="Personality, behaviour, quirks..." data-testid="input-edit-pet-traits" />
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending || isUploading} data-testid="button-update-pet">
            {mutation.isPending ? "Saving..." : "Update Pet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function VaccinationDialog({
  open,
  onOpenChange,
  petId,
  prefill,
  editVaccination,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: number;
  prefill?: { name?: string; date?: string; notes?: string; sourceEventId?: number };
  editVaccination?: Vaccination;
}) {
  const { toast } = useToast();
  const isEditing = !!editVaccination;
  const [name, setName] = useState(editVaccination?.name || prefill?.name || "");
  const [dateAdministered, setDateAdministered] = useState(
    editVaccination?.dateAdministered || prefill?.date || format(new Date(), "yyyy-MM-dd")
  );
  const [nextDueDate, setNextDueDate] = useState(
    editVaccination?.nextDueDate || (prefill?.date ? format(addYears(parseISO(prefill.date), 1), "yyyy-MM-dd") : format(addYears(new Date(), 1), "yyyy-MM-dd"))
  );
  const [veterinarian, setVeterinarian] = useState(editVaccination?.veterinarian || "");
  const [notes, setNotes] = useState(editVaccination?.notes || prefill?.notes || "");

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEditing
        ? apiRequest("PATCH", `/api/vaccinations/${editVaccination.id}`, data)
        : apiRequest("POST", `/api/pets/${petId}/vaccinations`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pets", petId, "vaccinations"] });
      toast({ title: isEditing ? "Vaccination updated" : "Vaccination recorded" });
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
          <DialogTitle>{isEditing ? "Edit Vaccination" : "Record Vaccination"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const payload: Record<string, unknown> = {
              name,
              dateAdministered,
              nextDueDate: nextDueDate || null,
              veterinarian: veterinarian || null,
              notes: notes || null,
            };
            if (!isEditing) {
              payload.sourceEventId = prefill?.sourceEventId || null;
            }
            mutation.mutate(payload);
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label>Vaccine Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rabies, DHPP, Bordetella" required data-testid="input-vaccination-name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date Given *</Label>
              <Input type="date" value={dateAdministered} onChange={(e) => setDateAdministered(e.target.value)} required data-testid="input-vaccination-date" />
            </div>
            <div className="space-y-1.5">
              <Label>Next Due Date</Label>
              <Input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} data-testid="input-vaccination-next-due" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Veterinarian</Label>
            <Input value={veterinarian} onChange={(e) => setVeterinarian(e.target.value)} placeholder="Dr. name or clinic" data-testid="input-vaccination-vet" />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional details..." className="resize-none" data-testid="input-vaccination-notes" />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-submit-vaccination">
            {mutation.isPending ? "Saving..." : isEditing ? "Update Vaccination" : "Record Vaccination"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MedicationDialog({
  open,
  onOpenChange,
  petId,
  prefill,
  editMedication,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: number;
  prefill?: { name?: string; date?: string; notes?: string; sourceEventId?: number };
  editMedication?: Medication;
}) {
  const { toast } = useToast();
  const isEditing = !!editMedication;
  const [name, setName] = useState(editMedication?.name || prefill?.name || "");
  const [dosage, setDosage] = useState(editMedication?.dosage || "");
  const [frequency, setFrequency] = useState(editMedication?.frequency || "");
  const [startDate, setStartDate] = useState(editMedication?.startDate || prefill?.date || format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(editMedication?.endDate || "");
  const [prescribedBy, setPrescribedBy] = useState(editMedication?.prescribedBy || "");
  const [notes, setNotes] = useState(editMedication?.notes || prefill?.notes || "");

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEditing
        ? apiRequest("PATCH", `/api/medications/${editMedication.id}`, data)
        : apiRequest("POST", `/api/pets/${petId}/medications`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pets", petId, "medications"] });
      toast({ title: isEditing ? "Medication updated" : "Medication recorded" });
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
          <DialogTitle>{isEditing ? "Edit Medication" : "Record Medication"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const payload: Record<string, unknown> = {
              name,
              dosage: dosage || null,
              frequency: frequency || null,
              startDate,
              endDate: endDate || null,
              prescribedBy: prescribedBy || null,
              notes: notes || null,
            };
            if (!isEditing) {
              payload.active = true;
              payload.sourceEventId = prefill?.sourceEventId || null;
            }
            mutation.mutate(payload);
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label>Medication Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Apoquel, Heartgard, Rimadyl" required data-testid="input-medication-name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Dosage</Label>
              <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 16mg" data-testid="input-medication-dosage" />
            </div>
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger data-testid="select-medication-frequency"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="once daily">Once Daily</SelectItem>
                  <SelectItem value="twice daily">Twice Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="as needed">As Needed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date *</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required data-testid="input-medication-start" />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} data-testid="input-medication-end" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Prescribed By</Label>
            <Input value={prescribedBy} onChange={(e) => setPrescribedBy(e.target.value)} placeholder="Dr. name or clinic" data-testid="input-medication-prescribed-by" />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional details..." className="resize-none" data-testid="input-medication-notes" />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-submit-medication">
            {mutation.isPending ? "Saving..." : isEditing ? "Update Medication" : "Record Medication"}
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
  const [showVaccinationDialog, setShowVaccinationDialog] = useState(false);
  const [showMedicationDialog, setShowMedicationDialog] = useState(false);
  const [vaccinationPrefill, setVaccinationPrefill] = useState<{ name?: string; date?: string; notes?: string; sourceEventId?: number } | undefined>();
  const [medicationPrefill, setMedicationPrefill] = useState<{ name?: string; date?: string; notes?: string; sourceEventId?: number } | undefined>();
  const [editingVaccination, setEditingVaccination] = useState<Vaccination | undefined>();
  const [editingMedication, setEditingMedication] = useState<Medication | undefined>();

  const { data: pet, isLoading: petLoading } = useQuery<Pet>({
    queryKey: ["/api/pets", petId],
    enabled: !!petId,
  });

  const { data: weights = [] } = useQuery<WeightEntry[]>({
    queryKey: ["/api/pets", petId, "weights"],
    enabled: !!petId,
  });

  const { data: petEventsData = [] } = useQuery<EventWithPets[]>({
    queryKey: ["/api/pets", petId, "events"],
    enabled: !!petId,
  });

  const { data: vaccinationsData = [] } = useQuery<Vaccination[]>({
    queryKey: ["/api/pets", petId, "vaccinations"],
    enabled: !!petId,
  });

  const { data: medicationsData = [] } = useQuery<Medication[]>({
    queryKey: ["/api/pets", petId, "medications"],
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

  const deleteVaccinationMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/vaccinations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pets", petId, "vaccinations"] });
      toast({ title: "Vaccination removed" });
    },
  });

  const deleteMedicationMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/medications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pets", petId, "medications"] });
      toast({ title: "Medication removed" });
    },
  });

  const toggleMedicationMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      apiRequest("PATCH", `/api/medications/${id}`, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pets", petId, "medications"] });
      toast({ title: "Medication updated" });
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

  const sortedEvents = [...petEventsData].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  );

  const activeMedications = medicationsData.filter((m) => m.active);
  const pastMedications = medicationsData.filter((m) => !m.active);

  const upcomingItems: { type: string; label: string; detail: string; daysUntil: number; variant: "default" | "destructive" | "secondary" }[] = [];

  vaccinationsData.forEach((vax) => {
    if (vax.nextDueDate) {
      const days = differenceInDays(parseISO(vax.nextDueDate), new Date());
      if (days <= 90) {
        upcomingItems.push({
          type: "vaccination",
          label: vax.name,
          detail: `Due ${format(parseISO(vax.nextDueDate), "MMM d, yyyy")}`,
          daysUntil: days,
          variant: days < 0 ? "destructive" : days <= 14 ? "default" : "secondary",
        });
      }
    }
  });

  activeMedications.forEach((med) => {
    upcomingItems.push({
      type: "medication",
      label: med.name,
      detail: `${med.dosage || ""}${med.dosage && med.frequency ? " \u00b7 " : ""}${med.frequency || "Active"}`,
      daysUntil: 0,
      variant: "default",
    });
  });

  upcomingItems.sort((a, b) => a.daysUntil - b.daysUntil);

  const openVaccinationFromEvent = (event: EventWithPets) => {
    setEditingVaccination(undefined);
    setVaccinationPrefill({
      name: event.title,
      date: event.eventDate,
      notes: event.notes || undefined,
      sourceEventId: event.id,
    });
    setShowVaccinationDialog(true);
  };

  const openMedicationFromEvent = (event: EventWithPets) => {
    setEditingMedication(undefined);
    setMedicationPrefill({
      name: event.title,
      date: event.eventDate,
      notes: event.notes || undefined,
      sourceEventId: event.id,
    });
    setShowMedicationDialog(true);
  };

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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PawPrint className="h-4 w-4 text-muted-foreground" />
            Profile Details
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowEditDialog(true)} data-testid="button-edit-profile-details">
            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <ProfileSection title="Identification & Vet">
              <ProfileField label="Microchip #" value={pet.microchipNumber} testId="text-profile-microchip" />
              <ProfileField label="Microchip Location" value={pet.microchipLocation} testId="text-profile-microchip-location" />
              <ProfileField label="Vet Name" value={pet.vetName} testId="text-profile-vet" />
              <ProfileField label="Yearly Vaccination Date" value={pet.yearlyVaccinationDate} testId="text-profile-yearly-vax" />
            </ProfileSection>
            <ProfileSection title="Appearance">
              <ProfileField label="Hair Colour" value={pet.color} testId="text-profile-color" />
              <ProfileField label="Hair Length" value={pet.hairLength} testId="text-profile-hair-length" />
              <ProfileField label="Desexed" value={pet.desexed} testId="text-profile-desexed" />
            </ProfileSection>
            <ProfileSection title="Family">
              <ProfileField label="Father's Name" value={pet.fatherName} testId="text-profile-father" />
              <ProfileField label="Mother's Name" value={pet.motherName} testId="text-profile-mother" />
            </ProfileSection>
            <ProfileSection title="Feeding">
              <ProfileField label="Food Brand" value={pet.foodBrand} testId="text-profile-food-brand" />
              <ProfileField label="Per Meal Amount" value={pet.perMealAmount} testId="text-profile-meal-amount" />
              <ProfileField label="Meals Per Day" value={pet.mealsPerDay} testId="text-profile-meals-per-day" />
              <ProfileField label="Food Bowl Colour" value={pet.foodBowlColour} testId="text-profile-bowl-colour" />
            </ProfileSection>
            <ProfileSection title="Personality">
              <ProfileField label="Traits" value={pet.traits} testId="text-profile-traits" />
            </ProfileSection>
          </div>
        </CardContent>
      </Card>

      {upcomingItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Upcoming Health Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {upcomingItems.map((item, i) => {
                const isMed = item.type === "medication";
                const ItemIcon = isMed ? Pill : Shield;
                const chartVar = isMed ? "--chart-2" : "--chart-3";
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-md border flex-1 min-w-[200px]"
                    data-testid={`card-upcoming-${i}`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `hsl(var(${chartVar}) / 0.12)`, color: `hsl(var(${chartVar}))` }}>
                      <ItemIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    <Badge variant={item.variant} data-testid={`badge-upcoming-status-${i}`}>
                      {item.type === "medication"
                        ? "Active"
                        : item.daysUntil < 0
                        ? `${Math.abs(item.daysUntil)}d overdue`
                        : item.daysUntil === 0
                        ? "Today"
                        : `${item.daysUntil}d`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="events" className="w-full">
            <div className="border-b px-4 pt-3">
              <TabsList className="bg-transparent p-0 h-auto gap-4">
                <TabsTrigger
                  value="events"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-2.5 pt-1 px-1"
                  data-testid="tab-events"
                >
                  <Stethoscope className="h-4 w-4 mr-1.5" />
                  Vet Visits
                </TabsTrigger>
                <TabsTrigger
                  value="vaccinations"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-2.5 pt-1 px-1"
                  data-testid="tab-vaccinations"
                >
                  <Shield className="h-4 w-4 mr-1.5" />
                  Vaccinations
                  {vaccinationsData.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5">{vaccinationsData.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="medications"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-2.5 pt-1 px-1"
                  data-testid="tab-medications"
                >
                  <Pill className="h-4 w-4 mr-1.5" />
                  Medications
                  {activeMedications.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5">{activeMedications.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="events" className="m-0 p-4">
              <div className="flex items-center justify-between gap-2 mb-4">
                <p className="text-sm text-muted-foreground">{sortedEvents.length} event{sortedEvents.length !== 1 ? "s" : ""} recorded</p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/events" data-testid="link-log-event">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Log Event
                  </Link>
                </Button>
              </div>
              {sortedEvents.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {sortedEvents.map((event) => {
                    const CatIcon = categoryIcons[event.category] || CalendarDays;
                    const isVetVisit = event.category === "vet_visit";
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 rounded-md border"
                        data-testid={`card-pet-event-${event.id}`}
                      >
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md mt-0.5"
                          style={{
                            backgroundColor: (categoryColors[event.category] || "hsl(var(--muted))") + "18",
                            color: categoryColors[event.category] || "hsl(var(--foreground))",
                          }}
                        >
                          <CatIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(event.eventDate), "MMM d, yyyy")}
                            {event.location && <> &middot; {event.location}</>}
                          </p>
                          {event.notes && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.notes}</p>
                          )}
                          {isVetVisit && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openVaccinationFromEvent(event)}
                                data-testid={`button-record-vax-from-event-${event.id}`}
                              >
                                <Shield className="h-3.5 w-3.5 mr-1" />
                                Record Vaccination
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openMedicationFromEvent(event)}
                                data-testid={`button-record-med-from-event-${event.id}`}
                              >
                                <Pill className="h-3.5 w-3.5 mr-1" />
                                Record Medication
                              </Button>
                            </div>
                          )}
                        </div>
                        <Badge variant="outline">{categoryLabels[event.category]}</Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <CalendarDays className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No events logged for {pet.name}</p>
                  <Button size="sm" variant="outline" className="mt-2" asChild>
                    <Link href="/events">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Log First Event
                    </Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="vaccinations" className="m-0 p-4">
              <div className="flex items-center justify-between gap-2 mb-4">
                <p className="text-sm text-muted-foreground">{vaccinationsData.length} vaccination{vaccinationsData.length !== 1 ? "s" : ""} recorded</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setVaccinationPrefill(undefined);
                    setEditingVaccination(undefined);
                    setShowVaccinationDialog(true);
                  }}
                  data-testid="button-add-vaccination"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Vaccination
                </Button>
              </div>
              {vaccinationsData.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {vaccinationsData.map((vax) => {
                    const status = getVaccinationStatus(vax);
                    const StatusIcon = status.icon;
                    return (
                      <div
                        key={vax.id}
                        className="flex items-start gap-3 p-3 rounded-md border"
                        data-testid={`card-vaccination-${vax.id}`}
                      >
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md mt-0.5"
                          style={{ backgroundColor: "hsl(var(--chart-3) / 0.12)", color: "hsl(var(--chart-3))" }}
                        >
                          <Shield className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{vax.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Given {format(parseISO(vax.dateAdministered), "MMM d, yyyy")}
                            {vax.veterinarian && <> &middot; {vax.veterinarian}</>}
                          </p>
                          {vax.nextDueDate && (
                            <p className="text-xs text-muted-foreground">
                              Next due: {format(parseISO(vax.nextDueDate), "MMM d, yyyy")}
                            </p>
                          )}
                          {vax.notes && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{vax.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant={status.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingVaccination(vax);
                              setVaccinationPrefill(undefined);
                              setShowVaccinationDialog(true);
                            }}
                            title="Edit vaccination"
                            data-testid={`button-edit-vaccination-${vax.id}`}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteVaccinationMutation.mutate(vax.id)}
                            data-testid={`button-delete-vaccination-${vax.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <Shield className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No vaccinations recorded for {pet.name}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => {
                      setVaccinationPrefill(undefined);
                      setEditingVaccination(undefined);
                      setShowVaccinationDialog(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add First Vaccination
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="medications" className="m-0 p-4">
              <div className="flex items-center justify-between gap-2 mb-4">
                <p className="text-sm text-muted-foreground">
                  {activeMedications.length} active, {pastMedications.length} past
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setMedicationPrefill(undefined);
                    setEditingMedication(undefined);
                    setShowMedicationDialog(true);
                  }}
                  data-testid="button-add-medication"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Medication
                </Button>
              </div>

              {medicationsData.length > 0 ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {activeMedications.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active</p>
                      {activeMedications.map((med) => (
                        <div
                          key={med.id}
                          className="flex items-start gap-3 p-3 rounded-md border"
                          data-testid={`card-medication-${med.id}`}
                        >
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md mt-0.5"
                            style={{ backgroundColor: "hsl(var(--chart-2) / 0.12)", color: "hsl(var(--chart-2))" }}
                          >
                            <Pill className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{med.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {med.dosage && <>{med.dosage}</>}
                              {med.dosage && med.frequency && " \u00b7 "}
                              {med.frequency && <>{med.frequency}</>}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Started {format(parseISO(med.startDate), "MMM d, yyyy")}
                              {med.prescribedBy && <> &middot; {med.prescribedBy}</>}
                            </p>
                            {med.notes && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{med.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge variant="default">Active</Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingMedication(med);
                                setMedicationPrefill(undefined);
                                setShowMedicationDialog(true);
                              }}
                              title="Edit medication"
                              data-testid={`button-edit-medication-${med.id}`}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => toggleMedicationMutation.mutate({ id: med.id, active: false })}
                              title="Mark as completed"
                              data-testid={`button-deactivate-medication-${med.id}`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteMedicationMutation.mutate(med.id)}
                              data-testid={`button-delete-medication-${med.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {pastMedications.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Past</p>
                      {pastMedications.map((med) => (
                        <div
                          key={med.id}
                          className="flex items-start gap-3 p-3 rounded-md border opacity-60"
                          data-testid={`card-medication-${med.id}`}
                        >
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md mt-0.5"
                            style={{ backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
                          >
                            <Pill className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{med.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {med.dosage && <>{med.dosage}</>}
                              {med.dosage && med.frequency && " \u00b7 "}
                              {med.frequency && <>{med.frequency}</>}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(med.startDate), "MMM d, yyyy")}
                              {med.endDate && <> - {format(parseISO(med.endDate), "MMM d, yyyy")}</>}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge variant="secondary">Completed</Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingMedication(med);
                                setMedicationPrefill(undefined);
                                setShowMedicationDialog(true);
                              }}
                              title="Edit medication"
                              data-testid={`button-edit-medication-past-${med.id}`}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => toggleMedicationMutation.mutate({ id: med.id, active: true })}
                              title="Reactivate"
                              data-testid={`button-reactivate-medication-${med.id}`}
                            >
                              <Activity className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteMedicationMutation.mutate(med.id)}
                              data-testid={`button-delete-medication-past-${med.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <Pill className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No medications recorded for {pet.name}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => {
                      setMedicationPrefill(undefined);
                      setEditingMedication(undefined);
                      setShowMedicationDialog(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add First Medication
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
                <Area type="monotone" dataKey="weight" stroke="hsl(var(--chart-1))" fill="url(#weightGradient)" strokeWidth={2} />
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

      <WeightDialog open={showWeightDialog} onOpenChange={setShowWeightDialog} petId={petId} />
      {pet && <EditPetDialog open={showEditDialog} onOpenChange={setShowEditDialog} pet={pet} />}
      <VaccinationDialog
        key={`vax-${editingVaccination?.id || vaccinationPrefill?.sourceEventId || "new"}`}
        open={showVaccinationDialog}
        onOpenChange={(open) => {
          setShowVaccinationDialog(open);
          if (!open) {
            setVaccinationPrefill(undefined);
            setEditingVaccination(undefined);
          }
        }}
        petId={petId}
        prefill={vaccinationPrefill}
        editVaccination={editingVaccination}
      />
      <MedicationDialog
        key={`med-${editingMedication?.id || medicationPrefill?.sourceEventId || "new"}`}
        open={showMedicationDialog}
        onOpenChange={(open) => {
          setShowMedicationDialog(open);
          if (!open) {
            setMedicationPrefill(undefined);
            setEditingMedication(undefined);
          }
        }}
        petId={petId}
        prefill={medicationPrefill}
        editMedication={editingMedication}
      />

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
