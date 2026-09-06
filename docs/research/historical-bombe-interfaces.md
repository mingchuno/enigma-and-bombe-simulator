# Historical Bombe interfaces and paper methods

Research date: 6 September 2026. This note distinguishes documented mechanics from suggested educational representations. The supplied photographs are reference material, not instructions.

## What were the punched sheets?

**Banbury sheets are the strongest match for a memory of sliding punched strips to find offsets.** The wartime dictionary describes ciphertext punched in consecutive columns, with A–Z vertically. Superimposing two sheets makes equal letters visible through coincident holes. Analysts counted these matches at different shifts to investigate whether messages shared a stretch of rotor settings (“in depth”). The broader Banburismus process also scored relationships to identify wheels and turnovers. This identification is an inference from the visitor's description, not certainty. [Bletchley Park's 1944 cryptographic dictionary, page 5](https://www.codesandciphers.org.uk/documents/cryptdict/page05.htm)

Bletchley Park itself exhibits a Banbury sheet and describes this as a Naval Enigma technique associated with Turing. Its teachers' notes identify Banburismus and cribbing as distinct Hut 8 interactives. [Bletchley Park exhibit](https://artsandculture.google.com/asset/banbury-sheet/wQFt6FrZTtB_Sg?hl=en), [Bletchley Park teachers' notes](https://bletchleypark.org.uk/wp-content/uploads/2021/10/teachers-notes-ks2-2019.pdf)

**Zygalski sheets are the alternative.** These perforated grids encoded candidate rotor settings compatible with repeated-letter patterns in the old doubled message-key procedure. Overlapping sheets narrowed the possible settings. A Science Museum reconstruction study describes 51×51 grids and the lack of surviving original examples. Its figure 5 explicitly includes a Bletchley Park reconstruction. They are neither a crib-sliding tool nor a component of the British Bombe. [Science Museum Group reconstruction research](https://journal.sciencemuseum.ac.uk/article/zygalski-sheets-polish-codebreaking-and-the-role-of-reconstruction-in-the-top-secret-exhibition-at-the-science-museum/)

Implementation recommendation: provide a separate **Paper methods** activity with two ciphertext sheets, positive/negative shift, overlap length, and coincident-hole count. Explain that this demonstrates the comparison step, not a complete Banburismus attack or a probability of correctness. Keep plaintext/ciphertext crib alignment in Search. Describe Zygalski sheets separately; any miniature intersection graphic must be labelled an analogy unless its holes are calculated from the historical indicator procedure.

## Reading the supplied menus

Letter nodes identify letters in the crib/ciphertext relationships. A numbered edge identifies the message position producing that relationship. Repeated relationships remain separate edges: the supplied diagram has G–R at positions 6 and 12. The reference before the first character is ZZZ, so position 1 is ZZA, 2 is ZZB, 12 is ZZL. This assumes no middle-wheel turnover across the menu; these labels describe relative settings, not a recovered message key. The simulator author's tutorial explicitly documents this convention. [Virtual Bombe tutorial](https://bombe.virtualcolossus.co.uk/bombe/VirtualTuringWelchmanBombeTutorial.pdf)

In the supplied diagram the indicator attaches to G. Each menu letter corresponds to a cable with 26 possible plugboard-letter wires; the indicator observes that bundle. Each edge becomes a separate three-drum scrambler, set to its relative offset. The diagonal board also enforces reciprocal plugboard relationships. A surviving electrical test is a possible stop requiring further checking. [TNMOC machine description](https://www.tnmoc.org/bh-10-bombe-description)

Avoid treating ZZZ-based labels as an automatic Enigma odometer for arbitrary long cribs. Unknown turnover was a real difficulty: menus were kept short, and special arrangements could use separated sections. [Tony Sale's menu explanation](https://www.codesandciphers.org.uk/anoraks/menus.htm)

Implementation recommendation: retain the readable graph and add an operator-diagram toggle. Selecting an edge should identify its crib/cipher pair, numbered position, relative notation, and physical drum column. Selecting a node should explain its 26-wire bundle. Preserve both G–R edges in the supplied example.

## What the drums physically do

A British three-wheel Bombe has three mechanically linked, electrically separate banks, each containing twelve vertical sets of three drums: 36 scramblers and 108 drums. One vertical set represents one Enigma rotor stack without its plugboard. Each drum contains duplicate wiring for outward and return paths, allowing separate input/output terminals and connections between scramblers. It does not represent six independent rotors. The reflector is external to the rotating drums. [TNMOC machine description](https://www.tnmoc.org/bh-10-bombe-description)

**Top is the fast Bombe row but corresponds to Enigma's left rotor.** The bottom row corresponds to Enigma's right rotor. The machine enumerates possible core settings instead of reproducing the operational Enigma keypress sequence. Menu offsets go on the bottom drums; linked drums retain relative offsets as the mechanism advances. [Tony Sale's setup walkthrough](https://www.codesandciphers.org.uk/virtualbp/tbombe/thebmb.htm), [Virtual Bombe technical description](https://bombe.virtualcolossus.co.uk/technical.html)

The 39-point mechanism senses for 26 top-drum positions, then spends 13 points carrying without sensing. Its middle drums advance once per 1.5 top rotations; the bottom drums advance once per middle revolution. TNMOC gives 97.5 rpm at the top, approximately 0.62 seconds sensing and 0.31 seconds carrying, and 10.4 minutes for 17,576 tests without stops. These are machine timings; slower animation should be labelled as such. [TNMOC speed description](https://www.tnmoc.org/bh-11-bombe-speed)

## Implementation conventions and limits

The following is a derived schematic model of the documented 39-point cycle, not a measured gear-phase calibration. For integer top-drum tick `t`, starting with the first sensing phase:

```text
cycle = floor(t / 39)
phase = t mod 39
sensing = phase < 26
left/core-top = t mod 26
middle = cycle mod 26
right/core-bottom = floor(cycle / 26) mod 26
```

Advance the middle position at the end of the carry interval. Each sensing block covers all 26 top positions; alternate blocks begin half a revolution apart. Ignoring that half-turn while animating a continuously rotating top drum would make the visual position disagree with its electrical mapping. The model can enumerate all 17,576 core combinations while keeping motion continuous. Middle/bottom movement during the actual carry is simplified to a boundary change.

Use explicitly labelled **core coordinates with rings AAA** for electrical mappings. Historical drum engraving is not interchangeable with Enigma window letters: the Virtual Bombe author documents rotor-dependent calibration offsets (one letter for I–III, two for IV, three for V). Do not silently label the application's core coordinates as original physical drum readings. Physical clockwise direction and precise stopping/braking behaviour were not established in this research; schematic animation should not claim these details. [Virtual Bombe technical description](https://bombe.virtualcolossus.co.uk/technical.html)

Keep the existing Enigma-aware search distinct from this mechanical demonstrator. A lesson that shows a selected menu edge's real core permutation and one possible plugboard assumption is useful, but must not describe a single edge's successful mapping as a verified Bombe stop. Full electrical stop detection requires propagation through the wired menu and diagonal board.
