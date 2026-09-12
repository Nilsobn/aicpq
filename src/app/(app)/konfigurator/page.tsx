import { Suspense } from "react";
import ConfiguratorPage from "./configurator-client";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="text-sm text-slate-500">Konfigurator wird geladen…</div>
      }
    >
      <ConfiguratorPage />
    </Suspense>
  );
}
