import { serve, sql } from "bun";
import App from "./index.html";
import mime from "mime-types";

serve({
    port: 3000,
    routes: {
        "/client/*": (req) => {
            const url = new URL(req.url);
            const pathname = url.pathname;
            const filePath = pathname.replace("/client/", "client/");
            
            const file = Bun.file(filePath);
            const mimeType = mime.lookup(pathname) || 'application/octet-stream';
            return new Response(file, {
                headers: { "Content-Type": mimeType },
            });
        },
        "/*": App,
    },
    fetch: () => new Response("Not Found", { status: 404 })
});
