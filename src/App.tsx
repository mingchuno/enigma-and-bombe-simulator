import { cn } from "./lib/cn.ts";
import styles from "./App.module.css";
import { useState } from "react";
import { AppearanceMenu } from "./components/AppearanceMenu.tsx";
import { BombeWorkbench } from "./components/BombeWorkbench.tsx";
import type { SearchExercise } from "./workbench/search-exercise.ts";
import { EnigmaWorkbench } from "./components/EnigmaWorkbench.tsx";
import { Guide } from "./components/Guide.tsx";
import { Icon } from "./components/Icon.tsx";

export function App() {
  const [tab, setTab] = useState<"enigma" | "bombe" | "guide">("enigma");
  const [transfer, setTransfer] = useState<SearchExercise | null>(null);
  function sendToBombe(value: SearchExercise) {
    setTransfer(value);
    setTab("bombe");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  return (
    <>
      <header className={styles.siteHeader}>
        <a
          className={styles.brand}
          href="#"
          onClick={(event) => {
            event.preventDefault();
            setTab("enigma");
          }}
          aria-label="Enigma and Bombe home"
        >
          <svg viewBox="0 0 36 36" width="34" height="34" aria-hidden="true">
            <circle cx="18" cy="18" r="15" />
            <circle cx="18" cy="18" r="8" />
            <path d="M18 0v9M18 27v9M0 18h9M27 18h9" />
          </svg>
          <span>
            Enigma <em>&</em> Bombe
          </span>
        </a>
        <nav aria-label="Workbench navigation">
          <button
            className={cn({ [styles.active]: tab === "enigma" })}
            aria-current={tab === "enigma" ? "page" : undefined}
            onClick={() => setTab("enigma")}
          >
            Enigma
          </button>
          <button
            className={cn({ [styles.active]: tab === "bombe" })}
            aria-current={tab === "bombe" ? "page" : undefined}
            onClick={() => setTab("bombe")}
          >
            Bombe
          </button>
          <button
            className={cn(styles.guideNav, {
              [styles.active]: tab === "guide",
            })}
            aria-current={tab === "guide" ? "page" : undefined}
            onClick={() => setTab("guide")}
          >
            <Icon name="book" size={16} />
            Field guide
          </button>
        </nav>
        <AppearanceMenu />
      </header>
      <main className={styles.main}>
        <div className={styles.simulatorIntro}>
          <h1>
            {tab === "enigma"
              ? "Enigma I"
              : tab === "bombe"
                ? "Bombe"
                : "Field guide"}
          </h1>
          <p className={styles.introDescription}>
            {tab === "enigma"
              ? "Set the rotors, type a message, and follow each letter through the machine."
              : tab === "bombe"
                ? "Search for possible rotor and plugboard settings using a crib, known rings, and reflector."
                : "Learn how Enigma works, how to use the simulator, and where the historical details come from."}
          </p>
        </div>
        <div hidden={tab !== "enigma"}>
          <EnigmaWorkbench onTransfer={sendToBombe} />
        </div>
        <div hidden={tab !== "bombe"}>
          <BombeWorkbench transfer={transfer} />
        </div>
        {tab === "guide" && <Guide />}
      </main>
      <footer className={styles.footer}>
        <span>Enigma & Bombe</span>
        <button
          onClick={() => {
            setTab("guide");
            window.scrollTo({ top: 0, behavior: "instant" });
          }}
        >
          About this simulation <Icon name="arrow" size={15} />
        </button>
      </footer>
    </>
  );
}
