# Design notes

How this site got to where it is, and why each decision went the way it did.
Written after the fact, from the actual sequence of choices — including the
ones that were tried and thrown away, because those are the ones that explain
the shape of what survived.

---

## The brief I set myself

A portfolio for a systems engineer, aimed at two readers who want opposite
things:

- **Recruiters**, who need the CV facts quickly and will not fight an
  interface to get them.
- **Engineering peers**, who have seen a thousand template portfolios and
  will decide in four seconds whether this one was built by someone who
  actually does the work.

And one interaction requirement that ruled out most of the obvious answers:
**everything is driven by scrolling, from the hero to the footer.** Not a
page with animations on it — a single continuous thing you move through.

---

## What I rejected first, and why it mattered

I started where everyone starts: three layout concepts. Split hero, bento
grid, terminal-styled sections. All three were competent and all three were
**generic** — they would have worked for a designer, a founder, or a
dentist. Nothing about them said *systems*.

That failure was useful, because it told me the problem was being solved at
the wrong level. I was picking a layout before picking an **idea**. The
right question was not "what arrangement of boxes?" but:

> What does this kind of engineer actually look at all day, and what would
> make one of them stop scrolling?

The second attempt over-corrected: an abstract topology of the estate,
nodes and flows, "the living system." Also wrong, and wrong in a more
interesting way — the abstraction had no referent. A viewer had to be told
what the shapes meant before they meant anything. Abstraction is a cost you
pay up front and it only pays back if the thing being abstracted is already
familiar.

**The fix was to go the other way: use a real object.**

---

## Why a server rack

I considered an oil pipeline — it has flow, pressure, valves, good
metaphorical range for a delivery pipeline. I rejected it for one reason:
**audience fit.** My readers are IT people. A rack is not a metaphor to
them, it is furniture. They can read a rack unit, a patch panel, a NIC port
and a cable run without a legend, and they will notice immediately if any of
it is wrong.

That cuts both ways, and accepting the second half is the whole point:

- **Upside:** zero explanation cost. The object carries the meaning.
- **Cost:** it has to be *right*. Ports where ports go, cables routed the
  way cables route, fans not overlapping the NIC column. An audience that
  reads racks fluently also spots a fake rack instantly.

Most of the iteration in this project went into paying that cost.

### Mapping the CV onto the object

The rack is not decoration with a CV bolted on. The CV **is** the rack:

| Rack element | Content |
|---|---|
| Patch panel (1U, top) | Skills — the things that connect everything else |
| Server, one per unit | One employer each, five in total |
| KVM tray, mid-rack | Writing |
| Lower units | Credentials, contact |

Five jobs, five servers. Faceplate labels are short by necessity —
`ABYRES`, `SOPRANO`, `AERODYNE`, `SYNAPSE`, `AXRAIL` — because a real
faceplate label is short.

One ordering decision worth stating: **writing sits before experience.**
Employment history is the expected thing and it is on the résumé anyway.
What I have actually built and understood is the more interesting claim, so
it gets the earlier position.

---

## The visual language

**Blueprint and wireframe, with a Jarvis-coded HUD over it.** Two rules
follow from that, and both were enforced against my own instinct to make it
prettier.

### No shading, no gradients on surfaces

The rack is drawn as **orthogonal line art**. Edges, not surfaces. Bodies
can be opaque — they have to be, or you see straight through the rack into
its own back panel — but they are never shaded, never lit, never
gradient-filled. A blueprint describes an object without pretending to
photograph it, and the moment a surface picks up a specular highlight the
whole thing becomes a render of a rack instead of a drawing of one.

There is one technical consequence worth recording: line-art bodies must
not write depth unless they are genuinely opaque. Getting that wrong hid the
KVM keyboard and the server interiors behind their own faces.

### One accent hue, and colour reserved for meaning

The entire interface runs on a single cyan (`#22D3EE`) against a deep blue
ground (`#04101c`). Not because monochrome is fashionable — because if
everything is coloured, colour cannot mean anything.

So colour is spent, not decorated with. There is exactly **one** other hue
in the scene: network yellow (`#fbbf24`) on the patch cabling. It is the
only thing that is not structure, so it is the only thing that gets a
different colour.

### Shapes, not colours, for encoding

Packet streams and their patch-panel ports are identified by **circle,
triangle, square** — not by colour. Three reasons, in order of how much they
mattered:

1. Adding hues would have broken the rule above.
2. Shape survives colour-blindness; hue-coded categories do not.
3. The marker can then appear in two places — on the moving packet and as a
   label at the port — and read as the same thing without a legend.

---

## Interaction: the camera is the navigation

Scroll position drives a camera around a fixed object. Each of the ten
sections owns a camera shot — azimuth, radius, height, look-at — so arriving
at "skills" means orbiting behind the rack to where the patch panel
actually is.

Nothing slides in from the bottom. When the camera settles on a section, an
**indicator line is drawn from the object to a point in empty space**, and
the description panel renders at the end of it, as if the interface were
annotating the hardware. It is a sci-fi HUD convention, and it does real
work: it tells you *which part of the object you are being told about*.
A panel that merely appears has no referent.

A radial menu sits at the left edge, numbered only. It enlarges on hover —
on hover of the menu itself, not of a hit region near it, which was an
earlier version and felt broken.

### Instruments, and being honest about them

Console widgets, log streams, and charts — heatmap, honeycomb, gauges, bar,
line — populate the empty regions: pipeline runs, firewall logs, application
logs, an AI transcript. They exist because this is what the work looks like:
several screens of moving telemetry, most of it ignorable.

Every one of them is **labelled `SIM`**. The data is generated. Unlabelled
fake telemetry on an infrastructure engineer's portfolio would be the exact
failure mode the blog is about — a display that reports something it does
not know.

### Layout as a constraint problem

Two rules, both of which required real work rather than taste:

- Widgets and ghost logs may only occupy the **free region for the current
  camera angle**. The rack's silhouette changes as the camera orbits, so the
  keep-out area is computed from its projected hull, not guessed.
- **Ghost logs never overlap each other.** Positions are randomised per
  reload, then rejected and re-rolled on collision.

Three console widgets at a time, not more. The first version showed
everything at once and read as noise.

---

## The cabling, which took the longest

Cabling is where "IT people will notice" turned into actual engineering.

The first version was 32 individual traces with sawtooth routing. It looked
like a mess because it *was* a mess. What replaced it:

- **Six buses**, not thirty-two traces. A rack has a handful of runs, not a
  spaghetti of them.
- **One conductor per link.** An earlier attempt drew each bus as a channel
  of parallel lines, which read as a ribbon cable and implied something
  untrue.
- **Real routing:** patch panel → down the side cable manager → back in to
  the NIC. Not straight across the front, which no one does, because you
  could not slide a server out.
- **Every NIC in one vertical column** (`x = 3.28`), sitting between the
  grille and the rear ports — because in a real rack the same port is in the
  same place on every identical server.
- **45° chamfers** on every bend. Right-angle turns read as PCB traces, and
  the aesthetic here is schematic, not silicon.

The property I actually wanted was **crossing-free by construction, not by
inspection.** Ordering the lanes by target depth and the exit heights
inversely guarantees no two runs cross, at any camera angle, without anyone
eyeballing a render. Verifying by looking is how you ship a diagram that is
wrong from one angle.

---

## Content is data

Everything textual lives in `src/_data/site.json` — identity, skills,
experience, credentials, and the ten section definitions with their camera
shots. Nothing is typed into a template.

This was a deliberate cost paid up front. A portfolio that is painful to
update does not get updated, and an out-of-date portfolio is worse than a
plain one. Changing jobs should be a JSON edit, not a hunt through a 3D
scene file.

The scene reads the same data: server faceplates come from
`experience[].plate`, so the 3D object and the text panels cannot disagree.

---

## The writing

The blog is not a feed. It is the evidence behind the claims the rack makes,
and it has its own rules:

- **Tutorials, not notes.** Each post builds one thing end to end, with real
  configs and real screenshots. Posts that could not meet that bar were
  deleted rather than padded into shape.
- **Diagrams are pre-rendered to SVG at build time** and committed. No
  CDN in the render path of my own writing, works with JavaScript off, and
  CI fails the build if a diagram would fall back to client-side rendering.
- **Diagrams carry shapes and short labels, not sentences.** If a box needs
  a paragraph in it, the diagram is doing the prose's job badly.
- **Troubleshooting tables name where you *see* a fault and where you *fix*
  it**, which in a pipeline are usually different machines.
- **Honest limits, every time.** Every post says what the thing does not do.

The recurring theme, which is also the estate's theme: **systems that report
success while being wrong.** A query returning empty strings instead of an
error. A label whose partial coverage silently filters 90% of the data. A
ruleset that is enabled, healthy, and structurally incapable of firing.

---

## What is deliberately unfinished

Stating this because a design document that only lists wins is marketing.

- **Mobile is untested below 1100px**, where instruments and the radial menu
  hide entirely. The scroll-driven camera is the core idea and it does not
  obviously survive a phone.
- **Draw calls sit around 500 per frame.** Instancing the repeated geometry
  would roughly halve it. Fine on a desktop GPU, unmeasured on anything
  thermally limited.
- **Debug switches are still in the build** (`?p=`, `cam`, `hinge`, `seed`,
  `nomove`, `hudlog`, `perf`, `bus`, `nopanel`).
- **Reduced-motion is not handled** in the scene. For a site whose entire
  premise is motion, that needs a real answer rather than a media query.

---

## Credit where it is due

The implementation was done with AI assistance — the Three.js scene, the
Eleventy build, the CSS. The design direction, the rejections, the metaphor,
the encoding rules, the layout constraints and every "no, not like that" in
the iteration were mine. This document exists so that distinction is on the
record rather than assumed in either direction.
