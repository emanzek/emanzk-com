---
title: "The ratchet catches what no probe can"
date: 2026-09-10
summary: "A fix can do exactly what it claims, leave the machine perfectly healthy, and still be wrong. Four signals, and the one that earns its place."
topics: ["automation", "ci", "hardening"]
---
An agent proposes a hardening fix. Something has to decide whether it ships. The interesting part of that pipeline is not the agent — it is the gate, and specifically the one signal that no health check can replace.

## Four signals, not one

Each candidate fix gets a disposable clone, and the harness judges the result on four independent questions:

- **target_fixed** — does the rule the fix was written for now pass?
- **no_regression** — did any rule that was passing before now fail?
- **probes_pass** — is the machine still reachable, are its services still up?
- **survived_reboot** — is all of the above still true after a restart?

A fix ships only if all four hold. Three of them are obvious. The second one is the ratchet, and it is the one that earns its place.

## Why probes are not enough

A health probe answers "is this machine alive and serving." That is a necessary question and a shallow one. A remediation can do exactly what it claims, leave the machine perfectly healthy, and still be wrong — because it broke a neighbouring rule that nothing was watching.

The ratchet compares the **full** rule set before and after. Not the target rule. All of them. It is the difference between "did my change work" and "what else did my change touch", and only the second question catches collateral damage.

## Three real verdicts

```
accepted   target fixed · no regression · probes pass · survived reboot
rejected   probes failed: unreachable — the fix locked out ssh
rejected   regressed a sibling rule — the ratchet caught it
```

The third one is the case for the whole design. That fix **fixed its target**. Probes passed — the machine was up and answering. It survived a reboot. By any reasonable liveness check it was a success, and it was still rejected, because a rule that had been passing before was now failing.

The second is the case for probes: a hardening rule that tightens remote access can be perfectly correct by the scanner's measure and leave you locked out of the machine. The scanner is delighted. You are on a console cable.

## The generalisation

Every automated change wants two separate instruments: one that asks **did it work**, and one that asks **did it break anything else**. They fail differently, they are measured differently, and a system that only has the first will ship regressions with a green light on the dashboard.

The ratchet is cheap — it is a set difference over a scan you were already running. It is also the only signal in the four that would have caught the third verdict, and that fix looked good on everything else.
