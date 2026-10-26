add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
# connect-src: the hosted API. Change it if VITE_API_BASE_URL points elsewhere.
# Inline styles are needed by the charts (Recharts sets style attributes).
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://expense-tracker-data-qypy.vercel.app; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" always;
