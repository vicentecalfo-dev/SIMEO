"use client";

import {
  Avatar,
  Breadcrumb,
  Button,
  GovBRLogo,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarOverlay,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@codeworker.br/govbr-tw-react";
import {
  faHouse,
  faChartLine,
  faUsers,
  faEllipsisVertical,
  faFolder,
  faCog,
  faBell,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Link from "next/link";
import { CSSProperties } from "react";

const SidebarBrand: React.FC = () => {
  const { isIconCollapsed } = useSidebar();
  return (
    <div
      className={`flex w-full items-center ${isIconCollapsed ? "justify-center" : "gap-6"}`}
    >
      <div className="size-16 flex items-center w-2/6">
        <GovBRLogo />
      </div>
      {!isIconCollapsed ? (
        <div className="flex flex-col w-4/6">
          <span className="text-sm font-semibold text-govbr-gray-80">
            CNCFlora / JBRJ
          </span>
          <span className="text-xs text-govbr-gray-60">Sistema de Métricas de Extensão e Ocupação da Flora Brasileira. </span>
        </div>
      ) : null}
    </div>
  );
};

const SidebarFooterUser: React.FC = () => {
  const { isIconCollapsed } = useSidebar();
  return (
    <div
      className={`flex w-full items-center ${isIconCollapsed ? "justify-center" : "gap-3"}`}
    >
      <Avatar
        variant="image"
        src="https://i.pravatar.cc/100?img=5"
        title="Ana"
        className="size-10 flex-shrink-0"
      />
      {!isIconCollapsed ? (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-govbr-gray-80">
            Ana Flora
          </span>
          <span className="text-xs text-govbr-gray-60">Coordenadora</span>
        </div>
      ) : null}
    </div>
  );
};

const OverviewSidebar = () => {
  const { theme } = useSidebar();
  const isDark = theme === "dark";
  const primaryTextClass = isDark ? "text-govbr-pure-0" : "text-govbr-gray-80";
  const subduedTextClass = isDark
    ? "text-govbr-blue-warm-20"
    : "text-govbr-gray-60";
  const cardSurfaceClass = isDark
    ? "border-govbr-blue-warm-20 bg-govbr-blue-warm-vivid-90"
    : "border-govbr-gray-20 bg-govbr-pure-0";
  const cardTitleClass = isDark ? "text-govbr-pure-0" : "text-govbr-gray-80";

  return (
    <>
      <Sidebar>
        <SidebarRail />

        <SidebarHeader className="gap-4">
          <SidebarBrand />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={<FontAwesomeIcon icon={faHouse} />}
                    isActive
                    tooltip="Inicio"
                  >
                    Inicio
                  </SidebarMenuButton>
                  <SidebarMenuBadge>12</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/projects">
                    <SidebarMenuButton
                      icon={<FontAwesomeIcon icon={faChartLine} />}
                      tooltip="Dashboard"
                    >
                      Projetos
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />
        </SidebarContent>

        <SidebarFooter>
          <SidebarFooterUser />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                icon={<FontAwesomeIcon icon={faCog} />}
                tooltip="Configuracoes"
              >
                Configuracoes
              </SidebarMenuButton>
              <SidebarMenuAction>
                <FontAwesomeIcon icon={faEllipsisVertical} />
              </SidebarMenuAction>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                icon={<FontAwesomeIcon icon={faBell} />}
                tooltip="Notificacoes"
              >
                Notificacoes
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarOverlay />
      <SidebarInset
        className={
          isDark ? "bg-govbr-blue-warm-vivid-95 text-govbr-pure-0" : undefined
        }
      >
      </SidebarInset>
    </>
  );
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <SidebarProvider
        collapsible="none"
        style={
          {
            ["--sidebar-width"]: "22rem",
            ["--sidebar-width-mobile"]: "18rem",
            ["--sidebar-width-icon"]: "4.5rem",
          } as CSSProperties
        }
      >
        <OverviewSidebar />
      </SidebarProvider>
      {/* <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">SIMEO</h1>
        <p className="mt-3 text-slate-600">
          Sistema de Métricas de Extensão e Ocupação
        </p>
        <Button
                type="button"
                variant="default"
              >
        <Link
          href="/projects"
        >
          Acessar projetos
        </Link>
        </Button>
      </div> */}
    </main>
  );
}
