import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { GlobalSearch } from './GlobalSearch';
import { NotificationBell } from './NotificationBell';

export function Layout() {
  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="sticky top-0 z-30 flex items-center justify-end gap-2 border-b border-border bg-background/95 backdrop-blur px-3 py-2 sm:px-4 md:px-8">
          <GlobalSearch />
          <NotificationBell />
        </div>
        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
