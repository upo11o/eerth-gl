import { h } from "./h"


export const qweasd_down_event  = "eerth-qweasd-down-event"
export const qweasd_up_event    = "eerth-qweasd-up-event"
export const qweasd_shift_event = "eerth-qweasd-shift-event"
export const qweasd_clear_event = "eerth-qweasd-clear"

const new_ev = <T extends string | boolean>(type: string, detail?: T) => new CustomEvent(type, { detail })

const a_down = new_ev(qweasd_down_event, "KeyA")
const d_down = new_ev(qweasd_down_event, "KeyD")
const q_down = new_ev(qweasd_down_event, "KeyQ")
const e_down = new_ev(qweasd_down_event, "KeyE")
const s_down = new_ev(qweasd_down_event, "KeyS")
const w_down = new_ev(qweasd_down_event, "KeyW")

const a_up = new_ev(qweasd_up_event, "KeyA")
const d_up = new_ev(qweasd_up_event, "KeyD")
const q_up = new_ev(qweasd_up_event, "KeyQ")
const e_up = new_ev(qweasd_up_event, "KeyE")
const s_up = new_ev(qweasd_up_event, "KeyS")
const w_up = new_ev(qweasd_up_event, "KeyW")

const shift_down = new_ev(qweasd_shift_event, true)
const shift_up   = new_ev(qweasd_shift_event, false)

const clear_event = new_ev(qweasd_clear_event)


const new_char_btn = (
  name: string,
  arrow: string,
  color: string,
  down_event: CustomEvent<string>,
  up_event: CustomEvent<string>,
) => {
  const span = h("span", { style: `color:${color}` }, arrow)
  const btn = h("div", {
    onpointerdown: (e: PointerEvent) => {
      if (e.button !== 0) return
      btn.setPointerCapture(e.pointerId)
      dispatchEvent(down_event)
    },
    onpointerup:     () => dispatchEvent(up_event),
    onpointercancel: () => dispatchEvent(up_event),

    class: "eerth-qweasd-char",
  }, name, " ", span)
  return btn
}


let qweasd_style_sheet: CSSStyleSheet

export const init_qweasd = (
  container?: HTMLElement | null,
  style?: string,
): HTMLDivElement => {

  const gap_size = 6
  const btn_size = 56
  const sft_size = btn_size * 1.5
  const emp_size = btn_size * 1.125
  const wrp_size = btn_size * 3 + gap_size * 3 + sft_size

  const qweasd = h("div", { class: "eerth-qweasd-wrap", style })

  const check = h("span", { style: "color:#3b3;visibility:hidden" }, "🔥")
  const shift = h("div", {
    onpointerdown: (e: PointerEvent) => {
      if (e.button !== 0) return
      if (check.style.visibility === "visible") {
        dispatchEvent(shift_up)
        check.style.visibility = "hidden"
      } else {
        dispatchEvent(shift_down)
        check.style.visibility = "visible"
      }
    },
    class: "eerth-qweasd-char",
    style: `width:${sft_size}px`,
  }, "shift ", check)

  qweasd.append(
    h("div", { style: `width:${emp_size}px` }),
    new_char_btn("Q", "↓", "#3a3", q_down, q_up),
    new_char_btn("W", "↑", "#57f", w_down, w_up),
    new_char_btn("E", "↑", "#3a3", e_down, e_up),
    shift,
    new_char_btn("A", "←", "#e53", a_down, a_up),
    new_char_btn("S", "↓", "#57f", s_down, s_up),
    new_char_btn("D", "→", "#e53", d_down, d_up),
  )

  if (!qweasd_style_sheet) {
    qweasd_style_sheet = new CSSStyleSheet()

    qweasd_style_sheet.insertRule(`.eerth-qweasd-wrap{position:absolute;bottom:0;right:0;margin:${gap_size}px;width:${wrp_size}px;display:flex;flex-wrap:wrap;gap:${gap_size}px}`)

    qweasd_style_sheet.insertRule(`.eerth-qweasd-char{width:${btn_size}px;height:${btn_size}px;padding:${gap_size}px ${gap_size * 1.5}px;display:flex;align-items:baseline;font:1rem/1rem sans-serif;border:1px solid #fff7;box-shadow:1px 1px 4px #0007;backdrop-filter:blur(8px);border-radius:8px;box-sizing:border-box;user-select:none;touch-action:none;-webkit-user-select:none;-webkit-touch-callout:none;& span{font:1.5rem/1rem monospace}}`)

    document.adoptedStyleSheets.push(qweasd_style_sheet)
  }

  ;(container ?? document.body).appendChild(qweasd)

  addEventListener("keydown", () => {
    dispatchEvent(clear_event)
    qweasd.remove()
  }, { once: true })

  return qweasd
}
