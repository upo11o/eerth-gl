let printer: HTMLPreElement

/**
creates 'pre' element and appends it to the body (or container).

default style:
```css
  position: absolute;
  top: 0;
  left: 0;
  font-family: monospace;
  font-size: 16px;
  line-height: 18px;
```
*/
export const init_printer = (
  container?: HTMLElement | Nullish,
  style?: string,
) => {
  printer = document.createElement("pre")
  printer.setAttribute("style", "position:absolute;top:0;left:0;font-family:monospace;font-size:16px;line-height:20px")
  if (style) {
    const props = style.split(";")
    for (const prop of props) {
      printer.style.setProperty(...prop.split(":") as [string, string])
    }
  }
  (container ?? document.body).appendChild(printer)
}


/** prints data joined with space */
export const prints = (...data: unknown[]) => {
  printer.textContent += data.join(" ") + " "
}
/** clear text then prints data joined with space */
export const cprints = (...data: unknown[]) => {
  printer.textContent = data.join(" ") + " "
}


/** prints data joined with new line */
export const printn = (...data: unknown[]) => {
  printer.textContent += data.join("\n") + "\n"
}
/** clear text then prints data joined with new line*/
export const cprintn = (...data: unknown[]) => {
  printer.textContent = data.join("\n") + "\n"
}
