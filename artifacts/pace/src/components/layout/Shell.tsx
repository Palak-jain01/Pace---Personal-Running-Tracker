import { NavBar } from '@/components/NavBar';

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#FAFAFA]">
      <NavBar />
      <main className="flex-1 w-full max-w-5xl mx-auto md:px-6 py-6 pb-24">
        {children}
      </main>
    </div>
  );
}
