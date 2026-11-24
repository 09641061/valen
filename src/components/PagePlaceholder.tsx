export function PagePlaceholder({ title }: { title: string }) {
  return (
    <section
      aria-labelledby="placeholder-title"
      className="flex min-h-[calc(100svh-3.5rem)] flex-1 items-center justify-center px-6 md:min-h-svh"
    >
      <h1
        id="placeholder-title"
        className="text-center text-3xl font-semibold tracking-[-0.03em] text-foreground"
      >
        {title}
      </h1>
    </section>
  );
}
