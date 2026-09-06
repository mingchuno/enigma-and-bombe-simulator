export function Guide() {
  return (
    <div className="guide-content">
      <section>
        <h2>Two machines. Opposite jobs.</h2>
        <p>
          Enigma turns a message into ciphertext using a secret configuration. The British
          Turing–Welchman Bombe helps work backwards from ciphertext and a guessed fragment of the
          original message.
        </p>
      </section>
      <div className="guide-columns">
        <section>
          <h2>Operate the Enigma</h2>
          <ol>
            <li>
              <strong>Set the machine.</strong> Choose three distinct rotors, ring settings,
              starting windows, reflector, and optional plug pairs.
            </li>
            <li>
              <strong>Type a message.</strong> The rotors step before each letter. Follow the
              outward and returning signal at the right.
            </li>
            <li>
              <strong>Decipher it.</strong> Clear the input, keep the same starting settings, and
              enter the ciphertext. Encryption and decryption use the same operation.
            </li>
          </ol>
          <p>
            Input is converted to A–Z. Spaces, numbers, and punctuation are removed and do not
            advance the rotors. Editing input or settings replays the whole message from the
            starting windows.
          </p>
        </section>
        <section>
          <h2>Run the Bombe search</h2>
          <ol>
            <li>
              <strong>Supply an intercept and crib.</strong> A crib is a suspected fragment of
              plaintext. Align it with a zero-based offset.
            </li>
            <li>
              <strong>Declare what is known.</strong> This version requires rings and reflector.
              Search one rotor order or all 60, with a maximum plugboard cable count.
            </li>
            <li>
              <strong>Inspect candidates.</strong> The search tests starting windows and propagates
              reciprocal plugboard pairings. Surviving candidates are replayed through Enigma to
              verify the crib.
            </li>
          </ol>
          <p>
            Unknown plugboard letters are not recovered facts. Longer, well-connected cribs
            constrain more of the key. Stopping early, hitting the candidate limit, or exceeding a
            work budget leaves a partial search.
          </p>
        </section>
      </div>
      <section className="guide-feature">
        <h2>The middle rotor’s extra step</h2>
        <p>
          The rotors are not a simple odometer. With III–II–I installed, these consecutive window
          positions show the middle rotor advancing twice in succession:
        </p>
        <div className="stepping-example">
          <span>KDQ</span>
          <b>→</b>
          <span>
            K<span>E</span>R
          </span>
          <b>→</b>
          <span>
            L<span>F</span>S
          </span>
        </div>
        <p>
          Turnover is tested before movement. Ring settings change the internal wiring offset, while
          the visible notch-trigger letters stay the same.
        </p>
      </section>
      <section>
        <h2>Historical scope & sources</h2>
        <p>
          This release models Enigma I with rotors I–V and B/C reflectors. The Bombe workspace is a
          modern constraint solver inspired by the British machine, with exact Enigma stepping. It
          does not simulate physical drum mechanics or electrical stop detection. M4 and unknown
          ring searches are outside this version.
        </p>
        <div className="source-links">
          <a href="https://enigmamuseum.com/rotwirg.htm" target="_blank" rel="noreferrer">
            Enigma Museum · rotor wiring ↗
          </a>
          <a href="https://www.tnmoc.org/bombe" target="_blank" rel="noreferrer">
            The National Museum of Computing · Bombe ↗
          </a>
          <a
            href="https://www.cryptomuseum.com/crypto/enigma/working.htm"
            target="_blank"
            rel="noreferrer"
          >
            Crypto Museum · Enigma mechanism ↗
          </a>
        </div>
      </section>
    </div>
  );
}
