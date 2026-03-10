import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Block {
  type: string;
  [key: string]: any;
}

interface FunnelStep {
  id: string;
  title: string;
  stepType: string;
  content: string;
  stepOrder: number;
}

function normalizeBlock(block: Block): Block {
  if (block.data && typeof block.data === "object") {
    return { ...block, ...block.data };
  }
  return block;
}

function renderBlock(rawBlock: Block, index: number) {
  const block = normalizeBlock(rawBlock);
  switch (block.type) {
    case "hero":
      return (
        <section
          key={index}
          className="py-16 px-6 text-center rounded-xl"
          style={{ backgroundColor: block.background || "#4f46e5", color: "#fff" }}
          data-testid={`block-hero-${index}`}
        >
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{block.heading || "Welcome"}</h2>
            {block.subheading && <p className="text-lg opacity-90 mb-6">{block.subheading}</p>}
            {block.ctaText && (
              <a href={block.ctaLink || "#"} className="inline-block bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                {block.ctaText}
              </a>
            )}
          </div>
        </section>
      );

    case "text":
      return (
        <section key={index} className="py-8 px-4" data-testid={`block-text-${index}`}>
          <div className="max-w-2xl mx-auto prose dark:prose-invert">
            {(block.content || "").split("\n").map((line: string, i: number) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </section>
      );

    case "features": {
      const items = block.items || [];
      return (
        <section key={index} className="py-12 px-4" data-testid={`block-features-${index}`}>
          <div className="max-w-3xl mx-auto">
            {block.heading && <h3 className="text-2xl font-bold text-center mb-8">{block.heading}</h3>}
            <div className="grid md:grid-cols-2 gap-6">
              {items.map((item: any, i: number) => (
                <div key={i} className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {item.icon && <span className="text-2xl">{item.icon}</span>}
                  <div>
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "cta":
      return (
        <section key={index} className="py-12 px-4 text-center" data-testid={`block-cta-${index}`}>
          <div className="max-w-xl mx-auto bg-indigo-600 text-white p-8 rounded-xl">
            <h3 className="text-2xl font-bold mb-3">{block.heading || "Take the next step"}</h3>
            {block.description && <p className="opacity-90 mb-6">{block.description}</p>}
            {block.buttonText && (
              <a href={block.buttonLink || "#"} className="inline-block bg-white text-indigo-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                {block.buttonText}
              </a>
            )}
          </div>
        </section>
      );

    case "testimonials": {
      const testimonials = block.items || [];
      return (
        <section key={index} className="py-12 px-4" data-testid={`block-testimonials-${index}`}>
          <div className="max-w-3xl mx-auto space-y-6">
            {testimonials.map((t: any, i: number) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border">
                <p className="italic mb-3">"{t.quote}"</p>
                <p className="font-semibold text-sm">{t.author}{t.role && <span className="text-muted-foreground font-normal"> — {t.role}</span>}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "image":
      return (
        <section key={index} className="py-8 px-4" data-testid={`block-image-${index}`}>
          <div className="max-w-3xl mx-auto text-center">
            <img src={block.url || ""} alt={block.alt || ""} className="w-full rounded-lg shadow" />
            {block.caption && <p className="text-sm text-muted-foreground mt-2">{block.caption}</p>}
          </div>
        </section>
      );

    default:
      return null;
  }
}

const stepTypeLabels: Record<string, string> = {
  opt_in: "Get Started",
  sales: "Details",
  checkout: "Checkout",
  thank_you: "Thank You",
  custom: "Step",
};

export default function PublicFunnel() {
  const params = useParams<{ tenantSlug: string; funnelSlug: string }>();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const funnelQuery = useQuery<{ funnel: any; steps: FunnelStep[]; tenant: any }>({
    queryKey: [`/api/public/${params.tenantSlug}/funnels/${params.funnelSlug}`],
  });

  if (funnelQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (funnelQuery.error || !funnelQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4" data-testid="funnel-not-found">
        <h1 className="text-2xl font-bold">Funnel Not Found</h1>
        <p className="text-muted-foreground">This funnel doesn't exist or isn't published yet.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const { funnel, steps, tenant } = funnelQuery.data;
  const sortedSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);
  const currentStep = sortedSteps[currentStepIndex];

  if (!currentStep || sortedSteps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">{funnel.name}</h1>
        <p className="text-muted-foreground">This funnel has no steps yet.</p>
      </div>
    );
  }

  let blocks: Block[] = [];
  try {
    blocks = JSON.parse(currentStep.content || "[]");
  } catch {
    blocks = [];
  }

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === sortedSteps.length - 1;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col" data-testid="public-funnel">
      <header className="border-b bg-white dark:bg-gray-950 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logoUrl && <img src={tenant.logoUrl} alt={tenant.name} className="h-8" />}
            <span className="font-semibold" data-testid="text-tenant-name">{tenant.name}</span>
          </div>
          <span className="text-sm text-muted-foreground" data-testid="text-funnel-name">{funnel.name}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full px-6 py-6">
        <div className="flex items-center justify-center gap-2 mb-8" data-testid="funnel-step-indicator">
          {sortedSteps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-2">
              <button
                onClick={() => idx <= currentStepIndex && setCurrentStepIndex(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  idx === currentStepIndex
                    ? "bg-indigo-600 text-white"
                    : idx < currentStepIndex
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-pointer"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
                data-testid={`step-indicator-${idx}`}
              >
                {idx < currentStepIndex ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <span className="w-4 text-center">{idx + 1}</span>
                )}
                <span className="hidden sm:inline">{stepTypeLabels[step.stepType] || step.title}</span>
              </button>
              {idx < sortedSteps.length - 1 && (
                <div className={`w-6 h-0.5 ${idx < currentStepIndex ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"}`} />
              )}
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-center mb-6" data-testid="text-step-title">{currentStep.title}</h2>

        <div className="space-y-2">
          {blocks.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>This step has no content yet.</p>
            </div>
          ) : (
            blocks.map((block, index) => renderBlock(block, index))
          )}
        </div>

        <div className="flex items-center justify-between mt-10 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
            disabled={isFirst}
            data-testid="button-prev-step"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground" data-testid="text-step-counter">
            Step {currentStepIndex + 1} of {sortedSteps.length}
          </span>
          {!isLast ? (
            <Button
              onClick={() => setCurrentStepIndex((i) => Math.min(sortedSteps.length - 1, i + 1))}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              data-testid="button-next-step"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <div className="w-24" />
          )}
        </div>
      </div>

      <footer className="mt-auto border-t py-6 text-center text-sm text-muted-foreground">
        <p>Powered by {tenant.name}</p>
      </footer>
    </div>
  );
}
