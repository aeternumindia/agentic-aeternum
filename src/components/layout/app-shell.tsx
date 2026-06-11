type AppShellProps = {
  children: React.ReactNode;
  context: React.ReactNode;
  input: React.ReactNode;
};

export function AppShell({ children, context, input }: AppShellProps) {
  return (
    <main className="h-screen bg-background text-foreground">
      <div className="flex h-full flex-col">
        <header className="border-b border-border">Navbar</header>

        <div className="flex flex-1 overflow-hidden">
          <section className="flex-1 border-r border-border">
            {children}
          </section>

          <aside className="hidden w-[420px] lg:block">{context}</aside>
        </div>

        <footer className="border-t border-border">{input}</footer>
      </div>
    </main>
  );
}
