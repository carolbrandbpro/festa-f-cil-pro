import { Guest } from "@/types/guest";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuestCardProps {
  guest: Guest;
  onStatusChange?: (id: string, status: Guest["status"]) => void;
}

const statusStyles = {
  Confirmado: "bg-success/10 text-success border-success/20",
  Pendente: "bg-warning/10 text-warning border-warning/20",
  "Não comparecerá": "bg-destructive/10 text-destructive border-destructive/20",
};

const ageGroupStyles = {
  Criança: "bg-chart-4/10 text-chart-4",
  Adolescente: "bg-chart-2/10 text-chart-2",
  Adulto: "bg-chart-1/10 text-chart-1",
  Idoso: "bg-chart-3/10 text-chart-3",
  "": "",
};

export function GuestCard({ guest }: GuestCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 transition-all duration-200 hover:shadow-md animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{guest.name}</h3>
            <p className="text-xs text-muted-foreground">{guest.inviteName}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn("text-xs font-medium", statusStyles[guest.status])}
        >
          {guest.status}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-3.5 w-3.5" />
          <span>{guest.phone || "Sem telefone"}</span>
        </div>

        {guest.accommodation && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{guest.accommodation}</span>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap mt-3">
          <Badge variant="secondary" className="text-xs">
            {guest.group}
          </Badge>
          {guest.ageGroup && (
            <Badge
              variant="outline"
              className={cn("text-xs", ageGroupStyles[guest.ageGroup])}
            >
              {guest.ageGroup}
            </Badge>
          )}
          {guest.friday === "sim" || guest.friday === "Aye" ? (
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              <Calendar className="h-3 w-3 mr-1" />
              Sexta
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  );
}
