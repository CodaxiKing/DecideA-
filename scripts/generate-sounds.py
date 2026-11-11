"""Gera os sons do DecideAí (sons próprios, sem licença de terceiros).

spin.wav: cliques que desaceleram junto com a roleta (4,2 s, mesma curva da animação).
win.wav: acorde curto de resultado.
Rodar: python scripts/generate-sounds.py
"""
import math, struct, wave, os

RATE = 22050
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds')

def bezier_y_at(x, p1x=0.12, p1y=0.6, p2x=0.15, p2y=1.0):
    lo, hi = 0.0, 1.0
    for _ in range(40):
        t = (lo + hi) / 2
        bx = 3*(1-t)**2*t*p1x + 3*(1-t)*t**2*p2x + t**3
        lo, hi = (t, hi) if bx < x else (lo, t)
    t = (lo + hi) / 2
    return 3*(1-t)**2*t*p1y + 3*(1-t)*t**2*p2y + t**3

def write(name, samples):
    with wave.open(os.path.join(OUT, name), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, s)) * 32767)) for s in samples))

def spin():
    dur = 4.2
    n = int(RATE * dur)
    out = [0.0] * n
    ticks, last = [], 0
    steps = 46  # cliques ao longo do giro
    for i in range(n):
        y = bezier_y_at(i / n)
        k = int(y * steps)
        if k > last:
            ticks.append(i); last = k
    tick_len = int(RATE * 0.018)
    for start in ticks:
        for j in range(tick_len):
            if start + j >= n: break
            env = math.exp(-j / (tick_len / 5))
            out[start + j] += 0.45 * env * math.sin(2 * math.pi * 1900 * j / RATE)
    write('spin.wav', out)

def win():
    dur = 0.7
    n = int(RATE * dur)
    notes = [(523.25, 0.0), (659.25, 0.07), (783.99, 0.14)]
    out = []
    for i in range(n):
        t = i / RATE
        s = 0.0
        for f, at in notes:
            if t >= at:
                u = t - at
                s += 0.22 * math.exp(-u * 4.5) * (math.sin(2*math.pi*f*u) + 0.3*math.sin(4*math.pi*f*u))
        out.append(s)
    write('win.wav', out)

spin(); win()
