import os from "os"
import fs from "fs"
import * as Bun from "bun"
import * as Esbuild from "esbuild"

const root_dir = import.meta.dir
const public_dir = root_dir + "/public"


//////// PUBLIC WATCH & HOT RELOAD
///////

const reload_cmd = new ArrayBuffer(1)

let reload_timer: Timer

// fs events arrive per write, so wait for them to settle before reloading
function notify_reload() {
  clearTimeout(reload_timer)
  reload_timer = setTimeout(() => {
    for (const client of clients) {
      // enqueue throws if the client is gone but cancel() hasn't fired yet
      try {
        client.enqueue(reload_cmd)
      } catch {
        clients.delete(client)
      }
    }
  }, 50)
}

const build_outputs = [ "index.js", "index.js.map" ]

fs.watch(public_dir, { recursive: true }, (_, filename) => {
  if (!filename || build_outputs.includes(filename)) return
  notify_reload()
})

const clients = new Set<ReadableStreamDefaultController>

const new_reload_stream = (): ReadableStream => {
  let ctrl: ReadableStreamDefaultController
  return new ReadableStream({
    start(controller) {
      clients.add(ctrl = controller)
    },
    cancel() {
      clients.delete(ctrl)
    },
  })
}


//////// SOURCE WATCH & BUILD
///////

const externalize: Esbuild.Plugin = {
  name: "externalize",
  setup(build) {
    build.onResolve({ filter: /lil-gui/ }, ({ path }) => {
      return { path: "./vendors/" + path + ".js", external: true }
    })
  },
}

const reload_on_build: Esbuild.Plugin = {
  name: "reload_on_build",
  setup(build) {
    build.onEnd(({ errors }) => {
      if (errors.length === 0) notify_reload()
    })
  },
}

const ctx = await Esbuild.context({
  absWorkingDir: root_dir,

  entryPoints: [ "./public/index.ts" ],
  outfile:     "./public/index.js",

  bundle:    true,
  format:    "esm",
  target:    "es2022",
  platform:  "browser",
  sourcemap: "linked",

  loader: { ".glsl": "text" },

  plugins: [ externalize, reload_on_build ],
})

await ctx.watch()


//////// GET HTML & INJECT HOT RELOAD SCRIPT
///////

// if the connection drops (server restart), poll until it is back, then reload
const reload_script = `<script>(${
  function hmr_connect(was_down = false) {
    fetch("/hmr")
      .then(res => was_down
        ? location.reload()
        : res.body?.getReader().read().then(() => location.reload()))
      .catch(() => setTimeout(hmr_connect, 1000, true))
  }
})()</script>`

const reload_injecter = new HTMLRewriter().on("body", {
  element: (el) => void el.append(reload_script, { html: true }),
})

const get_html = async () => new Blob([
  reload_injecter.transform(await Bun.file(public_dir + "/index.html").text()),
], { type: "text/html" })


//////// SERVER
///////

const lan_addresses = Object.values(os.networkInterfaces())
  .flatMap(nets => nets ?? [])
  .filter(net => net.family === "IPv4" && !net.internal && !net.address.startsWith("169.254."))
  .map(net => net.address)

const res_options: ResponseInit = {
  headers: {
    // enable shared memory
    "Cross-Origin-Opener-Policy":   "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",

    // reload only revalidates the document, subresources may come from heuristic cache
    "Cache-Control": "no-store",
  },
}

const init_server = (port: number) => Bun.serve({
  development: true,
  idleTimeout: 0,

  port,
  hostname: "0.0.0.0",

  tls: {
    cert: Bun.file(root_dir + "/https/cert"),
    key:  Bun.file(root_dir + "/https/key"),
  },

  fetch: async (req, server) => {
    const url = new URL(req.url)
    const path = url.pathname

    if (req.method === "GET") {
      if (path === "/" || path === "/index.html") {
        return new Response(await get_html(), res_options)
      }

      if (path === "/hmr") {
        return new Response(new_reload_stream())
      }

      const file = Bun.file(public_dir + path)

      if (await file.exists()) {
        return new Response(file, res_options)
      }
    }

    return new Response(null, { status: 404 })
  },
})

const serve = (port: number) => {
  try {
    return init_server(port)
  }
  // if port is taken retry with next one
  catch (err: any) {
    if (err?.code !== "EADDRINUSE" || port >= 9191) throw err
    return serve(port + 1)
  }
}

const server = serve(9091)

console.log()
for (const address of [ "localhost", ...lan_addresses ]) {
  console.log(`\x1b[34mhttps://${address}:${server.port}\x1b[0m`)
}
console.log()
