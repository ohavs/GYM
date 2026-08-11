import { TabBar } from '@/components/layout/tab-bar';
import { AppGate } from '@/components/layout/app-gate';

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] pb-dock safe-t">
      <AppGate>{children}</AppGate>
      <TabBar />
    </div>
  );
}
