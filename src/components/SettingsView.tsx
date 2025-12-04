import { PartyPopper, Info, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function SettingsView() {
  return (
    <div className="space-y-6 pb-20">
      <header className="space-y-1">
        <h1 className="text-2xl font-display font-bold text-foreground">
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seu evento
        </p>
      </header>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl gradient-gold flex items-center justify-center">
            <PartyPopper className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">Isola 70</h2>
            <p className="text-sm text-muted-foreground">
              Festa de aniversário
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Sobre o Evento
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Local</p>
              <p className="font-medium">Ilhabela, SP</p>
            </div>
            <div>
              <p className="text-muted-foreground">Data</p>
              <p className="font-medium">Sexta e Sábado</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
          Ações
        </h3>
        
        <Button variant="outline" className="w-full justify-start" disabled>
          <Download className="h-4 w-4 mr-3" />
          Exportar lista (em breve)
        </Button>

        <Button variant="outline" className="w-full justify-start" disabled>
          <Upload className="h-4 w-4 mr-3" />
          Importar dados (em breve)
        </Button>
      </div>

      <div className="bg-muted/50 rounded-xl p-4 flex gap-3">
        <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Dica</p>
          <p>
            Use o filtro na aba de convidados para encontrar rapidamente pessoas
            por hospedagem, grupo ou status de confirmação.
          </p>
        </div>
      </div>
    </div>
  );
}
