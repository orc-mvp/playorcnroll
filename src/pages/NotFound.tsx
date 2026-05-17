import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useI18n } from "@/lib/i18n";

const NotFound = () => {
  const location = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    if (import.meta.env.DEV) console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted">
      <Helmet>
        <title>Página não encontrada — Orc &amp; Roll</title>
        <meta name="description" content="A página que você procura não existe ou foi movida. Volte para a página inicial do Orc & Roll." />
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t.notFound.message}</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {t.notFound.returnHome}
        </a>
      </div>
    </main>
  );
};

export default NotFound;
