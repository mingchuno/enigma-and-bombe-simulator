import styles from "./Help.module.css";
import { Tooltip } from "@base-ui/react/tooltip";
import type { ReactNode } from "react";
import { useId, useRef, useState } from "react";

export function Help({
  term,
  children,
}: {
  term: string;
  children: ReactNode;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const openedByPress = useRef(false);
  return (
    <Tooltip.Root
      open={open}
      onOpenChange={(nextOpen, details) => {
        // A touch click can be followed by a delayed compatibility mouseleave.
        // Explicitly opened help stays visible until a deliberate dismissal.
        if (
          !nextOpen &&
          openedByPress.current &&
          details.reason === "trigger-hover"
        ) {
          details.cancel();
          return;
        }
        if (!nextOpen) openedByPress.current = false;
        setOpen(nextOpen);
      }}
      triggerId={id}
    >
      <Tooltip.Trigger
        id={id}
        className={styles.conceptHelp}
        aria-label={`Explain ${term}`}
        aria-describedby={open ? `${id}-description` : undefined}
        closeOnClick={false}
        onClick={() => {
          openedByPress.current = true;
          setOpen(true);
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 4M12 16h.01" />
        </svg>
        <span>{term}</span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner
          className={styles.conceptHelpPositioner}
          side="top"
          align="start"
          sideOffset={8}
          collisionPadding={12}
        >
          <Tooltip.Popup
            id={`${id}-description`}
            role="tooltip"
            className={styles.conceptHelpBody}
          >
            {children}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function ConfigurationHelp() {
  return (
    <div className={styles.configurationHelp}>
      <div className={styles.configurationHelpItems}>
        <Help term="Rotor order">
          A rotor is a wheel containing 26 crossed wires. I–V have different
          wirings. The three slots are read left to right; changing their order
          changes the cipher. Selecting an installed rotor swaps the two wheels.
        </Help>
        <Help term="Start windows">
          The three letters showing before the first keypress. The right wheel
          advances before a letter is encoded. To decipher, start with exactly
          the same letters and all the same settings.
        </Help>
        <Help term="Ring settings">
          The alphabet ring can turn relative to the internal wiring. Ring A
          (01) has no offset; B (02) shifts it one position. This is different
          from turning the whole wheel using Start. The visible turnover letter
          stays fixed.
        </Help>
        <Help term="Reflector">
          A fixed set of 13 paired wires sends the current back through all
          three rotors, then the plugboard. It makes the cipher reversible and
          prevents any letter encrypting to itself. B and C use different pairs.
        </Help>
      </div>
    </div>
  );
}
