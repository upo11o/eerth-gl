/**
  creates worker from source string
  @example
  ```typescript
  // dependency free function
  declare const worker_self: Function
  const worker = new_worker(`(${worker_self})()`)
  ```
*/
export const new_worker = (src: string): Worker => {
  const url = URL.createObjectURL(new Blob(
    [ src ],
    { type: "text/javascript" },
  ))
  const worker = new Worker(url)
  URL.revokeObjectURL(url)
  return worker
}
