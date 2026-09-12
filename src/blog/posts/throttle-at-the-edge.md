---
title: "The only throttle is at the edge"
date: 2026-09-11
summary: "Why a reverse proxy behind a tunnel cannot rate limit anything, what case-insensitive routing does to a WAF rule, and the test that measured the wrong path three times."
topics: ["security", "cloudflare", "networking"]
---
A media server went onto the public internet with no identity provider in front of it. Cloudflare Access breaks native TV and mobile clients, so the login form itself is exposed and a rate limit is the only thing standing in front of a password field.

The obvious place to put that limit is the reverse proxy, close to the service. That instinct is wrong here, and the reason generalises.

## A proxy behind a tunnel cannot see who is calling

The proxy sets its client IP header from the immediate peer. For anything arriving through a tunnel, the immediate peer is the tunnel daemon — every external visitor on earth arrives wearing the same address.

```
header_up X-Real-IP {remote_host}
```

A per-IP limit downstream of that does not protect the login form. It counts the entire internet as one client, and the first burst bans the tunnel — taking down all remote access. The control produces exactly the outage it was installed to prevent.

So the limit goes at the edge, where the client address is still a real thing.

## Two measurements that changed the rule

**The framework routes case-insensitively.** The app runs on ASP.NET Core, so `/users/authenticatebyname` reaches the same handler as `/Users/AuthenticateByName`. A WAF expression is case-*sensitive*. Matching the documented path exactly produces a rule that looks correct in the dashboard and is defeated by one keystroke. The expression needs to case-fold:

```
lower(http.request.uri.path) contains "authenticate"
```

The test that settles it is cheap: request the lowercase path and look for **401 versus 404**. A 401 means the route matched and the credentials were rejected. A 404 means there is no such route.

**The application's own lockout was off.** It exposes a lockout setting, carries a failed-attempt counter, and increments it faithfully. The branch that acts on the count is gated on the setting having a value, and the value was null. The counter was a gauge wired to nothing. Reading the source took two minutes; assuming would have sized the edge rule as defence-in-depth on top of a control that did not exist.

## The verification trap

The first three attempts to verify the deployed rule showed nothing being blocked. The rule was fine. The test was measuring the wrong path.

Split-horizon DNS resolves the public hostname, for anyone on the LAN, to the internal proxy. A curl from a workstation reaches the real service, returns a genuine 401, and **never touches the edge** — so every edge control is invisible. The response is authentic, which is what makes it convincing.

Latency gave it away: 23 milliseconds, repeatedly. That is a LAN number, not an internet one.

```bash
curl -s -o /dev/null -w '%{remote_ip}\n' https://example.com/api
```

Pin to the edge with `--resolve`, and use **one** address for the whole run — below Enterprise, rate-limit counters are keyed per data centre, so a burst spread across anycast addresses splits the counter and imitates a rule that does not work.

## What it buys

On a free plan: five requests per ten seconds, blocked for ten. Roughly fifteen attempts a minute sustained. That is a speed bump, and calling it anything else would be dishonest. The controls that matter more are cheaper — rename the account off its default, and add a second administrator before enabling lockout, because lockout on a single-account server is a denial of service an attacker triggers on purpose.
