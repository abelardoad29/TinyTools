import { contentForTool } from "../../core/seo/toolContent";

/**
 * Sits under the tool itself so the working area stays the first thing you see.
 * Also emits FAQPage structured data, which is what makes the questions eligible
 * to appear expanded in search results.
 */
export function ToolContent({ toolId, toolName }: { toolId: string; toolName: string }) {
  const content = contentForTool(toolId);
  if (!content) return null;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <section className="tool-article" aria-label={`About ${toolName}`}>
      <p className="tool-article-intro">{content.intro}</p>
      <h2>Common questions</h2>
      <dl className="tool-faq">
        {content.faqs.map((faq) => (
          <div key={faq.question}>
            <dt>{faq.question}</dt>
            <dd>{faq.answer}</dd>
          </div>
        ))}
      </dl>
      <script
        type="application/ld+json"
        // Static copy from toolContent.ts, never user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </section>
  );
}
