import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sun, Moon, Activity, Settings, TrendingUp, Bell, Download } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
  BarChart,
  Bar
} from "recharts";

// --- Mock data ---
const nights = [
  { date: "2025-10-03", duration: 7.6, efficiency: 91, rem: 22, deep: 17, light: 61, hrv: 72, hrMin: 52, hrAvg: 62, snoreMin: 4, awakenings: 2, sleepScore: 86 },
  { date: "2025-10-04", duration: 6.9, efficiency: 88, rem: 18, deep: 15, light: 67, hrv: 68, hrMin: 50, hrAvg: 60, snoreMin: 8, awakenings: 3, sleepScore: 79 },
  { date: "2025-10-05", duration: 8.2, efficiency: 93, rem: 24, deep: 19, light: 57, hrv: 74, hrMin: 49, hrAvg: 58, snoreMin: 2, awakenings: 1, sleepScore: 92 },
  { date: "2025-10-06", duration: 7.1, efficiency: 89, rem: 20, deep: 16, light: 64, hrv: 70, hrMin: 51, hrAvg: 61, snoreMin: 5, awakenings: 2, sleepScore: 83 },
  { date: "2025-10-07", duration: 7.8, efficiency: 92, rem: 23, deep: 18, light: 59, hrv: 75, hrMin: 48, hrAvg: 57, snoreMin: 3, awakenings: 2, sleepScore: 90 }
];

const sessionTimeline = [
  // time is hours from sleep start; value encodes stage (0-awake,1-light,2-deep,3-REM)
  { t: 0.0, stage: 1, hr: 64 },
  { t: 0.5, stage: 2, hr: 60 },
  { t: 1.0, stage: 2, hr: 58 },
  { t: 1.5, stage: 1, hr: 60 },
  { t: 2.0, stage: 3, hr: 62 },
  { t: 2.5, stage: 1, hr: 61 },
  { t: 3.0, stage: 2, hr: 57 },
  { t: 3.5, stage: 1, hr: 59 },
  { t: 4.0, stage: 3, hr: 61 },
  { t: 4.5, stage: 1, hr: 60 },
  { t: 5.0, stage: 2, hr: 56 },
  { t: 5.5, stage: 1, hr: 58 },
  { t: 6.0, stage: 1, hr: 59 },
  { t: 6.5, stage: 3, hr: 60 },
  { t: 7.0, stage: 1, hr: 61 },
  { t: 7.5, stage: 0, hr: 65 }
];

const stageName = (s:number) => s===0?"Awake": s===1?"Light": s===2?"Deep":"REM";

function kpi(colorClass:string, label:string, value:string) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-2xl shadow-sm bg-white/70 border">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-2xl font-semibold ${colorClass}`}>{value}</span>
    </div>
  );
}

export default function SleepApp() {
  const [tab, setTab] = useState("overview");
  const [selected, setSelected] = useState(nights[nights.length-1]);

  const trendData = useMemo(() =>
    nights.map(n => ({ date: n.date.slice(5), duration: n.duration, score: n.sleepScore, hrv: n.hrv })), []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-indigo-50 text-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dormio — Sleep</h1>
            <p className="text-sm text-gray-600">Prototipo de UI • Wereable de sueño</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="rounded-2xl"><Download className="mr-2 h-4 w-4"/>Exportar datos</Button>
            <Button className="rounded-2xl"><Bell className="mr-2 h-4 w-4"/>Alertas</Button>
          </div>
        </header>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 w-full rounded-2xl">
            <TabsTrigger value="overview" className="rounded-xl"><Activity className="mr-2 h-4 w-4"/>Resumen</TabsTrigger>
            <TabsTrigger value="sessions" className="rounded-xl"><Moon className="mr-2 h-4 w-4"/>Sesiones</TabsTrigger>
            <TabsTrigger value="trends" className="rounded-xl"><TrendingUp className="mr-2 h-4 w-4"/>Tendencias</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl"><Settings className="mr-2 h-4 w-4"/>Ajustes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid md:grid-cols-3 gap-4">
              {kpi("text-indigo-600","Duración (h)", selected.duration.toFixed(1))}
              {kpi("text-emerald-600","Eficiencia (%)", `${selected.efficiency}`)}
              {kpi("text-fuchsia-600","Puntuación", `${selected.sleepScore}`)}
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Hipnograma & FC</h3>
                    <div className="text-xs text-gray-500">Última noche ({selected.date})</div>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={sessionTimeline.map(p=>({t:p.t, stage:p.stage, hr:p.hr}))} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="t" tickFormatter={(v)=>`${v}h`} />
                      <YAxis yAxisId="left" domain={[0,3]} tickFormatter={(v)=>stageName(v)} allowDecimals={false} />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip formatter={(v, name) => name === "stage" ? stageName(Number(v)) : v} labelFormatter={(l)=>`${l}h`} />
                      <Area yAxisId="left" type="monotone" dataKey="stage" name="Fase" fillOpacity={0.2} />
                      <Line yAxisId="right" type="monotone" dataKey="hr" name="FC" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Reparto de fases (%)</h3>
                    <div className="text-xs text-gray-500">REM {selected.rem}% • Profundo {selected.deep}% • Ligero {selected.light}%</div>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={[{ name: "REM", v: selected.rem }, { name: "Profundo", v: selected.deep }, { name: "Ligero", v: selected.light }]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="v" name="Porcentaje" radius={[8,8,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-2xl lg:col-span-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Tendencia semanal</h3>
                    <div className="text-xs text-gray-500">Duración (h), puntuación y HRV</div>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="duration" name="Horas" dot={false} />
                      <Line type="monotone" dataKey="score" name="Puntuación" dot={false} />
                      <Line type="monotone" dataKey="hrv" name="HRV" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="mt-6">
            <div className="grid md:grid-cols-3 gap-4">
              {nights.map(n => (
                <button key={n.date} onClick={()=>setSelected(n)} className={`text-left p-4 rounded-2xl border shadow-sm bg-white/70 hover:shadow transition ${selected.date===n.date? 'ring-2 ring-indigo-500':''}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{n.date}</div>
                    <div className="text-xs text-gray-500">{n.duration.toFixed(1)} h</div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">Eficiencia {n.efficiency}% • REM {n.rem}% • Profunda {n.deep}%</div>
                  <div className="mt-1 text-xs text-gray-500">HRV {n.hrv} • FC media {n.hrAvg} • Ronquidos {n.snoreMin}m</div>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Horas de sueño</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="duration" name="Horas" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Puntuación del sueño</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" name="Score" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="rounded-2xl">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold mb-2">Preferencias</h3>
                  <div className="space-y-2">
                    <Label>Objetivo de horas</Label>
                    <Slider defaultValue={[8]} max={10} step={0.5} />
                  </div>
                  <div className="space-y-2">
                    <Label>Modo</Label>
                    <Select defaultValue="auto">
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automático</SelectItem>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Oscuro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="snore">Detección de ronquidos</Label>
                    <Switch id="snore" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notif">Notificaciones de hora de dormir</Label>
                    <Switch id="notif" defaultChecked />
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-6 space-y-3">
                  <h3 className="text-lg font-semibold mb-2">Integraciones</h3>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between border rounded-xl p-3">
                      <div className="flex items-center gap-3"><Moon className="h-4 w-4"/><span>WearOS / Android</span></div>
                      <Button variant="secondary" className="rounded-xl">Conectar</Button>
                    </div>
                    <div className="flex items-center justify-between border rounded-xl p-3">
                      <div className="flex items-center gap-3"><Sun className="h-4 w-4"/><span>watchOS / iOS</span></div>
                      <Button variant="secondary" className="rounded-xl">Conectar</Button>
                    </div>
                    <div className="flex items-center justify-between border rounded-xl p-3">
                      <div className="flex items-center gap-3"><Activity className="h-4 w-4"/><span>HealthKit / Google Fit</span></div>
                      <Button variant="secondary" className="rounded-xl">Conectar</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <footer className="mt-10 text-center text-xs text-gray-500">
          Prototipo estático. Ajustable a SDK real (BLE/REST) para ingesta de datos y clasificación de fases.
        </footer>
      </div>
    </div>
  );
}
