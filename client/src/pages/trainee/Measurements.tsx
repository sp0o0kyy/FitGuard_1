import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/AppLayout";
import { WeightTrendChart } from "@/components/charts/WeightTrendChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Scale, PlusCircle, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";

export default function Measurements() {
  const { user } = useAuthContext();
  const { data: measurements, isLoading, refetch } = trpc.trainee.listMeasurements.useQuery();
  const [open, setOpen] = useState(false);

  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [chest, setChest] = useState("");
  const [biceps, setBiceps] = useState("");
  const [thigh, setThigh] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [notes, setNotes] = useState("");

  const add = trpc.trainee.addMeasurement.useMutation({
    onSuccess: () => {
      toast.success("Замер сохранён");
      setOpen(false);
      setWeight("");
      setWaist("");
      setHips("");
      setChest("");
      setBiceps("");
      setThigh("");
      setBodyFat("");
      setNotes("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const del = trpc.trainee.deleteMeasurement.useMutation({
    onSuccess: () => {
      toast.success("Замер удалён");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;
    add.mutate({
      weight: Number(weight),
      waist: waist ? Number(waist) : undefined,
      hips: hips ? Number(hips) : undefined,
      chest: chest ? Number(chest) : undefined,
      biceps: biceps ? Number(biceps) : undefined,
      thigh: thigh ? Number(thigh) : undefined,
      bodyFat: bodyFat ? Number(bodyFat) : undefined,
      notes: notes.trim() || undefined,
    });
  };

  const chartData = [...(measurements || [])].reverse().map((m) => ({
    date: new Date(m.measuredAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
    weight: Number(m.weight),
    waist: m.waist ? Number(m.waist) : null,
    bodyFat: m.bodyFat ? Number(m.bodyFat) : null,
  }));

  return (
    <AppLayout
      title="Замеры и антропометрия"
      subtitle="Ведите динамику веса и объёмов тела — тренер видит эти данные в вашей карточке"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="text-xs h-9 gap-1.5">
              <PlusCircle className="h-4 w-4" /> Новый замер
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Внести замеры</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="w" className="text-xs">
                    Вес, кг *
                  </Label>
                  <Input
                    id="w"
                    type="number"
                    step="0.1"
                    min="20"
                    max="400"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="82.3"
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bf" className="text-xs">
                    Процент жира, %
                  </Label>
                  <Input
                    id="bf"
                    type="number"
                    step="0.1"
                    min="3"
                    max="70"
                    value={bodyFat}
                    onChange={(e) => setBodyFat(e.target.value)}
                    placeholder="17"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="wt" className="text-xs">
                    Талия, см
                  </Label>
                  <Input
                    id="wt"
                    type="number"
                    step="0.5"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                    placeholder="86"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="hp" className="text-xs">
                    Бёдра, см
                  </Label>
                  <Input
                    id="hp"
                    type="number"
                    step="0.5"
                    value={hips}
                    onChange={(e) => setHips(e.target.value)}
                    placeholder="101"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ch" className="text-xs">
                    Грудь, см
                  </Label>
                  <Input
                    id="ch"
                    type="number"
                    step="0.5"
                    value={chest}
                    onChange={(e) => setChest(e.target.value)}
                    placeholder="107"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bc" className="text-xs">
                    Бицепс, см
                  </Label>
                  <Input
                    id="bc"
                    type="number"
                    step="0.5"
                    value={biceps}
                    onChange={(e) => setBiceps(e.target.value)}
                    placeholder="40"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="th" className="text-xs">
                    Бедро, см
                  </Label>
                  <Input
                    id="th"
                    type="number"
                    step="0.5"
                    value={thigh}
                    onChange={(e) => setThigh(e.target.value)}
                    placeholder="60"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="nt" className="text-xs">
                  Заметка
                </Label>
                <Input
                  id="nt"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="после разгрузки, утро..."
                  className="h-9 text-xs"
                />
              </div>
              <Button type="submit" className="w-full h-10 text-xs" disabled={add.isPending}>
                {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        <WeightTrendChart
          data={chartData}
          targetWeight={user?.targetWeight ? Number(user.targetWeight) : null}
          initialWeight={user?.initialWeight ? Number(user.initialWeight) : null}
        />

        <Card>
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" /> История замеров
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            {isLoading ? (
              <div className="py-10 text-center text-xs text-muted-foreground animate-pulse">
                Загрузка...
              </div>
            ) : measurements && measurements.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                Нет записей замеров — нажмите «Новый замер»
              </p>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-muted-foreground text-[11px]">
                      <th className="py-2">Дата</th>
                      <th className="py-2">Вес</th>
                      <th className="py-2">Талия</th>
                      <th className="py-2">Бёдра</th>
                      <th className="py-2">Грудь</th>
                      <th className="py-2">Бицепс</th>
                      <th className="py-2">Жир %</th>
                      <th className="py-2">Заметка</th>
                      <th className="py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements?.map((m) => (
                      <tr key={m.id} className="border-b hover:bg-muted/30">
                        <td className="py-2 font-medium">
                          {new Date(m.measuredAt).toLocaleDateString("ru-RU")}
                        </td>
                        <td className="py-2 font-bold">{m.weight} кг</td>
                        <td className="py-2">{m.waist ? `${m.waist}` : "—"}</td>
                        <td className="py-2">{m.hips ? `${m.hips}` : "—"}</td>
                        <td className="py-2">{m.chest ? `${m.chest}` : "—"}</td>
                        <td className="py-2">{m.biceps ? `${m.biceps}` : "—"}</td>
                        <td className="py-2">{m.bodyFat ? `${m.bodyFat}%` : "—"}</td>
                        <td className="py-2 text-muted-foreground max-w-[150px] truncate">
                          {m.notes || "—"}
                        </td>
                        <td className="py-2 text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              if (confirm("Удалить замер?")) del.mutate({ id: m.id });
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
