export default function SecretVault() {
  return (
    <div style={{ fontFamily: 'monospace', background: '#0f172a', color: '#22d3ee', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <pre style={{ color: '#475569', fontSize: 12 }}>{`
  ██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗
  ██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝
  ██║   ██║███████║██║   ██║██║     ██║
  ╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║
   ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║
    ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  `}</pre>
      <p style={{ color: '#64748b', fontSize: 14 }}>You found the secret vault. 🔐</p>
      <code style={{ background: '#1e293b', padding: '12px 24px', borderRadius: 8, border: '1px solid #334155', fontSize: 14 }}>
        flag&#123;d4078fd0f999e68088896142089c4baf&#125;
      </code>
    </div>
  )
}
