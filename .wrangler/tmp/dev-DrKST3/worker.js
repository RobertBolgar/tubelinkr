var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-V8u9B9/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// worker.js
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key"
        }
      });
    }
    const path2 = url.pathname;
    if (path2.startsWith("/api/users")) {
      return handleUsersAPI(request, env);
    }
    if (path2.startsWith("/api/links")) {
      return handleLinksAPI(request, env);
    }
    if (path2.startsWith("/api/click-events")) {
      return handleClickEventsAPI(request, env);
    }
    return new Response(JSON.stringify({
      message: "TubeLinkr API is working",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key"
      }
    });
  }
};
async function handleUsersAPI(request, env) {
  const url = new URL(request.url);
  if (request.method === "POST" && path === "/api/users") {
    const userData = await request.json();
    const sql = `
      INSERT INTO users (email, username, created_at, updated_at, is_active)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [userData.email, userData.username, (/* @__PURE__ */ new Date()).toISOString(), (/* @__PURE__ */ new Date()).toISOString(), true];
    const result = await env.DB.prepare(sql).bind(...params).run();
    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key"
      }
    });
  }
  if (request.method === "GET" && path.startsWith("/api/users/")) {
    const username = path.split("/api/users/")[1];
    const sql = `
      SELECT id, email, username, created_at, updated_at, is_active
      FROM users 
      WHERE username = ? AND is_active = ?
    `;
    const params = [username, true];
    const result = await env.DB.prepare(sql).bind(...params).first();
    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key"
      }
    });
  }
}
__name(handleUsersAPI, "handleUsersAPI");
async function handleLinksAPI(request, env) {
  const url = new URL(request.url);
  if (request.method === "POST" && path === "/api/links") {
    const linkData = await request.json();
    const sql = `
      INSERT INTO links (user_id, slug, original_url, title, created_at, updated_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      linkData.user_id,
      linkData.slug,
      linkData.original_url,
      linkData.title || null,
      (/* @__PURE__ */ new Date()).toISOString(),
      (/* @__PURE__ */ new Date()).toISOString(),
      true
    ];
    const result = await env.DB.prepare(sql).bind(...params).run();
    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key"
      }
    });
  }
  if (request.method === "GET" && path.startsWith("/api/links?")) {
    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get("user_id");
    const sql = `
      SELECT id, user_id, slug, original_url, title, created_at, updated_at, is_active
      FROM links 
      WHERE user_id = ? AND is_active = ?
      ORDER BY created_at DESC
    `;
    const params = [userId, true];
    const result = await env.DB.prepare(sql).bind(...params).all();
    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key"
      }
    });
  }
  if (request.method === "GET" && path.match(/^\/api\/links\/([^\/]+)$/)) {
    const linkId = path.match(/^\/api\/links\/([^\/]+)$/)[1];
    const sql = `
      SELECT id, user_id, slug, original_url, title, created_at, updated_at, is_active
      FROM links 
      WHERE id = ? AND is_active = ?
    `;
    const params = [linkId, true];
    const result = await env.DB.prepare(sql).bind(...params).first();
    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key"
      }
    });
  }
  if (request.method === "PUT" && path.match(/^\/api\/links\/([^\/]+)$/)) {
    const linkId = path.match(/^\/api\/links\/([^\/]+)$/)[1];
    const updateData = await request.json();
    const setClause = Object.keys(updateData).filter((key) => key !== "id").map((key) => `${key} = ?`).join(", ");
    const sql = `
      UPDATE links 
      SET ${setClause}, updated_at = ?
      WHERE id = ?
    `;
    const params = [...Object.values(updateData), (/* @__PURE__ */ new Date()).toISOString(), linkId];
    const result = await env.DB.prepare(sql).bind(...params).run();
    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key"
      }
    });
  }
  if (request.method === "DELETE" && path.match(/^\/api\/links\/([^\/]+)$/)) {
    const linkId = path.match(/^\/api\/links\/([^\/]+)$/)[1];
    const sql = `
      UPDATE links 
      SET is_active = ?, updated_at = ?
      WHERE id = ?
    `;
    const params = [false, (/* @__PURE__ */ new Date()).toISOString(), linkId];
    const result = await env.DB.prepare(sql).bind(...params).run();
    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key"
      }
    });
  }
  if (request.method === "GET" && path.match(/^\/api\/links\/([^\/]+)\/([^\/]+)$/)) {
    const matches = path.match(/^\/api\/links\/([^\/]+)\/([^\/]+)$/);
    const userId = matches[1];
    const slug = matches[2];
    const sql = `
      SELECT id, user_id, slug, original_url, title, created_at, updated_at, is_active
      FROM links 
      WHERE user_id = ? AND slug = ? AND is_active = ?
    `;
    const params = [userId, slug, true];
    const result = await env.DB.prepare(sql).bind(...params).first();
    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key"
      }
    });
  }
  return new Response("Not found", { status: 404 });
}
__name(handleLinksAPI, "handleLinksAPI");
async function handleClickEventsAPI(request, env) {
  const url = new URL(request.url);
  if (request.method === "POST" && path === "/api/click-events") {
    const eventData = await request.json();
    const sql = `
      INSERT INTO click_events (link_id, timestamp, referrer, user_agent, ip_hash, source)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      eventData.link_id,
      (/* @__PURE__ */ new Date()).toISOString(),
      eventData.referrer || null,
      eventData.user_agent || null,
      eventData.ip_hash || null,
      eventData.source || null
    ];
    const result = await env.DB.prepare(sql).bind(...params).run();
    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  if (request.method === "POST" && path === "/api/click-events") {
    const { link_ids } = await request.json();
    const placeholders = link_ids.map(() => "?").join(",");
    const sql = `
      SELECT id, link_id, referrer, user_agent, ip_hash, source, timestamp
      FROM click_events 
      WHERE link_id IN (${placeholders})
      ORDER BY timestamp DESC
    `;
    const params = [];
    const result = await env.DB.prepare(sql).bind(...params).all();
    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  return new Response("Not found", { status: 404 });
}
__name(handleClickEventsAPI, "handleClickEventsAPI");

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-V8u9B9/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-V8u9B9/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
