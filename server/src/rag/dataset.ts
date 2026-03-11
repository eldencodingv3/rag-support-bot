import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Document } from '@langchain/core/documents';

interface FAQEntry {
  question: string;
  answer: string;
  category: string;
}

export function loadFAQDocuments(): Document[] {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const faqPath = join(__dirname, '../../data/support-faq.json');
  const raw = readFileSync(faqPath, 'utf-8');
  const faqs: FAQEntry[] = JSON.parse(raw);

  return faqs.map(
    (faq) =>
      new Document({
        pageContent: `Q: ${faq.question}\nA: ${faq.answer}`,
        metadata: { question: faq.question, category: faq.category },
      })
  );
}
