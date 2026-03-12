import { NextRequest, NextResponse } from 'next/server'

// Path Traversal challenge — simulates vulnerable file read endpoint
// Intended payload: ../../../../etc/passwd  OR  /secret/flag.txt  OR  ../admin/config.txt
const FLAG = 'flag{6e1b4d9a3c7f2e8b5a9d1c6f4e2b7a3d}'

const FAKE_FS: Record<string, string> = {
  'public/index.html':     '<html>Welcome</html>',
  'public/about.html':     '<html>About Us</html>',
  'public/style.css':      'body { color: #333; }',
  'uploads/logo.png':      '[binary data]',
  'admin/config.txt':      `# Admin Config\nflag=${FLAG}\ndebug=true\nsecret_key=s3cr3t`,
  '../../../../etc/passwd': `root:x:0:0:root:/root:/bin/bash\n...\n# Flag: ${FLAG}`,
  '../../../etc/passwd':    `root:x:0:0:root:/root:/bin/bash\n# Flag: ${FLAG}`,
  '../../admin/config.txt': `flag=${FLAG}`,
  '../admin/config.txt':    `flag=${FLAG}`,
  'secret/flag.txt':        FLAG,
}

export async function GET(req: NextRequest) {
  const filePath = req.nextUrl.searchParams.get('path') ?? 'public/index.html'

  // Check if traversal or sensitive file access
  const isTraversal = filePath.includes('..') || filePath.startsWith('/etc') || filePath.includes('admin') || filePath.includes('secret')

  const content = FAKE_FS[filePath]

  if (!content && !isTraversal) {
    return NextResponse.json({
      error: 'File not found',
      available: ['public/index.html', 'public/about.html', 'public/style.css'],
    }, { status: 404 })
  }

  if (isTraversal && !content) {
    // Generic traversal attempt — show the flag anyway for educational value
    return new NextResponse(`# Accessed: ${filePath}\n${FLAG}`, {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  return new NextResponse(content ?? '[empty]', {
    headers: { 'Content-Type': 'text/plain' },
  })
}
