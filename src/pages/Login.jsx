import { useNavigate, useParams } from 'react-router-dom';
import api from '../config/api';
import { Lock, User, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

// IMPORTAMOS EL LOGO (Este será el fallback)
import logoMochis from '../assets/mochis_punto_net_logo.png';

export default function Login({ isAdmin = false }) {
  const { clientSlug } = useParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientConfig, setClientConfig] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Si estamos en modo /admin, no intentamos descargar config
    if (isAdmin) {
      setClientConfig(null);
      setIsConfigLoading(false);
      return;
    }

    if (clientSlug) {
      setIsConfigLoading(true);
      setNotFound(false);
      api.get(`/public/client/${clientSlug}`)
        .then(res => {
          setClientConfig(res.data);
          setIsConfigLoading(false);
        })
        .catch(err => {
          console.error("Error al obtener config del cliente:", err);
          setNotFound(true);
          setIsConfigLoading(false);
        });
    }
  }, [clientSlug, isAdmin]);

  // useEffect(() => {
  //     const token = localStorage.getItem('token');

  //     if (token) {
  //       navigate('/dashboard');
  //     }
  //   }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: username,
        password,
        slug: isAdmin ? undefined : clientSlug // Enviamos slug solo si no somos el super admin
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('role', res.data.user.role);

      if (!isAdmin && clientSlug) {
        localStorage.setItem('clientSlug', clientSlug);
      } else if (isAdmin) {
        localStorage.removeItem('clientSlug');
      }

      if (res.data.user.role === 'super_admin' || res.data.user.role === 'super_agent') {
        navigate('/dashboard');
      } else {
        navigate(`/${clientSlug}/media`);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Credenciales incorrectas';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Variables dinámicas
  const finalLogo = clientConfig?.logo_url || logoMochis;
  const primaryColor = clientConfig?.primary_color || '#01597d';
  const secondaryColor = clientConfig?.secondary_color || '#003656';

  const dynamicContainerStyle = {
    ...containerStyle,
    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
  };

  const dynamicButtonStyle = {
    ...buttonStyle,
    backgroundColor: primaryColor
  };

  if (isConfigLoading) {
    return (
      <div style={dynamicContainerStyle}>
        <div style={{ color: 'white', fontWeight: '600' }}>Cargando información del cliente...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={dynamicContainerStyle}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <img src={logoMochis} alt="Mochis" style={logoStyle} />
          <h2 style={{ color: '#111827', fontSize: '24px', fontWeight: '800' }}>Página no encontrada</h2>
          <p style={{ color: '#6b7280', marginBottom: '25px' }}>El cliente que buscas no existe o fue deshabilitado.</p>
          <button onClick={() => navigate('/')} style={dynamicButtonStyle}>Regresar al inicio</button>
        </div>
      </div>
    );
  }

  return (
    <div style={dynamicContainerStyle}>
      <div style={cardStyle}>
        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>

          {/* LOGO */}
          <img
            src={finalLogo}
            alt="Logo"
            style={logoStyle}
          />

        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleLogin}>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Usuario</label>
            <div style={inputContainer}>
              <User size={18} color="#9ca3af" />
              <input
                type="text"
                required
                placeholder="nombre.usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={labelStyle}>Contraseña</label>
            <div style={inputContainer}>
              <Lock size={18} color="#9ca3af" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={dynamicButtonStyle}
          >
            {loading ? 'Entrando...' : 'Iniciar Sesión'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- ESTILOS ---

const containerStyle = {
  height: '100vh',
  width: '100vw',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  // CAMBIO AQUÍ: Usamos tus colores en degradado
  background: 'linear-gradient(135deg, #01597d 0%, #003656 100%)',
  fontFamily: '"Inter", sans-serif'
};

const cardStyle = {
  backgroundColor: 'white',
  padding: '40px',
  borderRadius: '16px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', // Sombra un poco más fuerte para contrastar con el fondo oscuro
  width: '100%',
  maxWidth: '400px'
};

const logoStyle = {
  width: 'auto',
  maxWidth: '240px',
  height: 'auto',
  maxHeight: '80px',
  objectFit: 'contain'
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: '#374151',
  marginBottom: '8px'
};

const inputContainer = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  backgroundColor: '#f9fafb'
};

const inputStyle = {
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  width: '100%',
  fontSize: '15px',
  color: '#111827'
};

// Ajusté el color del botón para que combine con tu nuevo fondo
const buttonStyle = {
  width: '100%',
  padding: '14px',
  backgroundColor: '#01597d', // Usamos el azul más claro para el botón
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  transition: 'all 0.2s'
};