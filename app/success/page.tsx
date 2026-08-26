import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-4xl">
          ✓
        </div>

        <h1 className="text-3xl font-bold">
          You&apos;re subscribed!
        </h1>

        <p className="mt-4 leading-7 text-slate-400">
          Your email has been verified successfully. You will now receive
          notifications when new university notices or examination results
          are published.
        </p>

        <Link
          href="/"
          className="mt-8 inline-block rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-500"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}