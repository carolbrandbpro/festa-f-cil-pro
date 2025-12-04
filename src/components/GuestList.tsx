import { useState, useMemo } from "react";
import { Guest, ConfirmationStatus, Accommodation, GuestGroup } from "@/types/guest";
import { GuestCard } from "./GuestCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface GuestListProps {
  guests: Guest[];
  onToggleArrived?: (id: string, arrived: boolean) => void;
}

const accommodations: Accommodation[] = [
  "Sandi",
  "Aconchego",
  "Vila Bom jardim",
  "Bartholomeu",
  "Barco próprio",
  "Pousada Literária",
];

const statuses: ConfirmationStatus[] = ["Confirmado", "Pendente", "Não comparecerá"];
const groups: GuestGroup[] = ["Família", "Amigos"];

export function GuestList({ guests, onToggleArrived }: GuestListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [accommodationFilter, setAccommodationFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [arrivedFilter, setArrivedFilter] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const matchesSearch =
        guest.name.toLowerCase().includes(search.toLowerCase()) ||
        guest.inviteName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || guest.status === statusFilter;
      const matchesAccommodation =
        accommodationFilter === "all" || guest.accommodation === accommodationFilter;
      const matchesGroup = groupFilter === "all" || guest.group === groupFilter;
      const matchesArrived =
        arrivedFilter === "all" || (arrivedFilter === "yes" ? !!guest.arrived : !guest.arrived);
      return matchesSearch && matchesStatus && matchesAccommodation && matchesGroup && matchesArrived;
    });
  }, [guests, search, statusFilter, accommodationFilter, groupFilter, arrivedFilter]);

  const activeFilters = [statusFilter, accommodationFilter, groupFilter, arrivedFilter].filter(
    (f) => f !== "all"
  ).length;

  const clearFilters = () => {
    setStatusFilter("all");
    setAccommodationFilter("all");
    setGroupFilter("all");
    setArrivedFilter("all");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar convidado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Filter className="h-4 w-4" />
              {activeFilters > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </Button>
          </SheetTrigger>
        <SheetContent side="bottom" className="h-auto max-h-[80vh]">
            <SheetHeader>
              <SheetTitle className="font-display">Filtros</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Hospedagem</label>
                <Select value={accommodationFilter} onValueChange={setAccommodationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {accommodations.map((acc) => (
                      <SelectItem key={acc} value={acc}>
                        {acc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Grupo</label>
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Chegada</label>
                <Select value={arrivedFilter} onValueChange={setArrivedFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="yes">Chegou</SelectItem>
                    <SelectItem value="no">Não chegou</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {activeFilters > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="text-sm text-muted-foreground">
        {filteredGuests.length} convidado{filteredGuests.length !== 1 && "s"}
      </div>

      <div className="grid gap-3 pb-20">
        {filteredGuests.map((guest) => (
          <GuestCard key={guest.id} guest={guest} onArrivedToggle={onToggleArrived} />
        ))}
        {filteredGuests.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum convidado encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
