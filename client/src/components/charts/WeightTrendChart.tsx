import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WeightPoint {
  date: string;
  weight: number;
  waist?: number | null;
  bodyFat?: number | null;
}

interface WeightTrendChartProps {
  data: WeightPoint[];
  targetWeight?: number | null;
  initialWeight?: number | null;
  className?: string;
  title?: string;
}

export function WeightTrendChart({
  data,
  targetWeight,
  initialWeight,
  className,
  title = "Динамика веса тела",
}: WeightTrendChartProps) {
  const weights = data.map((d) => d.weight).filter((w) => w > 0);
  const minW = weights.length ? Math.floor(Math.min(...weights) - 2) : 50;
  const maxW = weights.length ? Math.ceil(Math.max(...weights) + 2) : 100;
  const first = weights[0];
  const last = weights[weights.length - 1];
  const delta =
    first !== undefined && last !== undefined ? Number((last - first).toFixed(1)) : null;

  return (
    <Card className={cn(className)}>
      <CardHeader className="p-4 sm:p-5 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm sm:text-base">{title}</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Изменения массы тела (кг) по датам замеров
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs flex-wrap">
            {delta !== null && (
              <span
                className={cn(
                  "font-bold",
                  delta < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"
                )}
              >
                {delta < 0 ? "Сброшено" : "Набрано"}: {Math.abs(delta)} кг
              </span>
            )}
            {targetWeight && (
              <span className="text-muted-foreground">
                Цель: <b className="text-foreground">{targetWeight} кг</b>
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-2">
        {data.length === 0 ? (
          <div className="h-60 flex items-center justify-center text-xs text-muted-foreground">
            Пока нет записей замеров веса
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/40" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[minW, maxW]} tick={{ fontSize: 11 }} unit=" кг" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as WeightPoint;
                    return (
                      <div className="rounded-lg border bg-popover p-2 text-xs shadow-md space-y-0.5">
                        <p className="font-semibold text-foreground">{d.date}</p>
                        <p className="text-primary font-bold text-sm">{d.weight} кг</p>
                        {d.waist && <p className="text-muted-foreground">Талия: {d.waist} см</p>}
                        {d.bodyFat && <p className="text-muted-foreground">Жир: {d.bodyFat}%</p>}
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="Вес, кг"
                  stroke="#ec4899"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                  activeDot={{ r: 6 }}
                />
                {targetWeight && (
                  <ReferenceLine
                    y={targetWeight}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{ value: `Цель ${targetWeight} кг`, position: "insideBottomRight", fontSize: 10 }}
                  />
                )}
                {initialWeight && (
                  <ReferenceLine
                    y={initialWeight}
                    stroke="#94a3b8"
                    strokeDasharray="2 2"
                    label={{ value: `Старт ${initialWeight} кг`, position: "insideTopRight", fontSize: 10 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
