import { createServer } from "node:http"
import next from "next"

const dev = process.env.NODE_ENV !== "production"
const hostname = "http://192.168.29.90:3000/"
const port = 3000
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(handler)

  // No Socket.io setup needed anymore as we're using Supabase Realtime
  // Signaling is now handled by Supabase Realtime channels

  httpServer
    .once("error", (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})

