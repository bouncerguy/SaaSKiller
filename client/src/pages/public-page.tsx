import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Block {
  type: string;
  [key: string]: any;
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
          className="py-20 px-6 text-center"
          style={{ backgroundColor: block.background || "#4f46e5", color: "#fff" }}
          data-testid={`block-hero-${index}`}
        >
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{block.heading || "Welcome"}</h1>
            {block.subheading && <p className="text-xl opacity-90 mb-8">{block.subheading}</p>}
            {block.ctaText && (
              <a href={block.ctaLink || "#"} className="inline-block bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                {block.ctaText}
              </a>
            )}
          </div>
        </section>
      );

    case "text":
      return (
        <section key={index} className="py-12 px-6" data-testid={`block-text-${index}`}>
          <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert">
            {(block.content || "").split("\n").map((line: string, i: number) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </section>
      );

    case "features": {
      const items = block.items || [];
      return (
        <section key={index} className="py-16 px-6 bg-gray-50 dark:bg-gray-900" data-testid={`block-features-${index}`}>
          <div className="max-w-5xl mx-auto">
            {block.heading && <h2 className="text-3xl font-bold text-center mb-12">{block.heading}</h2>}
            <div className="grid md:grid-cols-3 gap-8">
              {items.map((item: any, i: number) => (
                <div key={i} className="text-center p-6">
                  {item.icon && <div className="text-4xl mb-4">{item.icon}</div>}
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "cta":
      return (
        <section key={index} className="py-16 px-6 bg-indigo-600 text-white text-center" data-testid={`block-cta-${index}`}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">{block.heading || "Ready to get started?"}</h2>
            {block.description && <p className="text-lg opacity-90 mb-8">{block.description}</p>}
            {block.buttonText && (
              <a href={block.buttonLink || "#"} className="inline-block bg-white text-indigo-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                {block.buttonText}
              </a>
            )}
          </div>
        </section>
      );

    case "testimonials": {
      const testimonials = block.items || [];
      return (
        <section key={index} className="py-16 px-6" data-testid={`block-testimonials-${index}`}>
          <div className="max-w-5xl mx-auto">
            {block.heading && <h2 className="text-3xl font-bold text-center mb-12">{block.heading}</h2>}
            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((t: any, i: number) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border">
                  <p className="text-lg italic mb-4">"{t.quote}"</p>
                  <div>
                    <p className="font-semibold">{t.author}</p>
                    {t.role && <p className="text-sm text-muted-foreground">{t.role}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "image":
      return (
        <section key={index} className="py-12 px-6" data-testid={`block-image-${index}`}>
          <div className="max-w-4xl mx-auto text-center">
            <img
              src={block.url || ""}
              alt={block.alt || ""}
              className="w-full rounded-lg shadow-lg"
            />
            {block.caption && <p className="text-sm text-muted-foreground mt-3">{block.caption}</p>}
          </div>
        </section>
      );

    default:
      return null;
  }
}

export default function PublicPage() {
  const params = useParams<{ tenantSlug: string; pageSlug: string }>();

  const pageQuery = useQuery<{ page: any; tenant: any }>({
    queryKey: [`/api/public/${params.tenantSlug}/pages/${params.pageSlug}`],
  });

  if (pageQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (pageQuery.error || !pageQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4" data-testid="page-not-found">
        <h1 className="text-2xl font-bold">Page Not Found</h1>
        <p className="text-muted-foreground">This page doesn't exist or isn't published yet.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const { page, tenant } = pageQuery.data;
  let blocks: Block[] = [];
  try {
    blocks = JSON.parse(page.content || "[]");
  } catch {
    blocks = [];
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950" data-testid="public-page">
      <header className="border-b bg-white dark:bg-gray-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logoUrl && <img src={tenant.logoUrl} alt={tenant.name} className="h-8" />}
            <span className="font-semibold text-lg" data-testid="text-tenant-name">{tenant.name}</span>
          </div>
          <h1 className="text-sm font-medium text-muted-foreground" data-testid="text-page-title">{page.title}</h1>
        </div>
      </header>

      <main>
        {blocks.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p>This page has no content yet.</p>
          </div>
        ) : (
          blocks.map((block, index) => renderBlock(block, index))
        )}
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>Powered by {tenant.name}</p>
      </footer>
    </div>
  );
}
