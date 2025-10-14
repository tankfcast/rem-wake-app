import React, { useMemo, useState, useEffect, createContext, useContext } from "react";
import { Sun, Moon, Activity, Settings, TrendingUp, Bell, Download } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Legend, BarChart, Bar
} from "recharts";

/* ---------------- Mini UI (sin shadcn/ui) ---------------- */
function Card({children, className=""}:{children:React.ReactNode; className?:string}) {
  return <div className={`rounded-2xl border bg-white/70 shadow-sm ${className}`}>{children}</div>;
}
function CardContent({children, className=""}:{children:React.ReactNode; className?:string}) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
function Button({children, variant="primary", className="", ...props}: any) {
  const base = "inline-flex items-center px-4 py-2 rounded-2xl text-sm font-medium transition";
  const styles = variant==="secondary"
    ? "bg-white border hover:bg-slate-50"
    : "bg-indigo-600 text-white hover:bg-indigo-700";
  return <button className={`${base} ${styles} ${className}`} {...props}>{children}</button>;
}
function Label({children}:{children:React.ReactNode}){ return <label className="text-sm text-gray-700">{children}</label>; }

/* --- Tabs LITE (controladas) --- */
const TabsCtx = createContext<{value:string; onChange:(v:string)=>void}>({value:"overview", onChange:()=>{}});
function Tabs({value, onValueChange, children}:{value:string; onValueChange:(v:string)=>void; children:React.ReactNode}){
  return <TabsCtx.Provider value={{value, onChange:onValueChange}}>{children}</TabsCtx.Provider>;
}
function TabsList({children, className=""}:{children:React.ReactNode; className?:string}){
  return <div className={`flex flex-wrap gap-2 ${className}`}>{children}</div>;
}
function TabsTrigger({value, children, className=""}:{value:string; children:React.ReactNode; className?:string}){
  const ctx = useContext(TabsCtx);
  const active = ctx.value===value;
  return (
    <button onClick={()=>ctx.onChange(value)}
      className={`px-3 py-2 rounded-xl text-sm border ${active?"bg-indigo-600 text-white border-indigo-600":"bg-white hover:bg-slate-50"} ${className}`}>
      {children}
    </button>
  );
}
function TabsContent({value, children, className=""}:{value:string; children:React.ReactNode; className?:string}){
  const ctx = useContext(TabsCtx);
  if (ctx.value!==value) return null;
  return <div className={className}>{children}</div>;
}
/* -------------------------------------------------------- */

/* ------------------ Datos mock -------------------------- */
const nights = [
  { date: "2025-10-03", duration: 7.6, efficiency: 91, rem: 22, deep: 17, light: 61, hrv: 72, hrMin: 52, hrAvg: 62, snoreMin: 4, awakenings: 2, sleepScore: 86 },
  { date: "2025-10-04", duration: 6.9, efficiency: 88, rem: 18, deep: 15, light: 67, hrv: 68, hrMin: 50, hrAvg: 60, snoreMin: 8, awakenings: 3, sleepScore: 79 },
  { date: "2025-10-05", duration: 8.2, efficiency: 93, rem: 24, deep: 19, light: 57, hrv: 74, hrMin: 49, hrAvg: 58, snoreMin: 2, awakenings: 1, sleepScore: 92 },
  { date: "2025-10-06", duration: 7.1, efficiency: 89, rem: 20, deep: 16, light: 64, hrv: 70, hrMin: 51, hrAvg: 61, snoreMin: 5, awakenings: 2, sleepScore: 83 },
  { date: "2025-10-07", duration: 7.8, efficiency: 92, rem: 23, deep: 18, light: 59, hrv: 75, hrMin: 48, hrAvg: 57, snoreMin: 3, awakenings: 2, sleepScore: 90 }
];

const sessionTimeline = [
  { t: 0.0, stage: 1, hr: 64 }, { t: 0.5, stage: 2, hr: 60 },
  { t: 1.0, stage: 2, hr: 58 }, { t: 1.5, stage: 1, hr: 60 },
  { t: 2.0, stage: 3, hr: 62 }, { t: 2.5, stage: 1, hr: 61 },
  { t: 3.0, stage: 2, hr: 57 }, { t: 3.5, stage: 1, hr: 59 },
  { t: 4.0, stage: 3, hr: 61 }, { t: 4.5, stage: 1, hr: 60 },
  { t: 5.0, stage: 2, hr: 56 }, { t: 5.5, stage: 1, hr: 58 },
  { t: 6.0, stage: 1, hr: 59 }, { t: 6.5, stage: 3, hr: 60 },
  { t: 7.0, stage: 1, hr: 61 }, { t: 7.5, stage: 0, hr: 65 }
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

/* ---------------- Smart Alarm (demo) -------------------- */
type Phase = "AWAKE" | "LIGHT" | "DEEP" | "REM";

function SmartAlarm() {
  const [target, setTarget] = useState<string>("07:30");
  const [windowMin, setWindowMin] = useState<number>(20);
  const [running, setRunning] = useState(false);
  const [firedAt, setFiredAt] = useState<Date | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("LIGHT");

  useEffect(() => {
    if (!running) return;
    const phases: Phase[] = ["LIGHT","DEEP","REM","LIGHT","AWAKE","LIGHT","DEEP","REM","LIGHT"];
    let i = 0;
    const id = setInterval(() => {
      setPhase(phases[i % phases.length]);
      i++;
    }, 7000);
    return () => clearInterval(id);
  }, [running]);

  async function ensureNotif() {
    try { if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission(); } catch {}
  }
  async function lockScreen() {
    try {
      // @ts-ignore
      if (navigator.wakeLock && document.visibilityState === "visible") {
        // @ts-ignore
        await navigator.wakeLock.request("screen");
      }
    } catch {}
  }
  function beep(seconds = 8) {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      const now = ctx.currentTime; g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.5, now + 0.1);
      o.start(); setTimeout(() => { o.stop(); ctx.close(); }, seconds * 1000);
    } catch {}
  }
  function notify(title: string, body: string) {
    try { if ("Notification" in window && Notification.permission === "granted") new Notification(title, { body }); } catch {}
  }
  function logLine(s: string) {
    setLog(prev => [new Date().toLocaleTimeString() + " — " + s, ...prev].slice(0, 80));
  }
  function todayAt(hhmm: string): Date {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date(); d.setHours(h, m, 0, 0); return d;
    }

  useEffect(() => {
    if (!running) return;
    ensureNotif(); lockScreen(); setFiredAt(null); logLine("Smart alarm iniciada");

    const T = todayAt(target);
    const startWindow = new Date(T.getTime() - windowMin * 60_000);

    const id = setInterval(() => {
      const now = new Date();
      if (now < startWindow) { logLine(`Esperando ventana (${startWindow.toLocaleTimeString()})`); return; }

      if ((phase === "LIGHT" || phase === "REM") && !firedAt) {
        setFiredAt(now); logLine(`¡Despertando en ${phase}!`);
        notify("Dormio", "¡Momento óptimo (sueño ligero/REM)!");
        beep(8); setRunning(false); return;
      }
      if (now >= T && !firedAt) {
        setFiredAt(now); logLine("No hubo momento óptimo. Hora objetivo.");
        notify("Dormio", "Despertador a hora objetivo."); beep(8); setRunning(false);
      }
    }, 1000);

    const guard = setTimeout(() => {
      if (!firedAt) { setFiredAt(new Date()); logLine("Cierre de seguridad: disparo tardío."); notify("Dormio","Cierre de seguridad."); beep(6); }
      setRunning(false);
    }, windowMin * 60_000 + 15 * 60_000);

    const onVis = () => lockScreen();
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); clearTimeout(guard); document.removeEventListener("visibilitychange", onVis); };
  }, [running, target, windowMin, phase, firedAt]);

  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-4">
        <h3 className="text-lg font-semibold">Smart Alarm (demo)</h3>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <Label>Hora objetivo</Label>
            <input type="time" value={target} onChange={(e)=>setTarget(e.target.value)} className="border rounded-xl px-3 py-2"/>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Ventana (minutos antes)</Label>
            <input type="number" min={0} max={90} value={windowMin}
              onChange={(e)=>setWindowMin(Math.max(0, Math.min(90, Number(e.target.value||0))))}
              className="border rounded-xl px-3 py-2"/>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Fase actual (simulada)</Label>
            <select className="border rounded-xl px-3 py-2" value={phase} onChange={(e)=>setPhase(e.target.value as Phase)}>
              <option value="AWAKE">AWAKE</option>
              <option value="LIGHT">LIGHT</option>
              <option value="DEEP">DEEP</option>
              <option value="REM">REM</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={()=>setRunning(true)} className="rounded-2xl">Iniciar</Button>
          <Button onClick={()=>{ setRunning(false); setFiredAt(null); setLog([]); }} variant="secondary" className="rounded-2xl">Reset</Button>
          <span className="text-sm text-gray-600">Estado: {running ? "Buscando momento óptimo…" : (firedAt?"Disparada":"Parada")}</span>
        </div>

        <div className="text-sm">
          <div className="mb-1">Log</div>
          <div className="h-40 overflow-auto border rounded-xl p-2 bg-white/60">
            {log.map((l,i)=><div key={i} className="text-gray-700">{l}</div>)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
/* -------------------------------------------------------- */

export default function App() {
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
            <p className="text-sm text-gray-600">Prototipo de UI • Wearable de sueño</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="rounded-2xl"><Download className="mr-2 h-4 w-4"/>Exportar datos</Button>
            <Button className="rounded-2xl"><Bell className="mr-2 h-4 w-4"/>Alertas</Button>
          </div>
        </header>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 w-full rounded-2xl mb-2">
            <TabsTrigger value="overview"><Activity className="mr-2 h-4 w-4"/>Resumen</TabsTrigger>
            <TabsTrigger value="sessions"><Moon className="mr-2 h-4 w-4"/>Sesiones</TabsTrigger>
            <TabsTrigger value="trends"><TrendingUp className="mr-2 h-4 w-4"/>Tendencias</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4"/>Ajustes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid md:grid-cols-3 gap-4">
              {kpi("text-indigo-600","Duración (h)", selected.duration.toFixed(1))}
              {kpi("text-emerald-600","Eficiencia (%)", `${selected.efficiency}`)}
              {kpi("text-fuchsia-600","Puntuación", `${selected.sleepScore}`)}
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              <Card><CardContent>
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
                    <Tooltip formatter={(v, name) => name === "stage" ? stageName(Number(v)) : (v as any)} labelFormatter={(l)=>`${l}h`} />
                    <Area yAxisId="left" type="monotone" dataKey="stage" name="Fase" fillOpacity={0.2} />
                    <Line yAxisId="right" type="monotone" dataKey="hr" name="FC" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent></Card>

              <Card><CardContent>
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
              </CardContent></Card>

              <Card className="lg:col-span-2"><CardContent>
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
              </CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="mt-6">
            <div className="grid md:grid-cols-3 gap-4">
              {nights.map(n => (
                <button key={n.date} onClick={()=>setSelected(n)}
                  className={`text-left p-4 rounded-2xl border shadow-sm bg-white/70 hover:shadow transition ${selected.date===n.date? 'ring-2 ring-indigo-500':''}`}>
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
              <Card><CardContent>
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
              </CardContent></Card>
              <Card><CardContent>
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
              </CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card><CardContent className="space-y-4">
                <h3 className="text-lg font-semibold mb-2">Preferencias</h3>
                <div className="space-y-2">
                  <Label>Objetivo de horas</Label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={0} max={10} step={0.5} defaultValue={8} className="w-full" />
                    <span className="text-sm w-10 text-right">8</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Modo</Label>
                  <select className="border rounded-xl px-3 py-2" defaultValue="auto">
                    <option value="auto">Automático</option>
                    <option value="light">Claro</option>
                    <option value="dark">Oscuro</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Detección de ronquidos</Label>
                  <button className="w-12 h-6 rounded-full bg-indigo-600 relative">
                    <span className="absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full translate-x-6" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Notificaciones de hora de dormir</Label>
                  <button className="w-12 h-6 rounded-full bg-indigo-600 relative">
                    <span className="absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full translate-x-6" />
                  </button>
                </div>
              </CardContent></Card>

              <Card><CardContent className="space-y-3">
                <h3 className="text-lg font-semibold mb-2">Integraciones</h3>
                <div className="flex items-center justify-between border rounded-xl p-3">
                  <div className="flex items-center gap-3"><span>WearOS / Android</span></div>
                  <Button variant="secondary" className="rounded-xl">Conectar</Button>
                </div>
                <div className="flex items-center justify-between border rounded-xl p-3">
                  <div className="flex items-center gap-3"><span>watchOS / iOS</span></div>
                  <Button variant="secondary" className="rounded-xl">Conectar</Button>
                </div>
                <div className="flex items-center justify-between border rounded-xl p-3">
                  <div className="flex items-center gap-3"><span>HealthKit / Google Fit</span></div>
                  <Button variant="secondary" className="rounded-xl">Conectar</Button>
                </div>
              </CardContent></Card>
            </div>

            <div className="mt-6">
              <SmartAlarm />
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
