import { h } from "./h"
import { new_ui_pool, ui_pool_get, ui_pool_put, type UI_Pool } from "./pool"

let printer: HTMLDivElement
let lines_pool: UI_Pool<"pre">
let last_line: HTMLPreElement
let clear_btn: HTMLPreElement
const lines: HTMLPreElement[] = []

/**
creates holder of `pre` elements for each printed line and appends it to the container.

default printer style:
```css
  position: absolute; top: 0; left: 0;
```
default line style:
```css
  width: fit-content; height: 20px; font: 16px/20px monospace;
```
*/
export const init_printer = (
  parent = document.body,
  printer_style = "",
  line_style = "",
): void => {
  if (printer) return
  printer = h("div", { style: "position:absolute;top:0;left:0;" + printer_style })
  const pre_style = "width:fit-content;height:20px;font:16px/20px monospace;" + line_style
  lines_pool = new_ui_pool("pre", 10, { style: pre_style })
  add_el()
  clear_btn = h("pre", {
    style:   `cursor:pointer;` + pre_style,
    onclick: () => {
      reset_printer()
      clear_btn.remove()
    },
  })
  parent.appendChild(printer)
}


const add_el = () => {
  last_line = ui_pool_get(lines_pool)
  lines.push(last_line)
  printer.appendChild(last_line)
}

const reset_printer = () => {
  for (const pre of lines) {
    pre.innerHTML = ""
    pre.remove()
  }
  ui_pool_put(lines_pool, ...lines)
  lines.length = 0
  add_el()
}


/** prints data joined with space */
export const printer_append_clear_btn = (label = "clear"): void => {
  clear_btn.textContent = `[ ${label} ]`
  printer.appendChild(clear_btn)
}


/** prints data separated by a space */
export const prints = (...data: unknown[]): void => {
  last_line.textContent += data.join(" ") + " "
}
/** clears content, then prints data separated by a space */
export const cprints = (...data: unknown[]): void => {
  reset_printer()
  last_line.textContent = data.join(" ") + " "
}


/** prints a new line with each data item */
export const printn = (...data: unknown[]): void => {
  for (const line of data) {
    last_line.textContent = line as string
    add_el()
  }
}
/** clears content, then prints a new line with each data item */
export const cprintn = (...data: unknown[]): void => {
  reset_printer()
  printn(...data)
}
