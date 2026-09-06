# Enigma and Bombe: algorithm research

Research date: 6 September 2026. Status: research and proposed scope; no application implementation yet.

## Recommended starting scope

Build a three-rotor **Enigma I** simulation with selectable rotors I–V, reflector B (optionally C), ring settings, starting windows, and a reciprocal plugboard. Pair it with an educational **British Turing–Welchman Bombe** constraint search. Treat naval M4 and a faithful simulation of Bombe relays/drum mechanics as later extensions. These are project recommendations, not agreed requirements.

The distinction matters: Enigma transforms a message under a key; the Bombe exploits a guessed plaintext fragment to eliminate candidate settings. A surviving Bombe stop still needs checking. The British Bombe and the earlier Polish bomba are different machines. [TNMOC overview](https://www.tnmoc.org/bombe)

## Enigma model and conventions

Enigma steps its rotors before routing electricity. The path is keyboard → plugboard → entry wheel → right, middle, left rotors → reflector → left, middle, right rotors in reverse → entry wheel → plugboard → lamp. The reflector pairs contacts, making the transform reciprocal and preventing self-encryption. Ring settings offset wiring relative to the displayed alphabet; turnover notches belong to that alphabet ring, so their visible trigger letters stay fixed when rings change. [Crypto Museum mechanism](https://www.cryptomuseum.com/crypto/enigma/working.htm)

Use these explicit software conventions:

- Letters and internal ring values: A=0 through Z=25. Display numeric rings as 01–26 if desired.
- Store and display rotors **left to right**; the right rotor moves fastest.
- A starting window is the position **before** the first keypress.
- Separate immutable wiring/configuration from mutable windows.
- Accept A–Z in the cipher core. Any case conversion, space preservation, or punctuation removal is an explicit interface policy; ignored characters must not step rotors.

### Wiring data

Each string gives outputs for inputs ABC…Z, entering from the right with zero offset. The turnover column below means the **window letter before stepping**, not the physical notch coordinate. These are factual wiring measurements/catalogue data. [David Hamer's wiring tables, Enigma Museum](https://enigmamuseum.com/rotwirg.htm)

| Component | Wiring | Turnover window |
|---|---|---|
| ETW | `ABCDEFGHIJKLMNOPQRSTUVWXYZ` | — |
| I | `EKMFLGDQVZNTOWYHXUSPAIBRCJ` | Q |
| II | `AJDKSIRUXBLHWTMCQGZNPYFVOE` | E |
| III | `BDFHJLCPRTXVZNYEIWGAKMUSQO` | V |
| IV | `ESOVPZJAYQUIRHXLNFTGKDCMWB` | J |
| V | `VZBRGITYUPSDNHLXAWMJQOFECK` | Z |
| Reflector B | `YRUHQSLDPXNGOKMIEBFZCWVJAT` | — |
| Reflector C | `FVPJIAOYEDRZXWGCTKUQSBNMHL` | — |

### Rotor mathematics

The following is our mathematical specification of the wiring transformation, consistent with the offset and inverse-map implementation in [Py-Enigma's rotor source](https://raw.githubusercontent.com/gremmie/enigma/master/enigma/rotors/rotor.py).

Let `W` be a rotor permutation, `W⁻¹` its inverse, `p` the displayed position, `r` the ring setting, and `d = (p-r) mod 26`. Define nonnegative modular arithmetic throughout:

```text
forward(x) = (W[(x+d) mod 26] - d) mod 26
reverse(x) = (W⁻¹[(x+d) mod 26] - d) mod 26
```

For example, rotor I with p=B and r=A maps forward A to J: shift input to B, look up K, then shift back to J. Setting both p=B and r=B restores zero electrical offset.

Let `P` be the plugboard permutation and `U` the reflector. After stepping, evaluate in this order:

```text
P → R.forward → M.forward → L.forward → U
  → L.reverse → M.reverse → R.reverse → P
```

Derived invariants: `P(P(x))=x`; `U(U(x))=x`; `U(x)≠x`. With windows held fixed the complete transform is an involution without fixed points. Whole-message decryption therefore requires resetting to the original state and replaying the same stepping sequence. Simply feeding ciphertext into the already-advanced machine will not work.

### Stepping and the double step

Evaluate both notch conditions on the old state, then apply all moves together:

```text
middleAtNotch = M.window in M.turnoverLetters
rightAtNotch  = R.window in R.turnoverLetters
if middleAtNotch:                 advance L
if middleAtNotch or rightAtNotch: advance M
always:                          advance R
then:                            encrypt one letter
```

Each rotor moves at most once per keypress. For III–II–I, windows progress `KDO → KDP → KDQ → KER → LFS → LFT`: the middle rotor advances on consecutive presses at `KDQ → KER → LFS`. [Cornell's explicit stepping rules and example](https://www.cs.cornell.edu/courses/cs3110/2015fa/a1/a1.html)

Do not shift the window-based turnover letters by the ring setting. Do not replace stepping with a base-26 counter. Do not apply the forward wiring again on the return journey.

### Plugboard and configuration validation

Validate disjoint pairs, with each letter in at most one pair; unused letters map to themselves. The physical board accommodates 0–13 pairs, while ten was a common operational setting. M4 adds a stationary Greek rotor and a thin reflector, rather than four normally stepping rotors. [Crypto Museum plugboard and model differences](https://www.cryptomuseum.com/crypto/enigma/working.htm)

Proposed core validation: unique installed rotor identities, 26-element bijective rotor maps, a fixed-point-free involutive reflector, legal window/ring ranges, and no repeated plug endpoints. Keep ring and window controls distinct: changing a left ring alone still changes encryption at a fixed displayed window, even though coordinated ring/window changes can describe equivalent electrical settings.

## Verification reference for implementation

These are acceptance criteria for the future implementation, not tests run in this research pass:

1. I–II–III, reflector B, rings AAA, windows AAA, no plugs: `AAAAA → BDZGO`. Reset and verify the reverse. This is an interoperability fixture in [Py-Enigma's test suite](https://raw.githubusercontent.com/gremmie/enigma/master/enigma/tests/test_enigma.py), not proof of historical provenance.
2. Verify the double-step sequence above, also with non-A rings; include wraparound and simultaneous notch conditions.
3. Nontrivial fixture: II–IV–V, B, rings **B U L**, plugs `AV BS CG DL FU HZ IN KM OW RX`. At WXC, `KCH → BLA`; reset to BLA, then `NIBLFMYMLLUFWCASCSSNVHAZ → THEXRUSSIANSXAREXCOMINGX`. Py-Enigma's README specifies the same rings as zero-based `[1,20,11]`. [Library author's example](https://github.com/gremmie/enigma)
4. Property checks: forward/reverse rotor maps undo each other at every offset; fixed-state reciprocity and no self-encryption hold; reset message round trips work; input normalization does not accidentally advance state.
5. Compare randomized configurations against an independent implementation, including turnover within long messages. A round trip alone can pass with a mutually consistent but historically incorrect cipher.

## British Turing–Welchman Bombe

The following covers the British three-wheel Bombe. The proposed software algorithm is a mathematical adaptation, not a claim that the historical machine used backtracking.

### What the machine actually supplied

A crib is guessed plaintext aligned with intercepted ciphertext. Its letter correspondences become a menu. A Bombe stop is a candidate requiring checking; it does not directly produce the complete plaintext or necessarily the full key. Checking propagates possible plugboard pairings, rejects conflicts, and supports recovery of remaining settings and pairings. [The National Museum of Computing: Menus and Cribs](https://www.tnmoc.org/bh-16-menus-and-cribs)

### Constraint model

Define `P` as the unknown plugboard permutation and `S_i` as the rotor–reflector–rotor permutation without the plugboard at character position `i`. For crib letter `p_i` and ciphertext `c_i`:

```text
c_i = P(S_i(P(p_i)))
P(c_i) = S_i(P(p_i))       because P(P(x)) = x
```

This is a mathematical restatement of the connected-scrambler principle: the unknown plugboard partners at adjacent menu letters can be connected directly through the scrambler corresponding to their message position. Closing a loop requires the initial partner to return to itself. Enigma's no-self-encipherment property also lets us discard crib alignments containing `p_i = c_i`. [Virtual Bombe: technical explanation](https://bombe.virtualcolossus.co.uk/technical.html)

Represent a menu as a multigraph: letter nodes and an edge `(p_i, c_i, i)` for each selected correspondence. Preserve repeated edges at different positions; their scramblers differ. Store the position index explicitly rather than deriving it from display layout. Loops impose consistency constraints. Welchman's diagonal board exploited `P(a)=b ⇔ P(b)=a`, making menus with fewer loops useful; loops are desirable, not an absolute requirement for the improved machine. [Bombe rebuild explanation by Frank Carter](https://www.rutherfordjournal.org/article030108.html)

### Two simulator layers

**Constraint solver (recommended foundation; our derived design).** For each candidate scrambler sequence, choose a well-connected menu letter `t` and try each hypothesis `P(t)=a`. Maintain a partial involution. Assigning `P(x)=y` must also assign `P(y)=x`; reject any clash with an existing assignment. A self-pair `P(x)=x` means unplugged and is valid. Every edge with known `P(p_i)` forces `P(c_i)=S_i(P(p_i))`; traverse either direction and repeat to a fixed point.

If propagation leaves unassigned menu letters, branch on one and continue. Do not silently accept disconnected or unresolved parts of the menu. Once all equations hold, preserve unresolved letters as unknown; complete them only subject to the selected cable-count rule. A partial mapping is not a recovered complete plugboard. Finally replay the crib through the exact Enigma engine. This is a constraint solver inspired by Bombe reasoning, with stronger checking than a historical stop detector.

**Electrical explanation layer.** Model 676 terminals `(x,a)`, meaning the hypothesis `P(x)=a`. Add diagonal connections `(x,a) ↔ (a,x)`. For each menu edge, connect `(p_i,a) ↔ (c_i,S_i(a))` for every `a`. Voltage propagation becomes graph reachability from a selected input terminal. The historical diagonal board was a 26-by-26 arrangement and the machine sensed whether any input-register circuit remained open. Its three banks contained 36 three-drum scramblers in total, with 12 per bank. [TNMOC: Bombe Description](https://www.tnmoc.org/bh-10-bombe-description)

In that electrical layer, all 26 input terminals reached means rejection. Fewer than 26 means a potential stop, not automatic success. The familiar one-live/25-live patterns can identify a candidate partner, but do not replace the general stop condition. An electrical simulation should let weak menus produce ambiguous stops and pass them to the constraint checker. [Carter: stop detection and checking](https://www.rutherfordjournal.org/article030108.html)

### Search dimensions and the turnover trap

For three distinct rotors selected from five, `5×4×3 = 60` orders. One `26³ = 17,576` core-position sweep per order totals `1,054,560` positions, before additional hypotheses. The wartime report explains reducing the ring-setting problem by using short crib sections assumed not to contain turnover, fixing reference rings, and searching relative positions. It also documents special turnover and delayed-hoppity menus. Therefore that million-position count is not an exhaustive count of every Enigma key, crib placement, ring setting, or stepping history. [6812th Signal Security Detachment training report, printed pp. 3–6 and 37–38](https://www.codesandciphers.org.uk/documents/bmbrpt/usbmbrpt.pdf)

Initial visible positions and ring settings jointly determine rotor core positions; several combinations give the same cores. A stop alone therefore does not uniquely identify the visible message-start letters and daily ring settings. [Carter: rotor core starting positions](https://www.rutherfordjournal.org/article030108.html)

For our software, choose an explicit search contract:

- **Exact Enigma search:** rings and reflector are inputs; enumerate permitted rotor orders and initial window positions, then obtain every `S_i` from the real stepping engine, including double stepping.
- **Historical-style core search:** enumerate reference core positions using explicitly declared relative menu offsets and turnover assumptions. Expose these assumptions and validate survivors against feasible actual Enigma settings.

Do not implement the second mode by advancing an Enigma once per Bombe candidate: the Bombe scans settings with its own drive system. Nor should independent modulo offsets be confused with Enigma's notch-driven stepping. The Virtual Bombe reconstruction describes sensing/carry phases and drum-letter offsets that differ from Enigma; reproducing these needs a separate presentation-to-core conversion. [Virtual Bombe: drums and drive mechanics](https://bombe.virtualcolossus.co.uk/technical.html)

### Validation and limits before implementation

Our proposed acceptance checks:

1. Encrypt a controlled message with known settings; a correct crib retains the generating settings and compatible plugboard.
2. Exercise repeated menu edges, disconnected components, self-pairs, reused plugboard endpoints, and configured cable count.
3. Deliberately wrong hypotheses show a concrete contradiction; weak or incorrect cribs may still produce false candidates.
4. Compare the constraint solver against exhaustive plugboard enumeration on a small toy alphabet.
5. Test cribs spanning fast-rotor turnover and double stepping. Exact mode must retain the real key; a restricted historical mode must disclose its limitation.
6. Keep electrical-stop candidates separate from fully checked crib matches and fully decrypted messages.

For a first educational release, recommend three-rotor Enigma with known rings/reflector and an exact constraint search, plus menu and propagation visualization. Defer claims of physical Bombe fidelity until drum orientation, indicator conventions, menu capacity, stop/cancel timing, and turnover procedures have separate fixtures. Four-rotor naval search and different Bombe variants require additional research.

## Source quality and remaining decisions

Evidence comes from museum custodians/reconstruction specialists, Hamer's published wiring catalogue, and first-party educational/library specifications. Software fixtures establish compatibility, not provenance of wartime messages. An attempted read of Hamer's original double-stepping PDF was blocked; the stepping rule is corroborated by Cornell and executable Py-Enigma tests.

Do not copy broad web claims about an overall Enigma key-space size into the UI: their assumptions about rings, equivalent settings, and reachable states differ. Declare exactly which dimensions each search varies. The interface style, historical fidelity level, and framework remain open; this research does not choose them.
