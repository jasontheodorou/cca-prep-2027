import { forwardRef, useImperativeHandle, useRef } from 'react'

/* Clawd, the small coral character from ~/Desktop/clawd-gentle-v6 (Gentle
 * gestures v6). Used on Course only, with the progress gesture (Jason,
 * 18 October 2026). Still until there is a reason to move: each gesture
 * lasts about a second and never loops. All four gestures are kept here:
 *   course           a nod and a blink
 *   momentum         tiny happy feet
 *   progress         a small hop with three bits of confetti
 *   recommendations  a head tilt and a wink, with one glint
 * With reduced motion he stays still; confetti and glints only fade. Pressing
 * him plays his gesture. The animation code is a port of the folder's
 * clawd.js, without its global. */

export type ClawdMode = 'course' | 'momentum' | 'progress' | 'recommendations'
export type ClawdHandle = { play: (gesture?: ClawdMode) => void; climb: () => void }

const POSES: Record<ClawdMode, string[]> = {
  course: ['translateY(0) scale(1)', 'translateY(3px) scale(1.01,.99)', 'translateY(0) scale(1)'],
  momentum: ['rotate(0deg) translateY(0)', 'rotate(-2deg) translateY(-2px)', 'rotate(2deg) translateY(-2px)', 'rotate(0deg) translateY(0)'],
  progress: [
    'translateY(0) scale(1)',
    'translateY(3px) scale(1.025,.975)',
    'translateY(-9px) scale(.99,1.01)',
    'translateY(1px) scale(1.015,.985)',
    'translateY(0) scale(1)',
  ],
  recommendations: ['rotate(0deg)', 'rotate(4deg)', 'rotate(4deg)', 'rotate(0deg)'],
}

const BODY = 'M72 91H331V152H390V215H331V344H294V277H264V344H231V277H170V344H136V277H107V344H72V215H12V152H72Z'
const TORSO = 'M72 91H331V152H390V215H331V277H72V215H12V152H72Z'

function animate(svg: SVGSVGElement, mode: ClawdMode, running: { current: boolean }) {
  if (running.current) return // let the short gesture finish
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const all: Animation[] = []
  const a = (el: Element | null, frames: Keyframe[], options: KeyframeAnimationOptions = {}) => {
    if (el) all.push(el.animate(frames, { duration: 850, easing: 'ease-in-out', ...options }))
  }
  if (!reduced) {
    a(svg.querySelector('.actor'), POSES[mode].map((transform) => ({ transform })))
    if (mode === 'course')
      a(svg.querySelector('.eyes'), [
        { transform: 'scaleY(1)' },
        { transform: 'scaleY(1)', offset: 0.2 },
        { transform: 'scaleY(.18)', offset: 0.34 },
        { transform: 'scaleY(1)', offset: 0.49 },
        { transform: 'scaleY(1)' },
      ])
    if (mode === 'momentum') {
      a(svg.querySelector('.feet-left'), [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-9px)', offset: 0.25 },
        { transform: 'translateY(0)', offset: 0.5 },
        { transform: 'translateY(0)' },
      ])
      a(svg.querySelector('.feet-right'), [
        { transform: 'translateY(0)' },
        { transform: 'translateY(0)', offset: 0.5 },
        { transform: 'translateY(-9px)', offset: 0.75 },
        { transform: 'translateY(0)' },
      ])
    }
    if (mode === 'progress')
      a(svg.querySelector('.eyes'), [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.55)', offset: 0.4 }, { transform: 'scaleY(1)' }])
    if (mode === 'recommendations')
      a(svg.querySelector('.eye-right'), [
        { transform: 'scaleY(1)' },
        { transform: 'scaleY(1)', offset: 0.35 },
        { transform: 'scaleY(.12)', offset: 0.48 },
        { transform: 'scaleY(1)', offset: 0.65 },
        { transform: 'scaleY(1)' },
      ])
  }
  svg.querySelectorAll<SVGGElement>(`.particle[data-for='${mode}']`).forEach((el, i) => {
    const dx = Number(el.dataset.dx)
    const dy = Number(el.dataset.dy)
    if (reduced) a(el, [{ opacity: 0 }, { opacity: 0.65, offset: 0.35 }, { opacity: 0 }], { duration: 450 })
    else
      a(
        el,
        [
          { opacity: 0, transform: 'translate(0,6px) scale(.3)' },
          { opacity: 0.9, transform: `translate(${dx * 0.3}px,${dy * 0.3}px) scale(1)`, offset: 0.3 },
          { opacity: 0, transform: `translate(${dx}px,${dy}px) scale(.55)` },
        ],
        { duration: 650, delay: 130 + i * 55, easing: 'ease-out' },
      )
  })
  if (!all.length) return
  running.current = true
  Promise.all(all.map((x) => x.finished.catch(() => {}))).then(() => {
    running.current = false
  })
}

/* The entrance: he climbs up from behind the card he stands on. His box is
 * clipped at the card's top edge, so while he is low he is hidden behind it.
 * Eyes first, a pause and a blink, two pulls up, then his gesture. */
function climb(svg: SVGSVGElement, then: () => void) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return then()
  const rise = svg.animate(
    [
      { transform: 'translateY(100%)', easing: 'cubic-bezier(.3,.7,.4,1)' },
      { transform: 'translateY(62%)', offset: 0.22 },
      { transform: 'translateY(62%)', offset: 0.5, easing: 'cubic-bezier(.4,0,.3,1)' },
      { transform: 'translateY(34%) rotate(-3deg)', offset: 0.68, easing: 'cubic-bezier(.4,0,.3,1)' },
      { transform: 'translateY(6%) rotate(2deg)', offset: 0.86, easing: 'cubic-bezier(.3,.7,.4,1)' },
      { transform: 'translateY(0) rotate(0deg)' },
    ],
    { duration: 1700, delay: 500, fill: 'backwards' },
  )
  svg.querySelector('.eyes')?.animate(
    [
      { transform: 'scaleY(1)' },
      { transform: 'scaleY(1)', offset: 0.34 },
      { transform: 'scaleY(.15)', offset: 0.38 },
      { transform: 'scaleY(1)', offset: 0.42 },
      { transform: 'scaleY(1)' },
    ],
    { duration: 1700, delay: 500 },
  )
  rise.finished.then(then).catch(() => {})
}

export const Clawd = forwardRef<ClawdHandle, { mode: ClawdMode; className?: string }>(function Clawd({ mode, className }, ref) {
  const svg = useRef<SVGSVGElement>(null)
  const running = useRef(false)
  const play = (gesture: ClawdMode = mode) => svg.current && animate(svg.current, gesture, running)
  useImperativeHandle(ref, () => ({
    play,
    // After climbing up he nods and blinks, so the entrance does not repeat
    // the hop he does when pressed.
    climb: () => svg.current && climb(svg.current, () => window.setTimeout(() => play('course'), 150)),
  }))

  return (
    <button type="button" className={`clawd ${className ?? ''}`} aria-label="Clawd. Press to say hello." onClick={() => play()}>
      <svg ref={svg} viewBox="-25 -20 450 420" aria-hidden="true" focusable="false">
        <g className="actor">
          {mode === 'momentum' ? (
            <g fill="currentColor">
              <path d={TORSO} />
              <g className="feet-left">
                <path d="M72 267H107V344H72ZM231 267H264V344H231Z" />
              </g>
              <g className="feet-right">
                <path d="M136 267H170V344H136ZM294 267H331V344H294Z" />
              </g>
            </g>
          ) : (
            <path fill="currentColor" d={BODY} />
          )}
          <g className="eyes" fill="#11110f">
            <path d="M107 119H141V153H107Z" />
            <path className="eye-right" d="M261 119H295V153H261Z" />
          </g>
        </g>
        {/* Confetti for the hop and a glint for the wink, always drawn and
            invisible until their gesture plays. */}
        <g className="particle" data-for="progress" data-dx="-14" data-dy="-18" fill="#d8a642">
          <rect x="131" y="76" width="6" height="6" rx="1" />
        </g>
        <g className="particle" data-for="progress" data-dx="0" data-dy="-25" fill="#fa5b45">
          <path d="M202 58L204 63L209 65L204 67L202 72L200 67L195 65L200 63Z" />
        </g>
        <g className="particle" data-for="progress" data-dx="14" data-dy="-18" fill="#d8a642">
          <rect x="269" y="76" width="6" height="6" rx="1" />
        </g>
        <g className="particle" data-for="recommendations" data-dx="8" data-dy="-21" fill="#d8a642">
          <path d="M260 66L262 71L267 73L262 75L260 80L258 75L253 73L258 71Z" />
        </g>
      </svg>
    </button>
  )
})
