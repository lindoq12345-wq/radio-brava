export const metadata = { title: "Offline · Rádio Brava" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-bold">Você está offline</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        As rádios precisam de internet para tocar. Quando a conexão voltar,
        recarregue a página.
      </p>
    </main>
  );
}
