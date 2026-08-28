import type { Locale } from "@/lib/i18n/config";
import { PageHero, WideCta } from "./page-parts";

export type BlogPageData = {
  hero: { eyebrow: string; title: string; subtitle: string };
  featured: {
    label: string;
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
  };
  posts: { title: string; date: string; readTime: string }[];
  cta: { heading: string; text: string };
};

export default function BlogPage({
  lang,
  page,
}: {
  lang: Locale;
  page: BlogPageData;
}) {
  return (
    <div>
      <PageHero {...page.hero} />
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="p-8">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
                {page.featured.label}
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">
                {page.featured.title}
              </h2>
              <p className="mt-3 text-zinc-600">{page.featured.excerpt}</p>
              <p className="mt-4 text-xs text-zinc-400">
                {page.featured.date} · {page.featured.readTime}
              </p>
            </div>
          </article>

          <div className="mt-10 divide-y divide-zinc-100 border-t border-zinc-100">
            {page.posts.map((post) => (
              <article key={post.title} className="py-5">
                <h3 className="text-base font-semibold text-zinc-900 hover:text-brand-600">
                  {post.title}
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  {post.date} · {post.readTime}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <WideCta lang={lang} heading={page.cta.heading} text={page.cta.text} />
    </div>
  );
}