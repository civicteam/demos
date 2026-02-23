import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import BasePathImage from "../components/BasePathImage";
import { UserMenu } from "../components/UserMenu";

type OwnedAudi = {
  id: string;
  model: string;
  year: number;
  trim: string;
  color: string;
  mileage: string;
  vin: string;
  status: string;
  image: string;
};

const ownedAudis: OwnedAudi[] = [
  {
    id: "audi-q8",
    model: "Audi Q8",
    year: 2024,
    trim: "Prestige",
    color: "Glacier White Metallic",
    mileage: "8,420 mi",
    vin: "WA1AAAF12RD112340",
    status: "Ready to drive",
    image: "car-1.webp",
  },
  {
    id: "audi-rs7",
    model: "Audi RS 7",
    year: 2023,
    trim: "Performance",
    color: "Daytona Gray Pearl",
    mileage: "12,108 mi",
    vin: "WUAPCBF23PN908177",
    status: "Service in 24 days",
    image: "car-2.webp",
  },
  {
    id: "audi-e-tron-gt",
    model: "Audi e-tron GT",
    year: 2025,
    trim: "quattro",
    color: "Mythos Black Metallic",
    mileage: "2,990 mi",
    vin: "WAUEAAGE3SA550921",
    status: "Charging at 82%",
    image: "car-3.webp",
  },
];

function getStatusPillClass(status: string): string {
  if (status.startsWith("Ready to drive"))
    return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (status.startsWith("Service"))
    return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  if (status.startsWith("Charging"))
    return "bg-sky-500/20 text-sky-400 border-sky-500/30";
  return "bg-white/10 text-gray-200 border-white/25";
}

export default async function MyAudiPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-990 text-white flex flex-col font-auditype [&_p]:font-[Helvetica,_Arial,_sans-serif]">
      <header className="w-full dark:bg-black shadow-sm py-4 px-6 bg-gray-990">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-3 items-center">
          <span className="text-lg font-medium">myAudi</span>
          <div className="flex justify-center">
            <Link className="flex items-center" href="/">
              <BasePathImage
                priority
                alt="Civic logo"
                // className="dark:invert"
                height={10}
                src="audi-logo.svg"
                width={70}
              />
            </Link>
          </div>
          <div className="flex justify-end">
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        {/* Full-bleed hero with background image */}
        <section className="relative w-full min-h-[60vh] overflow-hidden">
          <BasePathImage
            src="hero-image-2.jpeg"
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30"
            aria-hidden
          />
          <div className="absolute inset-0 z-10 flex flex-col justify-end px-4 py-10 md:px-8 md:py-16 lg:px-12">
            <div className="max-w-7xl mx-auto w-full">
              <p className="text-xs uppercase tracking-[0.22em] text-white/80 mb-2">Audi Garage</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold mb-4">My Audi</h1>
              <p className="text-white/90 max-w-2xl text-lg md:text-lg">
                Welcome back{session.user.name ? `, ${session.user.name}` : ""}. <br />Here are your
                purchased vehicles and current ownership status.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-8 md:px-8">
          <p className="text-xs uppercase tracking-[0.22em] mb-4">Your vehicles</p>
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {ownedAudis.map((car) => (
              <article
                key={car.id}
                className="rounded-xl border border-white/15 bg-gradient-to-b from-gray-900 to-black shadow-lg shadow-black/30 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
              >

                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-1">
                        {car.year}
                      </p>
                      <h2 className="text-2xl font-semibold leading-tight">{car.model}</h2>
                      <p className="text-gray-300 mt-1 text-sm">{car.trim}</p>
                    </div>
                    <span
                      className={`shrink-0 text-xs rounded-full border px-3 py-1 font-medium ${getStatusPillClass(car.status)}`}
                    >
                      {car.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-sm text-gray-300 leading-snug">
                    <p>
                      <span className="text-gray-400">Color:</span> {car.color}
                    </p>
                    <p>
                      <span className="text-gray-400">Mileage:</span> {car.mileage}
                    </p>
                    <p>
                      <span className="text-gray-400">VIN:</span> {car.vin}
                    </p>
                  </div>

                  <div className="absolute bottom-6 right-4 md:w-[110px] md:h-[110px] w-[200px] h-[200px] overflow-hidden rounded-lg">
                    <BasePathImage
                      src={car.image}
                      alt=""
                      fill
                      className="object-contain object-bottom object-right"
                      style={{ objectFit: "contain", objectPosition: "bottom right" }}
                    // sizes="112px"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>


        {/* Full-bleed upsell: Full Self-Driving */}
        <section className="relative w-full min-h-[60vh] overflow-hidden">
          <BasePathImage
            src="hero-image-4.jpeg"
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30"
            aria-hidden
          />
          <div className="absolute inset-0 z-10 flex flex-col justify-end px-4 py-10 md:px-8 md:py-16 lg:px-12">
            <div className="max-w-7xl mx-auto w-full">
              <p className="text-xs uppercase tracking-[0.22em] text-white/80 mb-2">Upgrade</p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold mb-4">Full Self-Driving</h2>
              <p className="text-white/90 max-w-2xl text-lg md:text-lg mb-6">
                Relax on every journey. Add hands-free driving to your vehicle.
              </p>
              <Link
                href="#"
                className="inline-flex items-center text-white font-medium underline underline-offset-4 hover:text-white/90 transition-colors"
              >
                Learn more
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-8 md:px-8">
          <p className="text-xs uppercase tracking-[0.22em] mb-4">Vehicle & ownership</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="#"
              className="block rounded-xl border border-white/15 bg-gradient-to-b from-gray-900 to-black p-5 shadow-lg shadow-black/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-white/25"
            >
              <h3 className="text-lg font-semibold text-white mb-1">Service history</h3>
              <p className="text-sm text-gray-400">Past services, next service due, book service</p>
            </Link>
            <Link
              href="#"
              className="block rounded-xl border border-white/15 bg-gradient-to-b from-gray-900 to-black p-5 shadow-lg shadow-black/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-white/25"
            >
              <h3 className="text-lg font-semibold text-white mb-1">Warranty & coverage</h3>
              <p className="text-sm text-gray-400">Warranty status, extended warranty, care packages</p>
            </Link>
            <Link
              href="#"
              className="block rounded-xl border border-white/15 bg-gradient-to-b from-gray-900 to-black p-5 shadow-lg shadow-black/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-white/25"
            >
              <h3 className="text-lg font-semibold text-white mb-1">Recall & campaigns</h3>
              <p className="text-sm text-gray-400">Open recalls and campaigns per vehicle, completion status</p>
            </Link>
            <Link
              href="#"
              className="block rounded-xl border border-white/15 bg-gradient-to-b from-gray-900 to-black p-5 shadow-lg shadow-black/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-white/25"
            >
              <h3 className="text-lg font-semibold text-white mb-1">Mileage & condition</h3>
              <p className="text-sm text-gray-400">Odometer, tire pressure, fluid levels (if connected)</p>
            </Link>
            <Link
              href="#"
              className="block rounded-xl border border-white/15 bg-gradient-to-b from-gray-900 to-black p-5 shadow-lg shadow-black/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-white/25"
            >
              <h3 className="text-lg font-semibold text-white mb-1">Digital key & access</h3>
              <p className="text-sm text-gray-400">Key status, share key, lock/unlock (for supported models)</p>
            </Link>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-8 md:px-8">
          <p className="text-xs uppercase tracking-[0.22em] mb-4">Promo & commercial</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="#"
              className="block rounded-xl border border-white/15 bg-gradient-to-b from-gray-900 to-black p-5 shadow-lg shadow-black/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-white/25"
            >
              <h3 className="text-lg font-semibold text-white mb-1">Accessories</h3>
              <p className="text-sm text-gray-400">Recommended for your model</p>
            </Link>
            <Link
              href="#"
              className="block rounded-xl border border-white/15 bg-gradient-to-b from-gray-900 to-black p-5 shadow-lg shadow-black/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-white/25"
            >
              <h3 className="text-lg font-semibold text-white mb-1">Care & protection</h3>
              <p className="text-sm text-gray-400">Paint protection, extended service plans</p>
            </Link>
            <Link
              href="#"
              className="block rounded-xl border border-white/15 bg-gradient-to-b from-gray-900 to-black p-5 shadow-lg shadow-black/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-white/25"
            >
              <h3 className="text-lg font-semibold text-white mb-1">Next car & loyalty</h3>
              <p className="text-sm text-gray-400">Upgrade offers, loyalty program</p>
            </Link>
          </div>
        </section>

      </main>

      <footer className="w-full border-t border-white/10 bg-black py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link className="flex items-center" href="/">
            <BasePathImage
              alt="Audi"
              height={10}
              src="audi-logo.svg"
              width={56}
              className="opacity-90"
            />
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of use</Link>
            <Link href="#" className="hover:text-white transition-colors">Legal</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </nav>
        </div>
        <div className="max-w-7xl mx-auto w-full mt-6 pt-6 border-t border-white/10 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Audi. myAudi demo.
        </div>
      </footer>
    </div >
  );
}
