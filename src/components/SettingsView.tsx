import { PartyPopper, Info, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRef, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Guest, AgeGroup, GuestGroup, ConfirmationStatus, FridayStatus, GuestStats } from "@/types/guest";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { setStore } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { setStore } from "@/lib/api";

interface SettingsViewProps {
  guests: Guest[];
  onImport: (guests: Guest[]) => void;
  eventTitle: string;
  onTitleChange: (title: string) => void;
}

export function SettingsView({ guests, onImport, eventTitle, onTitleChange }: SettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState<{ added: Guest[]; ignored: Guest[] } | null>(null);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      setLogged(!!data.session);
      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        setLogged(!!session);
      });
      unsub = () => sub.subscription.unsubscribe();
    })();
    return () => { if (unsub) unsub(); };
  }, []);

  const exportXLSX = async () => {
    const header = [
      "Nome do convite *",
      "DDI",
      "DDD +Telefone",
      "Grupo do convite",
      "Local de Hospedagem",
      "Nome dos convidados *",
      "Sexta",
      "Faixa etária",
      "sábado",
    ];
    const PRIMARY_BG = "FFFFF3E0";
    const PRIMARY_BORDER = "FFD4AF37";
    const HIGHLIGHT_BG = "FFFAE3B0";
    const PRIMARY_GRADIENT_START = "FFD99726";
    const PRIMARY_GRADIENT_END = "FFEBC247";
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Convidados");
    ws.columns = [
      { header: header[0], key: "inviteName", width: 28 },
      { header: header[1], key: "ddi", width: 6 },
      { header: header[2], key: "dddPhone", width: 16 },
      { header: header[3], key: "group", width: 12 },
      { header: header[4], key: "accommodation", width: 18 },
      { header: header[5], key: "name", width: 22 },
      { header: header[6], key: "friday", width: 10 },
      { header: header[7], key: "ageGroup", width: 12 },
      { header: header[8], key: "status", width: 12 },
    ];
    ws.addRow(["PLANILHA DE CONVIDADOS (2.0)"]);
    ws.mergeCells(1, 1, 1, header.length);
    ws.getRow(1).height = 22;
    ws.getCell(1, 1).alignment = { horizontal: "center", vertical: "middle" };
    ws.getCell(1, 1).font = { bold: true, size: 14 };
    for (let c = 1; c <= header.length; c++) {
      const cell = ws.getCell(1, c);
      cell.fill = {
        type: "gradient",
        gradient: "angle",
        degree: 0,
        stops: [
          { position: 0, color: { argb: PRIMARY_GRADIENT_START } },
          { position: 1, color: { argb: PRIMARY_GRADIENT_END } },
        ],
      };
      cell.border = {
        top: { style: "thin", color: { argb: PRIMARY_BORDER } },
        left: { style: "thin", color: { argb: PRIMARY_BORDER } },
        bottom: { style: "thin", color: { argb: PRIMARY_BORDER } },
        right: { style: "thin", color: { argb: PRIMARY_BORDER } },
      };
    }
    const headerRow = ws.addRow(header);
    headerRow.height = 20;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF2F7" } };
      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
    });
    guests.forEach((g) => {
      const p = splitBRPhone(g.phone);
      const r = ws.addRow([
        g.inviteName || eventTitle,
        p.ddi,
        p.dddPhone,
        g.group,
        g.accommodation,
        g.name,
        g.friday,
        g.ageGroup,
        g.status,
      ]);
      r.eachCell((cell) => {
        cell.border = {
          top: { style: "hair" },
          left: { style: "hair" },
          bottom: { style: "hair" },
          right: { style: "hair" },
        };
      });
    });
    ws.addRow([""]); ws.addRow([""]);
    const stats = computeStats(guests);
    ws.addRow(["RESUMO DO EVENTO"]);
    ws.mergeCells(ws.lastRow!.number, 1, ws.lastRow!.number, header.length);
    ws.getCell(ws.lastRow!.number, 1).alignment = { horizontal: "center" };
    ws.getCell(ws.lastRow!.number, 1).font = { bold: true, size: 12 };
    ws.getCell(ws.lastRow!.number, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_BG } };
    ws.getCell(ws.lastRow!.number, 1).border = {
      top: { style: "thin", color: { argb: PRIMARY_BORDER } },
      left: { style: "thin", color: { argb: PRIMARY_BORDER } },
      bottom: { style: "thin", color: { argb: PRIMARY_BORDER } },
      right: { style: "thin", color: { argb: PRIMARY_BORDER } },
    };
    const summaryRows = buildSummaryRows(stats);
    summaryRows.forEach((row) => {
      const r = ws.addRow([String(row["Métrica"]), row["Valor"]]);
      r.getCell(1).font = { bold: row["Métrica"] === "" ? false : true };
      if (String(row["Métrica"]) === "Total") {
        r.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HIGHLIGHT_BG } };
          cell.border = {
            top: { style: "thin", color: { argb: PRIMARY_BORDER } },
            left: { style: "thin", color: { argb: PRIMARY_BORDER } },
            bottom: { style: "thin", color: { argb: PRIMARY_BORDER } },
            right: { style: "thin", color: { argb: PRIMARY_BORDER } },
          };
        });
      }
    });
    ws.addRow([""]);
    ws.addRow(["POR GRUPO"]);
    ws.getCell(ws.lastRow!.number, 1).font = { bold: true };
    ws.getCell(ws.lastRow!.number, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_BG } };
    Object.entries(stats.byGroup).forEach(([k, v]) => ws.addRow([k, v]));
    ws.addRow([""]);
    ws.addRow(["POR HOSPEDAGEM"]);
    ws.getCell(ws.lastRow!.number, 1).font = { bold: true };
    ws.getCell(ws.lastRow!.number, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_BG } };
    Object.entries(stats.byAccommodation).forEach(([k, v]) => ws.addRow([k, v]));
    ws.addRow([""]);
    ws.addRow(["POR FAIXA ETÁRIA"]);
    ws.getCell(ws.lastRow!.number, 1).font = { bold: true };
    ws.getCell(ws.lastRow!.number, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_BG } };
    Object.entries(stats.byAgeGroup).forEach(([k, v]) => ws.addRow([k, v]));
    ws.addRow([""]); ws.addRow([""]);
    ws.addRow(["DUPLICIDADES POTENCIAIS"]);
    ws.mergeCells(ws.lastRow!.number, 1, ws.lastRow!.number, header.length);
    ws.getCell(ws.lastRow!.number, 1).alignment = { horizontal: "center" };
    ws.getCell(ws.lastRow!.number, 1).font = { bold: true, size: 12 };
    ws.getCell(ws.lastRow!.number, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_BG } };
    ws.getCell(ws.lastRow!.number, 1).border = {
      top: { style: "thin", color: { argb: PRIMARY_BORDER } },
      left: { style: "thin", color: { argb: PRIMARY_BORDER } },
      bottom: { style: "thin", color: { argb: PRIMARY_BORDER } },
      right: { style: "thin", color: { argb: PRIMARY_BORDER } },
    };
    const dupRows = buildDuplicateRows(guests);
    if (dupRows.length > 1) {
      const dupHeader = ws.addRow(["Nome", "Telefones", "Ocorrências"]);
      dupHeader.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF2F7" } };
        cell.border = {
          top: { style: "thin", color: { argb: "FFCBD5E1" } },
          left: { style: "thin", color: { argb: "FFCBD5E1" } },
          bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
          right: { style: "thin", color: { argb: "FFCBD5E1" } },
        };
      });
      dupRows.slice(1).forEach((r) => ws.addRow([String(r.Nome), String(r.Telefones), r.Ocorrências]));
    } else {
      ws.addRow(["Sem duplicidades"]);
    }
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventTitle}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exportação concluída", description: `Arquivo ${eventTitle}.xlsx baixado` });
  };

  const splitBRPhone = (raw: string) => {
    const digits = String(raw || "").replace(/\D/g, "");
    const ddi = "55";
    let rest = digits;
    if (digits.startsWith("55")) {
      rest = digits.slice(2);
    }
    const ddd = rest.slice(0, 2);
    const num = rest.slice(2);
    const dddPhone = ddd ? `${ddd} ${formatPhone(num)}` : formatPhone(num);
    return { ddi, dddPhone };
  };

  const formatPhone = (num: string) => {
    if (!num) return "";
    if (num.length >= 9) return `${num.slice(0, 5)}-${num.slice(5)}`;
    if (num.length >= 8) return `${num.slice(0, 4)}-${num.slice(4)}`;
    return num;
  };

  const computeStats = (guests: Guest[]): GuestStats => {
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
        byAccommodation[guest.accommodation] = (byAccommodation[guest.accommodation] || 0) + 1;
      }
      const age = guest.ageGroup || "Adulto";
      byAgeGroup[age] = (byAgeGroup[age] || 0) + 1;
      if (guest.friday === "sim" || guest.friday === "Aye") fridayConfirmed++;
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
  };

  const buildSummaryRows = (stats: GuestStats): Array<Record<string, string | number>> => {
    const rows: Array<Record<string, string | number>> = [];
    rows.push({ Métrica: "Total", Valor: stats.total });
    rows.push({ Métrica: "Confirmados", Valor: stats.confirmed });
    rows.push({ Métrica: "Pendentes", Valor: stats.pending });
    rows.push({ Métrica: "Não comparecerão", Valor: stats.notAttending });
    rows.push({ Métrica: "Sexta confirmados", Valor: stats.fridayConfirmed });
    rows.push({ Métrica: "", Valor: "" });
    rows.push({ Métrica: "Por Grupo", Valor: "" });
    Object.entries(stats.byGroup).forEach(([k, v]) => rows.push({ Métrica: k, Valor: v }));
    rows.push({ Métrica: "", Valor: "" });
    rows.push({ Métrica: "Por Hospedagem", Valor: "" });
    Object.entries(stats.byAccommodation).forEach(([k, v]) => rows.push({ Métrica: k, Valor: v }));
    rows.push({ Métrica: "", Valor: "" });
    rows.push({ Métrica: "Por Faixa Etária", Valor: "" });
    Object.entries(stats.byAgeGroup).forEach(([k, v]) => rows.push({ Métrica: k, Valor: v }));
    return rows;
  };

  const buildDuplicateRows = (guests: Guest[]): Array<Record<string, string | number>> => {
    const byName: Record<string, { phones: Set<string>; count: number }> = {};
    guests.forEach((g) => {
      const key = normalizeKey(g.name);
      const clean = String(g.phone || "").replace(/\D/g, "");
      if (!byName[key]) byName[key] = { phones: new Set(), count: 0 };
      if (clean) byName[key].phones.add(clean);
      byName[key].count += 1;
    });
    const rows: Array<Record<string, string | number>> = [{ Nome: "Nome", Telefones: "Telefones", Ocorrências: "Ocorrências" }];
    Object.entries(byName)
      .filter(([_, info]) => info.count > 1 || info.phones.size > 1)
      .forEach(([name, info]) => {
        rows.push({ Nome: name, Telefones: Array.from(info.phones).join(", "), Ocorrências: info.count });
      });
    return rows.length > 1 ? rows : [{ Nome: "Sem duplicidades", Telefones: "", Ocorrências: 0 }];
  };

  const triggerImport = () => {
    if (!logged) {
      toast({ title: "Faça login", description: "Entre para importar dados", variant: "destructive" });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const ext = (file.name.toLowerCase().split(".").pop() || "");
      const mime = file.type.toLowerCase();
      let imported: Guest[] = [];
      if (ext === "xlsx" || mime.includes("spreadsheet")) {
        const buf = await file.arrayBuffer();
        imported = parseXLSXGuests(buf);
      } else if (ext === "csv" || mime === "text/csv") {
        const text = await file.text();
        imported = parseCSVGuests(text);
      } else {
        const text = await file.text();
        imported = parseJSONGuests(text);
      }
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      imported = imported.map((g) => ({ ...g, inviteName: g.inviteName || baseName }));
      const { merged, added, ignored } = mergeUniqueWithReport(guests, imported);
      onImport(merged);
      onTitleChange(baseName);
      await setStore("guests", merged);
      await setStore("title", baseName);
      setReport({ added, ignored });
      setReportOpen(true);
      toast({ title: "Importação concluída", description: `${added.length} novos convidados adicionados` });
    } catch (err) {
      toast({ title: "Falha na importação", description: "Use um arquivo JSON ou CSV válido", variant: "destructive" });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const parseJSONGuests = (text: string): Guest[] => {
    const data = JSON.parse(text) as Partial<Guest>[];
    if (!Array.isArray(data)) throw new Error("Formato inválido");
    return data.map((g) => ({
      id: g.id ?? (crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2, 10)}`),
      inviteName: String(g.inviteName ?? ""),
      phone: String(g.phone ?? ""),
      group: normalizeGroup(String(g.group ?? "")),
      accommodation: String(g.accommodation ?? ""),
      name: String(g.name ?? ""),
      friday: normalizeFriday(String(g.friday ?? "")),
      ageGroup: normalizeAgeGroup(String(g.ageGroup ?? "")),
      status: normalizeStatus(String(g.status ?? "")),
    }));
  };

  const parseCSVGuests = (text: string): Guest[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];
    const headers = splitCSVLine(lines[0]).map((h) => h.trim());
    const idx = headerIndex(headers);
    const out: Guest[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = splitCSVLine(lines[i]);
      const id = getCol(cols, idx.id);
      const inviteName = getCol(cols, idx.inviteName);
      const ddi = getCol(cols, idx.ddi);
      const dddPhone = getCol(cols, idx.dddPhone);
      const phoneRaw = getCol(cols, idx.phone);
      const phone = phoneRaw || [ddi, dddPhone].filter(Boolean).join(" ");
      const group = normalizeGroup(getCol(cols, idx.group));
      const accommodation = getCol(cols, idx.accommodation);
      const name = getCol(cols, idx.name);
      const friday = normalizeFriday(getCol(cols, idx.friday));
      const ageGroup = normalizeAgeGroup(getCol(cols, idx.ageGroup));
      const status = normalizeStatus(getCol(cols, idx.status));
      out.push({
        id: id || (crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2, 10)}`),
        inviteName,
        phone,
        group,
        accommodation,
        name,
        friday,
        ageGroup,
        status,
      });
    }
    return out;
  };

  const parseXLSXGuests = (buf: ArrayBuffer): Guest[] => {
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, { defval: "" });
    const headers = Object.keys(rows[0] || {}).map((h) => String(h));
    const idx = headerIndex(headers);
    return rows.map((row) => {
      const get = (keyIdx: number, fallbackKey: string) => {
        if (keyIdx >= 0) return String(row[headers[keyIdx]] ?? "");
        return String(row[fallbackKey] ?? "");
      };
      const id = get(idx.id, "id");
      const inviteName = get(idx.inviteName, "inviteName");
      const ddi = get(idx.ddi, "ddi");
      const dddPhone = get(idx.dddPhone, "dddPhone");
      const phoneRaw = get(idx.phone, "phone");
      const phone = phoneRaw || [ddi, dddPhone].filter(Boolean).join(" ");
      const group = normalizeGroup(get(idx.group, "group"));
      const accommodation = get(idx.accommodation, "accommodation");
      const name = get(idx.name, "name");
      const friday = normalizeFriday(get(idx.friday, "friday"));
      const ageGroup = normalizeAgeGroup(get(idx.ageGroup, "ageGroup"));
      const status = normalizeStatus(get(idx.status, "status"));
      return {
        id: id || (crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2, 10)}`),
        inviteName,
        phone,
        group,
        accommodation,
        name,
        friday,
        ageGroup,
        status,
      };
    });
  };

  const mergeUniqueWithReport = (current: Guest[], incoming: Guest[]) => {
    const keyOf = (g: Guest) => normalizeKey(`${g.name}|${g.phone || ""}`);
    const set = new Set(current.map((g) => keyOf(g)));
    const added: Guest[] = [];
    const ignored: Guest[] = [];
    for (const g of incoming) {
      const key = keyOf(g);
      if (set.has(key)) {
        ignored.push(g);
      } else {
        set.add(key);
        added.push(g);
      }
    }
    return { merged: [...current, ...added], added, ignored };
  };

  const normalizeKey = (s: string) => s.trim().toLowerCase();

  const splitCSVLine = (line: string): string[] => {
    const res: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          const next = line[i + 1];
          if (next === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cur += ch;
        }
      } else {
        if (ch === ',') {
          res.push(cur);
          cur = "";
        } else if (ch === '"') {
          inQuotes = true;
        } else {
          cur += ch;
        }
      }
    }
    res.push(cur);
    return res.map((v) => v.trim());
  };

  const headerIndex = (headers: string[]) => {
    const map = (name: string) => normalizeHeader(name);
    const norm = headers.map((h) => map(h));
    const findOne = (...keys: string[]) => {
      for (const k of keys) {
        const idx = norm.indexOf(k);
        if (idx >= 0) return idx;
      }
      return -1;
    };
    return {
      id: findOne("id"),
      inviteName: findOne("invitename", "nomedoconvite"),
      phone: findOne("phone", "telefone"),
      ddi: findOne("ddi"),
      dddPhone: findOne("dddtelefone", "dddphone"),
      group: findOne("group", "grupodoconvite", "grupo"),
      accommodation: findOne("accommodation", "localdehospedagem", "hospedagem"),
      name: findOne("name", "nomedosconvidados", "nome"),
      friday: findOne("friday", "sexta"),
      ageGroup: findOne("agegroup", "faixaetaria"),
      status: findOne("status", "sabado"),
    };
  };

  const normalizeHeader = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  const getCol = (cols: string[], i: number) => (i >= 0 && i < cols.length ? cols[i] : "");

  const normalizeGroup = (s: string): GuestGroup => {
    const v = s.toLowerCase();
    if (v === "família" || v === "familia") return "Família";
    return "Amigos";
  };

  const normalizeStatus = (s: string): ConfirmationStatus => {
    const v = s.toLowerCase();
    if (v.startsWith("confirm")) return "Confirmado";
    if (v.startsWith("pend")) return "Pendente";
    return "Não comparecerá";
  };

  const normalizeFriday = (s: string): FridayStatus => {
    const v = s.toLowerCase();
    if (v === "sim" || v === "yes") return "sim";
    if (v === "não" || v === "nao" || v === "no") return "não";
    if (v === "aye") return "Aye";
    return "";
  };

  const normalizeAgeGroup = (s: string): AgeGroup => {
    const v = s.toLowerCase();
    if (v.startsWith("crian")) return "Criança";
    if (v.startsWith("adole")) return "Adolescente";
    if (v.startsWith("adult")) return "Adulto";
    if (v.startsWith("idos")) return "Idoso";
    return "";
  };

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
            <h2 className="text-xl font-display font-bold">{eventTitle}</h2>
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
              <p className="font-medium">Villa Bom Jardim, Ilha de Paraty</p>
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
        
        <Button variant="outline" className="w-full justify-start" onClick={exportXLSX}>
          <Download className="h-4 w-4 mr-3" />
          Exportar Excel
        </Button>

        <input ref={fileInputRef} type="file" accept="application/json,.json,text/csv,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx" className="hidden" onChange={handleFileChange} />
        <Button variant="outline" className="w-full justify-start" onClick={triggerImport} disabled={!logged}>
          <Upload className="h-4 w-4 mr-3" />
          Importar dados
        </Button>

        <div className="mt-2 text-xs text-muted-foreground px-1">
          Status: {logged ? "logado" : "não logado"}
        </div>
        {logged ? (
          <Button variant="secondary" className="w-full mt-2" onClick={async () => { await supabase?.auth.signOut(); toast({ title: "Sessão encerrada" }); } }>
            Sair
          </Button>
        ) : (
          <a href="/login" className="w-full mt-2 inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm">
            Entrar
          </a>
        )}
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

      {/* Relatório pós-importação */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resultado da importação</DialogTitle>
            <DialogDescription>
              {report ? `${report.added.length} adicionados, ${report.ignored.length} ignorados (duplicados).` : ""}
            </DialogDescription>
          </DialogHeader>
          {report && (
            <div className="grid grid-cols-2 gap-4 text-sm max-h-64 overflow-auto">
              <div>
                <p className="font-medium">Adicionados</p>
                <ul className="mt-2 space-y-1">
                  {report.added.map((g) => (
                    <li key={`added-${g.id}`}>{g.name} — {g.phone}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium">Ignorados</p>
                <ul className="mt-2 space-y-1">
                  {report.ignored.map((g, i) => (
                    <li key={`ignored-${i}`}>{g.name} — {g.phone}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
