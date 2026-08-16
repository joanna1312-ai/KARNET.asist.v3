"use client";

import { usePathname } from "next/navigation";
import { GuestNotice } from "@/components/GuestNotice";

type AppShellProps = {
  header: React.ReactNode;
  footer: React.ReactNode;
  bottomTabBar: React.ReactNode;
  children: React.ReactNode;
};

// Ekran onboardingu (1m) na "/" jest celowo pełnoekranowy, bez chrome aplikacji —
// Header/Footer/BottomTabBar (Server Components) mogą być tu dziećmi Client Component,
// Next.js renderuje je po stronie serwera jako slot. Padding pod dolny pasek nawigacji
// (pb-[88px]) przenosi się tu razem z bramkowaniem, żeby onboarding nie miał pustego
// marginesu po pasku, którego i tak nie pokazujemy.
export function AppShell({ header, footer, bottomTabBar, children }: AppShellProps) {
  const pathname = usePathname();
  const isOnboarding = pathname === "/";

  return (
    <>
      {!isOnboarding && header}
      <GuestNotice />
      <div className={isOnboarding ? "flex flex-1 flex-col" : "flex flex-1 flex-col pb-[88px] md:pb-0"}>
        {children}
      </div>
      {!isOnboarding && footer}
      {!isOnboarding && bottomTabBar}
    </>
  );
}
