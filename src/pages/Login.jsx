
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { Lock, User, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

// IMPORTAMOS EL LOGO
import logoMochis from '../assets/mochis_punto_net_logo.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
          password 
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (error) {
      alert('Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          
          {/* LOGO */}
          <img 
            src={logoMochis} 
            alt="Mochis.Net Logo" 
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
            style={buttonStyle} // Nota: Ahora el botón usa el color sólido
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
  width: '250px',      
  height: 'auto',      
  objectFit: 'contain',
  display: 'block',
  margin: '0 auto 15px auto' 
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