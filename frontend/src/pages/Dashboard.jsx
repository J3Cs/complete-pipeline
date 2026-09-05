import MetricsDashboard from "../components/MetricsDashboard";

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">
          Panel de Monitoreo e Infraestructura
        </h1>
        <p className="text-sm text-slate-400">
          Métricas asíncronas en tiempo real vía LocalStack / AWS SDK
        </p>
      </header>

      <MetricsDashboard />
    </div>
  );
}