// `npm test`: Node runs TypeScript directly, so the tests need no test framework.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { diffStats, parse } from '../src/lib/parseDiff.ts'

const DIFF = `diff --git a/src/app.ts b/src/app.ts
index 1111111..2222222 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -10,3 +10,4 @@ export function buildApp() {
   const a = 1
-  const b = 2
+  const b = 3
+  const c = 4
   return a
diff --git a/src/new.test.ts b/src/new.test.ts
new file mode 100644
index 0000000..3333333
--- /dev/null
+++ b/src/new.test.ts
@@ -0,0 +1,2 @@
+--- a line that starts like a file header
+it('works')
\\ No newline at end of file
`

test('files, line kinds and line numbers', () => {
  const [app, added] = parse(DIFF)
  assert.equal(app.path, 'src/app.ts')
  assert.deepEqual(
    app.lines.map((l) => [l.kind, l.old, l.new]),
    [
      ['hunk', undefined, undefined],
      ['ctx', 10, 10],
      ['del', 11, undefined],
      ['add', undefined, 11],
      ['add', undefined, 12],
      ['ctx', 12, 13],
    ],
  )
  assert.equal(added.path, 'src/new.test.ts')
  assert.deepEqual(
    added.lines.filter((l) => l.kind === 'add').map((l) => [l.text, l.new]),
    [
      ['--- a line that starts like a file header', 1],
      ["it('works')", 2],
    ],
  )
})

test('counts for the Changes tab', () => {
  assert.deepEqual(diffStats(DIFF), { files: 2, add: 4, del: 1 })
})
