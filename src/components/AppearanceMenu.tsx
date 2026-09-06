import { Popover } from "@base-ui/react/popover";
import { useEffect, useState } from "react";
import {
  applyTheme,
  readTheme,
  saveTheme,
  THEME_STORAGE_KEY,
  type Theme,
} from "../theme.ts";

export function AppearanceMenu() {
  const [theme, setTheme] = useState(readTheme);
  useEffect(() => {
    function syncTheme(event: StorageEvent) {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
      const next = readTheme();
      applyTheme(next);
      setTheme(next);
    }
    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  function chooseTheme(next: Theme) {
    saveTheme(next);
    setTheme(next);
  }

  return (
    <Popover.Root>
      <Popover.Trigger className="appearance-trigger" aria-label="Appearance">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4a8 8 0 0 0 0 16Z" fill="currentColor" />
        </svg>
        <span>Appearance</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          className="appearance-positioner"
          sideOffset={8}
          align="end"
          collisionPadding={12}
        >
          <Popover.Popup className="appearance-popup">
            <Popover.Title className="appearance-title">
              Appearance
            </Popover.Title>
            <Popover.Description className="appearance-description">
              Choose the look of your workbench.
            </Popover.Description>
            <fieldset className="appearance-options">
              <legend>Theme</legend>
              <label>
                <input
                  type="radio"
                  name="theme"
                  value="manual"
                  checked={theme === "manual"}
                  onChange={() => chooseTheme("manual")}
                />
                <span>
                  <strong>Service Manual</strong>
                  <small>Olive tones · condensed lettering</small>
                </span>
              </label>
              <label>
                <input
                  type="radio"
                  name="theme"
                  value="intercept"
                  checked={theme === "intercept"}
                  onChange={() => chooseTheme("intercept")}
                />
                <span>
                  <strong>Intercept Form</strong>
                  <small>Oxblood accents · typewriter lettering</small>
                </span>
              </label>
            </fieldset>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
