// Parses `git diff` output into files and lines with old and new line numbers.
export type Line = { kind: 'add' | 'del' | 'ctx' | 'hunk'; text: string; old?: number; new?: number }
export type File = { path: string; lines: Line[]; add: number; del: number }

export function parse(diff: string): File[] {
  const files: File[] = []
  let f: File | null = null
  let inHunk = false
  let o = 0
  let n = 0
  for (const line of diff.split('\n')) {
    if (line.startsWith('diff --git ')) {
      f = { path: line.slice(line.lastIndexOf(' b/') + 3), lines: [], add: 0, del: 0 }
      files.push(f)
      inHunk = false
    } else if (!f) {
      continue
    } else if (line.startsWith('@@')) {
      const m = /^@@ -(\d+)(?:,\d+)? \+(\d+)/.exec(line)
      o = Number(m?.[1] ?? 0)
      n = Number(m?.[2] ?? 0)
      f.lines.push({ kind: 'hunk', text: line })
      inHunk = true
    } else if (!inHunk || line.startsWith('\\')) {
      continue // file headers and "No newline at end of file"
    } else if (line.startsWith('+')) {
      f.lines.push({ kind: 'add', text: line.slice(1), new: n++ })
      f.add++
    } else if (line.startsWith('-')) {
      f.lines.push({ kind: 'del', text: line.slice(1), old: o++ })
      f.del++
    } else if (line.startsWith(' ')) {
      f.lines.push({ kind: 'ctx', text: line.slice(1), old: o++, new: n++ })
    }
  }
  return files
}

export function diffStats(diff: string) {
  const files = parse(diff)
  return { files: files.length, add: files.reduce((s, f) => s + f.add, 0), del: files.reduce((s, f) => s + f.del, 0) }
}
