export const debounce = <T extends unknown[]>(delay: number, fn: (...args: T) => void) => {
  let timer = 0
  return (...args: T) => {
    clearTimeout(timer)
    timer = setTimeout(fn, delay, ...args)
  }
}


export const throttle = <T extends unknown[]>(
  delay: number,
  fn: (...args: T) => void,
) => {
  let last_args: T
  let last_time = -Infinity
  let scheduled = false

  const exec = () => {
    scheduled = false
    last_time = performance.now()
    fn(...last_args)
  }

  return (...args: T) => {
    last_args = args
    if (scheduled) return

    const remaining = delay - performance.now() + last_time
    if (remaining <= 0) {
      exec()
    } else {
      scheduled = true
      setTimeout(exec, remaining)
    }
  }
}


export const async_debounce = <T extends unknown[]>(
  delay: number,
  fn: (...args: T) => Promise<void>,
) => {
  let last_args: T
  let timer = 0
  let scheduled = false
  let executing = false

  const exec = async () => {
    scheduled = false
    executing = true
    try {
      await fn(...last_args)
    } finally {
      executing = false
      if (scheduled) {
        timer = setTimeout(exec, delay)
      }
    }
  }

  return (...args: T) => {
    scheduled = true
    last_args = args
    clearTimeout(timer)
    if (!executing) {
      timer = setTimeout(exec, delay)
    }
  }
}

