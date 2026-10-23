// Password gate for the whole site, enforced on Netlify's edge so the page is never served
// without it. The password lives in the BOX_SCAN_PASSWORD environment variable, not in the repo.
// A correct password sets a signed cookie for 30 days; changing the password logs everyone out.

const COOKIE = "bs_auth";
const MAX_AGE = 60 * 60 * 24 * 30;

async function sign(password) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode("box-scan-v1"));
  return Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, "0")).join("");
}

function same(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function readCookie(req, name) {
  const all = req.headers.get("cookie") || "";
  for (const part of all.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

function loginPage(failed, status) {
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#114652">
<meta name="robots" content="noindex">
<title>Box Scanner · Sign in</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px;
    background: #F4F8FA; color: #424242; font: 16px/1.4 Montserrat, system-ui, Roboto, Arial, sans-serif; }
  .card { width: 100%; max-width: 360px; background: #fff; border-radius: 12px; overflow: hidden;
    box-shadow: 0 4px 30px rgba(17,70,82,.12); }
  .top { background: #114652; color: #fff; padding: 18px 20px 16px; }
  .top h1 { margin: 0; font-size: 20px; }
  .top p { margin: 4px 0 0; font-size: 13px; opacity: .8; }
  .stripe { display: flex; height: 5px; }
  .stripe i { flex: 1; }
  form { padding: 20px; }
  label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
  input { width: 100%; font: inherit; font-size: 18px; padding: 12px; border: 2px solid #E0EAF1; border-radius: 8px; }
  input:focus { outline: none; border-color: #1D75B9; }
  button { width: 100%; margin-top: 14px; font: inherit; font-weight: 700; font-size: 16px; padding: 12px;
    border: 0; border-radius: 8px; background: #1D75B9; color: #fff; }
  .err { background: #FCE9E9; color: #9C2322; border-radius: 8px; padding: 10px 12px; font-size: 14px; font-weight: 600; margin-bottom: 14px; }
</style>
</head><body>
<div class="card">
  <div class="top"><h1>Box Scanner</h1><p>Enter the password to continue</p></div>
  <div class="stripe"><i style="background:#1D75B9"></i><i style="background:#2FA6DE"></i><i style="background:#3E8891"></i><i style="background:#78B745"></i><i style="background:#CDD854"></i><i style="background:#F39623"></i><i style="background:#E96424"></i><i style="background:#E3272B"></i><i style="background:#803288"></i></div>
  <form method="post" action="/login">
    ${failed ? '<div class="err">Wrong password. Try again.</div>' : ""}
    <label for="pw">Password</label>
    <input id="pw" name="password" type="password" autocomplete="current-password" autofocus required>
    <button type="submit">Unlock</button>
  </form>
</div>
</body></html>`;
  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

export default async (req, context) => {
  const password = Netlify.env.get("BOX_SCAN_PASSWORD");
  if (!password) return new Response("Site password is not configured.", { status: 500 });

  const url = new URL(req.url);
  const token = await sign(password);
  const cookieBase = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax`;

  if (url.pathname === "/logout") {
    return new Response(null, { status: 303, headers: { location: "/", "set-cookie": cookieBase + "; Max-Age=0" } });
  }

  if (url.pathname === "/login" && req.method === "POST") {
    let given = "";
    try { given = String((await req.formData()).get("password") || ""); } catch { /* bad form */ }
    if (!same(given, password)) return loginPage(true, 401);
    return new Response(null, {
      status: 303,
      headers: { location: "/", "set-cookie": `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}` },
    });
  }

  if (same(readCookie(req, COOKIE), token)) {
    if (url.pathname === "/login") return new Response(null, { status: 303, headers: { location: "/" } });
    const upstream = await context.next();
    const res = new Response(upstream.body, upstream);
    res.headers.set("cache-control", "no-store");
    return res;
  }

  return loginPage(false, 401);
};

export const config = { path: "/*" };
