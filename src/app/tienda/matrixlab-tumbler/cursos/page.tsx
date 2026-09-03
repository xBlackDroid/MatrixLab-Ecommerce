import type { Metadata } from "next";
import { Camera } from "lucide-react";
import CourseExperience from "@/components/courses/CourseExperience";
import CourseFaq from "@/components/courses/CourseFaq";
import CourseGallery from "@/components/courses/CourseGallery";
import CourseHero from "@/components/courses/CourseHero";
import CourseRegistrationForm from "@/components/courses/CourseRegistrationForm";
import CourseVideos from "@/components/courses/CourseVideos";
import { SoftBlob } from "@/components/icons/BrandDecor";
import { SnowGlobeArt, SparkleMark } from "@/components/icons/CourseDecor";
import Reveal from "@/components/landing/Reveal";
import {
  COURSE_REGISTRATION_ANCHOR,
  getFeaturedEdition,
  MATRIXLAB_TUMBLER_COURSE,
} from "@/lib/store/courses";
import { listCourseGalleryImages } from "@/lib/store/courses/gallery";

/**
 * Landing de los CURSOS de MatrixLab Tumbler.
 *
 * RUTA: /tienda/matrixlab-tumbler/cursos
 *
 * `force-dynamic` NO es decorativo. La CSP de este proyecto se reparte por
 * ruta (ver src/middleware.ts): las páginas que Next renderiza en la petición
 * reciben la política ESTRICTA con nonce, y las prerenderizadas una compatible
 * con `unsafe-inline`. Esta página tiene un formulario que recoge nombre,
 * teléfono y correo, así que le toca la estricta — y para eso tiene que
 * renderizarse en la petición. La ruta está declarada en
 * `DYNAMIC_ROUTE_PATTERNS` y `scripts/qa/security-headers.test.ts` verifica la
 * equivalencia en los dos sentidos.
 *
 * Además, el render por petición es lo que hace que la galería se descubra
 * sola: `listCourseGalleryImages` lee la carpeta pública en cada visita, así
 * que una foto nueva aparece sin desplegar nada.
 *
 * ESCALABILIDAD
 * Todo el contenido sale de `getFeaturedEdition(MATRIXLAB_TUMBLER_COURSE)`.
 * Publicar la Edición 3 es añadir su objeto a `editions` y mover
 * `featuredEdition`: esta página no se toca ni se duplica.
 */
export const dynamic = "force-dynamic";

const course = MATRIXLAB_TUMBLER_COURSE;

export async function generateMetadata(): Promise<Metadata> {
  const edition = getFeaturedEdition(course);
  const title = `${course.name} — ${edition.hero.subtitle}`;
  const description = edition.pitch;
  return {
    title,
    description,
    alternates: { canonical: course.href },
    openGraph: {
      title: `${title} | Tienda MatrixLab`,
      description,
      type: "website",
      locale: "es_MX",
    },
  };
}

export default async function CursosMatrixLabTumblerPage() {
  const edition = getFeaturedEdition(course);
  const images = listCourseGalleryImages(edition.gallery);
  const registerHref = `#${COURSE_REGISTRATION_ANCHOR}`;

  return (
    <div className="pb-8">
      <CourseHero
        course={course}
        edition={edition}
        registerHref={registerHref}
      />

      {/* ================= GALERÍA ================= */}
      <section
        id="galeria"
        className="relative scroll-mt-24 px-4 py-14 sm:px-6 sm:py-16"
      >
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ml-violet">
                  Así se ve
                </span>
                <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-[2.5rem]">
                  El taller por <span className="text-gradient">dentro</span>
                </h2>
              </div>
              <p className="flex items-center gap-2 text-sm text-ml-white/45">
                <Camera className="h-4 w-4" aria-hidden />
                Desliza para ver más
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.06} className="mt-8">
            <CourseGallery images={images} title={course.name} />
          </Reveal>
        </div>
      </section>

      <CourseExperience items={edition.experience} />

      <CourseVideos videos={edition.videos} />

      {/* ================= REGISTRO ================= */}
      <section
        id={COURSE_REGISTRATION_ANCHOR}
        className="relative scroll-mt-24 overflow-hidden px-4 py-16 sm:px-6 sm:py-20"
      >
        <SoftBlob
          className="pointer-events-none absolute -left-44 top-10 h-[30rem] w-[30rem] text-ml-coral/[0.08] blur-2xl"
          aria-hidden
        />
        <SoftBlob
          className="pointer-events-none absolute -right-48 bottom-0 h-[32rem] w-[32rem] text-ml-violet/[0.07] blur-2xl"
          aria-hidden
        />
        <SnowGlobeArt
          className="pointer-events-none absolute -left-10 bottom-16 hidden h-40 w-40 text-ml-cyan opacity-[0.06] lg:block"
          aria-hidden
        />

        <div className="relative mx-auto max-w-3xl">
          <Reveal>
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-ml-coral/30 bg-ml-coral/10 px-4 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ml-coral">
                <SparkleMark className="h-3.5 w-3.5" aria-hidden />
                Aparta tu lugar
              </span>
              <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-[2.6rem]">
                Quiero mi lugar en la{" "}
                <span className="text-gradient">{edition.hero.subtitle}</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ml-white/70">
                Déjanos tus datos y tu día preferido. Te escribimos por WhatsApp
                para confirmar todo.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="mt-9">
            {/* Props estrechas a propósito: al componente de cliente sólo
                viajan el slug, el número de edición y las reglas del sondeo.
                Ver el comentario de CourseRegistrationForm. */}
            <CourseRegistrationForm
              courseSlug={course.slug}
              edition={edition.edition}
              rules={{
                dateOptions: edition.dateOptions,
                maxPartySize: edition.maxPartySize,
              }}
            />
          </Reveal>
        </div>
      </section>

      <CourseFaq items={edition.faq} />
    </div>
  );
}
