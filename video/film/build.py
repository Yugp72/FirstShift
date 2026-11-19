"""Generates the FirstShift launch film v2 (HyperFrames): accessibility-first, ~60/40 with languages.

Run: python build.py   -> writes index.html and compositions/*.html
Every time below is absolute film time in seconds unless a scene subtracts its offset.
"""
import os
import random
import re
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(HERE, "compositions"), exist_ok=True)

INK, MUTED, GREY, BLUE = "#1d1d1f", "#4d4d52", "#86868b", "#00479a"
FONT = "Inter, system-ui, sans-serif"
ACT1, PROD, CLOSE, END = 0.0, 36.4, 96.0, 110.5


def dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                          os.path.join(HERE, path)], capture_output=True, text=True).stdout
    return round(float(out), 3)


# id, start, caption, lang  (files in assets/vo2/)
VO = [
    ("a01", 1.5, "More than 1 in 4 American adults lives with a disability.", "en"),
    ("a02", 6.1, "Worldwide, that's 1.3 billion people.", "en"),
    ("a03", 9.2, "2.2 billion live with a vision impairment. 430 million, with disabling hearing loss.", "en"),
    ("a04", 16.4, "Yet only about 1 in 5 people with a disability has a job.", "en"),
    ("a05", 20.9, "And here in Santa Clara County, more than half of us speak another language at home. So do nearly half of restaurant chefs.", "en"),
    ("a06", 28.7, "Still, most training works one way, for everyone.", "en"),
    ("a07", 36.7, "Meet FirstShift. From first hello, to first shift.", "en"),
    ("a08", 40.6, "Every new hire starts with one question. How do you learn best? Captions. Read aloud. Extra time.", "en"),
    ("a09", 47.6, "Then the training changes to fit them. Larger text, captions on every video, and no timer. Ever.", "en"),
    ("a10", 54.0, "Prefer pictures? Every step has one. Rather listen? Every step reads aloud.", "en"),
    ("a11", 59.8, "It's built for keyboards and screen readers, and every text colour meets the highest contrast standard.", "en"),
    ("a12", 66.1, "Managers see how each person works best, as work preferences. Never as a medical record.", "en"),
    ("a13", 72.1, "One job post becomes every channel, in four languages, including an easy-read version.", "en"),
    ("a14", 78.3, "Each hire learns in English, Mandarin, Cantonese, or Spanish.", "en"),
    ("a15", 83.6, "And managers see what a score can't. Mei scored a hundred, but feels unsure, so she gets a buddy shift.", "en"),
    ("a16", 90.6, "Approved, with evidence. And the news lands on her phone, in her language.", "en"),
    ("a17", 96.4, "1.3 billion people with a disability. Around 7,000 languages. FirstShift is built for both.", "en"),
    ("a18", 104.3, "FirstShift. From first hello, to first shift.", "en"),
]
VO = [(i, s, t, l, dur(f"assets/vo2/{i}.wav")) for i, s, t, l in VO]
for (a, s1, _, _, d1), (b, s2, _, _, _) in zip(VO, VO[1:]):
    assert s1 + d1 <= s2 + 0.01, f"{a} overlaps {b}"

SFX = [  # file, start, volume
    ("whoosh-short", 1.35, 0.35), ("pop", 2.65, 0.25), ("pop", 6.55, 0.25), ("pop", 16.65, 0.25), ("pop", 21.25, 0.25),
    ("click-soft", 29.5, 0.35), ("click-soft", 30.2, 0.35), ("click-soft", 30.9, 0.35), ("whoosh", 35.85, 0.4),
    ("click-soft", 44.3, 0.5), ("click-soft", 45.3, 0.5), ("click-soft", 46.3, 0.5), ("click-soft", 47.8, 0.5),
    ("click-soft", 54.1, 0.5), ("click-soft", 56.8, 0.5),
    ("key-press", 60.95, 0.45), ("key-press", 61.76, 0.45), ("key-press", 62.57, 0.45), ("key-press", 64.6, 0.5),
    ("key-press", 71.05, 0.45), ("click-soft", 72.0, 0.5), ("click-soft", 79.9, 0.5), ("click-soft", 91.4, 0.5),
    ("pop", 93.9, 0.35), ("whoosh", 95.55, 0.35), ("pop", 101.95, 0.25), ("whoosh-short", 104.05, 0.3),
]


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

# ---------- ACT 1: the problem (0 – 36.4) ----------
rng = random.Random(7)
order = list(range(100)); rng.shuffle(order)
rank = {d: r for r, d in enumerate(order)}
GX, GY = 560, 500
dot_html = "\n".join(
    f'      <i class="dot" data-r="{rank[i]}" style="left:{GX + (i % 10 - 4.5) * 46 - 11:.1f}px;top:{GY + (i // 10 - 4.5) * 46 - 11:.1f}px"></i>'
    for i in range(100))
people_html = "\n".join(f'      <div class="person" id="p{k}" style="left:{GX - 5 * 70 + k * 140 - 40:.0f}px">{PERSON_SVG}</div>' for k in range(6))
LANG_WORDS = ["中文", "Español", "Tiếng Việt", "Tagalog", "हिन्दी", "한국어", "粵語", "Русский"]

act1_css = f"""
    .grid {{ position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }}
    .dot {{ position: absolute; width: 22px; height: 22px; border-radius: 50%; background: {GREY}; opacity: 0; }}
    .stat {{ position: absolute; left: 1010px; width: 820px; opacity: 0; }}
    .loc {{ top: 250px; font-size: 34px; font-weight: 700; color: {MUTED}; }}
    .num {{ top: 290px; font-size: 230px; font-weight: 900; letter-spacing: -0.05em; line-height: 1; }}
    .num.mid {{ font-size: 176px; top: 310px; }}
    .cap {{ top: 540px; font-size: 44px; font-weight: 700; line-height: 1.15; letter-spacing: -0.02em; }}
    .sub {{ font-size: 40px; font-weight: 700; letter-spacing: -0.02em; }}
    .sub b {{ color: {BLUE}; font-weight: 900; }}
    .src {{ top: 820px; font-size: 28px; font-weight: 400; color: {MUTED}; }}
    .words {{ position: absolute; left: {GX - 300}px; width: 600px; top: 780px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 22px; font-size: 28px; color: {MUTED}; }}
    .words span {{ opacity: 0; }}
    .person {{ position: absolute; top: {GY - 75}px; width: 80px; height: 150px; opacity: 0; }}
    .person svg {{ width: 100%; height: 100%; fill: {GREY}; }}
    .bars {{ position: absolute; left: {GX - 330}px; top: 360px; width: 660px; opacity: 0; }}
    .bar {{ margin-bottom: 64px; }}
    .bar .lbl {{ font-size: 32px; font-weight: 700; margin-bottom: 14px; display: flex; justify-content: space-between; }}
    .bar .trk {{ height: 44px; border-radius: 22px; background: #f0f0f2; overflow: hidden; }}
    .bar .fill {{ height: 44px; border-radius: 22px; transform-origin: 0 50%; }}
    .same {{ position: absolute; left: 1010px; font-size: 92px; font-weight: 900; letter-spacing: -0.04em; opacity: 0; }}
    .q {{ position: absolute; left: 0; top: 400px; width: 1920px; text-align: center; font-size: 80px; font-weight: 900; letter-spacing: -0.035em; line-height: 1.12; opacity: 0; }}
    .q em {{ font-style: normal; color: {BLUE}; }}
    .seed {{ position: absolute; left: 880px; top: 460px; width: 160px; height: 160px; border-radius: 80px; background: {GREY}; opacity: 0; }}
    .seed svg {{ position: absolute; inset: 22px; width: 116px; height: 116px; }}
"""
act1_body = f"""
    <div class="grid" id="a1-grid">
{dot_html}
    </div>
{people_html}
    <div class="bars" id="a1-bars">
      <div class="bar"><div class="lbl"><span>With a disability</span><span>22.8%</span></div><div class="trk"><div class="fill" id="a1-b1" style="width:22.8%;background:{BLUE}"></div></div></div>
      <div class="bar"><div class="lbl"><span>Without a disability</span><span>65.2%</span></div><div class="trk"><div class="fill" id="a1-b2" style="width:65.2%;background:{GREY}"></div></div></div>
    </div>
    <div class="words" id="a1-words">{''.join(f'<span>{w}</span>' for w in LANG_WORDS)}</div>

    <div class="stat loc" id="a1-loc1">United States</div>
    <div class="stat num" id="a1-num1">1 in 4</div>
    <div class="stat cap" id="a1-cap1">More than 1 in 4 adults live with a disability</div>
    <div class="stat src" id="a1-src1" style="top:680px">CDC · Disability and Health Data System, 2024</div>

    <div class="stat loc" id="a1-loc2">Worldwide</div>
    <div class="stat num mid" id="a1-num2">0.0 billion</div>
    <div class="stat cap" id="a1-cap2" style="top:510px">people live with a significant disability · 1 in 6</div>
    <div class="stat sub" id="a1-sub2a" style="top:640px"><b>2.2 billion</b> have a vision impairment</div>
    <div class="stat sub" id="a1-sub2b" style="top:710px"><b>430 million</b> have disabling hearing loss</div>
    <div class="stat src" id="a1-src2">World Health Organization · 2023, 2026</div>

    <div class="stat loc" id="a1-loc3">Jobs</div>
    <div class="stat num" id="a1-num3">0.0%</div>
    <div class="stat cap" id="a1-cap3">of people with a disability are employed, vs 65.2% without</div>
    <div class="stat src" id="a1-src3" style="top:700px">U.S. Bureau of Labor Statistics · 2025</div>

    <div class="stat loc" id="a1-loc4">Santa Clara County, California</div>
    <div class="stat num" id="a1-num4">0.0%</div>
    <div class="stat cap" id="a1-cap4">speak a language other than English at home</div>
    <div class="stat sub" id="a1-sub4" style="top:670px"><b>46%</b> of U.S. restaurant chefs do too</div>
    <div class="stat src" id="a1-src4" style="top:760px;width:860px">U.S. Census Bureau, ACS 2020–2024 · National Restaurant Association, March 2026</div>

    <div class="same" id="a1-s1" style="top:330px">One format.</div>
    <div class="same" id="a1-s2" style="top:450px">One speed.</div>
    <div class="same" id="a1-s3" style="top:570px">One language.</div>
    <div class="q" id="a1-q" data-hold="deliberate silent beat">What if training asked <em>how you learn</em><br/>— not what limits you?</div>
    <div class="seed" id="a1-seed">{LOGO_SVG}</div>
"""
act1_js = f"""
    const dots = $$('.dot').sort((a, b) => a.dataset.r - b.dataset.r);
    const first = dots[0];
    const fx = parseFloat(first.style.left) + 11, fy = parseFloat(first.style.top) + 11;
    const B = (els, t, st = 0.02) => tl.to(els, {{ backgroundColor: "{BLUE}", duration: 0.25, stagger: st }}, t);
    // B1 (0–1.4): one person. Then a hundred.
    tl.set(first, {{ opacity: 1 }}, 0);
    tl.fromTo('#a1-grid', {{ scale: 3.2, x: 960 - fx, y: 540 - fy, transformOrigin: `${{fx}}px ${{fy}}px` }}, {{ scale: 1, x: 0, y: 0, duration: 1.1, ease: "power2.inOut" }}, 1.4);
    tl.fromTo(dots.slice(1), {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3, stagger: 0.006, ease: "power2.out" }}, 1.5);
    // B2 (2.4–5.9): more than 1 in 4 U.S. adults
    IN('#a1-loc1', 2.4); IN('#a1-num1', 2.6, 0.25); B(dots.slice(0, 26), 2.6, 0.025); IN('#a1-cap1', 2.95); IN('#a1-src1', 3.3);
    // B3 (5.9–16): 1.3 billion; vision; hearing
    ['#a1-loc1', '#a1-num1', '#a1-cap1', '#a1-src1'].forEach((s) => OUT(s, 5.9));
    tl.to(dots, {{ scale: 0, opacity: 0, duration: 0.3, stagger: 0.003, ease: "power3.in" }}, 5.9);
    tl.fromTo('.person', {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "expo.out" }}, 6.1);
    IN('#a1-loc2', 6.3); IN('#a1-num2', 6.5, 0.15); COUNT($('#a1-num2'), 0, 1.3, 6.5, 1.0, 1, ' billion');
    tl.fromTo('#p2 svg', {{ fill: "{GREY}" }}, {{ fill: "{BLUE}", duration: 0.35 }}, 6.8);
    IN('#a1-cap2', 6.9); IN('#a1-src2', 7.3);
    IN('#a1-sub2a', 9.3); IN('#a1-sub2b', 12.5);
    // B4 (16–20.6): 22.8% employed vs 65.2%
    ['#a1-loc2', '#a1-num2', '#a1-cap2', '#a1-sub2a', '#a1-sub2b', '#a1-src2', '.person'].forEach((s) => OUT(s, 16.0));
    IN('#a1-bars', 16.3, 0.25);
    tl.fromTo('#a1-b1', {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.9, ease: "expo.out" }}, 16.6);
    tl.fromTo('#a1-b2', {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.9, ease: "expo.out" }}, 16.8);
    IN('#a1-loc3', 16.4); IN('#a1-num3', 16.6, 0.15); COUNT($('#a1-num3'), 0, 22.8, 16.6, 1.0, 1, '%');
    IN('#a1-cap3', 17.0); IN('#a1-src3', 17.6);
    // B5 (20.6–28.4): languages
    ['#a1-loc3', '#a1-num3', '#a1-cap3', '#a1-src3', '#a1-bars'].forEach((s) => OUT(s, 20.6));
    tl.to(dots, {{ scale: 1, opacity: 1, backgroundColor: "{GREY}", duration: 0.35, stagger: 0.003, ease: "expo.out" }}, 20.8);
    IN('#a1-loc4', 21.0); IN('#a1-num4', 21.2, 0.15); COUNT($('#a1-num4'), 0, 55.2, 21.2, 1.2, 1, '%');
    B(dots.slice(0, 55), 21.3, 0.012); IN('#a1-cap4', 21.5); IN('#a1-src4', 21.9);
    tl.fromTo('#a1-words span', {{ opacity: 0, y: 10 }}, {{ opacity: 1, y: 0, duration: 0.35, stagger: 0.12, ease: "power3.out" }}, 23.0);
    IN('#a1-sub4', 26.1);
    // B6 (28.4–31.6): one way for everyone
    ['#a1-loc4', '#a1-num4', '#a1-cap4', '#a1-sub4', '#a1-src4', '#a1-words'].forEach((s) => OUT(s, 28.4));
    tl.to(dots, {{ backgroundColor: "#c7c7cc", duration: 0.6 }}, 28.6);
    IN('#a1-s1', 29.5, 0.15); IN('#a1-s2', 30.2, 0.15); IN('#a1-s3', 30.9, 0.15);
    // B7 (31.9–35.75): silence, and the question
    ['#a1-grid', '#a1-s1', '#a1-s2', '#a1-s3'].forEach((s) => OUT(s, 31.6, 0.25));
    tl.fromTo('#a1-q', {{ opacity: 0, filter: "blur(10px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.45, ease: "power2.out" }}, 31.95);
    OUT('#a1-q', 35.65, 0.15);
    // B8 (35.8–36.4): one dot becomes FirstShift
    tl.fromTo('#a1-seed', {{ opacity: 0, scale: 0.1375 }}, {{ opacity: 1, duration: 0.08 }}, 35.8);
    tl.to('#a1-seed', {{ scale: 1, borderRadius: 36, backgroundColor: "{BLUE}", duration: 0.42, ease: "expo.out" }}, 35.86);
    tl.fromTo('#a1-seed .chk', {{ strokeDashoffset: 1 }}, {{ strokeDashoffset: 0, duration: 0.22, ease: "power2.out" }}, 36.06);
"""

# ---------- ACT 2: the product (36.4 – 96.0) ----------
S0, P0 = 0.8444, 0.98
LAPTOP_CLIPS = [  # id, file, abs start, media start, rate, duration
    ("keys", "keys", 59.7, 5.6, 0.8, 11.3),
    ("posts", "posts", 71.6, 5.0, 1.0, 6.3),
    ("pass", "passport", 83.3, 5.6, 0.7, 6.9),
    ("appr", "approve", 90.2, 5.8, 1.0, 3.1),
]
PHONE_CLIPS = [
    ("a11y", "a11ysetup", 41.3, 3.5, 1.0, 18.1),
    ("setup", "setup", 78.0, 4.0, 1.0, 3.0),
    ("lesson", "lesson", 81.0, 7.0, 1.0, 2.2),
    ("seal", "seal", 93.3, 2.4, 1.0, 2.7),
]


def vids(clips, w, h):
    return "\n".join(f'''        <div class="zoom" id="z-{cid}" style="width:{w}px;height:{h}px">
          <video id="v-{cid}" class="clip" src="assets/rec/{f}.mp4" data-start="{s - PROD:.2f}" data-duration="{d:.2f}" data-media-start="{ms}" data-playback-rate="{rate}" data-track-index="2" muted playsinline style="width:{w}px;height:{h}px"></video>
        </div>''' for cid, f, s, ms, rate, d in clips)


HL = [  # id, html, abs in, abs out, slot, extra class
    ("h-q1", "One question first:", 40.3, 47.4, "R", ""),
    ("h-q2", "How do you learn best?", 42.6, 47.4, "R2", "accent"),
    ("h-q3", "Captions · Read aloud · Extra time", 44.3, 47.4, "R3", "chips"),
    ("h-fit", "Training that fits them.", 47.7, 49.7, "R", ""),
    ("h-big", "Larger text.<br/>Larger buttons.", 49.8, 51.05, "R", ""),
    ("h-cap", "Captions on<br/>every video.", 51.1, 52.9, "R", ""),
    ("h-time", "No timer. Ever.", 53.0, 53.9, "R", ""),
    ("h-pics", "Prefer pictures?", 54.05, 56.4, "R", ""),
    ("h-pics2", "Every step has one.", 55.0, 56.4, "R2", "chips"),
    ("h-listen", "Rather listen?", 56.5, 59.0, "R", ""),
    ("h-listen2", "Every step reads aloud.", 57.4, 59.0, "R2", "chips"),
    ("h-keys", "Keyboard and<br/>screen reader.", 60.0, 65.8, "L", ""),
    ("h-aaa", "WCAG AAA contrast.", 63.0, 65.8, "L2", "accent"),
    ("h-prefs", "How they work best.", 66.2, 71.4, "L", ""),
    ("h-med", "Never a medical record.", 68.0, 71.4, "L2", "accent"),
    ("h-post", "One post.", 72.0, 77.5, "L", ""),
    ("h-post2", "Every channel.<br/>Four languages.<br/>Easy-read too.", 73.6, 77.5, "L2", "chips"),
    ("h-lang", "Four languages.", 78.3, 82.8, "R", ""),
    ("h-lang2", "English · 中文 · 粵語 · Español", 78.8, 82.8, "R2", "chips"),
    ("h-ready", "Readiness,<br/>not just a score.", 83.7, 85.4, "L", ""),
    ("h-mei", "Scored 100%.<br/>Feels unsure.", 85.6, 89.9, "L", ""),
    ("h-mei2", "→ Buddy shift", 87.5, 89.9, "L3", "flag"),
    ("h-appr", "Approved<br/>with evidence.", 90.7, 93.0, "L", ""),
    ("h-seal", "Shift-ready.<br/>In her language.", 93.8, 95.4, "R", ""),
]
POS = {"L": (110, 330), "L2": (110, 520), "L3": (110, 660), "R": (860, 330), "R2": (860, 520), "R3": (860, 610)}
hl_html = "\n".join(f'    <div class="hl {cls} {"left" if slot.startswith("L") else ""}" id="{i}" style="left:{POS[slot][0]}px;top:{POS[slot][1]}px">{t}</div>' for i, t, a, b, slot, cls in HL)
hl_js = "\n".join(f"    IN('#{i}', {a - PROD:.2f}); OUT('#{i}', {b - PROD:.2f});" for i, t, a, b, slot, cls in HL)

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
    .hl {{ position: absolute; width: 920px; font-size: 76px; font-weight: 900; letter-spacing: -0.04em; line-height: 1.05; opacity: 0; }}
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


DEVICES = [("#p-phone", 41.05, 59.15), ("#p-laptop", 59.45, 77.7), ("#p-phone", 77.85, 83.0),
           ("#p-laptop", 83.2, 93.05), ("#p-phone", 93.25, None)]
dev_js = "\n".join(f"    DEV_IN('{el}', {rel(a)});" + (f" DEV_OUT('{el}', {rel(b)});" if b else "") for el, a, b in DEVICES)

prod_js = f"""
    $$('#p-laptop .zoom').forEach((z) => tl.set(z, {{ scale: {S0}, transformOrigin: '0 0', x: 0, y: 0 }}, 0));
    $$('#p-phone .zoom').forEach((z) => tl.set(z, {{ scale: {P0}, transformOrigin: '0 0', x: 0, y: 0 }}, 0));
    // lockup
    tl.fromTo('#p-logo', {{ x: 0 }}, {{ x: -375, duration: 0.6, ease: 'power3.inOut' }}, {rel(36.65)});
    tl.fromTo('#p-word', {{ x: 0, clipPath: 'inset(0 100% 0 0)' }}, {{ x: -375, clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'power3.inOut' }}, {rel(36.65)});
    tl.fromTo('#p-tag', {{ opacity: 0, filter: 'blur(8px)' }}, {{ opacity: 1, filter: 'blur(0px)', duration: 0.3, ease: 'power3.out' }}, {rel(37.95)});
    OUT('#p-lockup', {rel(39.75)}, 0.25);
    // devices
    const DEV_IN = (el, t) => tl.fromTo(el, {{ opacity: 0, y: 70, filter: 'blur(8px)' }}, {{ opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out', immediateRender: false }}, t);
    const DEV_OUT = (el, t) => tl.to(el, {{ opacity: 0, y: -40, filter: 'blur(8px)', duration: 0.25, ease: 'power3.in' }}, t);
    tl.set(['#p-laptop', '#p-phone'], {{ opacity: 0 }}, 0);
{dev_js}
    // punch-ins on the real UI
{punch('z-a11y', 195, 400, 1.25, 51.0, 52.9, P0)}
{punch('z-keys', 1018, 600, 1.8, 60.3, 63.9, S0)}
{punch('z-keys', 1170, 560, 1.7, 66.3, 70.6, S0)}
{punch('z-posts', 900, 560, 1.3, 74.0, 77.2, S0)}
{punch('z-pass', 1170, 192, 1.9, 85.5, 89.7, S0)}
{punch('z-appr', 720, 450, 1.35, 91.6, 92.9, S0)}
    IN('#p-demo', {rel(83.5)}); OUT('#p-demo', {rel(92.9)});
{hl_js}
    tl.to('#p-phone', {{ scale: 0.06, x: {960 - 505}, y: {540 - 497}, opacity: 0, duration: 0.45, ease: 'power3.in' }}, {rel(95.5)});
    tl.fromTo('#p-dot', {{ opacity: 0 }}, {{ opacity: 1, duration: 0.15 }}, {rel(95.82)});
"""

# ---------- ACT 3: built for both (96.0 – 110.5) ----------
rng2 = random.Random(11)
field = []
while len(field) < 140:
    x, y = rng2.uniform(140, 1780), rng2.uniform(110, 960)
    if abs(x - 960) < 560 and 300 < y < 760:
        continue
    field.append((x, y, rng2.uniform(8, 16)))
field_html = "\n".join(f'    <i class="fd" style="left:{x:.0f}px;top:{y:.0f}px;width:{s:.0f}px;height:{s:.0f}px"></i>' for x, y, s in field)
L4 = ["English", "中文", "粵語", "Español"]
four_html = "\n".join(f'      <div class="four" style="left:{960 + (k - 1.5) * 220 - 90:.0f}px"><i></i><span>{w}</span></div>' for k, w in enumerate(L4))
A11Y = ["Captions", "Picture steps", "Read aloud", "Extra time", "Seated station", "Keyboard &amp; screen reader", "WCAG AAA contrast"]
chips_html = "".join(f"<span>{w}</span>" for w in A11Y)


def crel(t):
    return f"{t - CLOSE:.2f}"


close_css = f"""
    .fd {{ position: absolute; border-radius: 50%; background: #d2d2d7; opacity: 0; }}
    .big {{ position: absolute; left: 0; top: 330px; width: 1920px; text-align: center; font-size: 210px; font-weight: 900; letter-spacing: -0.05em; line-height: 1; opacity: 0; }}
    .ccap {{ position: absolute; left: 0; top: 570px; width: 1920px; text-align: center; font-size: 46px; font-weight: 700; letter-spacing: -0.02em; opacity: 0; }}
    .csrc {{ position: absolute; left: 0; top: 650px; width: 1920px; text-align: center; font-size: 28px; color: {MUTED}; opacity: 0; }}
    .both {{ position: absolute; left: 0; top: 250px; width: 1920px; text-align: center; font-size: 84px; font-weight: 900; letter-spacing: -0.04em; opacity: 0; }}
    .chips {{ position: absolute; left: 260px; top: 420px; width: 1400px; display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; opacity: 0; }}
    .chips span {{ padding: 12px 26px; border-radius: 999px; background: #eef3fa; color: {BLUE}; font-size: 34px; font-weight: 700; }}
    .fourrow {{ position: absolute; left: 0; top: 640px; width: 1920px; height: 120px; opacity: 0; }}
    .four {{ position: absolute; top: 0; width: 180px; text-align: center; }}
    .four i {{ display: block; margin: 0 auto 14px; width: 30px; height: 30px; border-radius: 50%; background: {BLUE}; }}
    .four span {{ font-size: 38px; font-weight: 700; }}
    .start {{ position: absolute; left: 949px; top: 529px; width: 22px; height: 22px; border-radius: 50%; background: {BLUE}; }}
    .elogo {{ position: absolute; left: 505px; top: 330px; width: 160px; height: 160px; border-radius: 36px; background: {BLUE}; opacity: 0; }}
    .elogo svg {{ position: absolute; inset: 22px; width: 116px; height: 116px; }}
    .eword {{ position: absolute; left: 695px; top: 338px; font-size: 128px; font-weight: 900; letter-spacing: -0.045em; line-height: 1; clip-path: inset(0 100% 0 0); }}
    .eline {{ position: absolute; left: 0; width: 1920px; text-align: center; opacity: 0; }}
"""
close_body = f"""
{field_html}
    <div class="start" id="c-start"></div>
    <div class="big" id="c-n1">1.3 billion</div>
    <div class="ccap" id="c-c1">people live with a significant disability</div>
    <div class="csrc" id="c-s1">World Health Organization</div>
    <div class="big" id="c-n2">~0</div>
    <div class="ccap" id="c-c2">languages are in use worldwide, spoken or signed</div>
    <div class="csrc" id="c-s2">UNESCO World Atlas of Languages</div>
    <div class="both" id="c-both">FirstShift is built for both.</div>
    <div class="chips" id="c-chips">{chips_html}</div>
    <div class="fourrow" id="c-four">
{four_html}
    </div>
    <div class="elogo" id="c-logo">{LOGO_SVG}</div>
    <div class="eword" id="c-word">FirstShift</div>
    <div class="eline" id="c-l1" style="top:560px;font-size:64px;font-weight:900;letter-spacing:-0.035em">From first hello to first shift.</div>
    <div class="eline" id="c-l2" style="top:660px;font-size:40px;font-weight:700;color:{MUTED}">However you learn. Whatever your language.</div>
    <div class="eline" id="c-l3" style="top:860px;font-size:30px;color:{MUTED}">Built on Converge.AI Enter and Framia · All people shown are demo data</div>
"""
close_js = f"""
    tl.to('#c-start', {{ scale: 0, opacity: 0, duration: 0.3, ease: 'power3.in' }}, {crel(96.3)});
    IN('#c-n1', {crel(96.45)}, 0.25); IN('#c-c1', {crel(96.8)}); IN('#c-s1', {crel(97.1)});
    ['#c-n1', '#c-c1', '#c-s1'].forEach((s) => OUT(s, {crel(99.35)}));
    tl.fromTo('.fd', {{ opacity: 0, scale: 0 }}, {{ opacity: 1, scale: 1, duration: 0.4, stagger: 0.008, ease: 'expo.out' }}, {crel(99.5)});
    IN('#c-n2', {crel(99.6)}, 0.15);
    {{ const o = {{ v: 0 }}; tl.fromTo(o, {{ v: 0 }}, {{ v: 7000, duration: 1.2, ease: 'expo.out', onUpdate: () => {{ $('#c-n2').textContent = '~' + (Math.round(o.v / 10) * 10).toLocaleString('en-US'); }} }}, {crel(99.6)}); }}
    IN('#c-c2', {crel(99.65)}); IN('#c-s2', {crel(100.0)});
    ['#c-n2', '#c-c2', '#c-s2', '.fd'].forEach((s) => OUT(s, {crel(101.75)}, 0.2));
    IN('#c-both', {crel(101.95)}, 0.25);
    tl.fromTo('#c-chips span', {{ opacity: 0, y: 14 }}, {{ opacity: 1, y: 0, duration: 0.35, stagger: 0.07, ease: 'expo.out' }}, {crel(102.1)});
    tl.set('#c-chips', {{ opacity: 1 }}, {crel(102.1)});
    IN('#c-four', {crel(102.7)}, 0.3);
    ['#c-both', '#c-chips', '#c-four'].forEach((s) => OUT(s, {crel(103.95)}, 0.22));
    tl.fromTo('#c-logo', {{ opacity: 0, scale: 0.14, borderRadius: 80 }}, {{ opacity: 1, scale: 1, borderRadius: 36, duration: 0.6, ease: 'expo.out' }}, {crel(104.2)});
    tl.fromTo('#c-logo .chk', {{ strokeDashoffset: 1 }}, {{ strokeDashoffset: 0, duration: 0.3, ease: 'power2.out' }}, {crel(104.45)});
    tl.fromTo('#c-word', {{ clipPath: 'inset(0 100% 0 0)' }}, {{ clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'power3.inOut' }}, {crel(104.6)});
    IN('#c-l1', {crel(105.5)}, 0.3); IN('#c-l2', {crel(106.5)}, 0.3); IN('#c-l3', {crel(107.1)}, 0.3);
"""

# ---------- captions ----------
groups = []
for i, s, text, lang, d in VO:
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
cap_html = [f'    <div class="cg clip" id="cg{k}" lang="{lang}" data-start="{max(a, 0.1):.2f}" data-duration="{b - max(a, 0.1) - 0.02:.2f}" data-track-index="0"><span>{c}</span></div>'
            for k, (a, b, c, lang) in enumerate(groups)]
captions_css = f"""
    #root {{ background: transparent; }}
    .cg {{ position: absolute; left: 0; top: 958px; width: 1920px; text-align: center; overflow: visible; }}
    .cg span {{ display: inline-block; padding: 8px 22px; border-radius: 14px; background: rgba(29,29,31,0.86); color: #fff; font-size: 36px; font-weight: 700; letter-spacing: -0.01em; }}
"""
captions_js = "    $$('.cg span').forEach((s) => { tl.fromTo(s, { opacity: 0 }, { opacity: 1, duration: 0.1 }, +s.parentElement.dataset.start); });"

files = {
    "act1": scene("act1", act1_body, act1_css, act1_js),
    "product": scene("product", prod_body, prod_css, prod_js),
    "close": scene("close", close_body, close_css, close_js),
    "captions": scene("captions", "\n".join(cap_html), captions_css, captions_js),
}
for name, html in files.items():
    open(os.path.join(HERE, "compositions", f"{name}.html"), "w", encoding="utf-8", newline="\n").write(html)

audio = [f'      <audio id="a-{i}" class="clip" src="assets/vo2/{i}.wav" data-start="{s:.2f}" data-duration="{d:.2f}" data-track-index="4" data-volume="1"></audio>'
         for i, s, text, lang, d in VO]
audio += [f'      <audio id="s{k}-{f}" class="clip" src="assets/sfx/{f}.mp3" data-start="{s:.2f}" data-duration="{dur(f"assets/sfx/{f}.mp3"):.2f}" data-track-index="5" data-volume="{v}"></audio>'
          for k, (f, s, v) in enumerate(SFX)]


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
# screen-time split for the 60/40 brief (seconds of each act given to each theme)
a11y = (20.6 - 1.4) + (59.15 - 40.3) + (71.4 - 59.45) + (99.4 - 96.4) + (103.95 - 101.95) * 0.6
lang = (28.4 - 20.6) + (96.0 - 71.6) + (101.75 - 99.5)
print(f"built: {len(groups)} caption groups, {len(VO)} voice lines, {len(SFX)} sfx; accessibility {a11y:.0f}s vs language {lang:.0f}s")
