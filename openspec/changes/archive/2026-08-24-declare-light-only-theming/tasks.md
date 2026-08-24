## 1. Author the light-only language

- [x] 1.1 Update `design-system/language/theming.md` with the light-paper-only stance, hue-only skin variation, dark-mode rationale, and the two supported `.dark` consumer choices (covers `Consumer finds the light-only stance` and `Consumer integrates with an existing dark application`).
- [x] 1.2 Add the corresponding no-dark-mode anti-goal to `design-system/language/anti-goals.md` and ensure the wording rejects dark skins and lightness inversion (covers `No dark implementation is introduced`).

## 2. Propagate and verify the contract

- [x] 2.1 Update the shipped consumer documentation/source inputs so the light-only stance and `.dark` integration choices are present without adding a dark skin, runtime branch, or visual token values (covers `Consumer finds the light-only stance`, `Consumer integrates with an existing dark application`, and `No dark implementation is introduced`).
- [x] 2.2 Run the documentation/build validation and inspect generated outputs to confirm no dark skin, dark-mode runtime path, or new visual token values were introduced; run the relevant OpenSpec strict validation (covers `No dark implementation is introduced`).
