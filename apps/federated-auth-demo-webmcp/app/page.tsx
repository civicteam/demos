import { auth } from "@/auth";
import { type ImageProps } from "next/image";
import { redirect } from "next/navigation";

import BasePathImage from "./components/BasePathImage";
import { LoginForm } from "./components/LoginForm";
import SpeechBubbles from "./components/SpeechBubbles";
import ThemeToggle from "./components/ThemeToggle";
import styles from "./page.module.css";

type Props = Omit<ImageProps, "src"> & {
  srcLight: string;
  srcDark: string;
};

const ThemeImage = (props: Props) => {
  const { srcLight, srcDark, ...rest } = props;

  return (
    <div
      className="relative"
      style={{
        width: typeof rest.width === "number" ? `${rest.width}px` : "auto",
        height: typeof rest.height === "number" ? `${rest.height}px` : "auto",
      }}
    >
      <BasePathImage {...rest} className="absolute inset-0 block dark:hidden" src={srcLight} />
      <BasePathImage {...rest} className="absolute inset-0 hidden dark:block" src={srcDark} />
    </div>
  );
};

export default async function Home() {
  const session = await auth();

  // If logged in, redirect to My Audi page
  if (session?.user) {
    redirect("/my-audi");
  }

  return (
    <div className={`${styles.page} relative`}>
      <div className="absolute inset-0 z-0">
        <BasePathImage
          src="hero-image.jpeg"
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-black/50"
          aria-hidden
        />
      </div>
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <main className={`${styles.main} relative z-10`}>

        <div className="mb-8 text-center w-full max-w-sm mx-auto">
          <BasePathImage
            src="audi-logo.svg"
            alt="Audi"
            width={80}
            height={32}
            className="mx-auto mb-3"
          />
          <h1 className="text-3xl font-bold mb-4 font-auditype">myAudi</h1>
          <p className="mb-4 text-sm">Sign in to view your Audi garage</p>
          <LoginForm />
        </div>
      </main>

    </div>
  );
}
