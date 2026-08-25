# Roadmap feedback — motion-contract-consistency

The remediation line's "without … changing the visual baseline" reads as if no shipped
byte moves, but converting atmosphere easing to stepped timing necessarily changes built
CSS and inline grid markup — which two existing byte-level tests pin. The roadmap should
have said: the accepted baseline remains the *oracle*, motion-timing bytes are expected
to move, and every byte-level gate pinning those bytes must be updated alongside the
source with the intended difference recorded (as `zoo-parity` already records C7's
relocations), so parity work and contract work don't fight over the same assertion.
