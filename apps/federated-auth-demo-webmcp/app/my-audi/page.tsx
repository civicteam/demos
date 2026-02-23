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
      </main>
    </div >
  );
}
