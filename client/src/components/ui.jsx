import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

/* ---------- Iconos (trazo, 24x24) ---------- */
const PATHS = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  receipt: 'M6 2h12v20l-3-2-3 2-3-2-3 2V2zM9 8h6M9 12h6',
  qr: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v3M14 20h3M20 20h1',
  flame: 'M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z',
  box: 'M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8',
  layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5',
  users: 'M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-1a4 4 0 00-3-3.9M16 4.1a3.5 3.5 0 010 6.8',
  coin: 'M12 21a9 9 0 100-18 9 9 0 000 18zM14.5 9.5c-.6-.8-1.5-1.2-2.5-1.2-1.5 0-2.5.8-2.5 1.8s1 1.5 2.5 1.9 2.5.9 2.5 1.9-1 1.8-2.5 1.8c-1 0-2-.4-2.5-1.2M12 6.5v1.8M12 15.7v1.8',
  file: 'M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8l-5-5zM14 3v5h5M9 13h6M9 17h6',
  graph: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  phone: 'M7 2h10a1 1 0 011 1v18a1 1 0 01-1 1H7a1 1 0 01-1-1V3a1 1 0 011-1zM11 18h2',
  chef: 'M7 14V9a4 4 0 017.5-2A3.5 3.5 0 0118 13v1M7 14h11v6H7z',
  out: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  refresh: 'M20 11a8 8 0 00-14.9-3M4 4v4h4M4 13a8 8 0 0014.9 3M20 20v-4h-4',
};

export function Icon({ name, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

export function BrandMark({ size = 34 }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }}>
      <Icon name="receipt" size={Math.round(size * 0.6)} />
    </span>
  );
}

/* ---------- Avisos (reemplazan a alert) ---------- */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const nextId = useRef(0);
  const toast = useCallback((text, kind = 'ok') => {
    const id = ++nextId.current;
    setItems((l) => [...l, { id, text, kind }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), kind === 'error' ? 5000 : 3000);
  }, []);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>{t.text}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Interruptor accesible ---------- */
export function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)} />
  );
}

/* ---------- Número que cuenta hacia su valor ---------- */
export function CountUp({ value, format = (n) => Math.round(n).toString() }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(value); return; }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / 900, 1);
      setShown(value * (1 - Math.pow(1 - t, 4)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{format(shown)}</>;
}

export const Skeleton = ({ h = 18, w = '100%' }) => <div className="skeleton" style={{ height: h, width: w }} />;

export function SkeletonRows({ n = 4 }) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {Array.from({ length: n }, (_, i) => <Skeleton key={i} h={22} />)}
    </div>
  );
}

export const ESTADO_TXT = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

export const Badge = ({ estado }) => <span className={`badge ${estado}`}>{ESTADO_TXT[estado] || estado}</span>;

/* Minutos desde un created_at de SQLite (UTC, sin zona) */
export function minutesSince(createdAt, now = Date.now()) {
  const t = Date.parse(String(createdAt).replace(' ', 'T') + 'Z');
  return Number.isNaN(t) ? 0 : Math.max(0, Math.floor((now - t) / 60000));
}
