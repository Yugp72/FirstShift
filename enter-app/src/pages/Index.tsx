import { UtensilsCrossed } from "lucide-react";
import { EndpointCard } from "@/components/console/endpoint-card";
import { RequestForm } from "@/components/console/request-form";
import { TaskGuide } from "@/components/console/task-guide";
import { ContractSection } from "@/components/console/contract-section";

const Index = () => {
  return (
    <div className="app-surface min-h-full">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <UtensilsCrossed className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">FirstShift</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                AI Core
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:flex">
            <span className="h-1 w-1 rounded-full bg-border" aria-hidden />
            Team33 · Imperial Treasure Palo Alto
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:px-8 sm:pt-16">
        <section className="animate-rise">
          <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <span className="h-px w-6 bg-border" aria-hidden />
            Enter × Converge.AI
          </p>
          <h1 className="mt-4 font-display text-[2.75rem] leading-[0.95] sm:text-6xl md:text-7xl">
            FirstShift AI Core
          </h1>
          <p className="mt-3 text-lg text-muted-foreground sm:text-xl">
            built on <span className="font-medium text-foreground">Enter</span> by{" "}
            <span className="font-medium text-foreground">Converge.AI</span>
          </p>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            One endpoint for the FirstShift app: grade a trainee's answer, translate a
            manager's message, summarize shift readiness, or draft a job post — every reply
            as strict JSON, no API keys.
          </p>
        </section>

        <div className="mt-10 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
          <div className="order-2 min-w-0 animate-rise lg:order-1">
            <RequestForm />
          </div>
          <aside className="order-1 animate-rise space-y-5 lg:order-2">
            <EndpointCard />
            <TaskGuide />
          </aside>
        </div>

        <ContractSection />
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Team33 — built for the Imperial Treasure Palo Alto challenge.</p>
          <p className="flex items-center gap-1.5">
            Enter <span className="text-border">/</span> Converge.AI
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
