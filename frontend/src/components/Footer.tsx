export function Footer() {
  return (
    <footer className="mt-8 py-4 border-t border-white/5 text-center text-text-muted text-xs">
      <p>
        OpenClaw Dashboard{' '}
        <span className="font-medium text-text">v1.0.0</span>
        {' '}|{' '}
        Running in Docker Container
      </p>
      <p className="mt-1">
        VPS: srv1318420 &mdash; Auto-refresh every 30 s
      </p>
    </footer>
  );
}
