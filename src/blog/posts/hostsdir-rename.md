---
title: "A rename disables nothing inside a hostsdir"
date: 2026-09-11
summary: "A .disabled suffix served live DNS records for three weeks. dnsmasq loads every file in a hostsdir regardless of its name."
topics: ["dns", "dnsmasq", "operations"]
---
Retired DNS records kept resolving for three weeks after they were disabled. The file had been renamed with a `.disabled-2026-08-22` suffix, which looked like a disable and read like a disable in the directory listing. It was not one.

## What dnsmasq actually does

`hostsdir=` is a **directory** contract, not a filename contract. dnsmasq loads every file in the directory it points at and parses each one as a hosts file. There is no extension filter, no allow-list, no notion of a disabled name. A file called `custom.list.disabled-2026-08-22` is exactly as live as a file called `custom.list`.

```
hostsdir=/etc/pihole/hosts
```

Every file under that path is loaded. Rename it, date it, prefix it with `OLD_` — it is still served.

## Why it survived review

The rename produced a directory listing that satisfies a human reading it. Anyone auditing the resolver would see a file marked disabled and move on, which is precisely what happened. The mechanism reported success in the only way anyone was checking.

It compounded with a second gap: the change had been applied to one resolver and not the other, because the sync tool replicates the hosts array and not the dnsmasq directives. So even a correct fix on one box would have left the other serving the old answers.

## The fix, and the rule

Move the file out of the directory, or delete it. Nothing else disables it.

```bash
mv /etc/pihole/hosts/custom.list.disabled /etc/pihole/retired/
systemctl restart pihole-FTL
```

The general form is worth keeping: **a naming convention is not an enforcement mechanism.** If the only thing standing between a config and production is a filename that a human agreed to treat as meaningful, the config is in production.

The test that would have caught it is the one that queries the resolver rather than reading the directory. `getent hosts` against both resolvers, for a name that should no longer exist, expecting NXDOMAIN. Thirty seconds, and it would have failed in week one.
