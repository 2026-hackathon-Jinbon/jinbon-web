import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Jinbon verification experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>진본 \| 영상 진본 검증<\/title>/i);
  assert.match(html, /이 영상은/);
  assert.match(html, /진본 여부 확인하기/);
  assert.match(html, /하나의 영상, 세 겹의 확인/);
  assert.match(html, /원본 미보관/);
  assert.match(html, /미인증이 곧 위조나 딥페이크를 의미하지는 않습니다/);
  assert.doesNotMatch(html, /블록체인 검증 네트워크 연결됨/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});
