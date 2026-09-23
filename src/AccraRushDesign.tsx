import React from "react";

const colors = { ink: "#160f1d", sky: "#30204b", coral: "#e44b3a", gold: "#f6c945", green: "#2d8f63", cyan: "#51d3d2", cream: "#fff4d6" };

function Scene({ children, eyebrow = "ACCRA • 18:42" }: { children: React.ReactNode; eyebrow?: string }) {
  return <div style={{ minHeight: 720, background: `linear-gradient(180deg, ${colors.sky} 0%, #57365e 52%, ${colors.ink} 52%)`, color: colors.cream, fontFamily: "Trebuchet MS, sans-serif", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: "0 0 48%", opacity: .18, background: "radial-gradient(circle at 20% 30%, #ffcf54 0 3px, transparent 4px), radial-gradient(circle at 80% 24%, #fff4d6 0 2px, transparent 3px)", backgroundSize: "120px 90px" }} />
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "48%", background: "repeating-linear-gradient(170deg, transparent 0 55px, rgba(0,0,0,.13) 56px 60px), linear-gradient(90deg, #221725, #332036 52%, #201622)" }} />
    <div style={{ position: "absolute", bottom: "11%", left: "4%", right: "4%", height: 8, background: colors.gold, boxShadow: `0 -19px 0 ${colors.cream}` }} />
    <div style={{ position: "absolute", top: 26, left: 34, letterSpacing: 3, fontSize: 12, color: colors.gold }}>{eyebrow}</div>
    <div style={{ position: "relative", zIndex: 1, padding: "74px 72px 52px", height: "calc(100% - 126px)", boxSizing: "border-box" }}>{children}</div>
  </div>
}

function Button({ children, tone = colors.gold }: { children: React.ReactNode; tone?: string }) {
  return <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "15px 26px", background: tone, color: colors.ink, fontWeight: 900, letterSpacing: 1.5, borderRadius: 3, boxShadow: "5px 5px 0 rgba(0,0,0,.25)" }}>{children}</div>;
}

function Skater({ accent = colors.coral, x = 0 }: { accent?: string; x?: number }) {
  return <div style={{ position: "relative", width: 128, height: 220, transform: `translateX(${x}px)` }}>
    <div style={{ position: "absolute", left: 43, top: 8, width: 54, height: 54, borderRadius: "50%", background: "#8d552f", border: `7px solid ${accent}` }} />
    <div style={{ position: "absolute", left: 36, top: 67, width: 70, height: 82, borderRadius: "38% 38% 20% 20%", background: accent, transform: "skew(-7deg)" }} />
    <div style={{ position: "absolute", left: 14, top: 78, width: 38, height: 15, borderRadius: 8, background: colors.cream, transform: "rotate(26deg)" }} />
    <div style={{ position: "absolute", left: 46, top: 140, width: 16, height: 65, background: "#8d552f", transform: "rotate(13deg)", transformOrigin: "top" }} />
    <div style={{ position: "absolute", left: 77, top: 140, width: 16, height: 68, background: "#8d552f", transform: "rotate(-16deg)", transformOrigin: "top" }} />
    <div style={{ position: "absolute", left: 13, top: 200, width: 112, height: 9, background: colors.gold, borderRadius: "50%", transform: "rotate(-4deg)" }} />
  </div>;
}

export function AccraRushTitle() {
  return <Scene><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, alignItems: "center", height: "100%" }}>
    <div><div style={{ color: colors.cyan, fontWeight: 900, letterSpacing: 5, fontSize: 16 }}>A STREET ARCADE FROM GHANA</div><h1 style={{ margin: "18px 0 8px", fontSize: 76, lineHeight: .9, letterSpacing: -4, color: colors.cream }}>ACCRA<br /><span style={{ color: colors.gold }}>RUSH</span></h1><p style={{ fontSize: 19, maxWidth: 370, lineHeight: 1.5, color: "#f5dcb6" }}>Catch the rhythm. Chain the streets. Own the night.</p><div style={{ marginTop: 32 }}><Button>START RUN →</Button><span style={{ marginLeft: 24, color: colors.cyan, fontSize: 13 }}>BEST 12,480</span></div></div>
    <div style={{ display: "flex", alignItems: "end", justifyContent: "center", height: "100%" }}><div style={{ position: "relative" }}><div style={{ position: "absolute", bottom: 140, left: -112, background: colors.coral, color: colors.cream, padding: "10px 14px", fontWeight: 900, transform: "rotate(-6deg)" }}>OSU LOOP →</div><Skater accent={colors.coral} x={20} /></div></div>
  </div></Scene>;
}

export function AccraRushPick() {
  const cards = [["AMA", "FAST FEET", colors.coral], ["KOJO", "TRICK KING", colors.cyan], ["ESI", "SMOOTH LINE", colors.green]];
  return <Scene eyebrow="CHOOSE YOUR RIDER"><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 28 }}><div><div style={{ color: colors.gold, letterSpacing: 4, fontSize: 13, fontWeight: 900 }}>STEP 01 / 03</div><h2 style={{ fontSize: 42, margin: "10px 0 0" }}>WHO'S RIDING?</h2></div><div style={{ color: "#f5dcb6", fontSize: 14 }}>Each rider brings a different line.</div></div><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>{cards.map(([name, style, accent], i) => <div key={name} style={{ background: i === 0 ? colors.cream : "rgba(22,15,29,.7)", color: i === 0 ? colors.ink : colors.cream, padding: 22, minHeight: 350, borderTop: `8px solid ${accent}`, boxShadow: i === 0 ? "0 0 0 3px #f6c945" : "none" }}><div style={{ height: 210, display: "flex", justifyContent: "center", alignItems: "end" }}><Skater accent={accent} /></div><div style={{ fontWeight: 900, letterSpacing: 2, fontSize: 22 }}>{name}</div><div style={{ color: accent, fontWeight: 900, fontSize: 12, letterSpacing: 1.5, marginTop: 5 }}>{style}</div></div>)}</div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}><div style={{ color: "#f5dcb6", fontSize: 13 }}>← → to choose &nbsp; SPACE to confirm</div><Button>RIDE WITH AMA →</Button></div></Scene>;
}

export function AccraRushRun() {
  return <Scene eyebrow="OSU LOOP / 00:38"><div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}><div><div style={{ color: colors.cyan, fontWeight: 900, letterSpacing: 3, fontSize: 12 }}>SCORE</div><div style={{ fontSize: 44, fontWeight: 900 }}>08,420</div></div><div style={{ textAlign: "right" }}><div style={{ color: colors.gold, fontWeight: 900, letterSpacing: 3, fontSize: 12 }}>CHAIN</div><div style={{ fontSize: 32, fontWeight: 900, color: colors.gold }}>x4</div></div></div><div style={{ height: 305, display: "flex", alignItems: "end", justifyContent: "center", gap: 130, paddingBottom: 8 }}><div style={{ width: 100, height: 46, background: colors.coral, borderRadius: "45% 45% 8% 8%", transform: "translateY(-36px)" }} /><Skater accent={colors.coral} x={0} /><div style={{ width: 120, height: 34, background: colors.green, transform: "translateY(-22px) rotate(-3deg)" }} /></div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(22,15,29,.72)", padding: "15px 20px", borderLeft: `5px solid ${colors.gold}` }}><div><span style={{ color: colors.gold, fontWeight: 900 }}>CLEAN LANDING!</span><span style={{ marginLeft: 14, color: "#f5dcb6", fontSize: 13 }}>+640</span></div><div style={{ width: 180, height: 8, background: "#5a3b50" }}><div style={{ width: "72%", height: "100%", background: colors.cyan }} /></div><div style={{ color: colors.cream, fontSize: 12 }}>P / ESC TO PAUSE</div></div></Scene>;
}

export function AccraRushPause() {
  return <Scene eyebrow="RUN PAUSED"><div style={{ display: "grid", placeItems: "center", height: "100%" }}><div style={{ background: "rgba(22,15,29,.94)", padding: "38px 52px", width: 420, textAlign: "center", borderTop: `7px solid ${colors.gold}` }}><div style={{ color: colors.cyan, letterSpacing: 4, fontSize: 12, fontWeight: 900 }}>TAKE A BREATH</div><h2 style={{ fontSize: 42, margin: "12px 0 26px" }}>PAUSED</h2><div style={{ display: "grid", gap: 12 }}><Button>RESUME RUN</Button><div style={{ border: `2px solid ${colors.cyan}`, padding: "13px 22px", color: colors.cyan, fontWeight: 900 }}>RESTART ROUTE</div><div style={{ color: "#f5dcb6", fontSize: 13, marginTop: 12 }}>Sound  ON &nbsp; • &nbsp; Reduced motion  OFF</div></div></div></div></Scene>;
}

export function AccraRushGameOver() {
  return <Scene eyebrow="RUN COMPLETE"><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center", height: "100%" }}><div><div style={{ color: colors.coral, fontWeight: 900, letterSpacing: 4, fontSize: 13 }}>THAT'S THE LINE</div><h2 style={{ fontSize: 58, lineHeight: .95, margin: "14px 0" }}>RUN<br />ENDED</h2><p style={{ color: "#f5dcb6", lineHeight: 1.5 }}>The street keeps moving. Your next line can be cleaner.</p><div style={{ marginTop: 26 }}><Button>RIDE AGAIN →</Button><span style={{ marginLeft: 20, color: colors.cyan, fontSize: 13 }}>CHANGE RIDER</span></div></div><div style={{ background: "rgba(22,15,29,.82)", padding: 28, borderTop: `7px solid ${colors.gold}` }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", borderBottom: "1px solid #5a3b50", paddingBottom: 18 }}><div><div style={{ color: colors.cyan, fontSize: 12, letterSpacing: 2 }}>FINAL SCORE</div><div style={{ fontSize: 52, fontWeight: 900, color: colors.gold }}>12,480</div></div><div style={{ color: colors.green, fontWeight: 900 }}>NEW BEST</div></div><div style={{ display: "grid", gap: 12, marginTop: 20, color: "#f5dcb6" }}><div style={{ display: "flex", justifyContent: "space-between" }}><span>Distance</span><b>+8,900</b></div><div style={{ display: "flex", justifyContent: "space-between" }}><span>Trick chains</span><b>+2,840</b></div><div style={{ display: "flex", justifyContent: "space-between" }}><span>Waakye tokens</span><b>+740</b></div></div><div style={{ marginTop: 22, background: colors.green, padding: "12px 14px", color: colors.cream, fontWeight: 900 }}>BADGE EARNED: OSU LOOP</div></div></div></Scene>;
}
