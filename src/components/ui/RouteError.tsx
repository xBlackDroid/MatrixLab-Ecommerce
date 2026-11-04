"use client";
import Link from "next/link";
import Button from "./Button";
export default function RouteError({ reset }: { reset: () => void }) { return <section className="mx-auto max-w-2xl px-6 py-14" aria-labelledby="route-error-title"><h1 id="route-error-title" className="text-2xl font-bold">No pudimos cargar esta sección</h1><p role="alert" className="mt-4 text-ui-text-muted">Los datos no están disponibles en este momento. Esto no significa que no haya registros. Puedes reintentar la consulta.</p><div className="mt-6 flex flex-wrap items-center gap-4"><Button onClick={reset}>Reintentar</Button><Link className="text-ui-accent underline underline-offset-4" href="/tienda">Volver a la tienda</Link></div></section>; }
