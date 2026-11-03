export const new_logger = (prefix: string, color: string, background = "transparent") => {
  prefix = `%c${prefix}`
  color = `color: ${color}; background-color: ${background}`
  const log = (...args: any[]) => console.log(prefix, color, ...args)
  const warn = (...args: any[]) => console.warn(prefix, color, ...args)
  const error = (...args: any[]) => console.error(prefix, color, ...args)
  return { log, warn, error }
}
