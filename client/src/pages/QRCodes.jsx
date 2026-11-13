import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { api } from '../api';

export default function QRCodes() {
  const [mesas, setMesas] = useState([]);
  const [numero, setNumero] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(null);
  const baseUrl = window.location.origin;

  const cargarMesas = () => {
    setLoading(true);
    api.get('/api/mesas')
      .then((res) => setMesas(res.mesas || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarMesas();
  }, []);

  const urlMesa = (mesa) => `${baseUrl}/pedido?mesa=${mesa}`;

  const crearMesa = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    try {
      await api.post('/api/mesas', { numero: Number(numero) });
      setNumero('');
      setMensaje('Mesa creada. Su código QR ya está disponible.');
      cargarMesas();
    } catch (e) {
      setError(e.message);
    }
  };

  const copiar = async (mesa) => {
    try {
      await navigator.clipboard.writeText(urlMesa(mesa));
      setCopiado(mesa);
      setMensaje(`Enlace de la mesa ${mesa} copiado.`);
      window.setTimeout(() => setCopiado(null), 1800);
    } catch {
      setError('El navegador no permitió copiar el enlace. Puedes seleccionarlo y copiarlo manualmente.');
    }
  };

  return (
    <div className="qr-admin-page">
      <div className="admin-topbar no-print">
        <div>
          <h1>QR de las mesas</h1>
          <p className="muted">Genera, prueba e imprime el código que usarán los clientes.</p>
        </div>
        <button className="btn" onClick={() => window.print()} disabled={mesas.length === 0}>
          Imprimir todos los QR
        </button>
      </div>

      <div className="card no-print">
        <h2 className="section-title">Enlace público de esta aplicación</h2>
        <p className="qr-base-url">{baseUrl}</p>
        <p className="muted">
          Cada QR abre el menú público de su mesa. Cuando publiques el sistema en internet, entra aquí desde el dominio publicado y vuelve a imprimir los códigos.
        </p>
      </div>

      <div className="card no-print">
        <h2 className="section-title">Agregar una mesa</h2>
        <form className="form-row" onSubmit={crearMesa}>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Número de mesa"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            required
          />
          <button className="btn" type="submit">Crear mesa</button>
        </form>
        {error && <p className="form-error">{error}</p>}
        {mensaje && <p className="form-success">{mensaje}</p>}
      </div>

      <div className="qr-print-heading">
        <h2>Menús por mesa</h2>
        <p>Escanea el código con la cámara del celular para abrir el menú correspondiente.</p>
      </div>

      {loading && <div className="empty">Cargando mesas...</div>}
      {!loading && mesas.length === 0 && <div className="empty">No hay mesas registradas.</div>}

      <div className="qr-admin-grid">
        {mesas.map((mesa) => {
          const url = urlMesa(mesa.numero);
          return (
            <article className="qr-table-card" key={mesa.id || mesa.numero}>
              <h3>Mesa {mesa.numero}</h3>
              <div className="qr-image-wrap">
                <QRCode value={url} size={180} level="M" />
              </div>
              <p className="qr-table-caption">Escanea para realizar tu pedido</p>
              <p className="qr-table-url">{url}</p>
              <div className="qr-actions no-print">
                <button className="btn small" onClick={() => copiar(mesa.numero)}>
                  {copiado === mesa.numero ? 'Copiado ✓' : 'Copiar enlace'}
                </button>
                <a className="btn small secondary" href={url} target="_blank" rel="noreferrer">
                  Probar QR
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
