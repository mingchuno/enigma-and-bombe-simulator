import { useState } from "react";
import { EnigmaWorkbench } from "./components/EnigmaWorkbench.tsx";
import type { Transfer } from "./components/EnigmaWorkbench.tsx";
import { BombeWorkbench } from "./components/BombeWorkbench.tsx";
import { Guide } from "./components/Guide.tsx";
import { Icon } from "./components/Icon.tsx";

export function App() {
  const [tab, setTab] = useState<"enigma" | "bombe" | "guide">("enigma");
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  function sendToBombe(value: Transfer) {
    setTransfer(value);
    setTab("bombe");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  return (
    <>
      <header className="site-header">
        <a
          className="brand"
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
            className={tab === "enigma" ? "active" : ""}
            aria-current={tab === "enigma" ? "page" : undefined}
            onClick={() => setTab("enigma")}
          >
            Enigma
          </button>
          <button
            className={tab === "bombe" ? "active" : ""}
            aria-current={tab === "bombe" ? "page" : undefined}
            onClick={() => setTab("bombe")}
          >
            Bombe
          </button>
          <button
            className={`guide-nav ${tab === "guide" ? "active" : ""}`}
            aria-current={tab === "guide" ? "page" : undefined}
            onClick={() => setTab("guide")}
          >
            <Icon name="book" size={16} />
            Field guide
          </button>
        </nav>
        <span className="header-note">The cipher workbench</span>
      </header>
      <main>
        <div className="page-intro">
          <div>
            <h1>
              {tab === "enigma" ? (
                <>
                  Every letter takes
                  <br className="mobile-break" /> a different path.
                </>
              ) : tab === "bombe" ? (
                "A clue becomes a constraint."
              ) : (
                "Inside the cipher."
              )}
            </h1>
            <p>
              {tab === "enigma"
                ? "Set the rotors. Press a key. See the cipher unfold."
                : tab === "bombe"
                  ? "Trace a crib through the connections. Search for settings that hold."
                  : "A working guide to enciphering messages and finding possible keys."}
            </p>
          </div>
          <span className="intro-tag">
            {tab === "enigma"
              ? "Enigma I · Interactive simulator"
              : tab === "bombe"
                ? "Bombe · Known-ring search"
                : "Principles, operation & sources"}
          </span>
        </div>
        <div hidden={tab !== "enigma"}>
          <EnigmaWorkbench onTransfer={sendToBombe} />
        </div>
        <div hidden={tab !== "bombe"}>
          <BombeWorkbench transfer={transfer} />
        </div>
        {tab === "guide" && <Guide />}
      </main>
      <footer>
        <span>Enigma & Bombe</span>
        <p>Explore the mechanism. Understand the mathematics.</p>
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
