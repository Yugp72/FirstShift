"""Generates the FirstShift launch film (HyperFrames) from one timing table.

Run: python build.py   -> writes index.html and compositions/*.html
Every time below is absolute film time in seconds unless a scene subtracts its offset.
"""
import json
import os
import random
import re
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(HERE, "compositions"), exist_ok=True)

INK, MUTED, GREY, BLUE, GREEN = "#1d1d1f", "#4d4d52", "#86868b", "#00479a", "#0f5222"
FONT = "Inter, system-ui, sans-serif"

# ---------- timing ----------
ACT1, PROD, CLOSE, END = 0.0, 29.3, 75.0, 89.0


def dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                          os.path.join(HERE, path)], capture_output=True, text=True).stdout
    return round(float(out), 3)


# id, start, caption text (None = no caption), lang
VO = [
    ("v01", 1.5, "In Palo Alto, 42% of us speak a language other than English at home.", "en"),
    ("v02", 6.8, "Across Santa Clara County, it's more than half.", "en"),
    ("v03", 10.2, "In America's restaurants, nearly half of all chefs do too.", "en"),
    ("v04", 14.6, "And one in six people worldwide lives with a significant disability.", "en"),
    ("v05", 19.9, "Yet most restaurants still train everyone the same way.", "en"),
    ("v06", 23.0, None, "en"),  # "One language. One format. One quiz." is already on screen as type
    ("v07", 29.6, "Meet FirstShift. From first hello, to first shift.", "en"),
    ("v08", 33.4, "A manager describes the job once. FirstShift writes every post, in four languages.", "en"),
    ("v09", 39.4, "Each hire chooses their language, and how they learn best.", "en"),
    ("vzh", 42.9, "用你的语言学习。", "zh"),
    ("ves", 45.1, "Aprende en tu idioma.", "es"),
    ("v10", 46.8, "Watch with captions. Follow the pictures. Listen. Or read, with all the time they need.", "en"),
    ("v11", 53.2, "After every answer, one more question. How sure are you?", "en"),
    ("v12", 57.2, "So managers see what a score can't.", "en"),
    ("v13", 59.3, "Mei scored a hundred, but feels unsure. So she gets a buddy shift.", "en"),
    ("v14", 64.3, "Jorge feels confident, but missed the allergy check. It's caught before a guest is.", "en"),
    ("v15", 69.6, "Approved, with evidence. And the news lands on her phone, in her language.", "en"),
    ("v16", 75.4, "Around 7,000 languages are in use worldwide. FirstShift speaks four today, and it's built to add the next.", "en"),
    ("v17", 83.2, "FirstShift. From first hello, to first shift.", "en"),
]
VO = [(i, s, t, l, dur(f"assets/vo/{i}.wav")) for i, s, t, l in VO]
for (a, s1, _, _, d1), (b, s2, _, _, _) in zip(VO, VO[1:]):
    assert s1 + d1 <= s2 + 0.01, f"{a} overlaps {b}"

SFX = [  # file, start, volume
    ("whoosh-short", 1.45, 0.35), ("pop", 3.7, 0.25), ("pop", 8.05, 0.25), ("whoosh-short", 10.1, 0.3),
    ("pop", 11.55, 0.25), ("pop", 15.35, 0.25), ("click-soft", 23.0, 0.35), ("click-soft", 23.85, 0.35),
    ("click-soft", 24.87, 0.35), ("whoosh", 28.75, 0.4), ("click-soft", 33.7, 0.5), ("whoosh-short", 39.3, 0.3),
    ("click-soft", 41.4, 0.5), ("click-soft", 44.0, 0.5), ("click-soft", 44.5, 0.5), ("click-soft", 53.6, 0.5),
    ("whoosh-short", 56.95, 0.3), ("click-soft", 69.7, 0.5), ("pop", 72.3, 0.35), ("whoosh", 74.6, 0.35),
    ("pop", 79.0, 0.25), ("whoosh-short", 82.5, 0.3),
]


# ---------- helpers ----------
def scene(cid, body, css, js):
    return f"""<template>
  <style>
    #root {{ position: absolute; inset: 0; background: #ffffff; font-family: {FONT}; color: {INK}; overflow: hidden; }}
    #root * {{ box-sizing: border-box; }}
{css}
  </style>
  <div id="root" data-composition-id="{cid}" data-width="1920" data-height="1080">
{body}
  </div>
  <script>
    (() => {{
    const root = document.querySelector('[data-composition-id="{cid}"]');
    const $ = (s) => root.querySelector(s);
    const $$ = (s) => Array.from(root.querySelectorAll(s));
    const tl = gsap.timeline({{ paused: true }});
    const IN = (el, t, d = 0.2) => tl.fromTo(el, {{ opacity: 0, filter: "blur(8px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: d, ease: "power4.out" }}, t);
    const OUT = (el, t, d = 0.18) => tl.to(el, {{ opacity: 0, filter: "blur(8px)", duration: d, ease: "power2.in" }}, t);
    const COUNT = (el, from, to, t, d, dec, suffix) => {{ const o = {{ v: from }}; tl.fromTo(o, {{ v: from }}, {{ v: to, duration: d, ease: "expo.out",
      onUpdate: () => {{ el.textContent = o.v.toFixed(dec) + suffix; }} }}, t); }};
{js}
    window.__timelines["{cid}"] = tl;
    }})();
  </script>
</template>
"""


LOGO_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path class="chk" d="M5 12.5l4.5 4.5L19 7.5" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0"/></svg>'
PERSON_SVG = '<svg viewBox="0 0 60 110"><circle cx="30" cy="18" r="16"/><path d="M6 108 V58 a24 24 0 0 1 48 0 V108 z"/></svg>'

# ---------- ACT 1: the problem (0 – 29.3) ----------
rng = random.Random(7)
order = list(range(100)); rng.shuffle(order)
rank = {d: r for r, d in enumerate(order)}
GX, GY = 560, 500  # grid centre
dots = []
for i in range(100):
    r, c = divmod(i, 10)
    x, y = GX + (c - 4.5) * 46, GY + (r - 4.5) * 46
    kr, kc = divmod(i, 20)  # kitchen line: 5 rows x 20
    kx, ky = GX + (kc - 9.5) * 30, GY + (kr - 2) * 46
    dots.append((i, x, y, kx, ky))
dot_html = "\n".join(f'      <i class="dot" data-r="{rank[i]}" data-kx="{kx - x:.1f}" data-ky="{ky - y:.1f}" style="left:{x - 11:.1f}px;top:{y - 11:.1f}px"></i>' for i, x, y, kx, ky in dots)
people_html = "\n".join(f'      <div class="person" id="p{k}" style="left:{GX - 5 * 70 + k * 140 - 40:.0f}px">{PERSON_SVG}</div>' for k in range(6))
LANG_WORDS = ["中文", "Español", "Tiếng Việt", "Tagalog", "हिन्दी", "한국어", "粵語", "Русский"]

act1_css = f"""
    .grid {{ position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }}
    .dot {{ position: absolute; width: 22px; height: 22px; border-radius: 50%; background: {GREY}; opacity: 0; }}
    .ring {{ position: absolute; left: {GX - 300}px; top: {GY - 300}px; width: 600px; height: 600px; border-radius: 50%; border: 2px solid #d2d2d7; opacity: 0; }}
    .stat {{ position: absolute; left: 1010px; width: 800px; }}
    .loc {{ top: 250px; font-size: 34px; font-weight: 700; color: {MUTED}; }}
    .num {{ top: 290px; font-size: 230px; font-weight: 900; letter-spacing: -0.05em; line-height: 1; color: {INK}; }}
    .num b {{ color: {BLUE}; font-weight: 900; }}
    .cap {{ top: 540px; font-size: 44px; font-weight: 700; line-height: 1.15; letter-spacing: -0.02em; }}
    .sub {{ top: 680px; font-size: 32px; font-weight: 700; color: {MUTED}; }}
    .src {{ top: 760px; font-size: 28px; font-weight: 400; color: {MUTED}; }}
    .words {{ position: absolute; left: {GX - 300}px; width: 600px; top: 780px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 22px; font-size: 26px; color: {MUTED}; }}
    .words span {{ opacity: 0; }}
    .person {{ position: absolute; top: {GY - 75}px; width: 80px; height: 150px; opacity: 0; }}
    .person svg {{ width: 100%; height: 100%; fill: {GREY}; }}
    .same {{ position: absolute; left: 0; width: 1920px; text-align: center; font-size: 84px; font-weight: 900; letter-spacing: -0.04em; opacity: 0; }}
    .q {{ position: absolute; left: 0; top: 400px; width: 1920px; text-align: center; font-size: 80px; font-weight: 900; letter-spacing: -0.035em; line-height: 1.12; opacity: 0; }}
    .q em {{ font-style: normal; color: {BLUE}; }}
    .seed {{ position: absolute; left: 880px; top: 460px; width: 160px; height: 160px; border-radius: 80px; background: {GREY}; opacity: 0; }}
    .seed svg {{ position: absolute; inset: 22px; width: 116px; height: 116px; }}
"""
act1_body = f"""
    <div class="grid" id="a1-grid">
      <div class="ring" id="a1-ring1"></div><div class="ring" id="a1-ring2"></div>
{dot_html}
    </div>
    <div class="words" id="a1-words">{''.join(f'<span>{w}</span>' for w in LANG_WORDS)}</div>
    <div class="stat loc" id="a1-loc1">Palo Alto, California</div>
    <div class="stat loc" id="a1-loc2">Santa Clara County, California</div>
    <div class="stat num" id="a1-num1">0.0%</div>
    <div class="stat cap" id="a1-cap1">speak a language other than English at home</div>
    <div class="stat src" id="a1-src1">U.S. Census Bureau, QuickFacts · ACS 2020–2024 · residents age 5+</div>
    <div class="stat loc" id="a1-loc3">U.S. restaurant workforce</div>
    <div class="stat num" id="a1-num3">0%</div>
    <div class="stat cap" id="a1-cap3">of restaurant chefs speak a language other than English at home</div>
    <div class="stat sub" id="a1-sub3">39% of cooks · 30% of all restaurant staff</div>
    <div class="stat src" id="a1-src3" style="top:740px">National Restaurant Association · Restaurant Employee Demographics, March 2026</div>
{people_html}
    <div class="stat loc" id="a1-loc4">Worldwide</div>
    <div class="stat num" id="a1-num4">1 in 6</div>
    <div class="stat cap" id="a1-cap4">people live with a significant disability</div>
    <div class="stat sub" id="a1-sub4">2.2 billion people have a vision impairment</div>
    <div class="stat src" id="a1-src4">World Health Organization · 2023, 2026</div>
    <div class="same" id="a1-s1" style="top:660px">One language.</div>
    <div class="same" id="a1-s2" style="top:760px">One format.</div>
    <div class="same" id="a1-s3" style="top:860px">One quiz.</div>
    <div class="q" id="a1-q" data-hold="deliberate silent beat">What if training asked <em>how you learn</em><br/>— not what limits you?</div>
    <div class="seed" id="a1-seed">{LOGO_SVG}</div>
"""
act1_js = f"""
    const dots = $$('.dot').sort((a, b) => a.dataset.r - b.dataset.r);
    const first = dots[0];
    // B1 (0–1.5): one person, alone. Then the camera pulls back to a hundred.
    const fx = parseFloat(first.style.left) + 11, fy = parseFloat(first.style.top) + 11;
    tl.fromTo('#a1-grid', {{ scale: 3.2, x: 960 - fx, y: 540 - fy, transformOrigin: `${{fx}}px ${{fy}}px` }}, {{ scale: 1, x: 0, y: 0, duration: 1.1, ease: "power2.inOut" }}, 1.4);
    tl.set(first, {{ opacity: 1 }}, 0);
    tl.fromTo(dots.slice(1), {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3, stagger: 0.006, ease: "power2.out" }}, 1.6);
    // B2 (1.5–6.6): Palo Alto 42.3%
    IN('#a1-loc1', 2.45); COUNT($('#a1-num1'), 0, 42.3, 2.55, 1.2, 1, '%'); IN('#a1-num1', 2.55, 0.15);
    tl.fromTo(dots.slice(0, 42), {{ backgroundColor: "{GREY}" }}, {{ backgroundColor: "{BLUE}", duration: 0.25, stagger: 0.02 }}, 2.55);
    IN('#a1-cap1', 2.9); IN('#a1-src1', 3.3);
    tl.fromTo('#a1-words span', {{ opacity: 0, y: 10 }}, {{ opacity: 1, y: 0, duration: 0.35, stagger: 0.12, ease: "power3.out" }}, 3.6);
    // B3 (6.6–10): zoom out to the county, 55.2%
    OUT('#a1-loc1', 6.6, 0.15); IN('#a1-loc2', 6.8);
    tl.fromTo(['#a1-ring1', '#a1-ring2'], {{ scale: 0.3, opacity: 0.7 }}, {{ scale: 1.8, opacity: 0, duration: 1.6, stagger: 0.35, ease: "power2.out", immediateRender: false }}, 6.6);
    COUNT($('#a1-num1'), 42.3, 55.2, 6.9, 1.2, 1, '%');
    tl.fromTo(dots.slice(42, 55), {{ backgroundColor: "{GREY}" }}, {{ backgroundColor: "{BLUE}", immediateRender: false, duration: 0.25, stagger: 0.05 }}, 6.9);
    // B4 (10–14.4): America's restaurant kitchens, 46% of chefs
    ['#a1-loc2', '#a1-num1', '#a1-cap1', '#a1-src1', '#a1-words'].forEach((s) => OUT(s, 10.0));
    tl.to(dots, {{ backgroundColor: "{GREY}", duration: 0.3 }}, 10.0);
    tl.to(dots, {{ x: (i, el) => +el.dataset.kx, y: (i, el) => +el.dataset.ky, duration: 0.8, ease: "power2.inOut", stagger: 0.003 }}, 10.15);
    IN('#a1-loc3', 10.4); IN('#a1-num3', 10.6, 0.15); COUNT($('#a1-num3'), 0, 46, 10.6, 1.0, 0, '%');
    tl.to(dots.slice(0, 46), {{ backgroundColor: "{BLUE}", duration: 0.25, stagger: 0.015 }}, 10.9);
    IN('#a1-cap3', 10.9); IN('#a1-src3', 11.4); IN('#a1-sub3', 12.0);
    // B5 (14.4–19.6): one in six
    ['#a1-loc3', '#a1-num3', '#a1-cap3', '#a1-sub3', '#a1-src3'].forEach((s) => OUT(s, 14.3));
    tl.to(dots, {{ scale: 0, opacity: 0, duration: 0.3, stagger: 0.003, ease: "power3.in" }}, 14.3);
    tl.fromTo('.person', {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "expo.out" }}, 14.6);
    IN('#a1-loc4', 15.0); IN('#a1-num4', 15.3);
    tl.fromTo('#p2 svg', {{ fill: "{GREY}" }}, {{ fill: "{BLUE}", duration: 0.35, ease: "power2.out" }}, 15.6);
    IN('#a1-cap4', 15.8); IN('#a1-src4', 16.3); IN('#a1-sub4', 17.2);
    // B6 (19.6–25.8): the same way for everyone
    ['#a1-loc4', '#a1-num4', '#a1-cap4', '#a1-sub4', '#a1-src4'].forEach((s) => OUT(s, 19.6));
    tl.to('#p2 svg', {{ fill: "{GREY}", duration: 0.6 }}, 19.9);
    tl.to('.person', {{ x: {960 - GX}, duration: 0.9, ease: "power2.inOut" }}, 20.0);
    IN('#a1-s1', 23.0, 0.15); IN('#a1-s2', 23.85, 0.15); IN('#a1-s3', 24.87, 0.15);
    // B7 (25.9–28.6): silence, and the question
    ['.person', '#a1-s1', '#a1-s2', '#a1-s3'].forEach((s) => OUT(s, 25.7, 0.2));
    tl.fromTo('#a1-q', {{ opacity: 0, filter: "blur(10px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.45, ease: "power2.out" }}, 25.9);
    OUT('#a1-q', 28.62, 0.15);
    // B8 (28.6–29.3): one dot again, and it becomes FirstShift
    tl.fromTo('#a1-seed', {{ opacity: 0, scale: 0.1375 }}, {{ opacity: 1, duration: 0.08 }}, 28.74);
    tl.to('#a1-seed', {{ scale: 1, borderRadius: 36, backgroundColor: "{BLUE}", duration: 0.42, ease: "expo.out" }}, 28.8);
    tl.fromTo('#a1-seed .chk', {{ strokeDashoffset: 1 }}, {{ strokeDashoffset: 0, duration: 0.22, ease: "power2.out" }}, 29.0);
"""

# ---------- ACT 2: the product (29.3 – 75.0) ----------
S0 = 0.8444  # 1440x900 recording -> 1216x760 laptop screen
P0 = 0.98    # 390x844 recording -> 382x827 phone screen
LAPTOP_CLIPS = [  # id, file, abs start, media start, rate, duration
    ("posts", "posts", 33.4, 5.0, 1.0, 6.0),
    ("pass", "passport", 57.0, 5.0, 0.9, 11.26),
    ("appr", "approve", 68.3, 5.6, 1.0, 3.4),
]
PHONE_CLIPS = [
    ("setup", "setup", 39.4, 4.0, 1.0, 7.1),
    ("lesson", "lesson", 46.5, 6.62, 1.6, 6.2),
    ("quiz", "quiz", 52.7, 8.1, 1.0, 4.3),
    ("seal", "seal", 71.7, 2.4, 1.0, 3.3),
]


def vids(clips, w, h):
    out = []
    for cid, f, s, ms, rate, d in clips:
        out.append(f'''        <div class="zoom" id="z-{cid}" style="width:{w}px;height:{h}px">
          <video id="v-{cid}" class="clip" src="assets/rec/{f}.mp4" data-start="{s - PROD:.2f}" data-duration="{d:.2f}" data-media-start="{ms}" data-playback-rate="{rate}" data-track-index="2" muted playsinline style="width:{w}px;height:{h}px"></video>
        </div>''')
    return "\n".join(out)


# headlines: id, text, abs in, abs out, side ("L" = left column for laptop shots, "R" = right column for phone shots)
HL = [
    ("h-once", "Write the job once.", 33.6, 39.1, "L", ""),
    ("h-every", "Every channel.<br/>Four languages.", 35.4, 39.1, "L2", ""),
    ("h-lang", "Their language.", 39.8, 46.4, "R", ""),
    ("h-chips", "English · 中文 · 粵語 · Español", 40.4, 46.4, "R2", "chips"),
    ("h-way", "Their way to learn.", 43.9, 46.4, "R3", ""),
    ("h-watch", "Watch with captions.", 46.8, 48.2, "R", ""),
    ("h-pics", "Follow the pictures.", 48.3, 49.7, "R", ""),
    ("h-listen", "Listen.", 49.8, 50.9, "R", ""),
    ("h-read", "Or read.<br/>No timer.", 51.0, 52.6, "R", ""),
    ("h-one", "One more question:", 53.3, 56.8, "R", ""),
    ("h-sure", "How sure are you?", 55.2, 56.8, "R2", "accent"),
    ("h-ready", "Readiness,<br/>not just a score.", 57.4, 59.2, "L", ""),
    ("h-mei", "Scored 100%.<br/>Feels unsure.", 59.4, 63.0, "L", ""),
    ("h-mei2", "→ Buddy shift", 61.6, 63.0, "L3", "flag"),
    ("h-jorge", "Feels confident.<br/>Missed the allergy check.", 64.4, 68.1, "L", ""),
    ("h-jorge2", "→ Double-check", 66.2, 68.1, "L3", "flag"),
    ("h-appr", "Approved<br/>with evidence.", 69.6, 71.5, "L", ""),
    ("h-seal", "Shift-ready.<br/>In her language.", 72.2, 74.5, "R", ""),
    ("h-sealw", "可以上班 · 可以返工 · Listo · Ready", 72.8, 74.5, "R2", "chips"),
]
POS = {"L": (110, 330), "L2": (110, 520), "L3": (110, 660), "R": (860, 330), "R2": (860, 520), "R3": (860, 610)}
hl_html = "\n".join(f'    <div class="hl {cls} {"left" if side.startswith("L") else ""}" id="{i}"style="left:{POS[side][0]}px;top:{POS[side][1]}px">{t}</div>' for i, t, a, b, side, cls in HL)
hl_js = "\n".join(f"    IN('#{i}', {a - PROD:.2f}); OUT('#{i}', {b - PROD:.2f});" for i, t, a, b, side, cls in HL)

prod_css = f"""
    .lockup {{ position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }}
    .logo {{ position: absolute; left: 880px; top: 460px; width: 160px; height: 160px; border-radius: 36px; background: {BLUE}; }}
    .logo svg {{ position: absolute; inset: 22px; width: 116px; height: 116px; }}
    .word {{ position: absolute; left: 1070px; top: 468px; font-size: 128px; font-weight: 900; letter-spacing: -0.045em; line-height: 1; clip-path: inset(0 100% 0 0); }}
    .tag {{ position: absolute; left: 0; top: 690px; width: 1920px; text-align: center; font-size: 52px; font-weight: 700; letter-spacing: -0.02em; color: {MUTED}; opacity: 0; }}
    .laptop {{ position: absolute; left: 594px; top: 120px; width: 1276px; height: 820px; opacity: 0; }}
    .laptop .bezel {{ position: absolute; left: 0; top: 0; width: 1276px; height: 790px; border-radius: 26px; background: #1d1d1f; box-shadow: 0 40px 80px rgba(0,0,0,0.18); }}
    .laptop .screen {{ position: absolute; left: 15px; top: 15px; width: 1216px; height: 760px; border-radius: 12px; overflow: hidden; background: #fff; }}
    .laptop .base {{ position: absolute; left: -60px; top: 790px; width: 1396px; height: 22px; border-radius: 0 0 22px 22px; background: linear-gradient(#d2d2d7, #b8b8bd); }}
    .phone {{ position: absolute; left: 300px; top: 70px; width: 410px; height: 855px; opacity: 0; }}
    .phone .bezel {{ position: absolute; inset: 0; border-radius: 58px; background: #1d1d1f; box-shadow: 0 40px 80px rgba(0,0,0,0.18); }}
    .phone .screen {{ position: absolute; left: 14px; top: 14px; width: 382px; height: 827px; border-radius: 46px; overflow: hidden; background: #fff; }}
    .zoom {{ position: absolute; left: 0; top: 0; }}
    .zoom video {{ display: block; }}
    .hl {{ position: absolute; width: 900px; font-size: 76px; font-weight: 900; letter-spacing: -0.04em; line-height: 1.05; opacity: 0; }}
    .hl.left {{ width: 460px; font-size: 62px; }}
    .hl.chips {{ font-size: 40px; font-weight: 700; letter-spacing: -0.01em; color: {MUTED}; }}
    .hl.accent {{ color: {BLUE}; }}
    .hl.flag {{ font-size: 44px; color: #8a3300; }}
    .demo {{ position: absolute; left: 1660px; top: 70px; font-size: 28px; color: {MUTED}; opacity: 0; }}
    .dotout {{ position: absolute; left: 949px; top: 529px; width: 22px; height: 22px; border-radius: 50%; background: {BLUE}; opacity: 0; }}
"""
prod_body = f"""
    <div class="lockup" id="p-lockup">
      <div class="logo" id="p-logo">{LOGO_SVG}</div>
      <div class="word" id="p-word">FirstShift</div>
      <div class="tag" id="p-tag">From first hello to first shift.</div>
    </div>
    <div class="laptop" id="p-laptop">
      <div class="bezel"></div><div class="base"></div>
      <div class="screen">
{vids(LAPTOP_CLIPS, 1440, 900)}
      </div>
    </div>
    <div class="phone" id="p-phone">
      <div class="bezel"></div>
      <div class="screen">
{vids(PHONE_CLIPS, 390, 844)}
      </div>
    </div>
{hl_html}
    <div class="demo" id="p-demo">In demo data</div>
    <div class="dotout" id="p-dot"></div>
"""


def rel(t):
    return f"{t - PROD:.2f}"


def punch(zid, px, py, k, t_in, t_out, s0):
    x, y = px * s0 * (1 - k), py * s0 * (1 - k)
    return (f"    tl.to('#{zid}', {{ scale: {s0 * k:.4f}, x: {x:.1f}, y: {y:.1f}, duration: 0.55, ease: 'power2.inOut' }}, {rel(t_in)});\n"
            f"    tl.to('#{zid}', {{ scale: {s0:.4f}, x: 0, y: 0, duration: 0.45, ease: 'power2.inOut' }}, {rel(t_out)});")


prod_js = f"""
    $$('#p-laptop .zoom').forEach((z) => tl.set(z, {{ scale: {S0}, transformOrigin: '0 0', x: 0, y: 0 }}, 0));
    $$('#p-phone .zoom').forEach((z) => tl.set(z, {{ scale: {P0}, transformOrigin: '0 0', x: 0, y: 0 }}, 0));
    // P0 (29.3–33.2): the lockup
    tl.fromTo('#p-logo', {{ x: 0 }}, {{ x: -375, duration: 0.6, ease: 'power3.inOut' }}, {rel(29.55)});
    tl.fromTo('#p-word', {{ x: 0, clipPath: 'inset(0 100% 0 0)' }}, {{ x: -375, clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'power3.inOut' }}, {rel(29.55)});
    tl.fromTo('#p-tag', {{ opacity: 0, filter: 'blur(8px)' }}, {{ opacity: 1, filter: 'blur(0px)', duration: 0.3, ease: 'power3.out' }}, {rel(30.85)});
    OUT('#p-lockup', {rel(32.85)}, 0.25);
    // devices: laptop 33.2–39.4, phone 39.4–57.0, laptop 57.0–71.7, phone 71.7–75.0
    const DEV_IN = (el, t) => tl.fromTo(el, {{ opacity: 0, y: 70, filter: 'blur(8px)' }}, {{ opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out', immediateRender: false }}, t);
    const DEV_OUT = (el, t) => tl.to(el, {{ opacity: 0, y: -40, filter: 'blur(8px)', duration: 0.25, ease: 'power3.in' }}, t);
    tl.set(['#p-laptop', '#p-phone'], {{ opacity: 0 }}, 0);
    DEV_IN('#p-laptop', {rel(33.05)}); DEV_OUT('#p-laptop', {rel(39.15)});
    DEV_IN('#p-phone', {rel(39.35)}); DEV_OUT('#p-phone', {rel(56.75)});
    DEV_IN('#p-laptop', {rel(57.0)}); DEV_OUT('#p-laptop', {rel(71.45)});
    DEV_IN('#p-phone', {rel(71.65)});
    // punch-ins on the real UI
{punch('z-posts', 900, 560, 1.3, 36.0, 39.0, S0)}
{punch('z-pass', 1170, 192, 1.9, 59.3, 62.7, S0)}
{punch('z-pass', 1170, 200, 1.9, 64.4, 67.9, S0)}
{punch('z-appr', 720, 450, 1.35, 70.0, 71.3, S0)}
    IN('#p-demo', {rel(57.4)}); OUT('#p-demo', {rel(68.1)});
{hl_js}
    // out: the phone becomes one blue dot, which the close picks up
    tl.to('#p-phone', {{ scale: 0.06, x: {960 - 505}, y: {540 - 497}, opacity: 0, duration: 0.45, ease: 'power3.in' }}, {rel(74.5)});
    tl.fromTo('#p-dot', {{ opacity: 0 }}, {{ opacity: 1, duration: 0.15 }}, {rel(74.82)});
"""

# ---------- ACT 3: the scale (75.0 – 89.0) ----------
rng2 = random.Random(11)
field = []
while len(field) < 140:
    x, y = rng2.uniform(140, 1780), rng2.uniform(110, 960)
    if abs(x - 960) < 560 and 300 < y < 760:
        continue
    field.append((x, y, rng2.uniform(8, 16)))
field_html = "\n".join(f'    <i class="fd" style="left:{x:.0f}px;top:{y:.0f}px;width:{s:.0f}px;height:{s:.0f}px"></i>' for x, y, s in field)
L4 = ["English", "中文", "粵語", "Español"]
four_html = "\n".join(f'    <div class="four" id="c-f{k}" style="left:{960 + (k - 1.5) * 220 - 90:.0f}px"><i></i><span>{w}</span></div>' for k, w in enumerate(L4))


def crel(t):
    return f"{t - CLOSE:.2f}"


close_css = f"""
    .fd {{ position: absolute; border-radius: 50%; background: #d2d2d7; opacity: 0; }}
    .big {{ position: absolute; left: 0; top: 330px; width: 1920px; text-align: center; font-size: 230px; font-weight: 900; letter-spacing: -0.05em; line-height: 1; opacity: 0; }}
    .ccap {{ position: absolute; left: 0; top: 590px; width: 1920px; text-align: center; font-size: 46px; font-weight: 700; letter-spacing: -0.02em; opacity: 0; }}
    .csrc {{ position: absolute; left: 0; top: 670px; width: 1920px; text-align: center; font-size: 28px; color: {MUTED}; opacity: 0; }}
    .four {{ position: absolute; top: 470px; width: 180px; text-align: center; opacity: 0; }}
    .four i {{ display: block; margin: 0 auto 18px; width: 34px; height: 34px; border-radius: 50%; background: {BLUE}; }}
    .four span {{ font-size: 40px; font-weight: 700; }}
    .live {{ position: absolute; left: 0; width: 1920px; text-align: center; font-weight: 900; letter-spacing: -0.04em; opacity: 0; }}
    .start {{ position: absolute; left: 949px; top: 529px; width: 22px; height: 22px; border-radius: 50%; background: {BLUE}; }}
    .elogo {{ position: absolute; left: 505px; top: 330px; width: 160px; height: 160px; border-radius: 36px; background: {BLUE}; opacity: 0; }}
    .elogo svg {{ position: absolute; inset: 22px; width: 116px; height: 116px; }}
    .eword {{ position: absolute; left: 695px; top: 338px; font-size: 128px; font-weight: 900; letter-spacing: -0.045em; line-height: 1; clip-path: inset(0 100% 0 0); }}
    .eline {{ position: absolute; left: 0; width: 1920px; text-align: center; opacity: 0; }}
"""
close_body = f"""
{field_html}
    <div class="start" id="c-start"></div>
    <div class="big" id="c-num">~0</div>
    <div class="ccap" id="c-cap">languages are in use worldwide, spoken or signed</div>
    <div class="csrc" id="c-src">UNESCO World Atlas of Languages</div>
{four_html}
    <div class="live" id="c-live1" style="top:640px;font-size:76px">4 live today.</div>
    <div class="live" id="c-live2" style="top:740px;font-size:56px;color:{MUTED}">Built to add the next.</div>
    <div class="elogo" id="c-logo">{LOGO_SVG}</div>
    <div class="eword" id="c-word">FirstShift</div>
    <div class="eline" id="c-l1" style="top:560px;font-size:64px;font-weight:900;letter-spacing:-0.035em">From first hello to first shift.</div>
    <div class="eline" id="c-l2" style="top:660px;font-size:40px;font-weight:700;color:{MUTED}">In your language. In the way you learn best.</div>
    <div class="eline" id="c-l3" style="top:860px;font-size:30px;color:{MUTED}">Built on Converge.AI Enter and Framia · All people shown are demo data</div>
"""
close_js = f"""
    // C1 (75–78.6): the world has ~7,000 languages
    tl.to('#c-start', {{ scale: 0, opacity: 0, duration: 0.3, ease: 'power3.in' }}, {crel(75.3)});
    tl.fromTo('.fd', {{ opacity: 0, scale: 0 }}, {{ opacity: 1, scale: 1, duration: 0.4, stagger: 0.01, ease: 'expo.out' }}, {crel(75.3)});
    IN('#c-num', {crel(75.5)}, 0.15); COUNT($('#c-num'), 0, 7000, {crel(75.5)}, 1.3, 0, '');
    tl.to({{}}, {{ duration: 0.01, onUpdate: () => {{}} }}, {crel(76.9)});
    IN('#c-cap', {crel(76.0)}); IN('#c-src', {crel(76.4)});
    ['#c-num', '#c-cap', '#c-src'].forEach((s) => OUT(s, {crel(78.55)}));
    // C2 (78.8–82.4): four live, built to add the next
    tl.fromTo('.four', {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.45, stagger: 0.12, ease: 'expo.out' }}, {crel(78.9)});
    IN('#c-live1', {crel(79.4)});
    tl.to('.fd', {{ backgroundColor: '#b9c6da', duration: 0.6, stagger: 0.004 }}, {crel(80.9)});
    IN('#c-live2', {crel(81.0)});
    ['.four', '#c-live1', '#c-live2', '.fd'].forEach((s) => OUT(s, {crel(82.45)}, 0.25));
    // C3 (82.7–89): end card
    tl.fromTo('#c-logo', {{ opacity: 0, scale: 0.14, borderRadius: 80, backgroundColor: '{BLUE}' }}, {{ opacity: 1, scale: 1, borderRadius: 36, duration: 0.6, ease: 'expo.out' }}, {crel(82.7)});
    tl.fromTo('#c-logo .chk', {{ strokeDashoffset: 1 }}, {{ strokeDashoffset: 0, duration: 0.3, ease: 'power2.out' }}, {crel(82.95)});
    tl.fromTo('#c-word', {{ clipPath: 'inset(0 100% 0 0)' }}, {{ clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'power3.inOut' }}, {crel(83.1)});
    IN('#c-l1', {crel(84.2)}, 0.3); IN('#c-l2', {crel(85.3)}, 0.3); IN('#c-l3', {crel(85.9)}, 0.3);
"""
close_js = close_js.replace("    tl.to({}, { duration: 0.01, onUpdate: () => {} }, " + crel(76.9) + ");\n", "")
# The ~7,000 counter needs the tilde and a thousands separator.
close_js = close_js.replace(
    "COUNT($('#c-num'), 0, 7000, " + crel(75.5) + ", 1.3, 0, '');",
    "{ const o = { v: 0 }; tl.fromTo(o, { v: 0 }, { v: 7000, duration: 1.3, ease: 'expo.out', onUpdate: () => { "
    "$('#c-num').textContent = '~' + (Math.round(o.v / 10) * 10).toLocaleString('en-US'); } }, " + crel(75.5) + "); }")
assert "toLocaleString" in close_js

# ---------- captions ----------
groups = []
for i, s, text, lang, d in VO:
    if not text:
        continue
    if lang == "zh":
        groups.append((s, s + d, text, lang)); continue
    parts = [p.strip() for p in re.split(r"(?<=[.,?])\s+", text) if p.strip()]
    chunks = []
    for p in parts:
        w = p.split()
        while len(w) > 6:
            cut = 5 if len(w) > 7 else 4
            chunks.append(" ".join(w[:cut])); w = w[cut:]
        chunks.append(" ".join(w))
    total = sum(len(c) for c in chunks)
    t = s
    for c in chunks:
        dd = d * len(c) / total
        groups.append((t, t + dd, c, lang)); t += dd
cap_html = []
for k, (a, b, c, lang) in enumerate(groups):
    a0 = max(a - 0.05, 0.1)
    cap_html.append(f'    <div class="cg clip" id="cg{k}" lang="{"zh-CN" if lang == "zh" else lang}" data-start="{a0:.2f}" data-duration="{b - a0 + 0.08:.2f}" data-track-index="0"><span>{c}</span></div>')
captions_css = f"""
    #root {{ background: transparent; }}
    .cg {{ position: absolute; left: 0; top: 958px; width: 1920px; text-align: center; overflow: visible; }}
    .cg span {{ display: inline-block; padding: 8px 22px; border-radius: 14px; background: rgba(29,29,31,0.86); color: #fff; font-size: 36px; font-weight: 700; letter-spacing: -0.01em; }}
"""
captions_js = "    $$('.cg span').forEach((s, k) => { const g = s.parentElement; const a = +g.dataset.start; tl.fromTo(s, { opacity: 0 }, { opacity: 1, duration: 0.1 }, a); });"

files = {
    "act1": scene("act1", act1_body, act1_css, act1_js),
    "product": scene("product", prod_body, prod_css, prod_js),
    "close": scene("close", close_body, close_css, close_js),
    "captions": scene("captions", "\n".join(cap_html), captions_css, captions_js),
}
for name, html in files.items():
    open(os.path.join(HERE, "compositions", f"{name}.html"), "w", encoding="utf-8", newline="\n").write(html)

audio = []
for i, s, text, lang, d in VO:
    audio.append(f'      <audio id="a-{i}" class="clip" src="assets/vo/{i}.wav" data-start="{s:.2f}" data-duration="{d:.2f}" data-track-index="4" data-volume="1"></audio>')
for k, (f, s, v) in enumerate(SFX):
    audio.append(f'      <audio id="s{k}-{f}" class="clip" src="assets/sfx/{f}.mp3" data-start="{s:.2f}" data-duration="{dur(f"assets/sfx/{f}.mp3"):.2f}" data-track-index="5" data-volume="{v}"></audio>')


def host(cid, start, d, track, kind):
    z = 10 if kind == "captions" else 1
    return (f'      <div id="{cid}" style="z-index:{z}" data-composition-id="{cid}" data-composition-src="compositions/{cid}.html" data-start="{start}" '
            f'data-duration="{d:.2f}" data-track-index="{track}" data-track-kind="{kind}" data-width="1920" data-height="1080"></div>')


index = f"""<!doctype html>
<html lang="en" data-resolution="landscape">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #ffffff; }}
      #ground {{ position: absolute; inset: 0; background: #ffffff; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{END}" data-width="1920" data-height="1080">
      <div id="ground"></div>
{host("act1", ACT1, PROD - ACT1, 1, "graphics")}
{host("product", PROD, CLOSE - PROD, 1, "graphics")}
{host("close", CLOSE, END - CLOSE, 1, "graphics")}
{host("captions", 0, END, 3, "captions")}
{chr(10).join(audio)}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
"""
open(os.path.join(HERE, "index.html"), "w", encoding="utf-8", newline="\n").write(index)
print("built:", len(groups), "caption groups,", len(VO), "voice lines,", len(SFX), "sfx")
