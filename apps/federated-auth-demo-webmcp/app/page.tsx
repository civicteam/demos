import { auth } from "@/auth";
import { type ImageProps } from "next/image";
import { redirect } from "next/navigation";

import BasePathImage from "./components/BasePathImage";
import { LoginForm } from "./components/LoginForm";

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

  // If logged in, redirect to chat page
  if (session?.user) {
    redirect("/chat");
  }

  return (
    <div className={styles.page}>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <main className={styles.main}>
        <div className="flex justify-center items-center w-full mb-12">
          <ThemeImage
            alt="Civic logo"
            className=""
            height={38}
            srcDark="civic-logo-white.svg"
            srcLight="civic-logo-dark.svg"
            width={240}
          />
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Federated auth demo</h1>
          <p className="mb-4">Sign in with email and password</p>
        </div>
        <LoginForm />

      </main>
      <footer className={styles.footer}>
        <a
          href="https://vercel.com/templates?search=turborepo&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          rel="noopener noreferrer"
          target="_blank"
        >
          <BasePathImage aria-hidden alt="Window icon" height={16} src="window.svg" width={16} />
          Examples
        </a>
        <a
          href="https://turbo.build?utm_source=create-turbo"
          rel="noopener noreferrer"
          target="_blank"
        >
          <BasePathImage aria-hidden alt="Globe icon" height={16} src="globe.svg" width={16} />
          Go to turbo.build →
        </a>
      </footer>
    </div>
  );
}
