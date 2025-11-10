import { useEffect, useMemo, useRef, useState } from 'react'
import Spline from '@splinetool/react-spline'
import { motion, useMotionValue, useSpring } from 'framer-motion'

const DEEP_BG = '#0b0b0d'
const TEAL = '#00FFD1'
const AMBER = '#FFB77B'

function useDeviceTier() {
  const [tier, setTier] = useState('high')
  useEffect(() => {
    const isLow = window.devicePixelRatio <= 1 || window.innerWidth < 640
    setTier(isLow ? 'low' : 'high')
  }, [])
  return tier
}

export default function Hero3D() {
  const tier = useDeviceTier()
  const sceneUrl =
    (tier === 'low'
      ? import.meta.env.VITE_SPLINE_SCENE_URL_MOBILE
      : import.meta.env.VITE_SPLINE_SCENE_URL) ||
    // Fallback demo scene (replace with your published Spline URL)
    'https://prod.spline.design/0Yl9d3cLHDIa0nXj/scene.splinecode'

  const [hotspots, setHotspots] = useState([])
  const [loaded, setLoaded] = useState(false)
  const splineRef = useRef(null)

  // Pointer ripple
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const smx = useSpring(mx, { stiffness: 120, damping: 20 })
  const smy = useSpring(my, { stiffness: 120, damping: 20 })

  useEffect(() => {
    fetch('/hotspots.json')
      .then((r) => r.json())
      .then((data) => setHotspots(data))
      .catch(() => setHotspots([]))
  }, [])

  const onLoad = (spline) => {
    splineRef.current = spline
    setLoaded(true)
  }

  // Handle basic node click via name matching
  const onMouseDown = (e) => {
    const name = e?.target?.name?.toLowerCase?.() || ''
    const hs = hotspots.find((h) => name.includes(h.match))
    if (hs) {
      hs?.onClick === 'pulse' && triggerPulse(hs.id)
    }
  }

  // Micro interaction: confetti burst + pulse ring
  const [pulses, setPulses] = useState([])
  function triggerPulse(id) {
    const now = Date.now()
    setPulses((prev) => [...prev, { id: `${id}-${now}`, created: now }])
    setTimeout(() => {
      setPulses((prev) => prev.filter((p) => p.created !== now))
    }, 1200)
  }

  // Confetti emitter
  const [confetti, setConfetti] = useState([])
  function emitConfetti(x, y) {
    const items = Array.from({ length: 8 }).map((_, i) => ({
      id: `${Date.now()}-${i}`,
      x,
      y,
      r: 2 + Math.random() * 3,
      hue: Math.random() > 0.5 ? TEAL : AMBER,
      dx: (Math.random() - 0.5) * 2,
      dy: -Math.random() * 2 - 0.5,
      life: 0,
    }))
    setConfetti((prev) => [...prev, ...items])
    setTimeout(() => {
      setConfetti((prev) => prev.filter((c) => Date.now() - parseInt(c.id.split('-')[0]) < 900))
    }, 900)
  }

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    mx.set(x)
    my.set(y)
  }

  const handleHotspotHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    emitConfetti(x, y)
  }

  const gradientStyle = useMemo(
    () => ({
      background: `radial-gradient(600px 600px at ${smtx.get()}px ${smy.get()}px, rgba(0,255,209,0.10), transparent 60%)`,
    }),
    [smtx, smy]
  )

  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden" style={{ background: DEEP_BG }}>
      {/* Neon brand headline */}
      <div className="pointer-events-none absolute inset-x-0 top-8 z-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight" style={{ color: TEAL, textShadow: `0 0 12px ${TEAL}55, 0 0 32px ${TEAL}33` }}>
            GDesigns — Designs that speak
          </h1>
          <p className="mt-3 text-sm sm:text-base text-white/60">Premium print & brand mockups, crafted with love and tech.</p>
        </div>
      </div>

      {/* Spline canvas */}
      <div
        className="relative mx-auto mt-24 h-[60vh] sm:h-[70vh] w-[96%] max-w-6xl rounded-3xl border border-white/5 bg-[#0d0d10] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]"
        onPointerMove={handlePointerMove}
      >
        <div className="absolute inset-0">
          <Spline scene={sceneUrl} onLoad={onLoad} onMouseDown={onMouseDown} />
        </div>

        {/* Cinematic gradient lights overlay for extra polish */}
        <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-70">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full blur-3xl" style={{ background: `${TEAL}22` }} />
          <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full blur-3xl" style={{ background: `${AMBER}22` }} />
        </div>

        {/* Ripple following pointer */}
        <motion.div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ left: smtx, top: smy, width: 8, height: 8, boxShadow: `0 0 0 0 ${TEAL}33` }}
          animate={{ boxShadow: [`0 0 0 0 ${TEAL}33`, `0 0 0 24px ${TEAL}00`] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />

        {/* Pulses from hotspot clicks */}
        {pulses.map((p) => (
          <motion.span
            key={p.id}
            className="pointer-events-none absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ borderColor: `${TEAL}66` }}
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 6, opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        ))}

        {/* Shadowed studio floor */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28">
          <div className="absolute inset-x-12 bottom-6 h-24 rounded-[60%] blur-2xl" style={{ background: 'radial-gradient(60% 100% at 50% 0%, rgba(0,0,0,0.6), rgba(0,0,0,0))' }} />
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(120deg, rgba(255,255,255,0.04) 10%, transparent 10%, transparent 50%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.04) 60%, transparent 60%)', backgroundSize: '18px 18px' }} />
        </div>

        {/* Interactive hotspots overlay */}
        <div className="absolute inset-0 z-20">
          <div className="relative h-full w-full">
            {hotspots.map((h) => (
              <button
                key={h.id}
                onClick={() => triggerPulse(h.id)}
                onMouseEnter={handleHotspotHover}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `calc(${h.anchor.x * 100}% )`, top: `calc(${h.anchor.y * 100}% )` }}
                aria-label={h.title}
              >
                <span className="block h-3 w-3 rounded-full ring-2 ring-white/60 transition-all group-hover:scale-125" style={{ background: TEAL, boxShadow: `0 0 12px ${TEAL}66` }} />
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 rounded-md bg-white/10 px-2 py-1 text-xs text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                  {h.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Confetti particles */}
        <svg className="pointer-events-none absolute inset-0 z-10" style={gradientStyle}>
          {confetti.map((c) => (
            <circle key={c.id} cx={c.x} cy={c.y + (Date.now() - parseInt(c.id.split('-')[0])) * 0.08} r={c.r} fill={c.hue} opacity={0.8} />
          ))}
        </svg>
      </div>

      {/* CTA */}
      <div className="relative z-30 mx-auto mt-10 flex max-w-6xl flex-col items-center gap-4 px-6 text-center">
        <p className="text-white/70">
          Experience our tactile mockups: wedding invites, visiting cards, and large-format banners with foil, vellum, and glossy finishes.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="#"
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur hover:bg-white/10"
          >
            Explore portfolio
          </a>
          <a
            href="#"
            className="rounded-full border border-white/0 bg-[--teal] px-5 py-2 text-sm font-semibold text-black hover:opacity-90"
            style={{ ['--teal']: TEAL }}
          >
            Get a quote
          </a>
        </div>

        {/* Embed guidance */}
        <details className="mt-6 w-full max-w-3xl rounded-lg border border-white/10 bg-white/[0.03] p-4 text-left text-white/80">
          <summary className="cursor-pointer text-sm font-semibold text-white">Embed this hero elsewhere</summary>
          <div className="mt-3 text-xs opacity-90">
            <p>Use this iframe in any site. Swap the URL with your published Spline scene link.</p>
            <pre className="mt-2 overflow-auto rounded bg-black/50 p-3">{`<iframe src="${sceneUrl}" frameborder="0" width="100%" height="600" style="border-radius:20px;background:${DEEP_BG}"></iframe>`}</pre>
          </div>
        </details>
      </div>
    </section>
  )
}
