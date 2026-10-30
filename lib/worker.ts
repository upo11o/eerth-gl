export const new_worker = (src: string): Worker => new Worker(URL.createObjectURL(new Blob(
  [ src ],
  { type: "text/javascript" },
)))
