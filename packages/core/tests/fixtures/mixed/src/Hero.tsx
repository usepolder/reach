export default function Hero({ title }: { title: string }) {
  return (
    <header className="hero">
      <h1 className="hero-title">{title}</h1>
      <p>subtitle</p>
    </header>
  );
}
