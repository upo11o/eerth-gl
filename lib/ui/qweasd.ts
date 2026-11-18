import { h } from "./h"


export const qweasd_down_event  = "eerth-qweasd-down-event"
export const qweasd_up_event    = "eerth-qweasd-up-event"
export const qweasd_shift_event = "eerth-qweasd-shift-event"
export const qweasd_clear_event = "eerth-qweasd-clear"

const new_ev = <T extends string | boolean>(type: string, detail?: T) => new CustomEvent(type, { detail })

const a_down = new_ev(qweasd_down_event, "A")
const d_down = new_ev(qweasd_down_event, "D")
const q_down = new_ev(qweasd_down_event, "Q")
const e_down = new_ev(qweasd_down_event, "E")
const s_down = new_ev(qweasd_down_event, "S")
const w_down = new_ev(qweasd_down_event, "W")

const a_up = new_ev(qweasd_up_event, "A")
const d_up = new_ev(qweasd_up_event, "D")
const q_up = new_ev(qweasd_up_event, "Q")
const e_up = new_ev(qweasd_up_event, "E")
const s_up = new_ev(qweasd_up_event, "S")
const w_up = new_ev(qweasd_up_event, "W")

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

  const qweasd = h("div", { class: "eerth-qweasd-wrap", style })

  const check = h("span", { style: "color:#0000" }, "●")
  const shift = h("div", {
    onpointerdown: (e: PointerEvent) => {
      if (e.button !== 0) return
      if (shift.style.background) {
        dispatchEvent(shift_up)
        shift.style.removeProperty("background")
        check.style.color = "#0000"
      } else {
        dispatchEvent(shift_down)
        shift.style.background = "#fff4"
        check.style.color = "#3b3"
      }
    },
    class: "eerth-qweasd-char",
    style: "width:112px",
  }, "shift ", check)

  qweasd.append(
    h("div", { style: "width:112px" }),
    new_char_btn("Q", "↓", "#3b3", q_down, q_up),
    new_char_btn("W", "↑", "#55f", w_down, w_up),
    new_char_btn("E", "↑", "#3b3", e_down, e_up),
    shift,
    new_char_btn("A", "←", "#f33", a_down, a_up),
    new_char_btn("S", "↓", "#55f", s_down, s_up),
    new_char_btn("D", "→", "#f33", d_down, d_up),
  )

  if (!qweasd_style_sheet) {
    qweasd_style_sheet = new CSSStyleSheet()
    qweasd_style_sheet.insertRule(".eerth-qweasd-wrap{position:absolute;bottom:0;right:0;margin:8px;width:328px;display:flex;flex-wrap:wrap;gap:8px}")
    qweasd_style_sheet.insertRule(".eerth-qweasd-char{width:64px;height:64px;padding:8px;border:2px solid #fff;border-radius:8px;font:bold 16px/16px sans-serif;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;box-sizing:border-box;& span{font:24px/16px monospace}}")
    document.adoptedStyleSheets.push(qweasd_style_sheet)
  }

  ;(container ?? document.body).appendChild(qweasd)

  addEventListener("keydown", () => {
    dispatchEvent(clear_event)
    qweasd.remove()
  }, { once: true })

  return qweasd
}
