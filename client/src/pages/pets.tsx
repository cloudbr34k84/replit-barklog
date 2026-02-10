import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, PawPrint, Upload, Camera } from "lucide-react";
import type { Pet } from "@shared/schema";

function PetFormDialog({
  open,
  onOpenChange,
  editPet,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editPet?: Pet;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(editPet?.name || "");
  const [breed, setBreed] = useState(editPet?.breed || "");
  const [species, setSpecies] = useState(editPet?.species || "dog");
  const [gender, setGender] = useState(editPet?.gender || "");
  const [color, setColor] = useState(editPet?.color || "");
  const [dateOfBirth, setDateOfBirth] = useState(editPet?.dateOfBirth || "");
  const [avatarUrl, setAvatarUrl] = useState(editPet?.avatarUrl || "");

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      setAvatarUrl(response.objectPath);
      toast({ title: "Photo uploaded successfully" });
    },
    onError: () => {
      toast({ title: "Failed to upload photo", variant: "destructive" });
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (editPet) {
        return apiRequest("PATCH", `/api/pets/${editPet.id}`, data);
      }
      return apiRequest("POST", "/api/pets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pets"] });
      toast({ title: editPet ? "Pet updated" : "Pet added successfully" });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    if (!editPet) {
      setName("");
      setBreed("");
      setSpecies("dog");
      setGender("");
      setColor("");
      setDateOfBirth("");
      setAvatarUrl("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
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
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editPet ? "Edit Pet" : "Add New Pet"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {name ? name.charAt(0).toUpperCase() : <PawPrint className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                <Camera className="h-3.5 w-3.5" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  data-testid="input-avatar-upload"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pet-name">Name *</Label>
              <Input
                id="pet-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Buddy"
                required
                data-testid="input-pet-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pet-breed">Breed *</Label>
              <Input
                id="pet-breed"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="e.g. Pug"
                required
                data-testid="input-pet-breed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Species</Label>
              <Select value={species} onValueChange={setSpecies}>
                <SelectTrigger data-testid="select-pet-species">
                  <SelectValue />
                </SelectTrigger>
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
                <SelectTrigger data-testid="select-pet-gender">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pet-color">Color</Label>
              <Input
                id="pet-color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Fawn"
                data-testid="input-pet-color"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pet-dob">Date of Birth</Label>
              <Input
                id="pet-dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                data-testid="input-pet-dob"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending || isUploading}
            data-testid="button-submit-pet"
          >
            {mutation.isPending
              ? "Saving..."
              : editPet
              ? "Update Pet"
              : "Add Pet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PetsPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [, setLocation] = useLocation();

  const { data: pets = [], isLoading } = useQuery<Pet[]>({
    queryKey: ["/api/pets"],
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
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
          <h1 className="text-2xl font-bold" data-testid="text-pets-title">Pets</h1>
          <p className="text-sm text-muted-foreground">
            Manage your pet profiles
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} data-testid="button-add-pet">
          <Plus className="h-4 w-4 mr-1" />
          Add Pet
        </Button>
      </div>

      {pets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map((pet) => (
            <Card
              key={pet.id}
              className="hover-elevate cursor-pointer"
              onClick={() => setLocation(`/pets/${pet.id}`)}
              data-testid={`card-pet-${pet.id}`}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={pet.avatarUrl || undefined} alt={pet.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                      {pet.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate" data-testid={`text-pet-name-${pet.id}`}>
                      {pet.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {pet.breed}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <Badge variant="secondary" className="text-xs">
                        {pet.species}
                      </Badge>
                      {pet.gender && (
                        <Badge variant="outline" className="text-xs">
                          {pet.gender}
                        </Badge>
                      )}
                      {pet.color && (
                        <Badge variant="outline" className="text-xs">
                          {pet.color}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <PawPrint className="h-12 w-12 mb-3 opacity-30" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              No pets yet
            </h3>
            <p className="text-sm mb-4">
              Add your first pet to start tracking their health
            </p>
            <Button onClick={() => setShowDialog(true)} data-testid="button-add-first-pet">
              <Plus className="h-4 w-4 mr-1" />
              Add Your First Pet
            </Button>
          </CardContent>
        </Card>
      )}

      <PetFormDialog open={showDialog} onOpenChange={setShowDialog} />
    </div>
  );
}
