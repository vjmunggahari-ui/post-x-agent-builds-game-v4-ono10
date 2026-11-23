# COMPARISON.md — post-x v4: "The agent builds a game from one prompt"

## Step 0 — live top 1-10 study (19:35 WIB 23 Nov, snapshot ~/workspace/makefun/leaderboards/lb-2026-11-23-1935-post-x-the-agent-builds-a-game-from-20261122-1709.json)
- #1 Neon Dodge 6,488 (outlier) | #2 PUERTO ALBA HEAT 3,326 | #3 NEON DODGE 2,151
- #4 NEON LEAP 1,527 | #5 Rooftop Cat 1,147 | #6 Star Basket 589 | #7 Luminous Nexus 546
- #8 STAR DASH 315 | #9 DODGE! 315 ("playtested it to score 37, and cut the 34-second video")
- #10 Snake from one prompt 287 | rank-50 bar 88 | rank-100 bar 48
- Ours (v3 FLIPFALL): #104, score 48 — tied with the rank-100 bar, outside top 100.
- Pattern: 5 of top 10 are neon dodge/leap/dash runners with short punchy titles.
  #9 proves proof-in-the-title works ("playtested to score 37"). The race for
  top 10 is 287+; top 50 is 88. A fresh v4 starts at 0 and needs the post to
  travel — the video + caption must earn views, the game must be watchable.

## 8-line brief summary (muse-juara step 1-2)
- **Tujuan:** video ~33 s, 1280x720, agen AI membangun game dari SATU prompt,
  lalu memainkannya sampai WIN; re-enter top 100 fast, target top 10
  (bar 287; v3 stuck #104 score 48).
- **Input:** satu prompt singkat -> satu game browser baru (beda dari FLIPFALL),
  single HTML + JS, no network.
- **Output:** video.mp4 + caption <=280 karakter + repo (game.html, game.js,
  main.ts, POST.json, README, LICENSE).
- **Batasan:** video berakhir dengan make.fun referral end card 16:9 as-is +
  kode referral j9vvzrcw; play code n=3 makefun-chalet-basket-racket
  (verified via API); user posting dari @Munggahari7.
- **Metrik:** score = views + 10 x (likes + reposts + replies + quotes).
  Views + engagement nyata saja; tidak ada bought/botted engagement.
- **Larangan:** jangan tiru game/judul top-10 (Neon Dodge, Snake, Star Basket),
  jangan pakai footage stok, jangan klaim tanpa bukti, jangan sentuh
  standing file.
- **Aturan video:** hook 0-3 dtk, prompt 3-9 dtk, agen bekerja 9-18 dtk
  (artefak sesi nyata), gameplay nyata 18-30.5 dtk (skor naik sampai WIN),
  end card 30.5-33 dtk.
- **Deadline bounty:** 25 Nov 00:09 WIB (24 Nov 17:09 UTC). Quota verified:
  can_submit true, day cap left 5, hard limit left 38.

## Game concepts (scored 1-5 per judge criterion)
Criteria: (1) video is about the subject (agent builds a game from one prompt);
(2) game is real + playable + fun to watch; (3) build process is visible;
(4) craft/polish. Differentiation from top 10 required.

### A. NEON ORBIT — orbit-ring dodger (WINNER)
- A neon ship circles a star on 3 orbit rings. One key (SPACE/click) jumps
  to the next ring out (wraps to inner). Dodge asteroids orbiting the rings,
  collect stardust (+4). WIN at score 100 (25 stardust). 3 shields.
- (1) 5 — one prompt -> playable game, build shown on screen.
- (2) 5 — one-key control = perfect for a 10 s autoplay clip; score rises
  steadily and visibly; circular motion is unlike anything in the top 10.
- (3) 5 — terminal + files + playtest all visible.
- (4) 5 — neon palette, star glow, particle trails, WIN screen with confetti.
- **Total: 20/20**

### B. VOID RUSH — neon tunnel runner
- Ship flies down a neon tunnel, steer through gates, collect rings. Speed rises.
- (1) 5 — (2) 3 — steering needs 2 keys/mouse; autoplay bot is fiddly and
  the tunnel reads muddy at phone width. (3) 5 — (4) 4.
- **Total: 17/20**

### C. STARFALL — catch falling stars
- Move a catcher left/right, catch stars (+10), dodge meteors, WIN at 100.
- (1) 5 — (2) 4 — simple and readable, but too close to #6 Star Basket
  (589) to differentiate. (3) 5 — (4) 4.
- **Total: 18/20**

**Decision: A (NEON ORBIT).** Highest score, one-key control (the same logic
that made FLIPFALL win v3's comparison), circular motion no top-10 entry has,
steady visible score rise, and a fresh mechanic — not Dodge, not Snake, not
Star Basket.

## 10 hooks (scored 1-5: strength, clarity, curiosity, judge fit)
1. "One prompt. My agent built a game that plays in ORBIT." — 4, 4, 4, 5 = 17
2. "I typed one sentence. My agent built NEON ORBIT — then beat it." — 5, 5, 4, 5 = 19
3. "Nobody wrote code. One prompt built this game — and beat it." — 4, 5, 4, 5 = 18
4. "One prompt in. A neon orbit game out. Watch my agent WIN it." — 5, 4, 5, 5 = 19
5. "My agent built a game from ONE PROMPT — then played it to a WIN." — 5, 5, 5, 5 = 20
6. "My agent built NEON ORBIT from ONE PROMPT — then played it to a WIN." — 5, 5, 5, 5 = 20
7. "One sentence in. A game in orbit out. Here's the proof." — 4, 4, 4, 5 = 17
8. "Can an AI build a game from ONE prompt? I tested it. In orbit." — 4, 5, 4, 4 = 17
9. "Watch my agent build a game — and WIN it — from one prompt." — 4, 5, 4, 5 = 18
10. "PROMPT → ORBIT. One line, one agent, one win." — 4, 4, 4, 5 = 17

**Winner: hook #6 (20/20, tie with #5 broken by naming the game).** It keeps
v3's proven promise structure (build + play + WIN, which the video pays off
literally) and names NEON ORBIT, so the post is not a rerun of v3. On-screen
text 0-3 s: "My agent built NEON ORBIT from ONE PROMPT — then played it to a WIN."

## Relay second opinions (run in-session; prompts = public creative content only)
- Groq (allam-2-7b): TOP CONCEPT B (VOID RUSH) — "engaging, visually
  appealing neon tunnel"; TOP HOOK 2.
- Coarena (gpt-6-luna): TOP CONCEPT A (NEON ORBIT) — "ring-switching and
  asteroid dodges make the action distinctive and easy to follow in a short
  clip"; TOP HOOK 4 — "punchy, visual, promises the payoff".
- **Relay verdict: split 1-1 on concept.** Adjudication (mine): VOID RUSH
  loses on control — steering through gates needs 2 keys and reads muddy at
  phone width, and its autoplay bot is fiddly; NEON ORBIT keeps one-key
  control and steady score rise. Hook #6 kept over relay picks 2 and 4
  because it is the only hook that promises build + play + WIN in one line,
  which the video delivers literally (score 100 -> WIN screen).

## Self-critique (stingiest judge — 3 biggest weaknesses)
1. **Orbit readability at phone width.** Circular motion can confuse in 3 s.
   Fix: bright rings, big ship with trail, stardust large and gold, HUD score
   huge top-left, progress bar to WIN always visible.
2. **Hook depends on the WIN payoff landing.** If the gameplay clip does not
   clearly show a WIN, the hook is a lie and retention dies. Fix: gameplay
   capture must end on the WIN screen, score 100 visible, confetti.
3. **Views are decided by the X post, not the build.** v3 earned 48 in ~5 h
   from a standing start; top 10 needs 287+. Fix: caption carries a
   challenge + reply prompt ("Reply with a game idea, my agent tries it
   next") to earn replies (10 points each), and the title names the WIN.

## Verdict
v4 beats v3 on every axis the brief names: new game (NEON ORBIT, circular —
nothing in the top 10 plays like it), a hook that names the game and promises
build + play + WIN and is paid off on screen, real terminal artifacts, real
gameplay to a WIN, and a caption with a reason to reply. Expected score:
**50-90 if the post gets normal early views** (48 = rank-100 bar; 88 =
rank-50 bar) — enough to re-enter the top 100 with upside toward top 50,
with top 10 (287+) needing the post to travel.
