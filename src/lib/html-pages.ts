/**
 * Branded standalone HTML pages served straight from the redirect route
 * handler. A route handler (unlike a page) can return a real 404/410/429
 * status code together with styled markup — important for HTTP-correct
 * behavior on dead short links.
 *
 * All content is static — no user input is ever interpolated, so there is
 * no XSS surface here.
 */

interface ShellOptions {
  code: string;
  title: string;
  message: string;
}

function shell({ code, title, message }: ShellOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${code} — Linkpulse</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: #020617;
    color: #e2e8f0;
    background-image: radial-gradient(60rem 30rem at 50% -10%, rgba(139, 92, 246, 0.18), transparent);
  }
  main { text-align: center; padding: 2rem; max-width: 28rem; }
  .code {
    font-size: 5rem;
    font-weight: 800;
    letter-spacing: -0.05em;
    background: linear-gradient(135deg, #a78bfa, #e879f9);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  h1 { font-size: 1.25rem; font-weight: 600; margin-top: 0.5rem; }
  p { color: #94a3b8; font-size: 0.9375rem; line-height: 1.6; margin-top: 0.75rem; }
  a.btn {
    display: inline-block;
    margin-top: 1.75rem;
    padding: 0.625rem 1.25rem;
    border-radius: 0.625rem;
    background: #8b5cf6;
    color: #fff;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
  }
  a.btn:hover { background: #a78bfa; }
  .brand {
    margin-top: 3rem;
    font-size: 0.8125rem;
    color: #64748b;
    letter-spacing: 0.04em;
  }
</style>
</head>
<body>
<main>
  <div class="code">${code}</div>
  <h1>${title}</h1>
  <p>${message}</p>
  <a class="btn" href="/">Shorten a link instead</a>
  <div class="brand">Linkpulse — short links, long on insight</div>
</main>
</body>
</html>`;
}

export function notFoundPage(): string {
  return shell({
    code: "404",
    title: "This short link does not exist",
    message:
      "The link may have been deleted, or the address was typed incorrectly. Double-check the URL and try again.",
  });
}

export function gonePage(reason: "expired" | "limit"): string {
  return shell({
    code: "410",
    title: "This short link has expired",
    message:
      reason === "limit"
        ? "This link reached its maximum number of clicks and is no longer active."
        : "This link had an expiry date that has now passed. Ask the owner for a fresh one.",
  });
}

export function tooManyRequestsPage(retryAfterSeconds: number): string {
  return shell({
    code: "429",
    title: "Slow down a little",
    message: `You have hit the rate limit for this action. Try again in about ${retryAfterSeconds} second${
      retryAfterSeconds === 1 ? "" : "s"
    }.`,
  });
}

export function serverErrorPage(): string {
  return shell({
    code: "500",
    title: "Something went wrong on our side",
    message:
      "The redirect could not be completed right now. Please try again in a moment.",
  });
}
