import { notFound } from "next/navigation";

import AreaPage from "@/app/masterdata/area/page";
import MaterialPage from "@/app/masterdata/material/page";
import PopPage from "@/app/masterdata/pop/page";
import OltPage from "@/app/masterdata/olt/page";
import OdpPage from "@/app/masterdata/odp/page";
import OntPage from "@/app/masterdata/ont/page";
import PortPonPage from "@/app/masterdata/port-pon/page";
import PaketPage from "@/app/masterdata/paket/page";
import UserPage from "@/app/masterdata/user/page";
import FabPage from "@/app/jaringan/fab/page";
import BaaPage from "@/app/jaringan/baa/page";

import { WORKSPACE_MODULES, DEFAULT_MODULE, type WorkspaceModuleKey } from "./modules";
import { WorkspaceTabs } from "./workspace-tabs";

// Peta key -> komponen halaman asli (import langsung dari route masing-masing)
const MODULE_COMPONENTS: Record<WorkspaceModuleKey, React.ComponentType<any>> = {
  area: AreaPage,
  material: MaterialPage,
  pop: PopPage,
  olt: OltPage,
  odp: OdpPage,
  ont: OntPage,
  portpon: PortPonPage,
  paket: PaketPage,
  user: UserPage,
  fab: FabPage,
  baa: BaaPage,
};

interface WorkspacePageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function WorkspacePage({ searchParams }: WorkspacePageProps) {
  const params = await searchParams;
  const view = (params.view as WorkspaceModuleKey) ?? DEFAULT_MODULE;

  const moduleConfig = WORKSPACE_MODULES.find((m) => m.key === view);

  if (!moduleConfig) {
    notFound();
  }

  const ModuleComponent = MODULE_COMPONENTS[view];

  // Sisa query param (search, page, dll) selain "view" tetap diteruskan
  // ke komponen aslinya, biar fitur search/pagination internal tiap
  // modul tetap jalan normal.
  const { view: _omit, ...restParams } = params;

  return (
    <div className="space-y-4">
      <WorkspaceTabs activeView={view} />

      {moduleConfig.usesSearchParams ? (
        <ModuleComponent searchParams={Promise.resolve(restParams)} />
      ) : (
        <ModuleComponent />
      )}
    </div>
  );
}