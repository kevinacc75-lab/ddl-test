#!/usr/bin/env python3
# r28 sound-effects renderer (Claude, 22 Oct 2026; Kevy 09:45: "chain links should have a robust loud chain sound, same
# logic for when cards are being moved or activated, it should feel dynamic and epic").
# Every sound here is ORIGINAL: built from sine/saw partials, filtered noise, envelopes, a synthetic reverb and soft
# saturation. The only recording used is the CC0 "Heavy chain" (BigSoundBank 0359, already in dist/audio, see CREDITS.md),
# sliced and layered under the chain-link hits. No Konami / Master Duel audio.
# Usage: python3 tools/r28-render-sfx.py <chain.wav (44.1 kHz mono decode of dist/audio/heavy-chain.mp3)> <out dir>
# Deterministic (fixed random seed), so a re-render gives the same files.
import sys, os, json, subprocess
import numpy as np
from scipy.signal import butter, sosfilt, lfilter, fftconvolve
from scipy.io import wavfile

SR = 44100
rng = np.random.default_rng(2810)
CHAIN_WAV, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

def t_(d): return np.arange(int(d * SR)) / SR
def pad(x, n): return np.pad(x, (0, max(0, n - len(x))))
def mix(*parts):
    n = max(len(p) for p in parts); out = np.zeros(n)
    for p in parts: out[:len(p)] += p
    return out
def at(x, sec): return np.concatenate([np.zeros(int(sec * SR)), x])
def env(n, a=0.002, d=0.3, hold=0.0):
    t = np.arange(n) / SR; e = np.exp(-np.maximum(0, t - a - hold) / max(d, 1e-4))
    if a > 0: e = np.where(t < a, t / a, e)
    return e
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, order=2): return sosfilt(butter(order, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, 'highpass', fs=SR, output='sos'), x)
def noise(d): return rng.standard_normal(int(d * SR))
def endfade(x, sec=0.25):
    # every layer fades to silence at its end (no hard cut-offs)
    n = min(len(x), int(sec * SR)); x = x.copy(); x[-n:] *= np.linspace(1, 0, n) ** 2; return x
def sweep(f0, f1, d, kind='sine', curve='exp'):
    t = t_(d); f = f0 * (f1 / f0) ** (t / d) if curve == 'exp' else f0 + (f1 - f0) * t / d
    ph = 2 * np.pi * np.cumsum(f) / SR
    if kind == 'saw': return 2 * ((ph / (2 * np.pi)) % 1) - 1
    if kind == 'square': return np.sign(np.sin(ph))
    if kind == 'tri': return 2 * np.abs(2 * ((ph / (2 * np.pi)) % 1) - 1) - 1
    return np.sin(ph)
def tone(f, d, a=0.003, dec=0.3, kind='sine', f1=None): x = sweep(f, f1 or f, d, kind); return endfade(x * env(len(x), a, dec))
def swept_noise(d, f0, f1, q=1.2, a=0.05, dec=None):
    # band-pass noise whose centre sweeps f0 -> f1 (chunked filter with carried state)
    n = int(d * SR); x = rng.standard_normal(n); out = np.zeros(n); zi = None; step = 256
    for i in range(0, n, step):
        c = f0 * (f1 / f0) ** (i / n); lo, hi = max(30, c / (1 + 1 / q)), min(SR / 2 - 100, c * (1 + 1 / q))
        b, a2 = butter(2, [lo, hi], 'bandpass', fs=SR)
        if zi is None or len(zi) != max(len(a2), len(b)) - 1: zi = np.zeros(max(len(a2), len(b)) - 1)
        out[i:i + step], zi = lfilter(b, a2, x[i:i + step], zi=zi)
    e = np.minimum(1, np.arange(n) / max(1, a * SR)) * (np.exp(-np.arange(n) / (dec * SR)) if dec else np.minimum(1, (n - np.arange(n)) / (0.06 * SR)))
    return out * e
def metal(f, d=1.0, dec=0.5, bright=1.0, ratios=(1, 2.76, 5.40, 8.93, 13.34, 2.0, 3.01)):
    # inharmonic bar / plate partials: a struck metal link
    t = t_(d); out = np.zeros(len(t))
    for i, r in enumerate(ratios):
        fr = f * r * (1 + rng.uniform(-0.006, 0.006))
        if fr > SR / 2.2: continue
        out += (bright ** i) * np.sin(2 * np.pi * fr * t + rng.uniform(0, 6.28)) * np.exp(-t / (dec / (1 + 0.55 * i))) / (1 + 0.35 * i)
    return endfade(out * env(len(t), 0.0008, 10))
def boom(f0=95, f1=32, d=0.9, dec=0.35): x = sweep(f0, f1, d); return endfade(x * env(len(x), 0.004, dec))
def crack(d=0.06, lo=2500, hi=12000): x = bp(noise(d), lo, hi); return x * env(len(x), 0.0005, d / 4)
def verb(x, wet=0.3, length=1.6, damp=5500, pre=0.018):
    n = int(length * SR); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / (length / 6.5 * SR)); ir = lp(ir, damp); ir = np.concatenate([np.zeros(int(pre * SR)), ir]); ir /= np.sqrt(np.sum(ir ** 2))
    w = fftconvolve(x, ir)[: len(x) + len(ir)]; return mix(x * (1 - wet * 0.35), w * wet)
def sat(x, drive=1.8): return np.tanh(drive * x) / np.tanh(drive)
def norm(x, peak=0.89): m = np.max(np.abs(x)) or 1; return x / m * peak
def fade_tail(x, sec=0.08):
    n = min(len(x), int(sec * SR)); x = x.copy(); x[-n:] *= np.linspace(1, 0, n); return x
def trim(x, floor=1e-3):
    idx = np.where(np.abs(x) > floor)[0]; return x[: idx[-1] + 1] if len(idx) else x

sr, ch = wavfile.read(CHAIN_WAV); ch = ch.astype(float) / 32768
if ch.ndim > 1: ch = ch.mean(1)
def rattle(start, dur, rate=1.0, gain=1.0):
    seg = ch[int(start * SR): int((start + dur * rate) * SR)]
    if rate != 1.0: seg = np.interp(np.arange(0, len(seg), rate), np.arange(len(seg)), seg)
    seg = hp(seg, 160); seg = norm(seg, 1.0) * gain; n = len(seg); seg *= np.minimum(1, np.arange(n) / (0.004 * SR)); seg *= np.minimum(1, (n - np.arange(n)) / (0.12 * SR))
    return seg

S = {}
# ---- Chain links: heavier and bigger each link (1, 2, 3, 4+) ----
for n in range(1, 5):
    f = 205 * 1.122 ** (n - 1)
    clank = mix(metal(f, 1.6, 0.42 + 0.05 * n, 0.92), at(metal(f * 1.33, 1.2, 0.3, 0.9) * 0.7, 0.034), at(metal(f * 0.75, 1.4, 0.5) * 0.5 * (n >= 3), 0.068))
    hit = mix(crack(0.05) * 1.3, clank * 0.85, boom(88 + 6 * n, 30, 1.2, 0.3 + 0.08 * n) * (0.9 + 0.18 * n))
    rat = mix(rattle(2.18, 0.8, 1 + 0.045 * (n - 1), 0.42 + 0.06 * n), at(rattle(1.02, 0.6, 1.1 + 0.05 * n, 0.25), 0.12) if n >= 2 else np.zeros(1))
    layers = [hit, at(rat, 0.02)]
    if n >= 4: layers += [metal(68, 3.0, 1.4, 0.8) * 0.55, at(swept_noise(0.9, 400, 6000, 1.5, 0.02, 0.35) * 0.35, 0.0)]
    x = verb(mix(*layers), 0.22 + 0.07 * n, 1.2 + 0.35 * n)
    S[f'chain-{n}'] = sat(norm(x, 0.95), 1.6 + 0.2 * n)
# chain complete / locked: one huge slam
S['chain-lock'] = sat(norm(verb(mix(crack(0.08) * 1.4, metal(150, 2.0, 0.6), at(metal(112, 2.0, 0.7), 0.05), boom(110, 28, 1.6, 0.55) * 1.6, rattle(2.18, 0.9, 0.92, 0.6), metal(55, 3.2, 1.8, 0.75) * 0.5), 0.42, 2.6), 0.95), 2.0)
# a link resolving: the chain unhooks (falling clanks + rattle) and a deep thump
S['chain-resolve'] = sat(norm(verb(mix(metal(330, 1.0, 0.25), at(metal(262, 1.0, 0.25) * 0.8, 0.07), at(metal(208, 1.2, 0.3) * 0.65, 0.14), boom(80, 30, 0.9, 0.3) * 1.2, at(rattle(2.25, 0.55, 0.95, 0.35), 0.03), crack(0.04) * 0.7), 0.3, 1.6), 0.92), 1.6)
# ---- Activations ----
shimmer = mix(*[at(tone(523.25 * r, 1.4, 0.004, 0.55, 'sine') * (0.6 - 0.07 * i), 0.035 * i) for i, r in enumerate([1, 1.26, 1.5, 2, 2.52, 3])])
S['activate-spell'] = sat(norm(verb(mix(crack(0.04, 4000, 14000), swept_noise(0.45, 900, 9000, 1.4, 0.02, 0.25) * 0.8, shimmer * 0.7, boom(120, 50, 0.6, 0.18) * 0.9), 0.38, 1.8), 0.93), 1.7)
trap_stab = mix(tone(155.6, 0.9, 0.002, 0.3, 'saw'), tone(220, 0.9, 0.002, 0.3, 'saw') * 0.8, tone(110, 0.9, 0.002, 0.35, 'saw') * 0.7)
S['activate-trap'] = sat(norm(verb(mix(crack(0.07, 1500, 9000) * 1.5, lp(trap_stab, 2400) * 0.55, metal(130, 1.4, 0.45, 0.85) * 0.8, boom(100, 34, 1.0, 0.32) * 1.3, at(metal(98, 1.0, 0.3) * 0.5, 0.09)), 0.34, 1.8), 0.95), 2.0)
charge = lp(sweep(110, 660, 0.32, 'saw'), 2600) * env(int(0.32 * SR), 0.25, 10)
S['activate-monster'] = sat(norm(verb(mix(charge * 0.5, at(mix(crack(0.05) * 1.2, boom(105, 36, 0.9, 0.28) * 1.2, metal(240, 1.0, 0.3, 0.85) * 0.6), 0.3)), 0.3, 1.5), 0.93), 1.8)
S['activate-field'] = sat(norm(verb(mix(swept_noise(1.3, 200, 7000, 1.2, 0.5, 0.6) * 0.8, *[at(tone(196 * r, 2.2, 0.25, 0.9, 'tri') * 0.35, 0.05 * i) for i, r in enumerate([1, 1.25, 1.5, 1.875, 2.25])], at(boom(110, 28, 1.8, 0.6) * 1.4, 0.35), at(crack(0.05) * 0.8, 0.35)), 0.5, 3.0), 0.93), 1.5)
S['equip'] = sat(norm(verb(mix(metal(620, 0.8, 0.18), crack(0.03) * 0.9, at(metal(780, 0.8, 0.2) * 0.9, 0.12), at(crack(0.03), 0.12), at(boom(140, 60, 0.4, 0.12) * 0.8, 0.12), *[at(crack(0.012, 6000, 15000) * 0.4, 0.26 + 0.03 * i) for i in range(4)]), 0.25, 1.2), 0.9), 1.7)
# ---- Summons ----
S['summon-normal'] = sat(norm(verb(mix(swept_noise(0.25, 3000, 600, 1.3, 0.01, 0.12) * 0.5, boom(95, 38, 0.7, 0.22) * 1.3, crack(0.03) * 0.6), 0.25, 1.2), 0.9), 1.6)
riser = swept_noise(0.42, 300, 9000, 1.4, 0.38, None) * 0.7
S['summon-special'] = sat(norm(verb(mix(riser, at(mix(crack(0.06) * 1.4, boom(100, 28, 1.4, 0.5) * 1.6, metal(196, 1.6, 0.6, 0.8) * 0.45, shimmer * 0.4), 0.4)), 0.4, 2.2), 0.95), 2.0)
swirl = mix(swept_noise(0.6, 400, 4000, 2.5, 0.3, None), swept_noise(0.6, 4400, 500, 2.5, 0.3, None)) * 0.6
choir = lp(mix(*[tone(146.8 * r * (1 + d), 2.0, 0.08, 1.0, 'saw') for r in (1, 1.5, 2, 2.4) for d in (-0.004, 0.004)]), 1800) * 0.25
S['summon-fusion'] = sat(norm(verb(mix(swirl, at(mix(crack(0.06) * 1.3, boom(98, 28, 1.6, 0.55) * 1.6, choir), 0.55)), 0.45, 2.6), 0.95), 1.9)
stars = mix(*[at(tone(784 * 1.122 ** i, 0.9, 0.002, 0.35, 'sine') * 0.5, 0.06 * i) for i in range(8)])
S['summon-synchro'] = sat(norm(verb(mix(stars, at(mix(crack(0.05) * 1.3, boom(105, 30, 1.5, 0.5) * 1.5, metal(262, 1.6, 0.6, 0.8) * 0.5), 0.5)), 0.45, 2.5), 0.95), 1.9)
pulses = mix(*[at(boom(60, 40, 0.3, 0.12) * 0.9, 0.13 * i) for i in range(3)], lp(tone(87.3, 0.6, 0.05, 0.4, 'saw'), 700) * 0.6)
S['summon-xyz'] = sat(norm(verb(mix(pulses, at(mix(crack(0.06) * 1.3, boom(90, 26, 1.6, 0.6) * 1.7, metal(174.6, 1.6, 0.7, 0.75) * 0.5), 0.42)), 0.45, 2.6), 0.95), 2.0)
blips = mix(*[at(lp(tone(392 * 1.189 ** i, 0.07, 0.001, 0.03, 'square'), 5000) * 0.35, 0.045 * i) for i in range(9)])
S['summon-link'] = sat(norm(verb(mix(blips, at(mix(crack(0.05) * 1.3, boom(110, 30, 1.4, 0.48) * 1.5, metal(392, 1.2, 0.4, 0.8) * 0.4), 0.42)), 0.4, 2.2), 0.95), 1.9)
brass = lp(mix(*[tone(73.4 * r * (1 + d), 2.6, 0.18, 1.3, 'saw') for r in (1, 1.5, 2, 3) for d in (-0.005, 0.005)]), 1400) * 0.3
S['boss'] = sat(norm(verb(mix(swept_noise(0.6, 200, 8000, 1.4, 0.5, None) * 0.7, at(mix(crack(0.09) * 1.6, boom(90, 24, 2.4, 0.9) * 2.0, metal(73.4, 3.4, 1.6, 0.7) * 0.6, brass), 0.58)), 0.5, 3.4), 0.96), 2.2)
# ---- Card movement ----
S['whoosh'] = norm(verb(swept_noise(0.36, 700, 4200, 1.6, 0.12, None), 0.2, 0.8), 0.7)
S['to-hand'] = norm(verb(mix(swept_noise(0.32, 900, 6000, 1.6, 0.1, None), at(tone(1568, 0.25, 0.002, 0.08) * 0.25, 0.26)), 0.22, 0.8), 0.72)
S['to-gy'] = sat(norm(verb(mix(swept_noise(0.34, 4000, 500, 1.4, 0.06, None) * 0.9, at(boom(85, 40, 0.5, 0.14) * 1.0, 0.28)), 0.25, 1.0), 0.82), 1.4)
vac = swept_noise(0.55, 600, 9000, 1.6, 0.5, None)
S['banish'] = sat(norm(verb(mix(vac * 0.8, at(mix(boom(70, 140, 0.25, 0.08) * 0.9, crack(0.03, 6000, 15000) * 0.8, swept_noise(1.0, 9000, 2000, 2.0, 0.005, 0.3) * 0.5), 0.52)), 0.55, 2.4, 8000), 0.9), 1.6)
pings = mix(*[at(metal(rng.uniform(1800, 4200), 0.5, 0.12, 0.7) * rng.uniform(0.2, 0.5), rng.uniform(0, 0.22)) for _ in range(16)])
S['destroy'] = sat(norm(verb(mix(crack(0.12, 1500, 14000) * 1.6, pings, boom(110, 30, 0.9, 0.3) * 1.3, swept_noise(0.4, 8000, 1200, 1.2, 0.005, 0.2) * 0.5), 0.35, 1.6), 0.95), 2.0)
S['material'] = sat(norm(verb(mix(swept_noise(0.5, 6000, 300, 2.0, 0.35, None) * 0.7, lp(tone(220, 0.6, 0.2, 0.3, 'saw', 70), 1200) * 0.5, at(boom(80, 40, 0.4, 0.12) * 0.8, 0.45)), 0.35, 1.4), 0.85), 1.6)
S['negate'] = sat(norm(verb(mix(lp(sweep(700, 40, 0.9, 'saw'), 3000) * env(int(0.9 * SR), 0.003, 0.5) * 0.7, crack(0.1, 800, 9000) * 1.4, boom(120, 26, 1.2, 0.45) * 1.5, *[at(tone(600 - 90 * i, 0.15, 0.002, 0.06, 'square') * 0.25, 0.07 * i) for i in range(5)]), 0.4, 2.0), 0.95), 2.4)
S['attack'] = sat(norm(verb(mix(swept_noise(0.28, 800, 7000, 1.5, 0.15, None), at(mix(bp(noise(0.35), 2500, 9000) * env(int(0.35 * SR), 0.002, 0.09) * 0.8, metal(1150, 0.5, 0.12, 0.6) * 0.5), 0.2)), 0.3, 1.2), 0.92), 1.8)
S['impact'] = sat(norm(verb(mix(crack(0.08, 1200, 12000) * 1.5, boom(85, 24, 1.4, 0.45) * 2.0, swept_noise(0.5, 5000, 400, 1.2, 0.003, 0.18) * 0.6), 0.35, 1.8), 0.96), 2.2)
S['cost'] = sat(norm(verb(mix(bp(noise(0.08), 300, 3000) * env(int(0.08 * SR), 0.001, 0.025) * 1.4, boom(130, 50, 0.4, 0.1) * 1.2, at(tone(500, 0.4, 0.004, 0.18, 'sine', 120) * 0.4, 0.04)), 0.25, 1.0), 0.88), 1.7)

manifest = {}
for name, x in S.items():
    x = norm(fade_tail(trim(x)), 0.84)  # about -1.5 dBFS so MP3 encoding never clips; relative levels are set in sound-engine.mjs
    wav = os.path.join(OUT, name + '.wav'); mp3 = os.path.join(OUT, name + '.mp3')
    wavfile.write(wav, SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '128k', '-map_metadata', '-1', mp3], check=True)
    os.remove(wav); manifest[name] = {'file': name + '.mp3', 'seconds': round(len(x) / SR, 2)}
json.dump({'version': 'r28', 'note': 'Original rendered SFX (tools/r28-render-sfx.py); chain layers use the CC0 BigSoundBank 0359 recording.', 'sounds': manifest}, open(os.path.join(OUT, 'sfx.json'), 'w'), indent=1)
print(json.dumps(manifest))
