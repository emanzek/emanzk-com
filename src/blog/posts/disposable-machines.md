---
title: "Disposable machines and guaranteed teardown"
date: 2026-09-09
summary: "__exit__ does not run when the process is killed. Teardown at exit is a hope; teardown at startup is a guarantee."
topics: ["python", "proxmox", "automation"]
---
Every candidate fix runs on a machine that was created for it and is destroyed after it, whatever happens. That is easy to write and surprisingly easy to get wrong.

## The obvious implementation

A context manager. Create the clone on entry, destroy it on exit, and let Python guarantee the teardown:

```python
with Clone(template=BASE) as vm:
    apply_fix(vm)
    scan(vm)
```

This handles the normal path and it handles exceptions, which covers most of what goes wrong. It does not handle the case that actually bit: the process was **SIGKILLed**. Twice, by the OOM killer, while an unrelated desktop process was eating memory.

`__exit__` does not run when the process is killed. `atexit` does not run. `finally` does not run. The clones survived, four gigabytes each, and were discovered later by noticing the storage.

## Teardown at start, not only at end

The fix is to stop treating cleanup as something that happens at the end of a run, and make it something that happens at the **beginning** of the next one:

```python
def reap(vms):
    for vm in stale_clones(vms):
        destroy(vm)
```

Exit-time teardown is best-effort — it runs unless the process dies in a way that skips it. Start-time teardown is guaranteed, because the next run always happens. Anything left behind by a previous run is destroyed before this run creates anything.

## The condition that makes it safe

A reaper that deletes machines is a dangerous thing to run automatically, so the predicate matters more than the mechanism. A stale clone must match **both** conditions:

- its ID falls inside the range reserved for this harness
- its name carries the harness prefix

Either alone is too loose. An ID range can be reused by a human who did not know it was reserved; a name prefix can be typed by anyone. Requiring both means the reaper can only ever destroy something this harness created, and a machine that fails either test is left alone even if it looks like litter.

## The rule

Any process that creates infrastructure should assume it will one day be killed in a way that skips its own cleanup — because eventually it will be. Teardown that only runs on the way out is a hope. Teardown that runs on the way in is a guarantee, and it costs one function call at startup.
