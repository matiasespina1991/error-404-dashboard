"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ModeToggle } from "./layout/theme-toggle";
import {
  CalendarDays,
  Disc3,
  Mic,
  Images,
  FileText,
  ExternalLink,
  LogOut,
  ChevronsUpDown,
  Store,
} from "lucide-react";
import { requestJson } from "./client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const links = [
  { href: "/releases", title: "Releases", icon: Disc3 },
  { href: "/events", title: "Eventos", icon: CalendarDays },
  { href: "/interviews", title: "Entrevistas", icon: Mic },
  { href: "/about", title: "About", icon: FileText },
  { href: "/media", title: "Galería", icon: Images },
];

type ProfileProps = { email: string; photoURL?: string; name?: string };

function Account({ email, photoURL, name }: ProfileProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    try {
      await requestJson("/api/auth/session", { method: "DELETE" });
      window.location.assign("/login");
    } catch {
      setBusy(false);
      setError("No se pudo cerrar la sesión. Intentá nuevamente.");
    }
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={photoURL} alt={name || "Perfil"} />
            <AvatarFallback className="rounded-lg">
              {email.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Error404</span>
            <span className="truncate text-xs">{email}</span>
          </div>
          <ChevronsUpDown className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-medium">Error404</div>
          <div className="text-xs text-muted-foreground">{email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={busy}
          onSelect={(e) => {
            e.preventDefault();
            void logout();
          }}
        >
          <LogOut />
          {busy ? "Saliendo…" : "Cerrar sesión"}
        </DropdownMenuItem>
        {error && (
          <p role="alert" className="p-2 text-xs text-destructive">
            {error}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppSidebar({ email, photoURL, name }: ProfileProps) {
  const path = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/"
          aria-label="Error404 — inicio del dashboard"
          className="flex items-center rounded-md px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          onClick={() => {
            if (isMobile) setOpenMobile(false);
          }}
        >
          <BrandLogo className="max-w-full group-data-[collapsible=icon]:w-8" />
        </Link>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {links.map(({ href, title, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  asChild
                  tooltip={title}
                  isActive={path === href || path.startsWith(href + "/")}
                >
                  <Link
                    href={href}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                    }}
                  >
                    <Icon />
                    <span>{title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Enlaces</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Ver la web">
                <a
                  href={
                    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink />
                  <span>Ver la web</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Shopify">
                <a
                  href="https://admin.shopify.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Store />
                  <span>Shopify</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Account email={email} photoURL={photoURL} name={name} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
function HeaderAccount({ email, photoURL, name }: ProfileProps) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full"
          aria-label="Menú de usuario"
        >
          <Avatar className="size-8">
            <AvatarImage src={photoURL} alt={name || "Perfil"} />
            <AvatarFallback>{email.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p>Error404</p>
          <p className="truncate text-xs font-normal text-muted-foreground">
            {email}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={busy}
          onSelect={(e) => {
            e.preventDefault();
            setBusy(true);
            requestJson("/api/auth/session", { method: "DELETE" })
              .then(() => window.location.assign("/login"))
              .catch(() => {
                setBusy(false);
                setError("No se pudo cerrar la sesión.");
              });
          }}
        >
          <LogOut />
          Cerrar sesión
        </DropdownMenuItem>
        {error && (
          <p role="alert" className="p-2 text-xs text-destructive">
            {error}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function Header({ email, photoURL, name }: ProfileProps) {
  const path = usePathname();
  const section = links.find(
    (item) => path === item.href || path.startsWith(item.href + "/"),
  );
  const slug = section && path.slice(section.href.length + 1).split("/")[0];
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex min-w-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink asChild>
                <Link href="/">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {section && (
              <>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  {slug ? (
                    <BreadcrumbLink asChild>
                      <Link href={section.href}>{section.title}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{section.title}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </>
            )}
            {slug && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="max-w-44 truncate">
                    {slug === "new" ? "Nuevo" : decodeURIComponent(slug)}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-2 px-4">
        <ModeToggle />
        <HeaderAccount email={email} photoURL={photoURL} name={name} />
      </div>
    </header>
  );
}
export function Shell({
  email,
  photoURL,
  name,
  children,
  defaultOpen = true,
}: {
  email: string;
  photoURL?: string;
  name?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const path = usePathname();
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <a
        href="#workspace"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Ir al contenido
      </a>
      <AppSidebar email={email} photoURL={photoURL} name={name} />
      <SidebarInset>
        <Header email={email} photoURL={photoURL} name={name} />
        <main
          id="workspace"
          className={
            [
              "/media",
              "/about",
              "/events",
              "/interviews",
              "/releases",
            ].includes(path) ||
            /^\/(events|interviews|releases)\/[^/]+$/.test(path)
              ? "flex min-h-0 flex-1 flex-col"
              : "flex flex-1 flex-col p-4 pt-0 md:p-6 md:pt-0"
          }
        >
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
