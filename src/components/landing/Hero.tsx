import { useTranslation } from "react-i18next";
import { LuArrowRight } from "react-icons/lu";
import heroImage from "../../assets/Hero.png";

type HeroProps = {
  onSignIn: () => void;
};

export function Hero({ onSignIn }: HeroProps) {
  const { t } = useTranslation();

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-r from-surface to-primary-light"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:min-h-[520px] lg:grid-cols-2 lg:px-10 lg:py-20">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl leading-tight font-bold tracking-tight text-heading sm:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-body sm:text-xl">
            {t("hero.description")}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex items-center gap-3 rounded-full bg-primary px-7 py-3.5 font-medium text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-dark"
            >
              {t("hero.signInCta")}
            </button>
            <a
              href="#features"
              className="inline-flex items-center gap-3 font-semibold text-primary hover:underline"
            >
              {t("hero.exploreCta")}
              <LuArrowRight className="size-5" aria-hidden />
            </a>
          </div>
        </div>

        <img
          src={heroImage}
          alt={t("hero.imageAlt")}
          className="w-full rounded-3xl object-cover lg:absolute lg:inset-y-0 lg:right-0 lg:h-full lg:w-1/2 lg:rounded-none lg:[mask-image:linear-gradient(to_right,transparent,black_18%)]"
        />
      </div>
    </section>
  );
}
