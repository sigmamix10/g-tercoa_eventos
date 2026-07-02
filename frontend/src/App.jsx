import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import {
  Calendar,
  User,
  BookOpen,
  FileText,
  Award,
  Video,
  Users,
  CheckCircle,
  FileCheck,
  Plus,
  Search,
  QrCode,
  LogOut,
  Clock,
  Info,
  ChevronRight,
  LayoutDashboard,
  Upload,
  Send,
  Lock,
  ExternalLink,
  MapPin,
  Trash2,
  Menu,
  HelpCircle,
  Bell
} from 'lucide-react';

import logoLight from './assets/logo-light.png';
import logoDark from './assets/logo-dark.png';

const API_URL = '';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return `${API_URL}${url}`;
};

const getLocalDate = (dStr) => {
  if (!dStr) return null;
  const cleanStr = typeof dStr === 'string' ? dStr.split('T')[0] : dStr.toISOString().split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), 12, 0, 0);
  }
  return new Date(dStr);
};

const formatLocalDate = (dStr) => {
  const date = getLocalDate(dStr);
  return date ? date.toLocaleDateString('pt-BR') : '';
};

export default function App() {
  const navigate = useNavigate();

  // Authentication State
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loadingUser, setLoadingUser] = useState(!!localStorage.getItem('token'));
  const [myAssignments, setMyAssignments] = useState([]);

  // Event Notifications states
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTargetAudience, setNotifTargetAudience] = useState('all');
  const [notifsList, setNotifsList] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  // Dashboard Sub-views: 'admin-events' | 'admin-checkin' | 'admin-submissions' | 'admin-metrics' | 'evaluator-reviews' | 'participant-events' | 'participant-submissions' | 'participant-certificates'
  const [dashboardSubView, setDashboardSubView] = useState('participant-events');

  // Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Global Toast Notifications
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Accessibility States
  const [fontSizeScale, setFontSizeScale] = useState(
    parseInt(localStorage.getItem('fontSizeScale')) || 100
  );
  const [contrastMode, setContrastMode] = useState(
    localStorage.getItem('contrastMode') === 'true'
  );

  // Apply font size scale
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSizeScale}%`;
    localStorage.setItem('fontSizeScale', fontSizeScale);
  }, [fontSizeScale]);

  // Apply contrast mode
  useEffect(() => {
    if (contrastMode) {
      document.body.classList.add('contrast-mode');
    } else {
      document.body.classList.remove('contrast-mode');
    }
    localStorage.setItem('contrastMode', contrastMode);
  }, [contrastMode]);

  const adjustFontSize = (delta) => {
    setFontSizeScale(prev => {
      const next = prev + delta;
      return Math.min(Math.max(next, 76), 200); // limit between 76% and 200%
    });
  };

  const resetFontSize = () => {
    setFontSizeScale(100);
  };

  const toggleContrast = () => {
    setContrastMode(prev => !prev);
  };



  const fetchMyAssignments = async (authToken) => {
    const activeToken = authToken || token;
    if (!activeToken) return;
    try {
      const res = await fetch(`${API_URL}/api/my-assignments`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyAssignments(data);
      }
    } catch (err) {
      console.error('Error fetching my assignments:', err);
    }
  };

  const fetchUserProfile = async (authToken, skipSubViewReset = false) => {
    const activeToken = authToken || token;
    if (!activeToken) {
      setLoadingUser(false);
      return;
    }
    try {
      setLoadingUser(true);
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        fetchMyAssignments(activeToken);
        if (!skipSubViewReset) {
          // Set default dashboard view depending on role
          if (data.role === 'admin') setDashboardSubView('admin-metrics');
          else if (data.role === 'evaluator') setDashboardSubView('evaluator-reviews');
          else setDashboardSubView('participant-events');
        }
      } else {
        setToken('');
        localStorage.removeItem('token');
      }
    } catch (err) {
      console.error(err);
      setToken('');
      localStorage.removeItem('token');
    } finally {
      setLoadingUser(false);
    }
  };

  const handleLoginSuccess = (authToken, loggedInUser) => {
    setToken(authToken);
    setUser(loggedInUser);
    localStorage.setItem('token', authToken);
    setLoadingUser(false);
    fetchMyAssignments(authToken);
    if (loggedInUser.role === 'admin') setDashboardSubView('admin-metrics');
    else if (loggedInUser.role === 'evaluator') setDashboardSubView('evaluator-reviews');
    else setDashboardSubView('participant-events');
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      if (!user) {
        fetchUserProfile(token);
      }
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setLoadingUser(false);
    }
  }, [token]);

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setMyAssignments([]);
    navigate('/');
    showToast('Logout realizado com sucesso.');
  };

  return (
    <div>
      {/* Accessibility Top Bar */}
      <div className="accessibility-bar">
        <div className="accessibility-container">
          <div className="accessibility-links">
            <a href="#main-content" className="access-link" onClick={(e) => {
              e.preventDefault();
              const content = document.getElementById('main-content');
              if (content) {
                content.tabIndex = -1;
                content.focus();
              }
            }}>Ir para o conteúdo [1]</a>
          </div>
          <div className="accessibility-controls">
            <button className="access-btn" onClick={toggleContrast} title="Alternar Alto Contraste">
              🌓 Alto Contraste
            </button>
            <button className="access-btn" onClick={() => adjustFontSize(8)} title="Aumentar Fonte">
              A+
            </button>
            <button className="access-btn" onClick={() => adjustFontSize(-8)} title="Diminuir Fonte">
              A-
            </button>
            <button className="access-btn" onClick={resetFontSize} title="Resetar Fonte">
              A Padrão
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: toast.type === 'success' ? 'var(--success)' : 'var(--danger)',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--glass-shadow)',
          fontWeight: 600,
          animation: 'modalEnter 0.2s ease-out'
        }}>
          {toast.message}
        </div>
      )}

      {/* Navigation Header */}
      <nav className="main-nav">
        <div className="logo-container" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => navigate('/')}>
          <img src={logoLight} alt="G-TERCOA Logo" style={{ height: '52px', width: 'auto', objectFit: 'contain' }} />
          <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary)' }}>Eventos</span>
        </div>
        <div className="nav-links">
          <Link to="/">Eventos</Link>
          <Link to="/verify">Validar Certificado</Link>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => navigate('/dashboard')}>
                <LayoutDashboard size={16} />
                Painel
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name.split(' ')[0]}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role}</span>
              </div>
              <button className="btn btn-danger" style={{ padding: '8px 12px' }} onClick={handleLogout}>
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button id="nav-login-btn" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => setShowLoginModal(true)}>Entrar</button>
              <button id="nav-register-btn" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => setShowRegisterModal(true)}>Cadastrar</button>
            </div>
          )}
        </div>
      </nav>

      {/* MAIN VIEW ROUTER */}
      <main id="main-content" style={{ minHeight: 'calc(100vh - 70px)', outline: 'none' }}>
        <Routes>
          <Route path="/" element={<HomeView showToast={showToast} token={token} />} />
          <Route
            path="/evento/:slug"
            element={
              <EventEditionView
                token={token}
                user={user}
                showToast={showToast}
                setShowLoginModal={setShowLoginModal}
              />
            }
          />
          <Route path="/verify" element={<CertificateVerifyView showToast={showToast} />} />
          <Route
            path="/dashboard"
            element={
              loadingUser ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '15px' }}>
                  <div className="spinner"></div>
                  <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Carregando painel...</p>
                </div>
              ) : user ? (
                <DashboardRouter
                  user={user}
                  token={token}
                  subView={dashboardSubView}
                  setSubView={setDashboardSubView}
                  showToast={showToast}
                  refreshUserProfile={fetchUserProfile}
                  myAssignments={myAssignments}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </main>

      {/* FOOTER */}
      <footer style={{ background: 'var(--secondary)', color: '#94a3b8', padding: '30px 20px', textAlign: 'center', fontSize: '0.9rem', borderTop: '1px solid var(--border)' }}>
        <p>&copy; {new Date().getFullYear()} G-TERCOA/UFC/CNPq - Grupo de Estudo e Pesquisa Tecendo Redes Cognitivas de Aprendizagem.</p>
        <p style={{ fontSize: '0.75rem', marginTop: '6px' }}>Plataforma integrada desenvolvida por Rogério Alves.</p>
      </footer>

      {/* Auth Modals */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
          showToast={showToast}
        />
      )}
      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          showToast={showToast}
          setShowLoginModal={setShowLoginModal}
        />
      )}
    </div>
  );
}

// ==========================================
// VIEW COMPONENTS
// ==========================================

// 1. HOME VIEW (LANDING PAGE)
function HomeView({ showToast }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      } else {
        showToast('Erro ao carregar eventos', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao conectar ao servidor', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const getFormatName = (type) => {
    const formats = {
      'school_of_summer': 'Escola de Verão',
      'dima': 'DIMA (Diálogos Matemática & Pedagogia)',
      'live_cycle': 'Ciclo de Lives',
      'workshop': 'Workshop'
    };
    return formats[type] || 'Evento';
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = activeFilter === 'all' || event.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Institutional Hero Banner */}
      <div className="hero-banner">
        {/* Abstract shapes */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
        <img src={logoDark} alt="G-TERCOA Logo" style={{ height: '150px', width: 'auto', marginBottom: '20px', objectFit: 'contain' }} />
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, marginBottom: '15px' }}>Plataforma de Eventos Acadêmicos</h1>
        <p style={{ fontSize: '1.15rem', maxWidth: '800px', margin: '0 auto', color: '#bfdbfe', fontWeight: 300 }}>
          Descubra e participe de nossos workshops, ciclos de lives, escolas de verão e do DIMA. Gerencie suas inscrições, envie artigos e emita certificados acadêmicos válidos.
        </p>
      </div>

      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '24px', color: 'var(--primary)' }}>Próximas Edições de Eventos</h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Carregando edições...</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <Calendar size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ color: 'var(--text-secondary)' }}>Nenhuma edição de evento aberta no momento</h3>
          <p style={{ color: 'var(--text-muted)' }}>A comissão organizadora do G-TERCOA disponibilizará novos eventos em breve.</p>
        </div>
      ) : (
        <>
          {/* Search and filter controls */}
          <div className="glass-card search-filter-card">
            <div className="search-wrapper">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Buscar por nome ou descrição do evento..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <button
                className={`filter-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                Todos
              </button>
              <button
                className={`filter-tab-btn ${activeFilter === 'school_of_summer' ? 'active' : ''}`}
                onClick={() => setActiveFilter('school_of_summer')}
              >
                Escola de Verão
              </button>
              <button
                className={`filter-tab-btn ${activeFilter === 'dima' ? 'active' : ''}`}
                onClick={() => setActiveFilter('dima')}
              >
                DIMA
              </button>
              <button
                className={`filter-tab-btn ${activeFilter === 'live_cycle' ? 'active' : ''}`}
                onClick={() => setActiveFilter('live_cycle')}
              >
                Ciclo de Lives
              </button>
              <button
                className={`filter-tab-btn ${activeFilter === 'workshop' ? 'active' : ''}`}
                onClick={() => setActiveFilter('workshop')}
              >
                Workshop
              </button>
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', width: '100%' }}>
              <Info size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Nenhum evento encontrado para a busca ou filtro selecionado.</p>
            </div>
          ) : (
            <div className="grid-cards">
              {filteredEvents.map(event => (
                <div key={event.id} className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                  <div style={{
                    height: '140px',
                    backgroundImage: `url(${getImageUrl(event.banner_url) || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600&auto=format&fit=crop'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                  }}>
                    <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10 }}>
                      <span className="badge badge-primary" style={{ background: '#fff', border: '1px solid var(--border)' }}>
                        {getFormatName(event.type)}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px', color: 'var(--primary)' }}>{event.name}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', flex: 1, marginBottom: '18px' }}>
                      {event.description ? event.description.substring(0, 140) + '...' : 'Sem descrição disponível.'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                      <Calendar size={14} style={{ color: 'var(--accent-light)' }} />
                      <span>
                        {formatLocalDate(event.start_date)} a {formatLocalDate(event.end_date)}
                      </span>
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => {
                      navigate(`/evento/${event.slug}`);
                    }}>
                      Acessar Evento
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 2. DETALHES DA EDIÇÃO DO EVENTO (MULTI-TENANT HOME PAGE DE CADA EVENTO)
function EventEditionView({ token, user, showToast, setShowLoginModal }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [submittingReg, setSubmittingReg] = useState(false);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionFileIdentified, setSubmissionFileIdentified] = useState(null);

  // Submission Form State
  const [subTitle, setSubTitle] = useState('');
  const [subAuthors, setSubAuthors] = useState('');
  const [subAffiliation, setSubAffiliation] = useState('');
  const [subAxis, setSubAxis] = useState('');
  const [submittingWork, setSubmittingWork] = useState(false);
  const [mainAuthor, setMainAuthor] = useState('');
  const [coAuthorsList, setCoAuthorsList] = useState([]);

  // Coauthor search state
  const [coauthorSearchQuery, setCoauthorSearchQuery] = useState('');
  const [coauthorSearchResults, setCoauthorSearchResults] = useState([]);
  const [coauthorSearchLoading, setCoauthorSearchLoading] = useState(false);

  const handleCoauthorSearch = async (query) => {
    setCoauthorSearchQuery(query);
    if (!query.trim()) {
      setCoauthorSearchResults([]);
      return;
    }
    setCoauthorSearchLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${event.id}/registered-users-search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Exclude main author (logged in user) and already added coauthors
        const filtered = data.filter(u => u.id !== user.id && !coAuthorsList.some(c => c.id === u.id));
        setCoauthorSearchResults(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCoauthorSearchLoading(false);
    }
  };

  const handleAddCoauthor = (selectedUser) => {
    const maxCoauthorsAllowed = event.max_coauthors !== undefined ? parseInt(event.max_coauthors, 10) : 3;
    if (coAuthorsList.length >= maxCoauthorsAllowed) {
      showToast(`Limite de coautores atingido (Máximo ${maxCoauthorsAllowed})`, 'danger');
      return;
    }
    setCoAuthorsList([...coAuthorsList, selectedUser]);
    setCoauthorSearchQuery('');
    setCoauthorSearchResults([]);
  };

  useEffect(() => {
    if (user && !mainAuthor) {
      setMainAuthor(user.name || '');
    }
  }, [user]);

  // Checks if user is already registered to enable submission form
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);
  const [checkingReg, setCheckingReg] = useState(true);

  // Activities programming state
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Fetch Event Details
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoadingEvent(true);
        const res = await fetch(`${API_URL}/api/events/by-slug/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setEvent(data);
        } else {
          showToast('Erro ao carregar detalhes do evento', 'danger');
          navigate('/');
        }
      } catch (err) {
        console.error(err);
        showToast('Erro ao carregar detalhes do evento', 'danger');
        navigate('/');
      } finally {
        setLoadingEvent(false);
      }
    };
    fetchEventDetails();
  }, [slug]);

  useEffect(() => {
    if (event) {
      checkUserRegistration();
      fetchActivities();
    }
  }, [event, user]);

  const fetchActivities = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events/${event.id}/activities`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const getRegistrationStatus = () => {
    if (!event) return { isOpen: false, status: 'closed' };

    const start = event.registration_start_date || null;
    const end = event.registration_end_date || null;

    if (!start && !end) {
      return { isOpen: true, status: 'open' };
    }

    const offset = new Date().getTimezoneOffset();
    const localDate = new Date(new Date().getTime() - (offset * 60 * 1000));
    const today = localDate.toISOString().split('T')[0];

    if (start && today < start) {
      return { isOpen: false, status: 'before', date: start };
    }
    if (end && today > end) {
      return { isOpen: false, status: 'after', date: end };
    }

    return { isOpen: true, status: 'open', start, end };
  };

  const getSubmissionStatus = () => {
    if (!event) return { isOpen: false, status: 'closed' };
    if (event.submissions_enabled !== 1) return { isOpen: false, status: 'disabled' };

    const start = event.submission_start_date || null;
    const end = event.submission_deadline || null;

    if (!start && !end) {
      return { isOpen: true, status: 'open' };
    }

    const offset = new Date().getTimezoneOffset();
    const localDate = new Date(new Date().getTime() - (offset * 60 * 1000));
    const today = localDate.toISOString().split('T')[0];

    if (start && today < start) {
      return { isOpen: false, status: 'before', date: start };
    }
    if (end && today > end) {
      return { isOpen: false, status: 'after', date: end };
    }
    return { isOpen: true, status: 'open', start, end };
  };

  const regStatus = getRegistrationStatus();

  const checkUserRegistration = async () => {
    if (!user || !token) {
      setIsRegistered(false);
      setRegistrationId(null);
      setCheckingReg(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/registrations/my-events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const userReg = data.find(reg => reg.event_id === event.id);
        if (userReg) {
          setIsRegistered(true);
          setRegistrationId(userReg.id);
        } else {
          setIsRegistered(false);
          setRegistrationId(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingReg(false);
    }
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    if (!token) {
      showToast('Por favor, faça login para se inscrever', 'danger');
      setShowLoginModal(true);
      return;
    }
    if (!selectedCategory) {
      showToast('Selecione uma categoria de inscrição', 'danger');
      return;
    }

    setSubmittingReg(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${event.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ category: selectedCategory })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Inscrição realizada com sucesso! Confirmação gerada.');
        setIsRegistered(true);
        setRegistrationId(data.registrationId);
      } else {
        showToast(data.error || 'Erro ao realizar inscrição', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao conectar ao servidor', 'danger');
    } finally {
      setSubmittingReg(false);
    }
  };

  const handleDownloadReceiptPDF = async (regId) => {
    showToast('Iniciando visualização do comprovante...');
    try {
      const response = await fetch(`${API_URL}/api/registrations/${regId}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        showToast('Comprovante carregado para visualização!');
      } else {
        showToast('Falha ao gerar comprovante de inscrição', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao visualizar comprovante', 'danger');
    }
  };

  const handleWorkSubmission = async (e) => {
    e.preventDefault();
    if (!token) return;
    
    const finalAuthorsNames = [mainAuthor.trim(), ...coAuthorsList.map(c => c.name.trim())].filter(Boolean);
    if (!subTitle || finalAuthorsNames.length === 0 || !subAffiliation || !subAxis || !submissionFile || !submissionFileIdentified) {
      showToast('Preencha todos os campos e anexe ambos os arquivos (com e sem identificação)', 'danger');
      return;
    }

    setSubmittingWork(true);
    const coauthorIds = coAuthorsList.map(c => c.id);
    const formData = new FormData();
    formData.append('title', subTitle);
    formData.append('authors', finalAuthorsNames.join(', '));
    formData.append('coauthor_ids', JSON.stringify(coauthorIds));
    formData.append('affiliation', subAffiliation);
    formData.append('thematic_axis', subAxis);
    formData.append('file', submissionFile);
    formData.append('file_identified', submissionFileIdentified);

    try {
      const res = await fetch(`${API_URL}/api/events/${event.id}/submissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Trabalho submetido com sucesso! O comitê irá avaliar.');
        // reset form
        setSubTitle('');
        setCoAuthorsList([]);
        setSubAffiliation('');
        setSubAxis('');
        setSubmissionFile(null);
        setSubmissionFileIdentified(null);
      } else {
        showToast(data.error || 'Erro ao submeter trabalho', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao servidor', 'danger');
    } finally {
      setSubmittingWork(false);
    }
  };

  if (loadingEvent) {
    return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Carregando detalhes do evento...</div>;
  }

  if (!event) {
    return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Evento não encontrado.</div>;
  }

  // Helper: format date to pt-BR
  const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

  // Group activities by date
  const activitiesByDay = activities.reduce((acc, act) => {
    const day = new Date(act.start_time).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    if (!acc[day]) acc[day] = [];
    acc[day].push(act);
    return acc;
  }, {});

  const guests = event.guests || [];
  const supporters = event.supporters || [];
  const organizers = event.organizers || [];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 0 80px' }}>

      {/* ── HERO BANNER ── */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '440px',
        overflow: 'hidden',
        borderRadius: '0 0 var(--radius) var(--radius)',
        background: '#0f172a'
      }}>
        {event.banner_url ? (
          <img
            src={getImageUrl(event.banner_url)}
            alt={event.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #7c3aed 100%)' }} />
        )}
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.05) 100%)'
        }} />
        {/* Text overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--accent)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
            {event.type === 'school_of_summer' ? 'Escola de Verão' : event.type === 'dima' ? 'DIMA' : event.type === 'live_cycle' ? 'Ciclo de Lives' : 'Workshop'}
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: '14px', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>{event.name}</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', color: 'rgba(255,255,255,0.88)', fontSize: '0.92rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={15} />
              {fmtDate(event.start_date)} – {fmtDate(event.end_date)}
            </span>
            {event.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} />
                {event.location}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} />
              {event.workload_hours}h de carga horária
            </span>
          </div>
        </div>
      </div>

      {/* ── CONTENT BODY ── */}
      <div style={{ padding: '0 20px', marginTop: '36px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* ── INSCRIÇÃO ── */}
        <section>
          {isRegistered ? (
            <div className="glass-card" style={{ border: '2px solid var(--success)', background: 'rgba(5, 150, 105, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <CheckCircle size={28} style={{ color: 'var(--success)' }} />
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--success)', margin: 0 }}>Inscrição Confirmada!</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '20px' }}>
                Você já está inscrito neste evento. Acesse seu painel para ver credencial e acompanhar transmissões.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                  Acessar Painel do Participante
                </button>
                {registrationId && (
                  <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => handleDownloadReceiptPDF(registrationId)}>
                    <FileText size={15} /> Comprovante (PDF)
                  </button>
                )}
              </div>
            </div>
          ) : !regStatus.isOpen ? (
            <div className="glass-card" style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(214,158,46,0.12)', borderRadius: '50%', width: '52px', height: '52px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={24} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Inscrições {regStatus.status === 'before' ? 'ainda não abertas' : 'encerradas'}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  {regStatus.status === 'before'
                    ? `As inscrições serão abertas em ${regStatus.date.split('-').reverse().join('/')}.`
                    : `O prazo de inscrições encerrou em ${regStatus.date.split('-').reverse().join('/')}.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-card">
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '18px' }}>Inscrições Abertas</h2>
              {(event.registration_start_date || event.registration_end_date) && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px', background: 'rgba(214, 158, 46, 0.07)', border: '1px solid rgba(214, 158, 46, 0.18)', padding: '10px 14px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <span>Período de inscrições: <strong>{event.registration_start_date ? event.registration_start_date.split('-').reverse().join('/') : 'Imediato'}</strong> até <strong>{event.registration_end_date ? event.registration_end_date.split('-').reverse().join('/') : 'encerramento'}</strong></span>
                </div>
              )}
              <form onSubmit={handleRegistration} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: '1', minWidth: '200px', margin: 0 }}>
                  <label className="form-label">Selecione sua Categoria</label>
                  <select className="form-select" required value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                    <option value="">Selecione...</option>
                    {event.registration_categories && event.registration_categories.map((cat, i) => (
                      <option key={i} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-accent" style={{ padding: '12px 28px', fontWeight: 700, whiteSpace: 'nowrap' }} disabled={submittingReg}>
                  {submittingReg ? 'Aguarde...' : 'Garantir Minha Vaga →'}
                </button>
              </form>
            </div>
          )}
        </section>

        {/* ── SOBRE O EVENTO ── */}
        {event.description && (
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'inline-block', width: '4px', height: '22px', background: 'var(--primary-light)', borderRadius: '2px' }} />
              Sobre o Evento
            </h2>
            <div className="glass-card">
              <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.97rem' }}>
                {event.description}
              </div>
              {event.thematic_axes && event.thematic_axes.length > 0 && (
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Eixos Temáticos</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {event.thematic_axes.map((axis, i) => (
                      <span key={i} style={{ background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.14)', color: 'var(--primary)', padding: '5px 14px', borderRadius: '20px', fontSize: '0.83rem', fontWeight: 600 }}>{axis}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {((event.transmission_link) || (event.additional_links && event.additional_links.length > 0)) && (
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'inline-block', width: '4px', height: '22px', background: '#ec4899', borderRadius: '2px' }} />
              Transmissão & Links Úteis
            </h2>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {event.transmission_link && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.95rem' }}>📺 <strong>Link Principal de Transmissão:</strong></span>
                  <a href={event.transmission_link} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-light)', fontWeight: 600, textDecoration: 'underline' }}>
                    Assistir Transmissão Ao Vivo
                  </a>
                </div>
              )}
              {event.additional_links && event.additional_links.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: event.transmission_link ? '10px' : '0' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Links Complementares:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {event.additional_links.map((link, idx) => (
                      <a key={idx} href={link.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--surface-secondary)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--text-primary)', textDecoration: 'none', transition: 'background 0.2s' }}>
                        <ExternalLink size={14} style={{ color: 'var(--primary-light)' }} /> {link.label || 'Link'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── PROGRAMAÇÃO ── */}
        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'inline-block', width: '4px', height: '22px', background: 'var(--accent)', borderRadius: '2px' }} />
            Programação
          </h2>
          <div className="glass-card">
            {loadingActivities ? (
              <div style={{ color: 'var(--text-muted)' }}>Carregando programação...</div>
            ) : activities.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>A programação completa será divulgada em breve.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {Object.entries(activitiesByDay).map(([day, acts]) => (
                  <div key={day}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary-light)', marginBottom: '14px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>{day}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      {acts.map(act => (
                        <div key={act.id} style={{ display: 'flex', gap: '18px' }}>
                          <div style={{ minWidth: '90px', textAlign: 'right', paddingTop: '2px', flexShrink: 0 }}>
                            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>{new Date(act.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>até {new Date(act.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                          <div style={{ flex: 1, paddingLeft: '18px', borderLeft: '2px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', whiteSpace: 'nowrap', marginTop: '2px' }}>{act.type.replace('_', ' ')}</span>
                              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{act.title}</h3>
                            </div>
                            {act.description && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0', whiteSpace: 'pre-wrap' }}>{act.description}</p>}
                            {act.location && <div style={{ fontSize: '0.8rem', color: 'var(--primary-light)', marginTop: '4px' }}>📍 {act.location}</div>}
                            {act.transmission_link && (
                              <div style={{ marginTop: '6px', fontSize: '0.8rem' }}>
                                <a href={act.transmission_link} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#8b5cf6', fontWeight: 600, textDecoration: 'underline' }}>
                                  <Video size={14} />
                                  Link de Transmissão / Vídeo
                                </a>
                              </div>
                            )}
                            {act.additional_links && act.additional_links.length > 0 && (
                              <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.8rem' }}>
                                {act.additional_links.map((link, idx) => (
                                  <a key={idx} href={link.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary-light)', fontWeight: 600, textDecoration: 'underline' }}>
                                    <ExternalLink size={14} />
                                    {link.label || 'Link'}
                                  </a>
                                ))}
                              </div>
                            )}
                            {act.guests && act.guests.length > 0 && (
                              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {act.guests.map((g, idx) => (
                                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface-secondary)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem' }}>
                                    <span style={{ fontWeight: 700, color: g.role === 'palestrante' ? 'var(--primary-light)' : 'var(--accent)' }}>{g.role === 'palestrante' ? '🎤' : '🎯'}</span>
                                    <span>{g.name}</span>
                                    {g.institution && <span style={{ color: 'var(--text-muted)' }}>· {g.institution}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── CONVIDADOS / PALESTRANTES ── */}
        {guests.length > 0 && (
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'inline-block', width: '4px', height: '22px', background: '#8b5cf6', borderRadius: '2px' }} />
              Convidados & Palestrantes
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {guests.map((g, i) => (
                <div key={i} className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px 18px', gap: '12px' }}>
                  {g.image_url ? (
                    <img src={getImageUrl(g.image_url)} alt={g.name} style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-light)', boxShadow: '0 4px 12px rgba(37,99,235,0.18)' }} />
                  ) : (
                    <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.5rem', color: '#fff', boxShadow: '0 4px 12px rgba(37,99,235,0.18)' }}>{g.name.charAt(0)}</div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{g.name}</div>
                    {g.institution && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{g.institution}</div>}
                    {g.role && <span style={{ display: 'inline-block', marginTop: '6px', background: g.role === 'palestrante' ? 'rgba(37,99,235,0.1)' : 'rgba(214,158,46,0.12)', color: g.role === 'palestrante' ? 'var(--primary-light)' : 'var(--accent)', fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: '12px', textTransform: 'capitalize' }}>{g.role}</span>}
                    {g.mini_bio && (
                      <p style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        margin: '10px 0 0 0',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textAlign: 'center'
                      }} title={g.mini_bio}>
                        {g.mini_bio}
                      </p>
                    )}
                    {(g.orcid_link || g.lattes_link) && (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px' }}>
                        {g.orcid_link && (
                          <a
                            href={g.orcid_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: '#a3e635',
                              background: 'rgba(163,230,53,0.1)',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              textDecoration: 'none'
                            }}
                          >
                            ORCID
                          </a>
                        )}
                        {g.lattes_link && (
                          <a
                            href={g.lattes_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: '#38bdf8',
                              background: 'rgba(56,189,248,0.1)',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              textDecoration: 'none'
                            }}
                          >
                            Lattes
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── ORGANIZAÇÃO ── */}
        {organizers.length > 0 && (
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'inline-block', width: '4px', height: '22px', background: '#0ea5e9', borderRadius: '2px' }} />
              Organização
            </h2>
            <div className="glass-card">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {organizers.map((org, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 18px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '1rem', flexShrink: 0 }}>{org.name ? org.name.charAt(0) : '?'}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{org.name}</div>
                      {org.role && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{org.role}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── APOIADORES ── */}
        {supporters.length > 0 && (
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'inline-block', width: '4px', height: '22px', background: '#10b981', borderRadius: '2px' }} />
              Apoiadores & Parceiros
            </h2>
            <div className="glass-card">
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '28px' }}>
                {supporters.map((s, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 0.9, transition: 'opacity 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0.9}>
                    {s.logo_url ? (
                      <img src={getImageUrl(s.logo_url)} alt={s.name} style={{ height: '48px', maxWidth: '140px', objectFit: 'contain', filter: 'grayscale(20%)' }} />
                    ) : (
                      <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', background: 'var(--surface-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{s.name}</span>
                      </div>
                    )}
                    {s.logo_url && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>{s.name}</span>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── SUBMISSÃO DE TRABALHOS ── */}
        {checkingReg ? null : isRegistered ? (() => {
          const subStatus = getSubmissionStatus();
          return (
            <section>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ display: 'inline-block', width: '4px', height: '22px', background: '#f59e0b', borderRadius: '2px' }} />
                Submissão de Trabalhos
              </h2>
              <div className="glass-card">
                {/* Prazos Importantes Box */}
                {(event.submission_start_date || event.submission_deadline || event.evaluation_deadline || event.results_deadline) && (
                  <div style={{ background: 'var(--surface-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.85rem', border: '1px solid var(--border)' }}>
                    <h4 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                      <Calendar size={16} /> Cronograma e Prazos da Chamada Científica
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                      {(event.submission_start_date || event.submission_deadline) && (
                        <div>
                          <strong>Período de Submissão:</strong><br />
                          {event.submission_start_date ? fmtDate(event.submission_start_date) : 'Imediato'} até {event.submission_deadline ? fmtDate(event.submission_deadline) : 'Encerramento'}
                        </div>
                      )}
                      {event.evaluation_deadline && (
                        <div>
                          <strong>Prazo de Avaliação:</strong><br />
                          Até {fmtDate(event.evaluation_deadline)}
                        </div>
                      )}
                      {event.results_deadline && (
                        <div>
                          <strong>Resultados Finais:</strong><br />
                          {fmtDate(event.results_deadline)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Notice Alert */}
                {!subStatus.isOpen && (
                  <div className="abnt-warning-box" style={{ marginBottom: '20px', borderLeftColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}>
                    <h4 style={{ color: 'var(--danger)' }}><Lock size={18} /> Submissões Bloqueadas</h4>
                    <p style={{ margin: '4px 0 0 0' }}>
                      {subStatus.status === 'before' && `O período de submissão de trabalhos ainda não iniciou. As submissões começam em ${subStatus.date.split('-').reverse().join('/')}.`}
                      {subStatus.status === 'after' && `O prazo para envio de trabalhos foi encerrado em ${subStatus.date.split('-').reverse().join('/')}.`}
                      {subStatus.status === 'disabled' && 'As submissões de trabalhos científicos para este evento estão temporariamente desativadas.'}
                      {subStatus.status === 'closed' && 'Submissões encerradas.'}
                    </p>
                  </div>
                )}

                {subStatus.isOpen && (
                  <div className="abnt-warning-box" style={{ marginBottom: '20px' }}>
                    <h4><Info size={18} /> Atenção às Normas da ABNT</h4>
                    <p>Todos os resumos e artigos devem estar formatados conforme as diretrizes da ABNT (NBR 6023, NBR 10520). Trabalhos fora das normas serão rejeitados pela comissão examinadora.</p>
                  </div>
                )}

                {event.submission_rules && (
                  <div style={{ background: 'var(--surface-secondary)', padding: '14px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.88rem', whiteSpace: 'pre-wrap' }}>
                    <strong>Regras deste Evento:</strong><br />{event.submission_rules}
                  </div>
                )}
                {event.rules_files && (() => {
                  let files = [];
                  try {
                    files = typeof event.rules_files === 'string' ? JSON.parse(event.rules_files) : event.rules_files;
                  } catch(e) {
                    console.error(e);
                  }
                  return files && files.length > 0 ? (
                    <div style={{ background: 'var(--surface-secondary)', padding: '14px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.88rem' }}>
                      <strong>Arquivos e Modelos para Submissão:</strong>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {files.map((file, idx) => (
                          <a 
                            key={idx} 
                            href={`${API_URL}${file.url}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                          >
                            <FileText size={14} style={{ color: 'var(--primary)' }} /> {file.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
                <form onSubmit={handleWorkSubmission}>
                  <fieldset disabled={!subStatus.isOpen} style={{ border: 'none', padding: 0, margin: 0 }}>
                    <div className="form-group">
                      <label className="form-label">Título do Trabalho *</label>
                      <input type="text" className="form-input" placeholder="Título completo" required value={subTitle} onChange={(e) => setSubTitle(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label className="form-label">Autor Principal (Você) *</label>
                        <input type="text" className="form-input" disabled value={mainAuthor} style={{ background: 'var(--surface-secondary)', cursor: 'not-allowed' }} />
                      </div>
                      <div>
                        <label className="form-label">Filiação Institucional *</label>
                        <input type="text" className="form-input" placeholder="UFC, UECE, IFCE" required value={subAffiliation} onChange={(e) => setSubAffiliation(e.target.value)} />
                      </div>
                    </div>

                    {(() => {
                      const maxCoauthorsAllowed = event.max_coauthors !== undefined ? parseInt(event.max_coauthors, 10) : 3;
                      return maxCoauthorsAllowed > 0 ? (
                        <div className="form-group" style={{ background: 'var(--surface-secondary)', padding: '14px', borderRadius: '8px', marginBottom: '20px' }}>
                          <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px' }}>Coautores Inscritos (Máximo {maxCoauthorsAllowed})</label>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Apenas participantes inscritos no evento podem ser adicionados como coautores.</p>

                          {/* Search Bar for Coauthors */}
                          {coAuthorsList.length < maxCoauthorsAllowed && (
                            <div style={{ position: 'relative', marginBottom: '14px' }}>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Buscar coautor por Nome, E-mail ou CPF..."
                                value={coauthorSearchQuery}
                                onChange={(e) => handleCoauthorSearch(e.target.value)}
                              />
                              {coauthorSearchLoading && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Buscando participantes inscritos...</div>}
                              {coauthorSearchResults.length > 0 && (
                                <div style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  right: 0,
                                  background: '#fff',
                                  border: '1px solid var(--border)',
                                  borderRadius: 'var(--radius-sm)',
                                  maxHeight: '180px',
                                  overflowY: 'auto',
                                  zIndex: 100,
                                  boxShadow: 'var(--shadow-md)',
                                  marginTop: '4px'
                                }}>
                                  {coauthorSearchResults.map(res => (
                                    <div key={res.id} style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '0.85rem' }}>
                                      <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{res.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{res.email}</div>
                                      </div>
                                      <button type="button" className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleAddCoauthor(res)}>
                                        Adicionar
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Selected Coauthors List */}
                          {coAuthorsList.length === 0 ? (
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>Nenhum coautor selecionado.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {coAuthorsList.map((author, index) => (
                                <div key={author.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                  <div>
                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, marginRight: '8px' }}>Coautor {index + 1}:</span>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{author.name}</span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '8px' }}>({author.email})</span>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-danger"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                    onClick={() => setCoAuthorsList(coAuthorsList.filter(c => c.id !== author.id))}
                                  >
                                    Remover
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null;
                    })()}
                <div className="form-group">
                  <label className="form-label">Eixo Temático *</label>
                  <select className="form-select" required value={subAxis} onChange={(e) => setSubAxis(e.target.value)}>
                    <option value="">Selecione o eixo...</option>
                    {event.thematic_axes.map((axis, i) => <option key={i} value={axis}>{axis}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 'bold' }}>Versão Cega (Sem Identificação) *</label>
                    <div style={{ border: '2px dashed var(--border)', borderRadius: '8px', padding: '18px', textAlign: 'center', cursor: 'pointer', background: submissionFile ? 'rgba(5,150,105,0.02)' : 'transparent', borderColor: submissionFile ? 'var(--success)' : 'var(--border)', transition: 'all 0.2s' }} onClick={() => document.getElementById('file-upload-blind').click()}>
                      <Upload size={20} style={{ color: submissionFile ? 'var(--success)' : 'var(--text-muted)', marginBottom: '4px' }} />
                      <p style={{ fontSize: '0.82rem', fontWeight: 500, margin: '0 0 2px', wordBreak: 'break-all' }}>{submissionFile ? submissionFile.name : 'Selecionar arquivo cego'}</p>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Sem nome dos autores</span>
                      <input type="file" id="file-upload-blind" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={(e) => setSubmissionFile(e.target.files[0])} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 'bold' }}>Versão Identificada (Com Identificação) *</label>
                    <div style={{ border: '2px dashed var(--border)', borderRadius: '8px', padding: '18px', textAlign: 'center', cursor: 'pointer', background: submissionFileIdentified ? 'rgba(5,150,105,0.02)' : 'transparent', borderColor: submissionFileIdentified ? 'var(--success)' : 'var(--border)', transition: 'all 0.2s' }} onClick={() => document.getElementById('file-upload-identified').click()}>
                      <Upload size={20} style={{ color: submissionFileIdentified ? 'var(--success)' : 'var(--text-muted)', marginBottom: '4px' }} />
                      <p style={{ fontSize: '0.82rem', fontWeight: 500, margin: '0 0 2px', wordBreak: 'break-all' }}>{submissionFileIdentified ? submissionFileIdentified.name : 'Selecionar arquivo identificado'}</p>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Com nome dos autores</span>
                      <input type="file" id="file-upload-identified" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={(e) => setSubmissionFileIdentified(e.target.files[0])} />
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '13px' }} disabled={submittingWork}>
                  {submittingWork ? 'Submetendo...' : 'Enviar Trabalho para Avaliação'}
                </button>
                  </fieldset>
              </form>
            </div>
          </section>
          );
        })() : null}

      </div>
    </div>
  );
}

// 3. VALIDAR CERTIFICADOS
function CertificateVerifyView({ showToast }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [certData, setCertData] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code) return;
    setLoading(true);
    setCertData(null);

    try {
      const res = await fetch(`${API_URL}/api/certificates/verify/${code.trim().toUpperCase()}`);
      const data = await res.json();
      if (res.ok) {
        setCertData(data);
        showToast('Certificado válido encontrado!');
      } else {
        showToast(data.error || 'Código inválido ou inexistente', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao validar certificado', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 20px' }}>
      <div className="glass-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Award size={48} style={{ color: 'var(--accent-light)', marginBottom: '12px' }} />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>Validar Certificado G-TERCOA</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Insira o código verificador impresso no rodapé do certificado para conferir sua autenticidade.
          </p>
        </div>

        <form onSubmit={handleVerify}>
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '1px', fontWeight: 600, textTransform: 'uppercase' }}
              placeholder="Ex: GTERCOA-ABC123"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }} disabled={loading}>
            {loading ? 'Verificando...' : 'Verificar Autenticidade'}
          </button>
        </form>

        {certData && (
          <div style={{ marginTop: '30px', padding: '20px', border: '2px solid var(--success)', borderRadius: 'var(--radius-sm)', background: 'rgba(5, 150, 105, 0.02)' }}>
            <h3 style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', marginBottom: '12px' }}>
              <CheckCircle size={18} />
              Certificado Autêntico e Válido
            </h3>
            <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Participante:</td><td style={{ padding: '8px 0', fontWeight: 600 }}>{certData.user_name}</td></tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>CPF:</td><td style={{ padding: '8px 0' }}>{certData.user_cpf}</td></tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Tipo:</td><td style={{ padding: '8px 0', fontWeight: 600 }}>
                  {certData.type === 'participation' ? 'Participação' :
                    certData.type === 'organization' ? 'Comissão Organizadora' :
                      certData.type === 'presentation' ? 'Apresentação de Trabalho' :
                        certData.type === 'guest' ? 'Convidado / Palestrante' :
                          certData.type === 'organization_general' ? 'Organização (Geral)' :
                            certData.type === 'organization_coordinator' ? 'Organização (Coordenador)' :
                              certData.type === 'organization_technical' ? 'Organização (Técnico)' :
                                certData.type === 'submission' ? 'Submissão de Trabalho' :
                                  certData.type === 'guest_speaker' ? 'Convidado (Palestrante)' :
                                    certData.type === 'guest_mediator' ? 'Convidado (Mediador)' :
                                      certData.type === 'workshop' ? 'Minicurso / Oficina' :
                                        certData.type}
                </td></tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Evento:</td><td style={{ padding: '8px 0', fontWeight: 600 }}>{certData.event_name}</td></tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Carga Horária:</td><td style={{ padding: '8px 0' }}>{certData.workload_hours} horas</td></tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Período:</td><td style={{ padding: '8px 0' }}>{formatLocalDate(certData.start_date)} a {formatLocalDate(certData.end_date)}</td></tr>
                <tr><td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Código Verificador:</td><td style={{ padding: '8px 0', fontWeight: 'bold', color: 'var(--primary)' }}>{certData.verification_code}</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// 4. DASHBOARD ROUTER AND RBAC VIEWS
function DashboardRouter({ user, token, subView, setSubView, showToast, refreshUserProfile, myAssignments = [] }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem('sidebarCollapsed') === 'true'
  );

  const toggleSidebar = () => {
    const nextState = !sidebarCollapsed;
    setSidebarCollapsed(nextState);
    localStorage.setItem('sidebarCollapsed', String(nextState));
  };

  return (
    <div className={`dashboard-grid ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        {/* Toggle button */}
        <div className="sidebar-toggle-container" style={{ marginBottom: '8px' }}>
          <button className="sidebar-toggle-btn" onClick={toggleSidebar} title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}>
            <Menu size={20} />
          </button>
        </div>

        {/* Sidebar Brand Logo */}
        <div style={{ display: 'flex', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', alignItems: 'center', padding: '0 8px 16px 8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', gap: '12px', marginBottom: '16px' }}>
          <img src={logoDark} alt="G-TERCOA Logo" style={{ height: sidebarCollapsed ? '32px' : '52px', width: 'auto', objectFit: 'contain', transition: 'all 0.3s' }} />
          {!sidebarCollapsed && <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '1px', color: '#fff' }}>EVENTOS</span>}
        </div>

        {/* User Card */}
        <div className="sidebar-user-card">
          <div className="sidebar-avatar">
            {user.photo_url ? (
              <img src={getImageUrl(user.photo_url)} alt={user.name} />
            ) : (
              user.name.charAt(0)
            )}
          </div>
          <div className="sidebar-user-details">
            <h4>{user.name}</h4>
            <span style={{ textTransform: 'capitalize' }}>
              {user.role === 'admin' ? 'Administrador' : user.role === 'moderator' ? 'Moderador' : user.role === 'evaluator' ? 'Avaliador' : 'Participante'}
            </span>
          </div>
        </div>

        {/* Dynamic Sidebar Links depending on Role */}
        {(user.role === 'admin' || user.role === 'moderator' || myAssignments.some(as => as.role === 'event_coordinator' || as.role === 'communication_coordinator')) && (
          <>
            <div className="sidebar-section-title">Comissão</div>
            {user.role === 'admin' && (
              <a href="#" className={`sidebar-link ${subView === 'admin-metrics' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setSubView('admin-metrics'); }}>
                <LayoutDashboard size={18} /> <span className="sidebar-text">Métrica Geral</span>
              </a>
            )}
            <a href="#" className={`sidebar-link ${subView === 'admin-events' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setSubView('admin-events'); }}>
              <Calendar size={18} /> <span className="sidebar-text">Workspace Eventos</span>
            </a>
            {user.role === 'admin' && (
              <a href="#" className={`sidebar-link ${subView === 'admin-users' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setSubView('admin-users'); }}>
                <Users size={18} /> <span className="sidebar-text">Gerenciar Usuários</span>
              </a>
            )}
          </>
        )}

        {(user.role === 'evaluator' || user.role === 'admin' || user.role === 'moderator') && (
          <>
            <div className="sidebar-section-title">Comissão Científica</div>
            {user.role === 'evaluator' && (
              <a href="#" className={`sidebar-link ${subView === 'evaluator-reviews' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setSubView('evaluator-reviews'); }}>
                <FileText size={18} /> <span className="sidebar-text">Avaliar Trabalhos</span>
              </a>
            )}
            <a href="#" className={`sidebar-link ${subView === 'coordinator-submissions' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setSubView('coordinator-submissions'); }}>
              <Users size={18} /> <span className="sidebar-text">Coordenação de Eixos</span>
            </a>
          </>
        )}

        {/* All users have access to Participant section */}
        <div className="sidebar-section-title">Participante</div>
        <a href="#" className={`sidebar-link ${subView === 'participant-events' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setSubView('participant-events'); }}>
          <Calendar size={18} /> <span className="sidebar-text">Minhas Inscrições</span>
        </a>
        <a href="#" className={`sidebar-link ${subView === 'participant-submissions' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setSubView('participant-submissions'); }}>
          <FileText size={18} /> <span className="sidebar-text">Minhas Submissões</span>
        </a>
        <a href="#" className={`sidebar-link ${subView === 'participant-certificates' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setSubView('participant-certificates'); }}>
          <Award size={18} /> <span className="sidebar-text">Meus Certificados</span>
        </a>

        {/* Settings / Profile section */}
        <div className="sidebar-section-title">Configurações</div>
        <a href="#" className={`sidebar-link ${subView === 'profile' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setSubView('profile'); }}>
          <User size={18} /> <span className="sidebar-text">Meu Perfil</span>
        </a>
      </aside>

      {/* Main Dashboard Content Area */}
      <section className="dashboard-content">
        {subView === 'participant-events' && <ParticipantEventsView user={user} token={token} showToast={showToast} />}
        {subView === 'participant-submissions' && <ParticipantSubmissionsView token={token} />}
        {subView === 'participant-certificates' && <ParticipantCertificatesView token={token} showToast={showToast} />}
        {subView === 'evaluator-reviews' && <EvaluatorReviewsView token={token} showToast={showToast} />}
        {subView === 'coordinator-submissions' && <CoordinatorSubmissionsView token={token} showToast={showToast} />}
        {subView === 'admin-metrics' && <AdminMetricsView token={token} />}
        {subView === 'admin-events' && <AdminEventsView token={token} showToast={showToast} user={user} myAssignments={myAssignments} />}
        {subView === 'admin-users' && <AdminUsersView token={token} showToast={showToast} />}
        {subView === 'profile' && <UserProfileView user={user} token={token} showToast={showToast} refreshUserProfile={refreshUserProfile} />}
      </section>
    </div>
  );
}

// USER PROFILE VIEW COMPONENT
function UserProfileView({ user, token, showToast, refreshUserProfile }) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [cpf, setCpf] = useState(user.cpf || '');
  const [photoUrl, setPhotoUrl] = useState(user.photo_url || '');
  const [minibio, setMinibio] = useState(user.minibio || '');
  const [contact, setContact] = useState(user.contact || '');
  const [institution, setInstitution] = useState(user.institution || '');
  const [position, setPosition] = useState(user.position || '');
  const [lattesLink, setLattesLink] = useState(user.lattes_link || '');
  const [orcid, setOrcid] = useState(user.orcid || '');

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const res = await fetch(`${API_URL}/api/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setPhotoUrl(data.image_url);
        showToast('Foto de perfil enviada com sucesso!');
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao enviar a foto', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de rede ao enviar foto', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email,
          cpf,
          photo_url: photoUrl,
          minibio,
          contact,
          institution,
          position,
          lattes_link: lattesLink,
          orcid
        })
      });

      if (res.ok) {
        showToast('Perfil atualizado com sucesso!');
        await refreshUserProfile(token, true);
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao atualizar perfil', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de rede ao salvar perfil', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-container">
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Meu Perfil</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Mantenha suas informações pessoais e acadêmicas atualizadas.</p>
      </div>

      <form onSubmit={handleSave} className="profile-grid-layout">
        {/* Left Column: Photo Card */}
        <div className="profile-card profile-photo-section">
          <div className="profile-photo-wrapper">
            <div className="profile-photo-container">
              {photoUrl ? (
                <img src={getImageUrl(photoUrl)} alt={name} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-placeholder">
                  <User size={48} />
                </div>
              )}
              {uploading && (
                <div className="profile-upload-overlay">
                  <div className="spinner small"></div>
                </div>
              )}
            </div>

            <label className="btn btn-secondary profile-upload-btn">
              {uploading ? 'Enviando...' : 'Alterar Foto'}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
            </label>
            <p className="photo-instructions">PNG, JPG ou WEBP. Máx 5MB.</p>
          </div>

          <hr style={{ margin: '20px 0', borderColor: 'var(--border)' }} />

          <div className="profile-summary">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '5px' }}>{name || 'Seu Nome'}</h3>
            <span className="badge badge-primary" style={{ textTransform: 'capitalize', display: 'inline-block' }}>
              {user.role === 'admin' ? 'Administrador' : user.role === 'moderator' ? 'Moderador' : user.role === 'evaluator' ? 'Avaliador Científico' : 'Participante'}
            </span>
            <p style={{ marginTop: '15px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: minibio ? 'normal' : 'italic' }}>
              {minibio || '"Nenhuma minibio fornecida ainda. Escreva algo sobre você na seção ao lado."'}
            </p>
          </div>
        </div>

        {/* Right Column: Profile Form Details */}
        <div className="profile-card profile-form-section">
          {/* Section: Informações Básicas */}
          <div className="form-section-title">Informações Básicas</div>
          <div className="form-row">
            <div className="form-group">
              <label>Nome Completo *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Seu nome"
              />
            </div>
            <div className="form-group">
              <label>CPF *</label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                required
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>E-mail *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu.email@exemplo.com"
              />
            </div>
            <div className="form-group">
              <label>Contato / Celular</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="(85) 99999-9999"
              />
            </div>
          </div>

          {/* Section: Perfil Profissional & Acadêmico */}
          <div className="form-section-title" style={{ marginTop: '25px' }}>Perfil Acadêmico e Profissional</div>
          <div className="form-row">
            <div className="form-group">
              <label>Instituição de Vínculo</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Ex: Universidade Federal do Ceará (UFC)"
              />
            </div>
            <div className="form-group">
              <label>Cargo / Função</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Ex: Professor Adjunto, Estudante de Mestrado"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Link Currículo Lattes</label>
              <input
                type="url"
                value={lattesLink}
                onChange={(e) => setLattesLink(e.target.value)}
                placeholder="http://lattes.cnpq.br/..."
              />
            </div>
            <div className="form-group">
              <label>Identificador ORCID</label>
              <input
                type="text"
                value={orcid}
                onChange={(e) => setOrcid(e.target.value)}
                placeholder="0000-0000-0000-0000"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Minibio / Apresentação</label>
            <textarea
              rows="4"
              value={minibio}
              onChange={(e) => setMinibio(e.target.value)}
              placeholder="Escreva um breve resumo profissional ou acadêmico sobre suas linhas de pesquisa ou atuação."
            />
          </div>

          <div className="form-actions-wrapper">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || uploading}
              style={{ padding: '12px 30px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {saving ? (
                <>
                  <div className="spinner small white"></div> Salvando...
                </>
              ) : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ==========================================
// PARTICIPANT DASHBOARD MODULES
// ==========================================

// A. PARTICIPANT ENROLLED EVENTS & VIRTUAL TRANSMISSION
function ParticipantRegistrationCard({ reg, token, onSelectLive, onSelectWallet, onDownloadReceipt }) {
  const [frequency, setFrequency] = useState(null);
  const [loadingFreq, setLoadingFreq] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchFrequency();
  }, [reg.event_id]);

  const fetchFrequency = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events/${reg.event_id}/my-frequency`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFrequency(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFreq(false);
    }
  };

  const getFormatLabel = (type) => {
    const formats = {
      'school_of_summer': 'Escola de Verão',
      'dima': 'DIMA',
      'live_cycle': 'Ciclo de Lives',
      'workshop': 'Workshop'
    };
    return formats[type] || 'Evento';
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '8px' }}>
            {getFormatLabel(reg.type)}
          </span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{reg.event_name}</h3>
          <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
            <span>Categoria: <strong>{reg.category}</strong></span>
            <span>Inscrito em: {new Date(reg.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {reg.type === 'live_cycle' && (
            <button className="btn btn-accent" onClick={() => onSelectLive(reg)}>
              <Video size={18} />
              Entrar na Transmissão
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => onSelectWallet(reg)}>
            <QrCode size={18} />
            Ver QR Credencial
          </button>
          <button className="btn btn-primary" onClick={() => onDownloadReceipt(reg.id)}>
            <FileText size={18} />
            Comprovante PDF
          </button>
        </div>
      </div>

      {/* Real-time Frequency section */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginTop: '5px' }}>
        {loadingFreq ? (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Carregando frequência nas atividades...</span>
        ) : frequency ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Frequência nas Atividades:</span>
                <span style={{
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  color: frequency.percentage >= 75 ? 'var(--success)' : 'var(--danger)'
                }}>
                  {frequency.percentage}%
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ({frequency.attended_activities} de {frequency.total_activities} atividades)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.78rem', padding: '3px 8px', borderRadius: '4px', background: frequency.percentage >= 75 ? 'rgba(5, 150, 105, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: frequency.percentage >= 75 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  {frequency.percentage >= 75 ? 'Requisito de Certificado Atingido' : 'Frequência abaixo de 75%'}
                </span>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', height: 'auto' }}
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? 'Ocultar Atividades' : 'Detalhar Atividades'}
                </button>
              </div>
            </div>

            {/* Attendance Progress Bar */}
            <div style={{ height: '8px', background: 'var(--surface-secondary)', borderRadius: '4px', overflow: 'hidden', width: '100%', marginBottom: '10px' }}>
              <div style={{
                height: '100%',
                background: frequency.percentage >= 75 ? 'var(--success)' : 'var(--danger)',
                width: `${frequency.percentage}%`,
                borderRadius: '4px',
                transition: 'width 0.3s ease-out'
              }}></div>
            </div>

            {/* Attendance Breakdown (collapsible) */}
            {showDetails && (
              <div style={{ background: 'var(--surface-secondary)', borderRadius: 'var(--radius-sm)', padding: '12px', marginTop: '12px', border: '1px solid var(--border)', animation: 'modalEnter 0.2s ease-out' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', color: 'var(--primary)' }}>Presença Detalhada por Atividade:</h4>
                {frequency.details.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhuma atividade cadastrada na programação deste evento.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {frequency.details.map(act => (
                      <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#fff', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{act.title}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            📅 {new Date(act.start_time).toLocaleDateString('pt-BR')} | ⏰ {new Date(act.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(act.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <span className={`badge ${act.attended ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>
                          {act.attended ? 'Presente' : 'Ausente'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <span style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>Falha ao carregar dados de frequência.</span>
        )}
      </div>
    </div>
  );
}

function ParticipantEventsView({ user, token, showToast }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLiveEvent, setSelectedLiveEvent] = useState(null);
  const [walletReg, setWalletReg] = useState(null);

  const [participantNotifications, setParticipantNotifications] = useState([]);
  const [loadingParticipantNotifications, setLoadingParticipantNotifications] = useState(false);

  const fetchParticipantNotifications = async (eventId) => {
    setLoadingParticipantNotifications(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setParticipantNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching participant notifications:', err);
    } finally {
      setLoadingParticipantNotifications(false);
    }
  };

  useEffect(() => {
    if (selectedLiveEvent) {
      fetchParticipantNotifications(selectedLiveEvent.event_id);
    } else {
      setParticipantNotifications([]);
    }
  }, [selectedLiveEvent]);

  const handleDownloadReceiptPDF = async (regId) => {
    showToast('Iniciando visualização do comprovante...');
    try {
      const response = await fetch(`${API_URL}/api/registrations/${regId}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        showToast('Comprovante carregado para visualização!');
      } else {
        showToast('Falha ao gerar comprovante de inscrição', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao visualizar comprovante', 'danger');
    }
  };

  // Live Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchMyEvents();
  }, []);

  // Poll for messages when in live event
  useEffect(() => {
    let interval;
    if (selectedLiveEvent) {
      // Simulate live message polling
      interval = setInterval(() => {
        const mockQuestions = [
          "Como será a disponibilização dos slides?",
          "Parabéns pela excelente explanação do tema!",
          "Qual é o livro de referência sugerido para essa pesquisa?",
          "O check-in virtual é computado automaticamente?"
        ];
        const randomMsg = mockQuestions[Math.floor(Math.random() * mockQuestions.length)];
        const names = ["Ana Clara", "Dr. Marcos", "Patrícia Lima", "Roberto Oliveira"];

        setChatMessages(prev => [
          ...prev,
          { id: Date.now(), user: names[Math.floor(Math.random() * names.length)], text: randomMsg, timestamp: new Date().toLocaleTimeString() }
        ]);
      }, 9000);
    }
    return () => clearInterval(interval);
  }, [selectedLiveEvent]);

  const fetchMyEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/registrations/my-events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setChatMessages(prev => [
      ...prev,
      { id: Date.now(), user: "Você", text: newMessage, timestamp: new Date().toLocaleTimeString(), isSelf: true }
    ]);
    setNewMessage('');
  };

  const getYoutubeEmbed = (url) => {
    if (!url) return '';
    // Extract video ID from youtube URL
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  if (selectedLiveEvent) {
    const embedUrl = getYoutubeEmbed(selectedLiveEvent.transmission_link);
    return (
      <div>
        <button className="btn btn-secondary" style={{ marginBottom: '20px' }} onClick={() => setSelectedLiveEvent(null)}>
          Voltar para Inscrições
        </button>
        <h2 style={{ fontSize: '1.6rem', color: 'var(--primary)', marginBottom: '10px' }}>{selectedLiveEvent.event_name}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', minHeight: '500px' }}>
          {/* Stream Video Player container */}
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#000', width: '100%', aspectRatio: '16/9', position: 'relative' }}>
              {embedUrl ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={embedUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0 }}
                ></iframe>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                  <Video size={48} style={{ marginBottom: '12px' }} />
                  <p>Link de transmissão ainda não configurado para esta live.</p>
                  {selectedLiveEvent.transmission_link && (
                    <a href={selectedLiveEvent.transmission_link} target="_blank" rel="noreferrer" style={{ marginTop: '10px', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Acessar link externo <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              )}
            </div>
            <div style={{ padding: '20px' }}>
              <span className="badge badge-success" style={{ marginBottom: '8px' }}>Transmissão Ativa</span>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Assista ao Ciclo de Lives e participe enviando suas dúvidas na caixa ao lado. Seu credenciamento virtual é gerado com base no check-in do administrador.
              </p>
              {selectedLiveEvent.additional_links && selectedLiveEvent.additional_links.length > 0 && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Links Complementares / Materiais:</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {selectedLiveEvent.additional_links.map((link, idx) => (
                      <a key={idx} href={link.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--surface-secondary)', border: '1px solid var(--border)', padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-primary)', textDecoration: 'none' }}>
                        <ExternalLink size={12} style={{ color: 'var(--primary-light)' }} /> {link.label || 'Link'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Q&A / Chat Module */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '0', height: '100%' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-secondary)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>Perguntas e Chat</h3>
            </div>

            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px' }}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '40px' }}>
                  Nenhuma pergunta enviada ainda. Seja o primeiro!
                </div>
              ) : (
                chatMessages.map(msg => (
                  <div key={msg.id} style={{
                    background: msg.isSelf ? 'rgba(37, 99, 235, 0.06)' : 'var(--surface-secondary)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    alignSelf: msg.isSelf ? 'flex-end' : 'flex-start',
                    maxWidth: '85%'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                      <span>{msg.user}</span>
                      <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>{msg.timestamp}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', marginTop: '4px', wordBreak: 'break-word' }}>{msg.text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendChatMessage} style={{ padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Faça uma pergunta ou comente..."
                style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 12px' }}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Mural de Comunicados do Evento */}
        <div className="glass-card" style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} /> Comunicados do Evento
          </h3>
          {loadingParticipantNotifications ? (
            <div>Carregando comunicados...</div>
          ) : participantNotifications.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Nenhum comunicado recebido para este evento.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {participantNotifications.map(n => (
                <div key={n.id} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                      <h4 style={{ fontWeight: 'bold', color: 'var(--primary-light)', margin: 0, fontSize: '0.95rem' }}>{n.title}</h4>
                      <span className="badge badge-secondary" style={{ fontSize: '0.62rem', whiteSpace: 'nowrap' }}>
                        {n.target_audience === 'all' ? 'Geral' :
                         n.target_audience === 'present' ? 'Credenciado' :
                         n.target_audience === 'authors' ? 'Autor' :
                         n.target_audience === 'evaluators' ? 'Avaliador' : 'Comissão'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', marginBottom: '16px', lineHeight: '1.4' }}>{n.message}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                    <span>Por: {n.sender_name || 'Gestor'}</span>
                    <span>{new Date(n.created_at).toLocaleDateString('pt-BR')} {new Date(n.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '24px' }}>Minhas Inscrições</h2>
      {loading ? (
        <div>Carregando inscrições...</div>
      ) : registrations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)' }}>Você ainda não se inscreveu em nenhuma edição de evento.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {registrations.map(reg => (
            <ParticipantRegistrationCard
              key={reg.id}
              reg={reg}
              token={token}
              onSelectLive={setSelectedLiveEvent}
              onSelectWallet={setWalletReg}
              onDownloadReceipt={handleDownloadReceiptPDF}
            />
          ))}
        </div>
      )}

      {/* Mobile Wallet Pass Modal */}
      {walletReg && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'modalEnter 0.25s ease-out'
        }} onClick={() => setWalletReg(null)}>
          <div style={{
            width: '340px',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            color: '#fff',
            overflow: 'hidden',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>

            {/* Ticket Header */}
            <div style={{ padding: '20px 24px', background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px dashed rgba(255,255,255,0.15)', textAlign: 'center', position: 'relative' }}>
              <span style={{ fontSize: '0.75rem', letterSpacing: '2px', color: '#93c5fd', fontWeight: 'bold', textTransform: 'uppercase' }}>G-TERCOA EVENTOS</span>
              <h4 style={{ margin: '4px 0 0', fontSize: '1.1rem', fontWeight: 800 }}>Credencial Digital</h4>
            </div>

            {/* Ticket Body */}
            <div style={{ padding: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Evento</span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>{walletReg.event_name}</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginBottom: '25px', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Participante</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff' }}>{user ? user.name : 'Participante'}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>CPF</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{user ? user.cpf : ''}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Categoria</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#10b981' }}>{walletReg.category}</div>
                  </div>
                </div>
              </div>

              {/* Dashed ripped line separator */}
              <div style={{ display: 'flex', alignItems: 'center', margin: '0 -24px 20px', position: 'relative' }}>
                <div style={{ width: '12px', height: '24px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '0 12px 12px 0', border: '1px solid rgba(255, 255, 255, 0.1)', borderLeft: 'none' }}></div>
                <div style={{ flex: 1, borderTop: '2px dashed rgba(255,255,255,0.15)', margin: '0 8px' }}></div>
                <div style={{ width: '12px', height: '24px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '12px 0 0 12px', border: '1px solid rgba(255, 255, 255, 0.1)', borderRight: 'none' }}></div>
              </div>

              {/* QR Code */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#fff', padding: '12px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${walletReg.id}`}
                    alt="QR Code Credencial"
                    style={{ display: 'block', width: '160px', height: '160px' }}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8', marginTop: '12px', letterSpacing: '1px' }}>
                  ID: {walletReg.id.substring(0, 8)}...
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px', textAlign: 'center' }}>
                  Apresente este QR Code no credenciamento para realizar check-in rápido
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '16px',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onClick={() => setWalletReg(null)}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              Fechar Credencial
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// B. PARTICIPANT SUBMISSIONS VIEW
function ParticipantSubmissionsView({ token }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/submissions/my-submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'under_review': <span className="badge badge-warning">Sob Revisão</span>,
      'accepted': <span className="badge badge-success">Aceito</span>,
      'accepted_with_remarks': <span className="badge badge-primary">Aceito com Ressalvas</span>,
      'rejected': <span className="badge badge-danger">Rejeitado</span>
    };
    return badges[status] || <span className="badge">{status}</span>;
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '24px' }}>Minhas Submissões</h2>
      {loading ? (
        <div>Carregando submissões...</div>
      ) : submissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)' }}>Você ainda não enviou nenhum trabalho acadêmico.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Evento</th>
                <th>Título do Trabalho</th>
                <th>Eixo Temático</th>
                <th>Arquivo</th>
                <th>Status</th>
                <th>Parecer / Observações</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => (
                <tr key={sub.id}>
                  <td style={{ fontWeight: 600 }}>{sub.event_name}</td>
                  <td>
                    <div>{sub.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Coautores: {sub.authors || 'Nenhum'}</div>
                  </td>
                  <td>{sub.thematic_axis}</td>
                  <td>
                    <a href={`${API_URL}${sub.file_path}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={14} /> Download
                    </a>
                  </td>
                  <td>{getStatusBadge(sub.status)}</td>
                  <td>
                    <div>
                      {sub.review_comments ? (
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Coordenação:</strong>{' '}
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{sub.review_comments}</span>
                        </div>
                      ) : (
                        <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>Sem comentários adicionais da coordenação.</div>
                      )}
                      
                      {/* Pareceres Técnicos Anônimos */}
                      {((sub.reviewer_status && sub.reviewer_status !== 'under_review') || 
                        (sub.reviewer_2_status && sub.reviewer_2_status !== 'under_review')) && (
                        <div style={{ fontSize: '0.78rem', background: 'var(--surface-secondary)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)', marginTop: '4px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--primary)', marginBottom: '4px' }}>Pareceres Acadêmicos (Duplo-Cego):</div>
                          {sub.reviewer_status && sub.reviewer_status !== 'under_review' && (
                            <div style={{ marginBottom: '4px' }}>
                              <strong style={{color:'var(--text-muted)'}}>Revisor 1:</strong>{' '}
                              <span className={`badge ${sub.reviewer_status === 'accepted' ? 'badge-success' : sub.reviewer_status === 'rejected' ? 'badge-danger' : 'badge-warning'}`} style={{ padding: '1px 4px', fontSize: '0.65rem' }}>
                                {sub.reviewer_status === 'accepted' ? 'Aceito' : sub.reviewer_status === 'accepted_with_remarks' ? 'Aceito com Ressalvas' : 'Rejeitado'}
                              </span>
                              {sub.reviewer_comments && <div style={{ fontStyle: 'italic', marginLeft: '8px', color: '#4a5568' }}>"{sub.reviewer_comments}"</div>}
                            </div>
                          )}
                          {sub.reviewer_2_status && sub.reviewer_2_status !== 'under_review' && (
                            <div style={{ borderTop: '1px dotted var(--border)', paddingTop: '4px', marginTop: '4px' }}>
                              <strong style={{color:'var(--text-muted)'}}>Revisor 2:</strong>{' '}
                              <span className={`badge ${sub.reviewer_2_status === 'accepted' ? 'badge-success' : sub.reviewer_2_status === 'rejected' ? 'badge-danger' : 'badge-warning'}`} style={{ padding: '1px 4px', fontSize: '0.65rem' }}>
                                {sub.reviewer_2_status === 'accepted' ? 'Aceito' : sub.reviewer_2_status === 'accepted_with_remarks' ? 'Aceito com Ressalvas' : 'Rejeitado'}
                              </span>
                              {sub.reviewer_2_comments && <div style={{ fontStyle: 'italic', marginLeft: '8px', color: '#4a5568' }}>"{sub.reviewer_2_comments}"</div>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// C. PARTICIPANT CERTIFICATES VIEW
function ParticipantCertificatesView({ token, showToast }) {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/certificates/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCerts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (certId, code) => {
    showToast('Iniciando visualização do certificado...');
    try {
      const response = await fetch(`${API_URL}/api/certificates/${certId}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        showToast('Certificado carregado para visualização!');
      } else {
        showToast('Falha ao gerar PDF do certificado', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao visualizar certificado', 'danger');
    }
  };

  const getCertTypeLabel = (type) => {
    const labels = {
      'participation': 'Participação',
      'organization': 'Comissão Organizadora',
      'presentation': 'Apresentação de Trabalho',
      'guest': 'Convidado / Palestrante',
      'organization_general': 'Organização (Geral)',
      'organization_coordinator': 'Organização (Coordenador)',
      'organization_technical': 'Organização (Técnico)',
      'submission': 'Submissão de Trabalho',
      'guest_speaker': 'Convidado (Palestrante)',
      'guest_mediator': 'Convidado (Mediador)',
      'workshop': 'Minicurso / Oficina'
    };
    return labels[type] || 'Participação';
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '24px' }}>Meus Certificados</h2>
      {loading ? (
        <div>Carregando certificados...</div>
      ) : certs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)' }}>Nenhum certificado disponível para download.</p>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Nota: Certificados são emitidos pela organização após a confirmação do seu check-in.
          </span>
        </div>
      ) : (
        <div className="grid-cards">
          {certs.map(cert => (
            <div key={cert.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <Award size={32} style={{ color: 'var(--accent-light)', marginBottom: '12px' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)' }}>{cert.event_name}</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  <div>Tipo: <strong style={{ color: 'var(--primary-light)' }}>{getCertTypeLabel(cert.type)}</strong></div>
                  {cert.presentation_title && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }} title={cert.presentation_title}>Artigo: {cert.presentation_title}</div>}
                  <div style={{ marginTop: '4px' }}>Carga Horária: <strong>{cert.workload_hours} horas</strong></div>
                  <div>Emissão: {new Date(cert.created_at).toLocaleDateString('pt-BR')}</div>
                  <div style={{ fontFamily: 'monospace', marginTop: '6px', background: 'var(--surface-secondary)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                    Cód: {cert.verification_code}
                  </div>
                </div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => handleDownloadPDF(cert.id, cert.verification_code)}>
                Visualizar PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// EVALUATOR PORTAL
// ==========================================
function EvaluatorReviewsView({ token, showToast }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);

  // Evaluation fields
  const [status, setStatus] = useState('');
  const [comments, setComments] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Structured evaluation checklist state
  const [formAnswers, setFormAnswers] = useState({
    q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '', q8: '', q9: '', q10: '', q11: '', q12: '', q13: ''
  });
  const [recommendation, setRecommendation] = useState('');

  const EVALUATION_QUESTIONS = [
    { id: 'q1', text: '1. O texto traz uma contribuição importante para o conhecimento da área em que se insere?' },
    { id: 'q2', text: '2. O título e o resumo são coerentes com o conteúdo do texto?' },
    { id: 'q3', text: '3. O Resumo apresenta os elementos principais?' },
    { id: 'q4', text: '4. O tema proposto está bem desenvolvido, com articulação entre as partes do texto?' },
    { id: 'q5', text: '5. O texto apresenta o método de pesquisa, descrevendo os instrumentos e técnicas adotados na pesquisa?' },
    { id: 'q6', text: '6. De um modo geral, o texto alcança e/ou responde aos objetivos/questões propostos?' },
    { id: 'q7', text: '7. O texto apresenta os principais resultados encontrados, com os dados e informações que contribuem para o atendimento do objetivo proposto?' },
    { id: 'q8', text: '8. O texto apresenta as considerações sobre o estudo, sintetizando os aspectos mais importantes da pesquisa?' },
    { id: 'q9', text: '9. As referências são atualizadas e/ou relevantes ao texto?' },
    { id: 'q10', text: '10. Apresenta todas as referências citadas no texto?' },
    { id: 'q11', text: '11. Quanto aos aspectos ortográfico e gramatical, o texto está bem escrito?' },
    { id: 'q12', text: '12. Quanto à adequação da linguagem está clara?' },
    { id: 'q13', text: '13. O texto segue rigorosamente as normas da ABNT?' }
  ];

  useEffect(() => {
    fetchSubmissionsToReview();
  }, []);

  useEffect(() => {
    if (selectedSub) {
      setComments(selectedSub.review_comments || '');
      setStatus(selectedSub.status === 'under_review' ? '' : selectedSub.status);
      if (selectedSub.evaluation_form) {
        setFormAnswers(selectedSub.evaluation_form.answers || {
          q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '', q8: '', q9: '', q10: '', q11: '', q12: '', q13: ''
        });
        setRecommendation(selectedSub.evaluation_form.recommendation || '');
      } else {
        setFormAnswers({
          q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '', q8: '', q9: '', q10: '', q11: '', q12: '', q13: ''
        });
        setRecommendation('');
      }
    }
  }, [selectedSub]);

  const handleRecommendationChange = (val) => {
    setRecommendation(val);
    if (val === 'publish_as_is') {
      setStatus('accepted');
    } else if (val === 'publish_with_minor' || val === 'publish_with_major') {
      setStatus('accepted_with_remarks');
    } else if (val === 'reject') {
      setStatus('rejected');
    }
  };

  const fetchSubmissionsToReview = async () => {
    try {
      const res = await fetch(`${API_URL}/api/submissions/to-review`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!status || !recommendation) {
      showToast('Selecione a recomendação oficial', 'danger');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_URL}/api/submissions/${selectedSub.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status, 
          review_comments: comments,
          evaluation_form: {
            answers: formAnswers,
            recommendation
          }
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Parecer acadêmico e formulário enviados com sucesso!');
        setSelectedSub(null);
        setStatus('');
        setComments('');
        fetchSubmissionsToReview();
      } else {
        showToast(data.error || 'Erro ao enviar parecer', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de rede', 'danger');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '24px' }}>Avaliar Trabalhos Científicos</h2>

      {selectedSub && (
        <div className="glass-card" style={{ marginBottom: '30px', border: '1px solid var(--primary-light)' }}>
          <h3 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginBottom: '14px' }}>Emitir Parecer: {selectedSub.title}</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '0.9rem', marginBottom: '20px', background: 'var(--surface-secondary)', padding: '15px', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <div><strong>Evento:</strong> {selectedSub.event_name}</div>
              <div><strong>Eixo Temático:</strong> {selectedSub.thematic_axis}</div>
              <div><strong>Função Designada:</strong> <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Avaliador {selectedSub.reviewer_slot}</span> (Duplo-Cego)</div>
            </div>
            <div>
              <div>
                <strong>Trabalho Escrito:</strong>{' '}
                <a href={`${API_URL}${selectedSub.file_path}`} target="_blank" rel="noreferrer" style={{ fontWeight: 'bold' }}>
                  Baixar Documento
                </a>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmitReview}>
            <div style={{ background: 'rgba(59, 130, 246, 0.05)', borderLeft: '4px solid var(--primary-light)', padding: '14px', borderRadius: '4px', marginBottom: '20px', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
              <strong>A comissão editorial solicita que V. Sa. aprecie o presente artigo e devolva a sua avaliação, no prazo de 05 dias a partir do recebimento desta solicitação. Informamos que será emitida uma declaração para o(a) avaliador(a). Qualquer impedimento, entre em contato pelo e-mail: tercoa.monitoria@gmail.com</strong>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '10px', color: 'var(--primary)' }}>FORMULÁRIO DE AVALIAÇÃO DE TRABALHOS</h4>
            <div className="table-container" style={{ marginBottom: '20px', overflowX: 'auto' }}>
              <table className="custom-table" style={{ width: '100%', fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Critério de Avaliação</th>
                    <th style={{ textAlign: 'center', width: '70px' }}>Sim</th>
                    <th style={{ textAlign: 'center', width: '70px' }}>Razoável</th>
                    <th style={{ textAlign: 'center', width: '70px' }}>Pouco</th>
                    <th style={{ textAlign: 'center', width: '70px' }}>Não</th>
                  </tr>
                </thead>
                <tbody>
                  {EVALUATION_QUESTIONS.map(q => (
                    <tr key={q.id}>
                      <td style={{ textAlign: 'left', fontWeight: '500' }}>{q.text}</td>
                      {['sim', 'razoavel', 'pouco', 'nao'].map(opt => (
                        <td key={opt} style={{ textAlign: 'center' }}>
                          <input
                            type="radio"
                            name={q.id}
                            value={opt}
                            checked={formAnswers[q.id] === opt}
                            onChange={() => setFormAnswers(prev => ({ ...prev, [q.id]: opt }))}
                            required
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="form-group" style={{ background: 'var(--surface-secondary)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border)' }}>
              <label className="form-label" style={{ fontWeight: 'bold', marginBottom: '10px' }}>RECOMENDAÇÃO *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                  <input
                    type="radio"
                    name="recommendation"
                    value="publish_as_is"
                    checked={recommendation === 'publish_as_is'}
                    onChange={() => handleRecommendationChange('publish_as_is')}
                    required
                  />
                  Publicar o texto integralmente, sem alterações.
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                  <input
                    type="radio"
                    name="recommendation"
                    value="publish_with_minor"
                    checked={recommendation === 'publish_with_minor'}
                    onChange={() => handleRecommendationChange('publish_with_minor')}
                    required
                  />
                  Publicar o texto, sem retorno ao(s) autor(es), após pequenas correções, conforme sugestões anexas.
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                  <input
                    type="radio"
                    name="recommendation"
                    value="publish_with_major"
                    checked={recommendation === 'publish_with_major'}
                    onChange={() => handleRecommendationChange('publish_with_major')}
                    required
                  />
                  Publicar o texto após o retorno ao(s) autor(es) para significativas correções e alterações, conforme sugestões anexas.
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                  <input
                    type="radio"
                    name="recommendation"
                    value="reject"
                    checked={recommendation === 'reject'}
                    onChange={() => handleRecommendationChange('reject')}
                    required
                  />
                  Não publicar, devido aos motivos indicados a seguir.
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'bold' }}>COMENTÁRIOS AO TEXTO *</label>
              <textarea
                className="form-input"
                style={{ minHeight: '120px' }}
                placeholder="Insira as observações críticas, justificativa da recomendação ou anotações detalhadas de revisão..."
                required
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" disabled={submittingReview}>
                {submittingReview ? 'Enviando...' : 'Confirmar e Enviar Parecer'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedSub(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div>Carregando trabalhos alocados...</div>
      ) : submissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)' }}>Você não possui trabalhos designados para avaliação pendente.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Evento</th>
                <th>Título</th>
                <th>Eixo Temático</th>
                <th>Função</th>
                <th>Data de Envio</th>
                <th>Status do Parecer</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => (
                <tr key={sub.id}>
                  <td>{sub.event_name}</td>
                  <td style={{ fontWeight: 600 }}>{sub.title}</td>
                  <td>{sub.thematic_axis}</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Avaliador {sub.reviewer_slot}</td>
                  <td>{new Date(sub.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <span className={`badge ${sub.status === 'under_review' ? 'badge-warning' : sub.status === 'accepted' ? 'badge-success' : sub.status === 'rejected' ? 'badge-danger' : 'badge-primary'
                      }`}>
                      {sub.status === 'under_review' ? 'Sob Avaliação' : sub.status === 'accepted' ? 'Aceito' : sub.status === 'accepted_with_remarks' ? 'Aceito com Ressalvas' : sub.status === 'rejected' ? 'Rejeitado' : sub.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setSelectedSub(sub)}>
                      Avaliar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// B. COORDINATOR SUBMISSIONS VIEW
function CoordinatorSubmissionsView({ token, showToast }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);
  const [evaluatorsList, setEvaluatorsList] = useState([]);
  const [loadingEvaluators, setLoadingEvaluators] = useState(false);

  // Assign reviewer modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedReviewerId, setSelectedReviewerId] = useState('');
  const [activeSlot, setActiveSlot] = useState(1);
  const [isAssigning, setIsAssigning] = useState(false);

  // Final decision form state
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [finalStatus, setFinalStatus] = useState('');
  const [finalComments, setFinalComments] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Read-only structured form modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [formModalTitle, setFormModalTitle] = useState('');
  const [formModalData, setFormModalData] = useState(null);

  const openFormViewModal = (title, formStr, commentsVal) => {
    let formData = null;
    if (formStr) {
      try {
        formData = typeof formStr === 'string' ? JSON.parse(formStr) : formStr;
      } catch (e) {
        console.error('Error parsing evaluation form', e);
      }
    }
    setFormModalTitle(title);
    setFormModalData({
      answers: formData?.answers || {},
      recommendation: formData?.recommendation || '',
      comments: commentsVal || ''
    });
    setShowFormModal(true);
  };
  const [selectedEventIdForCoordination, setSelectedEventIdForCoordination] = useState(null);

  useEffect(() => {
    fetchCoordinationSubmissions();
  }, []);

  const fetchCoordinationSubmissions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/coordination/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventEvaluators = async (eventId) => {
    setLoadingEvaluators(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/assigned-evaluators`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluatorsList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEvaluators(false);
    }
  };

  const openAssignModal = (sub, slot) => {
    setSelectedSub(sub);
    setActiveSlot(slot);
    setSelectedReviewerId((slot === 2 ? sub.reviewer_2_id : sub.reviewer_id) || '');
    fetchEventEvaluators(sub.event_id);
    setShowAssignModal(true);
  };

  const handleAssignReviewer = async (e) => {
    e.preventDefault();
    setIsAssigning(true);
    try {
      const res = await fetch(`${API_URL}/api/submissions/${selectedSub.id}/assign-evaluator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          reviewer_id: selectedReviewerId || null, 
          reviewer_slot: activeSlot 
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(selectedReviewerId ? 'Avaliador alocado com sucesso!' : 'Avaliador removido com sucesso!');
        setShowAssignModal(false);
        setSelectedSub(null);
        fetchCoordinationSubmissions();
      } else {
        showToast(data.error || 'Erro ao alocar avaliador', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao alocar avaliador', 'danger');
    } finally {
      setIsAssigning(false);
    }
  };

  const openDecisionModal = (sub) => {
    setSelectedSub(sub);
    setFinalStatus(sub.status === 'under_review' ? '' : sub.status);
    setFinalComments(sub.review_comments || '');
    setShowDecisionModal(true);
  };

  const handleCoordinatorDecision = async (e) => {
    e.preventDefault();
    if (!finalStatus) {
      showToast('Selecione o parecer final', 'danger');
      return;
    }
    setIsSubmittingDecision(true);
    try {
      const res = await fetch(`${API_URL}/api/submissions/${selectedSub.id}/coordinator-decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: finalStatus, review_comments: finalComments })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Parecer final salvo com sucesso!');
        setShowDecisionModal(false);
        setSelectedSub(null);
        fetchCoordinationSubmissions();
      } else {
        showToast(data.error || 'Erro ao salvar parecer', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de rede', 'danger');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'under_review': <span className="badge badge-warning">Sob Avaliação</span>,
      'accepted': <span className="badge badge-success">Aceito</span>,
      'accepted_with_remarks': <span className="badge badge-primary">Aceito com Ressalvas</span>,
      'rejected': <span className="badge badge-danger">Rejeitado</span>
    };
    return badges[status] || <span className="badge">{status}</span>;
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '24px' }}>Coordenação de Trabalhos Científicos</h2>

      {/* Assign Reviewer Modal */}
      {showAssignModal && selectedSub && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-card" style={{ width: '450px', padding: '30px', animation: 'modalEnter 0.25s ease-out' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Alocar Avaliador {activeSlot}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              <strong>Artigo:</strong> {selectedSub.title}<br />
              <strong>Eixo:</strong> {selectedSub.thematic_axis}
            </p>
            <form onSubmit={handleAssignReviewer}>
              <div className="form-group">
                <label className="form-label">Selecionar Avaliador</label>
                {loadingEvaluators ? (
                  <div>Carregando avaliadores do evento...</div>
                ) : evaluatorsList.length === 0 ? (
                  <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>Nenhum avaliador geral cadastrado para este evento. Adicione avaliadores na tela do Admin.</div>
                ) : (
                  <select
                    className="form-select"
                    value={selectedReviewerId}
                    onChange={(e) => setSelectedReviewerId(e.target.value)}
                  >
                    <option value="">-- Remover Designação / Nenhum --</option>
                    {evaluatorsList.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.name} ({ev.email})</option>
                    ))}
                  </select>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" disabled={isAssigning || evaluatorsList.length === 0}>
                  {isAssigning ? 'Salvando...' : 'Confirmar Designação'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAssignModal(false); setSelectedSub(null); }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coordinator Decision Modal */}
      {showDecisionModal && selectedSub && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-card" style={{ width: '650px', padding: '30px', animation: 'modalEnter 0.25s ease-out' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Decisão Final da Coordenação</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              <strong>Artigo:</strong> {selectedSub.title}<br />
              <strong>Eixo:</strong> {selectedSub.thematic_axis}
            </p>

            {/* Pareceres Técnicos Lado a Lado */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '15px', 
              marginBottom: '20px', 
              background: 'var(--surface-secondary)', 
              padding: '12px', 
              borderRadius: 'var(--radius-sm)', 
              fontSize: '0.82rem',
              border: '1px solid var(--border)'
            }}>
              <div style={{ borderRight: '1px solid var(--border)', paddingRight: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '6px', color: 'var(--primary)' }}>Avaliador 1</h4>
                  <div><strong>Nome:</strong> {selectedSub.reviewer_name || <span style={{color:'var(--text-muted)'}}>Não designado</span>}</div>
                  <div style={{ marginTop: '3px' }}>
                    <strong>Parecer:</strong>{' '}
                    <span className={`badge ${selectedSub.reviewer_status === 'accepted' ? 'badge-success' : selectedSub.reviewer_status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                      {selectedSub.reviewer_status === 'under_review' ? 'Pendente' : selectedSub.reviewer_status || 'Nenhum'}
                    </span>
                  </div>
                  <div style={{ marginTop: '6px', fontStyle: 'italic', maxHeight: '80px', overflowY: 'auto', background: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    {selectedSub.reviewer_comments ? `"${selectedSub.reviewer_comments}"` : 'Sem observações.'}
                  </div>
                </div>
                {selectedSub.reviewer_evaluation_form && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '5px 10px', fontSize: '0.72rem', marginTop: '10px', width: '100%' }}
                    onClick={() => openFormViewModal('Ficha de Avaliação - Revisor 1', selectedSub.reviewer_evaluation_form, selectedSub.reviewer_comments)}
                  >
                    👁️ Ver Ficha de Avaliação 1
                  </button>
                )}
              </div>
              <div style={{ paddingLeft: '5px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '6px', color: 'var(--primary)' }}>Avaliador 2</h4>
                  <div><strong>Nome:</strong> {selectedSub.reviewer_2_name || <span style={{color:'var(--text-muted)'}}>Não designado</span>}</div>
                  <div style={{ marginTop: '3px' }}>
                    <strong>Parecer:</strong>{' '}
                    <span className={`badge ${selectedSub.reviewer_2_status === 'accepted' ? 'badge-success' : selectedSub.reviewer_2_status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                      {selectedSub.reviewer_2_status === 'under_review' ? 'Pendente' : selectedSub.reviewer_2_status || 'Nenhum'}
                    </span>
                  </div>
                  <div style={{ marginTop: '6px', fontStyle: 'italic', maxHeight: '80px', overflowY: 'auto', background: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    {selectedSub.reviewer_2_comments ? `"${selectedSub.reviewer_2_comments}"` : 'Sem observações.'}
                  </div>
                </div>
                {selectedSub.reviewer_2_evaluation_form && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '5px 10px', fontSize: '0.72rem', marginTop: '10px', width: '100%' }}
                    onClick={() => openFormViewModal('Ficha de Avaliação - Revisor 2', selectedSub.reviewer_2_evaluation_form, selectedSub.reviewer_2_comments)}
                  >
                    👁️ Ver Ficha de Avaliação 2
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleCoordinatorDecision}>
              <div className="form-group">
                <label className="form-label">Resultado Final *</label>
                <select className="form-select" required value={finalStatus} onChange={(e) => setFinalStatus(e.target.value)}>
                  <option value="">Selecione...</option>
                  <option value="accepted">Aceito</option>
                  <option value="accepted_with_remarks">Aceito com Ressalvas</option>
                  <option value="rejected">Rejeitado</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Comentários e Parecer da Coordenação *</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '120px' }}
                  required
                  placeholder="Insira as observações finais enviadas ao participante..."
                  value={finalComments}
                  onChange={(e) => setFinalComments(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingDecision}>
                  {isSubmittingDecision ? 'Salvando...' : 'Salvar Decisão Oficial'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowDecisionModal(false); setSelectedSub(null); }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div>Carregando submissões sob sua coordenação...</div>
      ) : submissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)' }}>Nenhuma submissão encontrada sob sua coordenação para eixos ativos.</p>
        </div>
      ) : selectedEventIdForCoordination === null ? (
        (() => {
          const groupedEvents = submissions.reduce((acc, sub) => {
            let ev = acc.find(e => e.id === sub.event_id);
            if (!ev) {
              ev = {
                id: sub.event_id,
                name: sub.event_name,
                total: 0,
                pending: 0,
                reviewed: 0
              };
              acc.push(ev);
            }
            ev.total += 1;
            if (sub.status === 'under_review') {
              ev.pending += 1;
            } else {
              ev.reviewed += 1;
            }
            return acc;
          }, []);

          return (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Evento</th>
                    <th style={{ textAlign: 'center' }}>Total de Trabalhos</th>
                    <th style={{ textAlign: 'center' }}>Avaliados</th>
                    <th style={{ textAlign: 'center' }}>Pendentes</th>
                    <th style={{ textAlign: 'center', width: '180px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedEvents.map(ev => (
                    <tr key={ev.id}>
                      <td style={{ fontWeight: 600 }}>{ev.name}</td>
                      <td style={{ textAlign: 'center' }}>{ev.total}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-success" style={{ minWidth: '35px', display: 'inline-block' }}>{ev.reviewed}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-warning" style={{ minWidth: '35px', display: 'inline-block' }}>{ev.pending}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }} 
                          onClick={() => setSelectedEventIdForCoordination(ev.id)}
                        >
                          Gerenciar Trabalhos
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()
      ) : (
        (() => {
          const filteredSubmissions = submissions.filter(sub => sub.event_id === selectedEventIdForCoordination);
          const currentEventName = filteredSubmissions[0]?.event_name || 'Evento';
          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'var(--surface-secondary)', padding: '15px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', margin: 0 }}>{currentEventName}</h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Gerenciando {filteredSubmissions.length} trabalho(s) sob sua coordenação</span>
                </div>
                <button className="btn btn-secondary" onClick={() => setSelectedEventIdForCoordination(null)}>
                  Voltar para Lista de Eventos
                </button>
              </div>

              {filteredSubmissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <p style={{ color: 'var(--text-muted)' }}>Nenhum trabalho sob sua coordenação para este evento.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Título do Artigo</th>
                        <th>Eixo Temático</th>
                        <th>Avaliadores (1 & 2)</th>
                        <th>Status</th>
                        <th>Parecer Final</th>
                        <th style={{ width: '170px', textAlign: 'center' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.map(sub => (
                <tr key={sub.id}>
                  <td>{sub.event_name}</td>
                  <td style={{ fontWeight: 600 }}>{sub.title}</td>
                  <td>{sub.thematic_axis}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                          <strong style={{ color: 'var(--text-muted)' }}>Av. 1:</strong>{' '}
                          {sub.reviewer_name ? (
                            <span style={{ fontWeight: '600', color: 'var(--primary)' }} title={sub.reviewer_name}>{sub.reviewer_name}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Pendente</span>
                          )}
                        </span>
                        <button className="btn btn-secondary" style={{ padding: '2px 5px', fontSize: '0.68rem', height: 'fit-content' }} onClick={() => openAssignModal(sub, 1)}>
                          Definir
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '4px' }}>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                          <strong style={{ color: 'var(--text-muted)' }}>Av. 2:</strong>{' '}
                          {sub.reviewer_2_name ? (
                            <span style={{ fontWeight: '600', color: 'var(--primary)' }} title={sub.reviewer_2_name}>{sub.reviewer_2_name}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Pendente</span>
                          )}
                        </span>
                        <button className="btn btn-secondary" style={{ padding: '2px 5px', fontSize: '0.68rem', height: 'fit-content' }} onClick={() => openAssignModal(sub, 2)}>
                          Definir
                        </button>
                      </div>
                    </div>
                  </td>
                  <td>{getStatusBadge(sub.status)}</td>
                  <td>
                    {sub.review_comments ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{sub.review_comments.substring(0, 50)}...</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>Pendente</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <a href={`${API_URL}${sub.file_path}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.72rem', textDecoration: 'none', textAlign: 'center' }}>
                          Cego (Sem Id.)
                        </a>
                        {sub.file_path_identified && (
                          <a href={`${API_URL}${sub.file_path_identified}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.72rem', textDecoration: 'none', textAlign: 'center' }}>
                            Identificado
                          </a>
                        )}
                      </div>
                      <button className="btn btn-accent" style={{ padding: '6px 10px', fontSize: '0.78rem' }} onClick={() => openDecisionModal(sub)}>
                        Decidir
                      </button>
                    </div>
                  </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()
      )}
      {showFormModal && formModalData && (
        <EvaluationFormViewModal
          title={formModalTitle}
          data={formModalData}
          onClose={() => { setShowFormModal(false); setFormModalData(null); }}
        />
      )}
    </div>
  );
}

// C. ADMIN PORTAL MODULES
// ==========================================

// A. METRICS VIEW
function AdminMetricsView({ token }) {
  const [metrics, setMetrics] = useState({
    eventsCount: 0,
    regsCount: 0,
    checkinCount: 0,
    submissionsCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const resEvents = await fetch(`${API_URL}/api/events`);
      const events = await resEvents.json();

      let totalRegs = 0;
      let totalCheckins = 0;
      let totalSubmissions = 0;

      for (const ev of events) {
        const resRegs = await fetch(`${API_URL}/api/events/${ev.id}/registrations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const regs = await resRegs.json();
        totalRegs += regs.length;
        totalCheckins += regs.filter(r => r.checked_in === 1).length;

        const resSub = await fetch(`${API_URL}/api/events/${ev.id}/submissions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const subs = await resSub.json();
        totalSubmissions += subs.length;
      }

      setMetrics({
        eventsCount: events.length,
        regsCount: totalRegs,
        checkinCount: totalCheckins,
        submissionsCount: totalSubmissions
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando métricas...</div>;

  const attendanceRate = metrics.regsCount > 0 ? Math.round((metrics.checkinCount / metrics.regsCount) * 100) : 0;

  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '24px' }}>Métricas do G-TERCOA</h2>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="metric-card">
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Edições de Eventos</span>
            <div className="metric-number">{metrics.eventsCount}</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-light)' }}>
            <Calendar size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Total de Inscritos</span>
            <div className="metric-number">{metrics.regsCount}</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'rgba(180, 83, 9, 0.1)', color: 'var(--accent)' }}>
            <Users size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Trabalhos Submetidos</span>
            <div className="metric-number">{metrics.submissionsCount}</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'rgba(5, 150, 105, 0.1)', color: 'var(--success)' }}>
            <FileText size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Taxa de Presença</span>
            <div className="metric-number">{attendanceRate}%</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'rgba(13, 148, 136, 0.1)', color: '#0d9488' }}>
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Visual Graphical charts using Custom inline SVGs & CSS bar charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', color: 'var(--primary)', marginBottom: '20px' }}>Comparecimento vs Credenciados</h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', gap: '40px' }}>
            {/* SVG Donut Chart */}
            <svg width="150" height="150" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="var(--success)"
                strokeWidth="3.5"
                strokeDasharray={`${attendanceRate} ${100 - attendanceRate}`}
                strokeDashoffset="0"
              />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                <div style={{ width: '12px', height: '12px', background: 'var(--success)', borderRadius: '3px' }}></div>
                <span>Credenciados: <strong>{metrics.checkinCount}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                <div style={{ width: '12px', height: '12px', background: '#e2e8f0', borderRadius: '3px' }}></div>
                <span>Ausentes: <strong>{metrics.regsCount - metrics.checkinCount}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', color: 'var(--primary)', marginBottom: '20px' }}>Volume Acadêmico por Categoria</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '220px', justifyContent: 'center' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span>Artigos / Resumos</span>
                <strong>{metrics.submissionsCount}</strong>
              </div>
              <div style={{ height: '8px', background: 'var(--surface-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--primary-light)', width: `${Math.min(100, (metrics.submissionsCount / 20) * 100)}%`, borderRadius: '4px' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span>Inscrições Efetuadas</span>
                <strong>{metrics.regsCount}</strong>
              </div>
              <div style={{ height: '8px', background: 'var(--surface-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--accent)', width: `${Math.min(100, (metrics.regsCount / 50) * 100)}%`, borderRadius: '4px' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span>Canais de Comunicação</span>
                <strong>{metrics.eventsCount} Edições</strong>
              </div>
              <div style={{ height: '8px', background: 'var(--surface-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#0d9488', width: `${Math.min(100, (metrics.eventsCount / 10) * 100)}%`, borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// B. EVENT BUILDER
function AdminEventsView({ token, showToast, user, myAssignments = [] }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection / Workspace Navigation State
  const [selectedEventForManagement, setSelectedEventForManagement] = useState(null);
  const [workspaceTab, setWorkspaceTab] = useState('basic');

  // Delete Event Form State
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteConfirmCheckbox, setDeleteConfirmCheckbox] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Event Form State (Basic information)
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState('workshop');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('Auditório Principal');
  const [registrationStartDate, setRegistrationStartDate] = useState('');
  const [registrationEndDate, setRegistrationEndDate] = useState('');
  const [submissionStartDate, setSubmissionStartDate] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [evaluationDeadline, setEvaluationDeadline] = useState('');
  const [resultsDeadline, setResultsDeadline] = useState('');

  // Incremental configurations
  const [bannerUrl, setBannerUrl] = useState('');
  const [workloadHours, setWorkloadHours] = useState('20');
  const [transmissionLink, setTransmissionLink] = useState('');
  const [eventAdditionalLinks, setEventAdditionalLinks] = useState([]);
  const [newEventLinkLabel, setNewEventLinkLabel] = useState('');
  const [newEventLinkUrl, setNewEventLinkUrl] = useState('');

  const handleAddEventLink = () => {
    if (!newEventLinkLabel.trim() || !newEventLinkUrl.trim()) {
      showToast('Preencha o nome e a URL do link', 'warning');
      return;
    }
    let url = newEventLinkUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    setEventAdditionalLinks(prev => [...prev, { label: newEventLinkLabel.trim(), url }]);
    setNewEventLinkLabel('');
    setNewEventLinkUrl('');
  };

  const handleRemoveEventLink = (index) => {
    setEventAdditionalLinks(prev => prev.filter((_, i) => i !== index));
  };

  const [thematicAxes, setThematicAxes] = useState([]);
  const [submissionRules, setSubmissionRules] = useState('');
  const [submissionsEnabled, setSubmissionsEnabled] = useState(1);
  const [rulesFiles, setRulesFiles] = useState([]);
  const [maxCoauthors, setMaxCoauthors] = useState(3);
  const [newRulesFileName, setNewRulesFileName] = useState('');
  const [newRulesFile, setNewRulesFile] = useState(null);
  const [uploadingRulesFile, setUploadingRulesFile] = useState(false);

  // Tickets / Categories
  const [regCategories, setRegCategories] = useState([
    { name: 'Estudante do Ensino Médio', price: 0 },
    { name: 'Estudante da Graduação', price: 0 },
    { name: 'Estudante da Pós-graduação', price: 0 },
    { name: 'Professor(a) da Educação Básica', price: 0 },
    { name: 'Professor(a) e Pesquisador(a) do Ensino Superior', price: 0 }
  ]);

  // Guests list & Form state
  const [guestsList, setGuestsList] = useState([]);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestRole, setNewGuestRole] = useState('palestrante');
  const [newGuestInstitution, setNewGuestInstitution] = useState('');
  const [newGuestImageUrl, setNewGuestImageUrl] = useState('');
  const [newGuestBio, setNewGuestBio] = useState('');
  const [newGuestOrcid, setNewGuestOrcid] = useState('');
  const [newGuestLattes, setNewGuestLattes] = useState('');
  const [isUploadingGuestImage, setIsUploadingGuestImage] = useState(false);
  const [systemUsers, setSystemUsers] = useState([]);
  const [selectedSystemUserId, setSelectedSystemUserId] = useState('');
  const [guestToDeleteId, setGuestToDeleteId] = useState(null);

  // Supporters state
  const [supportersList, setSupportersList] = useState([]);
  const [newSupporterName, setNewSupporterName] = useState('');
  const [newSupporterLogoUrl, setNewSupporterLogoUrl] = useState('');
  const [isUploadingSupporterLogo, setIsUploadingSupporterLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Certificate Customization State
  const [certBorderColor, setCertBorderColor] = useState('#1A365D');
  const [certSignatureName, setCertSignatureName] = useState('Comissão Organizadora G-TERCOA');
  const [certSignatureRole, setCertSignatureRole] = useState('Coordenador Geral');

  // Text templates for the 4 certificate types
  const [certTextTemplate, setCertTextTemplate] = useState('Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou ativamente do evento acadêmico {evento}, realizado {periodo}, cumprindo carga horária total de {carga_horaria} horas.');
  const [certTextOrganization, setCertTextOrganization] = useState('Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou da Comissão Organizadora do evento acadêmico {evento}, realizado {periodo}, com carga horária total de {carga_horaria} horas.');
  const [certTextPresentation, setCertTextPresentation] = useState('Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, apresentou o trabalho intitulado "{titulo_trabalho}" no evento acadêmico {evento}, realizado {periodo}, com carga horária de {carga_horaria} horas.');
  const [certTextGuest, setCertTextGuest] = useState('Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou como convidado(a)/palestrante especial no evento acadêmico {evento}, realizado {periodo}, ministrando atividades com carga horária de {carga_horaria} horas.');
  const [certBgFrontUrl, setCertBgFrontUrl] = useState('');
  const [certBgBackUrl, setCertBgBackUrl] = useState('');
  const [showCertHelp, setShowCertHelp] = useState(false);

  // New certificate templates state
  const [certTemplates, setCertTemplates] = useState([]);
  const [templateForm, setTemplateForm] = useState({ name: '', bg_front_url: '', bg_back_url: '', text_template: '' });
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [selectedTemplateIdLote, setSelectedTemplateIdLote] = useState('');
  const [selectedTemplateIdIndividual, setSelectedTemplateIdIndividual] = useState('');

  // Issuance and preview lists
  const [issueUserEmail, setIssueUserEmail] = useState('');
  const [issueCertType, setIssueCertType] = useState('organization');
  const [issueWorkload, setIssueWorkload] = useState('20');
  const [issuePresentationTitle, setIssuePresentationTitle] = useState('');
  const [certificatesList, setCertificatesList] = useState([]);
  const [isIssuing, setIsIssuing] = useState(false);
  const [registrationsList, setRegistrationsList] = useState([]);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [evaluatorsPool, setEvaluatorsPool] = useState([]);



  const fetchEvaluatorsPool = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/evaluators`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluatorsPool(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssignments = async (eventId) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/assignments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAssignmentsList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events`);
      if (res.ok) {
        const data = await res.json();
        
        let filteredData = data;
        if (user && user.role !== 'admin' && user.role !== 'moderator') {
          const managedEventIds = myAssignments
            .filter(as => as.role === 'event_coordinator' || as.role === 'communication_coordinator')
            .map(as => as.event_id);
          filteredData = data.filter(ev => managedEventIds.includes(ev.id));
        }

        setEvents(filteredData);

        // If an event is selected, keep it updated
        if (selectedEventForManagement) {
          const current = filteredData.find(ev => ev.id === selectedEventForManagement.id);
          if (current) {
            setSelectedEventForManagement(current);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load events list and evaluators pool when token is available
  useEffect(() => {
    if (token) {
      fetchEvents();
      fetchEvaluatorsPool();
    }
  }, [token]);

  const handleSelectEventForManagement = (ev) => {
    setSelectedEventForManagement(ev);
    const role = myAssignments.find(as => as.event_id === ev.id)?.role;
    if (role === 'communication_coordinator' && user.role !== 'admin' && user.role !== 'moderator') {
      setWorkspaceTab('communication');
    } else {
      setWorkspaceTab('basic');
    }

    // Reset delete form states
    setDeleteReason('');
    setDeleteConfirmName('');
    setDeleteConfirmCheckbox(false);
    setIsDeleting(false);

    // Reset guest form states
    setNewGuestName('');
    setNewGuestRole('palestrante');
    setNewGuestInstitution('');
    setNewGuestImageUrl('');
    setNewGuestBio('');
    setNewGuestOrcid('');
    setNewGuestLattes('');
    setSelectedSystemUserId('');
    setGuestToDeleteId(null);

    // Populate states
    setName(ev.name || '');
    setSlug(ev.slug || '');
    setType(ev.type || 'workshop');
    setDescription(ev.description || '');
    setBannerUrl(ev.banner_url || '');
    setStartDate(ev.start_date || '');
    setEndDate(ev.end_date || '');
    setLocation(ev.location || 'Auditório Principal');
    setRegistrationStartDate(ev.registration_start_date || '');
    setRegistrationEndDate(ev.registration_end_date || '');
    setSubmissionStartDate(ev.submission_start_date || '');
    setSubmissionDeadline(ev.submission_deadline || '');
    setEvaluationDeadline(ev.evaluation_deadline || '');
    setResultsDeadline(ev.results_deadline || '');

    setWorkloadHours(ev.workload_hours ? ev.workload_hours.toString() : '20');
    setTransmissionLink(ev.transmission_link || '');
    setEventAdditionalLinks(ev.additional_links || []);
    setThematicAxes(ev.thematic_axes || []);
    setSubmissionRules(ev.submission_rules || '');
    setSubmissionsEnabled(ev.submissions_enabled !== undefined ? ev.submissions_enabled : 1);
    setMaxCoauthors(ev.max_coauthors !== undefined ? ev.max_coauthors : 3);

    let parsedRulesFiles = [];
    if (ev.rules_files) {
      try {
        parsedRulesFiles = typeof ev.rules_files === 'string' ? JSON.parse(ev.rules_files) : ev.rules_files;
      } catch (e) {
        console.error('Error parsing rules files JSON', e);
      }
    }
    setRulesFiles(parsedRulesFiles);
    setNewRulesFileName('');
    setNewRulesFile(null);

    setRegCategories(ev.registration_categories || [
      { name: 'Estudante do Ensino Médio', price: 0 },
      { name: 'Estudante da Graduação', price: 0 },
      { name: 'Estudante da Pós-graduação', price: 0 },
      { name: 'Professor(a) da Educação Básica', price: 0 },
      { name: 'Professor(a) e Pesquisador(a) do Ensino Superior', price: 0 }
    ]);

    // Parse guests
    let parsedGuests = [];
    if (ev.guests) {
      try {
        parsedGuests = typeof ev.guests === 'string' ? JSON.parse(ev.guests) : ev.guests;
      } catch (e) {
        console.error('Error parsing guests JSON', e);
      }
    }
    setGuestsList(parsedGuests);

    // Parse supporters
    let parsedSupporters = [];
    if (ev.supporters) {
      try {
        parsedSupporters = typeof ev.supporters === 'string' ? JSON.parse(ev.supporters) : ev.supporters;
      } catch (e) {
        console.error('Error parsing supporters JSON', e);
      }
    }
    setSupportersList(parsedSupporters);

    setCertBorderColor(ev.cert_border_color || '#1A365D');
    setCertSignatureName(ev.cert_signature_name || 'Comissão Organizadora G-TERCOA');
    setCertSignatureRole(ev.cert_signature_role || 'Coordenador Geral');
    setCertTextTemplate(ev.cert_text_template || 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou ativamente do evento acadêmico {evento}, realizado {periodo}, cumprindo carga horária total de {carga_horaria} horas.');
    setCertTextOrganization(ev.cert_text_organization || 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou da Comissão Organizadora do evento acadêmico {evento}, realizado {periodo}, com carga horária total de {carga_horaria} horas.');
    setCertTextPresentation(ev.cert_text_presentation || 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, apresentou o trabalho intitulado "{titulo_trabalho}" no evento acadêmico {evento}, realizado {periodo}, com carga horária de {carga_horaria} horas.');
    setCertTextGuest(ev.cert_text_guest || 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou como convidado(a)/palestrante especial no evento acadêmico {evento}, realizado {periodo}, ministrando atividades com carga horária de {carga_horaria} horas.');
    setCertBgFrontUrl(ev.cert_bg_front_url || '');
    setCertBgBackUrl(ev.cert_bg_back_url || '');

    // Fetch lists
    fetchCertificates(ev.id);
    fetchRegistrations(ev.id);
    fetchSubmissions(ev.id);
    fetchAssignments(ev.id);
    fetchSystemUsers();
    fetchEvaluatorsPool();
    fetchCertTemplates();
  };

  const fetchSystemUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSystemUsers(data);
      }
    } catch (err) {
      console.error('Error fetching system users:', err);
    }
  };

  const fetchCertificates = async (eventId) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/certificates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCertificatesList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCertTemplates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/certificates/templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCertTemplates(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRegistrations = async (eventId) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/registrations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRegistrationsList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubmissions = async (eventId) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissionsList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEventSubmit = async (e) => {
    e.preventDefault();
    if (!name || !slug || !startDate || !endDate) {
      showToast('Preencha os campos obrigatórios (*)', 'danger');
      return;
    }

    const payload = {
      name,
      slug,
      type,
      description,
      start_date: startDate,
      end_date: endDate,
      location,
      registration_start_date: registrationStartDate || null,
      registration_end_date: registrationEndDate || null
    };

    try {
      const res = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Edição do evento criada com sucesso!');
        resetCreationForm();
        fetchEvents();
      } else {
        showToast(data.error || 'Erro ao criar evento', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão', 'danger');
    }
  };

  const saveEventDetails = async (overrides = {}) => {
    const payload = {
      name: overrides.name !== undefined ? overrides.name : name,
      slug: overrides.slug !== undefined ? overrides.slug : slug,
      type: overrides.type !== undefined ? overrides.type : type,
      description: overrides.description !== undefined ? overrides.description : description,
      banner_url: overrides.banner_url !== undefined ? overrides.banner_url : bannerUrl,
      start_date: overrides.start_date !== undefined ? overrides.start_date : startDate,
      end_date: overrides.end_date !== undefined ? overrides.end_date : endDate,
      thematic_axes: overrides.thematic_axes !== undefined ? overrides.thematic_axes : thematicAxes,
      registration_categories: overrides.registration_categories !== undefined ? overrides.registration_categories : regCategories,
      submission_rules: overrides.submission_rules !== undefined ? overrides.submission_rules : submissionRules,
      workload_hours: overrides.workload_hours !== undefined ? parseInt(overrides.workload_hours) || parseInt(workloadHours) : parseInt(workloadHours),
      transmission_link: overrides.transmission_link !== undefined ? overrides.transmission_link : transmissionLink,
      cert_border_color: overrides.cert_border_color !== undefined ? overrides.cert_border_color : certBorderColor,
      cert_signature_name: overrides.cert_signature_name !== undefined ? overrides.cert_signature_name : certSignatureName,
      cert_signature_role: overrides.cert_signature_role !== undefined ? overrides.cert_signature_role : certSignatureRole,
      cert_text_template: overrides.cert_text_template !== undefined ? overrides.cert_text_template : certTextTemplate,
      location: overrides.location !== undefined ? overrides.location : location,
      guests: overrides.guests !== undefined ? overrides.guests : guestsList,
      submissions_enabled: overrides.submissions_enabled !== undefined ? overrides.submissions_enabled : submissionsEnabled,
      cert_text_organization: overrides.cert_text_organization !== undefined ? overrides.cert_text_organization : certTextOrganization,
      cert_text_presentation: overrides.cert_text_presentation !== undefined ? overrides.cert_text_presentation : certTextPresentation,
      cert_text_guest: overrides.cert_text_guest !== undefined ? overrides.cert_text_guest : certTextGuest,
      registration_start_date: overrides.registration_start_date !== undefined ? overrides.registration_start_date : registrationStartDate,
      registration_end_date: overrides.registration_end_date !== undefined ? overrides.registration_end_date : registrationEndDate,
      submission_start_date: overrides.submission_start_date !== undefined ? overrides.submission_start_date : submissionStartDate,
      submission_deadline: overrides.submission_deadline !== undefined ? overrides.submission_deadline : submissionDeadline,
      evaluation_deadline: overrides.evaluation_deadline !== undefined ? overrides.evaluation_deadline : evaluationDeadline,
      results_deadline: overrides.results_deadline !== undefined ? overrides.results_deadline : resultsDeadline,
      supporters: overrides.supporters !== undefined ? overrides.supporters : supportersList,
      additional_links: overrides.additional_links !== undefined ? overrides.additional_links : eventAdditionalLinks,
      rules_files: overrides.rules_files !== undefined ? overrides.rules_files : rulesFiles,
      max_coauthors: overrides.max_coauthors !== undefined ? parseInt(overrides.max_coauthors, 10) : parseInt(maxCoauthors, 10)
    };

    try {
      const res = await fetch(`${API_URL}/api/events/${selectedEventForManagement.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Evento atualizado com sucesso!');
        const updated = { 
          ...selectedEventForManagement, 
          ...payload, 
          guests: JSON.stringify(payload.guests), 
          supporters: JSON.stringify(payload.supporters), 
          additional_links: payload.additional_links,
          rules_files: JSON.stringify(payload.rules_files)
        };
        setSelectedEventForManagement(updated);
        fetchEvents();
        return true;
      } else {
        showToast(data.error || 'Erro ao atualizar evento', 'danger');
        return false;
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao salvar', 'danger');
      return false;
    }
  };

  const handleGuestImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setIsUploadingGuestImage(true);
    try {
      const res = await fetch(`${API_URL}/api/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setNewGuestImageUrl(data.image_url);
        showToast('Foto do convidado enviada com sucesso!');
      } else {
        showToast(data.error || 'Erro ao enviar imagem', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao enviar imagem', 'danger');
    } finally {
      setIsUploadingGuestImage(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setIsUploadingBanner(true);
    try {
      const res = await fetch(`${API_URL}/api/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setBannerUrl(data.image_url);
        showToast('Capa do evento enviada com sucesso!');
      } else {
        showToast(data.error || 'Erro ao enviar imagem', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao enviar imagem', 'danger');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    if (!issueUserEmail || !issueCertType) {
      showToast('E-mail do usuário e tipo do certificado são obrigatórios', 'danger');
      return;
    }

    setIsIssuing(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${selectedEventForManagement.id}/certificates/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_email: issueUserEmail.trim(),
          type: issueCertType,
          workload_hours: parseInt(issueWorkload) || 20,
          presentation_title: (issueCertType === 'presentation' || issueCertType === 'submission' || issueCertType === 'workshop') ? issuePresentationTitle.trim() : null,
          template_id: selectedTemplateIdIndividual || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Certificado emitido com sucesso!');
        setIssueUserEmail('');
        setIssuePresentationTitle('');
        fetchCertificates(selectedEventForManagement.id);
      } else {
        showToast(data.error || 'Erro ao emitir certificado', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao emitir certificado', 'danger');
    } finally {
      setIsIssuing(false);
    }
  };

  const handleBulkGenerateCertificates = async () => {
    if (!window.confirm('Deseja realmente gerar certificados de participação para todos os presentes credenciados?')) return;

    setIsIssuing(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${selectedEventForManagement.id}/certificates/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          template_id: selectedTemplateIdLote || null
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Certificados gerados com sucesso!');
        fetchCertificates(selectedEventForManagement.id);
      } else {
        showToast(data.error || 'Erro ao gerar certificados', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao gerar certificados', 'danger');
    } finally {
      setIsIssuing(false);
    }
  };

  const handleViewCertificatePDF = async (certId) => {
    showToast('Iniciando visualização do certificado...');
    try {
      const response = await fetch(`${API_URL}/api/certificates/${certId}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        showToast('Certificado carregado com sucesso!');
      } else {
        showToast('Falha ao gerar PDF do certificado', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao visualizar certificado', 'danger');
    }
  };

  const resetCreationForm = () => {
    setName('');
    setSlug('');
    setType('workshop');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setLocation('Auditório Principal');
    setRegistrationStartDate('');
    setRegistrationEndDate('');
    setSupportersList([]);
    setNewSupporterName('');
    setNewSupporterLogoUrl('');
    setEventAdditionalLinks([]);
    setNewEventLinkLabel('');
    setNewEventLinkUrl('');
  };

  const tabStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 18px',
    border: 'none',
    background: isActive ? 'var(--primary-light)' : 'transparent',
    color: isActive ? '#fff' : 'var(--text-secondary)',
    fontWeight: 600,
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.15)' : 'none',
    whiteSpace: 'nowrap'
  });

  const getFormatLabel = (fmt) => {
    const labels = {
      'school_of_summer': 'Escola de Verão',
      'dima': 'Diálogos da Matemática com a Pedagogia (DIMA)',
      'live_cycle': 'Ciclo de Lives',
      'workshop': 'Workshop'
    };
    return labels[fmt] || fmt;
  };

  // Render sub-sections of workspace
  const renderBasicInfoTab = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
      <div className="glass-card">
        <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Informações Básicas</h3>
        <form onSubmit={(e) => { e.preventDefault(); saveEventDetails(); }}>
          <div className="form-group">
            <label className="form-label">Nome da Edição *</label>
            <input
              type="text"
              className="form-input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">URL Amigável (Slug) *</label>
            <input
              type="text"
              className="form-input"
              disabled
              value={slug}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>O slug não pode ser alterado.</span>
          </div>
          <div className="form-group">
            <label className="form-label">Formato de Evento *</label>
            <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="school_of_summer">Escola de Verão</option>
              <option value="dima">Diálogos da Matemática com a Pedagogia (DIMA)</option>
              <option value="live_cycle">Ciclo de Lives</option>
              <option value="workshop">Workshop</option>
            </select>
          </div>
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="form-label">Data de Início *</label>
              <input type="date" className="form-input" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Data de Fim *</label>
              <input type="date" className="form-input" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="form-label">Início das Inscrições</label>
              <input type="date" className="form-input" value={registrationStartDate} onChange={(e) => setRegistrationStartDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Fim das Inscrições</label>
              <input type="date" className="form-input" value={registrationEndDate} onChange={(e) => setRegistrationEndDate(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Local *</label>
            <input type="text" className="form-input" required value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Descrição Geral</label>
            <textarea className="form-textarea" style={{ minHeight: '100px' }} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Salvar Alterações</button>
        </form>
      </div>

      <div className="glass-card">
        <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Ajustes Adicionais & Banner</h3>
        <form onSubmit={(e) => { e.preventDefault(); saveEventDetails(); }}>
          <div className="form-group">
            <label className="form-label">Link de Transmissão (Lives/Meet)</label>
            <input type="text" className="form-input" placeholder="YouTube, Meet Link..." value={transmissionLink} onChange={(e) => setTransmissionLink(e.target.value)} />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginTop: '15px', marginBottom: '15px' }}>
            <label className="form-label" style={{ fontWeight: 700 }}>Outros Links do Evento (Documentos, Apoio, Redes)</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Nome (ex: Instagram, Pasta Drive)"
                value={newEventLinkLabel}
                onChange={(e) => setNewEventLinkLabel(e.target.value)}
              />
              <input
                type="text"
                className="form-input"
                style={{ flex: 2 }}
                placeholder="URL (https://...)"
                value={newEventLinkUrl}
                onChange={(e) => setNewEventLinkUrl(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddEventLink}
                style={{ whiteSpace: 'nowrap', padding: '0 15px' }}
              >
                + Add
              </button>
            </div>
            {eventAdditionalLinks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--surface-secondary)', padding: '10px', borderRadius: 'var(--radius-sm)', marginBottom: '15px' }}>
                {eventAdditionalLinks.map((link, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', background: '#fff', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                    <div style={{ wordBreak: 'break-all' }}>
                      <strong>{link.label || 'Link'}:</strong> <a href={link.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-light)', textDecoration: 'underline' }}>{link.url}</a>
                    </div>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem', marginLeft: '10px' }}
                      onClick={() => handleRemoveEventLink(idx)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Carga Horária Geral (horas) *</label>
            <input type="number" className="form-input" required value={workloadHours} onChange={(e) => setWorkloadHours(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Capa do Evento (Banner PNG/JPG)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="file"
                className="form-input"
                accept="image/*"
                onChange={handleBannerUpload}
              />
              {isUploadingBanner && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fazendo upload da capa...</span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Ou insira a URL:</span>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="http://..."
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                />
              </div>
            </div>
          </div>
          {bannerUrl && (
            <div style={{ marginBottom: '15px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img src={getImageUrl(bannerUrl)} alt="Banner Preview" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', display: 'block' }} />
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Salvar Configurações</button>
        </form>
      </div>

      {/* Supporters Management Card */}
      <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Apoiadores & Parceiros</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Adicione os apoiadores e parceiros deste evento. Eles serão exibidos na página pública.
            </p>
            <div className="form-group">
              <label className="form-label">Nome do Apoiador / Instituição *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: CAPES, CNPq, UFC"
                value={newSupporterName}
                onChange={(e) => setNewSupporterName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Logo (imagem)</label>
              <input
                type="file"
                className="form-input"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('image', file);
                  setIsUploadingSupporterLogo(true);
                  try {
                    const res = await fetch(`${API_URL}/api/upload-image`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}` },
                      body: formData
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setNewSupporterLogoUrl(data.image_url);
                      showToast('Logo enviado com sucesso!');
                    } else {
                      showToast(data.error || 'Erro ao enviar logo', 'danger');
                    }
                  } catch (err) {
                    showToast('Erro ao enviar logo', 'danger');
                  } finally {
                    setIsUploadingSupporterLogo(false);
                  }
                }}
              />
              {isUploadingSupporterLogo && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Enviando logo...</span>}
              {newSupporterLogoUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                  <img src={getImageUrl(newSupporterLogoUrl)} alt="Logo Preview" style={{ height: '36px', maxWidth: '100px', objectFit: 'contain', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 'bold' }}>Logo vinculado!</span>
                </div>
              )}
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={async () => {
                if (!newSupporterName.trim()) { showToast('Nome do apoiador é obrigatório', 'danger'); return; }
                const newSupporter = { id: Date.now().toString(), name: newSupporterName.trim(), logo_url: newSupporterLogoUrl };
                const updated = [...supportersList, newSupporter];
                const success = await saveEventDetails({ supporters: updated });
                if (success) {
                  setSupportersList(updated);
                  setNewSupporterName('');
                  setNewSupporterLogoUrl('');
                }
              }}
            >
              Adicionar Apoiador
            </button>
          </div>

          <div>
            <h4 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '12px' }}>Apoiadores Cadastrados ({supportersList.length})</h4>
            {supportersList.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Nenhum apoiador cadastrado ainda.</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {supportersList.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px' }}>
                    {s.logo_url && <img src={getImageUrl(s.logo_url)} alt={s.name} style={{ height: '32px', maxWidth: '80px', objectFit: 'contain' }} />}
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</span>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '1rem', padding: '0 4px', lineHeight: 1 }}
                      onClick={async () => {
                        const updated = supportersList.filter(x => x.id !== s.id);
                        const success = await saveEventDetails({ supporters: updated });
                        if (success) setSupportersList(updated);
                      }}
                      title="Remover apoiador"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderGuestsTab = () => {
    const handleAddGuestSubmit = async (e) => {
      e.preventDefault();
      if (!newGuestName.trim()) {
        showToast('Nome do convidado é obrigatório', 'danger');
        return;
      }

      const newGuest = {
        id: Date.now().toString(),
        userId: selectedSystemUserId || null,
        name: newGuestName.trim(),
        role: newGuestRole,
        institution: newGuestInstitution.trim(),
        image_url: newGuestImageUrl,
        mini_bio: newGuestBio.trim(),
        orcid_link: newGuestOrcid.trim(),
        lattes_link: newGuestLattes.trim()
      };

      const updatedGuests = [...guestsList, newGuest];

      const success = await saveEventDetails({ guests: updatedGuests });
      if (success) {
        setGuestsList(updatedGuests);
        setNewGuestName('');
        setNewGuestInstitution('');
        setNewGuestImageUrl('');
        setNewGuestBio('');
        setNewGuestOrcid('');
        setNewGuestLattes('');
        setSelectedSystemUserId('');
      }
    };

    const handleRemoveGuestClick = async (guestId) => {
      const updatedGuests = guestsList.filter(g => g.id !== guestId);
      const success = await saveEventDetails({ guests: updatedGuests });
      if (success) {
        setGuestsList(updatedGuests);
        setGuestToDeleteId(null);
      }
    };

    return (
      <div className="glass-card" style={{ height: 'fit-content' }}>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Cadastrar Convidado</h3>

        <form onSubmit={handleAddGuestSubmit} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '20px' }}>
          <div className="form-group">
            <label className="form-label">Importar de Usuário Cadastrado (Opcional)</label>
            <select
              className="form-select"
              value={selectedSystemUserId}
              onChange={(e) => {
                const uId = e.target.value;
                setSelectedSystemUserId(uId);
                if (uId) {
                  const selectedUser = systemUsers.find(u => u.id === uId);
                  if (selectedUser) {
                    setNewGuestName(selectedUser.name);
                  }
                }
              }}
            >
              <option value="">-- Convidado Externo (Sem conta cadastrada) --</option>
              {systemUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email}) - {u.role === 'admin' ? 'Admin' : u.role === 'evaluator' ? 'Avaliador' : 'Participante'}
                </option>
              ))}
            </select>
            {selectedSystemUserId && (
              <span style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>
                ✓ Convidado vinculado a usuário do sistema.
              </span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Nome Completo *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Prof. Dr. Carlos Souza"
              required
              value={newGuestName}
              onChange={(e) => setNewGuestName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Papel / Função *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Palestrante, Mediador"
              required
              value={newGuestRole}
              onChange={(e) => setNewGuestRole(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Instituição</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: UFC"
              value={newGuestInstitution}
              onChange={(e) => setNewGuestInstitution(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Foto de Perfil</label>
            <input
              type="file"
              className="form-input"
              accept="image/*"
              onChange={handleGuestImageUpload}
            />
            {isUploadingGuestImage && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Fazendo upload...</span>}
            {newGuestImageUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <img src={getImageUrl(newGuestImageUrl)} alt="Preview" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 'bold' }}>Imagem vinculada!</span>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Minicurrículo</label>
            <textarea
              className="form-textarea"
              placeholder="Breve biografia ou mini-currículo do convidado..."
              style={{ minHeight: '60px' }}
              value={newGuestBio}
              onChange={(e) => setNewGuestBio(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label className="form-label">Link do ORCID</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://orcid.org/..."
                value={newGuestOrcid}
                onChange={(e) => setNewGuestOrcid(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Link do Lattes</label>
              <input
                type="url"
                className="form-input"
                placeholder="http://lattes.cnpq.br/..."
                value={newGuestLattes}
                onChange={(e) => setNewGuestLattes(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Adicionar Convidado</button>
        </form>

        <h4 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '12px' }}>Convidados do Evento ({guestsList.length})</h4>
        {guestsList.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum convidado cadastrado.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
            {guestsList.map(g => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', padding: '10px', background: 'var(--surface-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {g.image_url ? (
                    <img src={getImageUrl(g.image_url)} alt={g.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>
                      {g.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {g.name}
                      {g.userId && systemUsers.find(su => su.id === g.userId) && (
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--success)', color: '#fff', borderRadius: '4px', fontWeight: 'bold' }}>
                          ✓ Cadastrado ({systemUsers.find(su => su.id === g.userId).email})
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{g.role} {g.institution ? `@ ${g.institution}` : ''}</div>
                    {(g.orcid_link || g.lattes_link) && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '2px', fontSize: '0.7rem' }}>
                        {g.orcid_link && <a href={g.orcid_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-light)' }}>ORCID</a>}
                        {g.lattes_link && <a href={g.lattes_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-light)' }}>Lattes</a>}
                      </div>
                    )}
                  </div>
                </div>
                {guestToDeleteId === g.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Confirmar exclusão?</span>
                    <button type="button" className="btn btn-danger" style={{ padding: '3px 6px', fontSize: '0.7rem' }} onClick={() => handleRemoveGuestClick(g.id)}>Sim</button>
                    <button type="button" className="btn btn-secondary" style={{ padding: '3px 6px', fontSize: '0.7rem' }} onClick={() => setGuestToDeleteId(null)}>Não</button>
                  </div>
                ) : (
                  <button type="button" className="btn btn-danger" style={{ padding: '3px 6px', fontSize: '0.7rem' }} onClick={() => setGuestToDeleteId(g.id)}>Excluir</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderActivitiesTab = () => {
    return (
      <AdminActivitiesView token={token} showToast={showToast} selectedEventId={selectedEventForManagement.id} eventGuests={guestsList} />
    );
  };

  const renderSubmissionsTab = () => {
    const handleSaveSubmissionConfig = async (e) => {
      e.preventDefault();
      await saveEventDetails({
        submissions_enabled: submissionsEnabled,
        submission_rules: submissionRules,
        thematic_axes: thematicAxes,
        rules_files: rulesFiles,
        max_coauthors: maxCoauthors,
        submission_start_date: submissionStartDate || null,
        submission_deadline: submissionDeadline || null,
        evaluation_deadline: evaluationDeadline || null,
        results_deadline: resultsDeadline || null
      });
    };

    const handleAddRulesFile = async (e) => {
      e.preventDefault();
      if (!newRulesFile) {
        showToast('Selecione um arquivo para enviar', 'warning');
        return;
      }
      const displayName = newRulesFileName.trim() || newRulesFile.name;
      
      setUploadingRulesFile(true);
      const formData = new FormData();
      formData.append('file', newRulesFile);
      
      try {
        const res = await fetch(`${API_URL}/api/upload-file`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          const updated = [...rulesFiles, { name: displayName, url: data.file_url }];
          setRulesFiles(updated);
          setNewRulesFileName('');
          setNewRulesFile(null);
          const fileInput = document.getElementById('rules-file-input');
          if (fileInput) fileInput.value = '';
          showToast('Arquivo de regras enviado com sucesso!');
          await saveEventDetails({
            submissions_enabled: submissionsEnabled,
            submission_rules: submissionRules,
            thematic_axes: thematicAxes,
            rules_files: updated,
            max_coauthors: maxCoauthors,
            submission_start_date: submissionStartDate || null,
            submission_deadline: submissionDeadline || null,
            evaluation_deadline: evaluationDeadline || null,
            results_deadline: resultsDeadline || null
          });
        } else {
          showToast(data.error || 'Erro ao enviar arquivo', 'danger');
        }
      } catch (err) {
        console.error(err);
        showToast('Erro ao enviar arquivo', 'danger');
      } finally {
        setUploadingRulesFile(false);
      }
    };

    const handleRemoveRulesFile = async (idx) => {
      const updated = rulesFiles.filter((_, i) => i !== idx);
      setRulesFiles(updated);
      showToast('Arquivo de regras removido');
      await saveEventDetails({
        submissions_enabled: submissionsEnabled,
        submission_rules: submissionRules,
        thematic_axes: thematicAxes,
        rules_files: updated,
        max_coauthors: maxCoauthors,
        submission_start_date: submissionStartDate || null,
        submission_deadline: submissionDeadline || null,
        evaluation_deadline: evaluationDeadline || null,
        results_deadline: resultsDeadline || null
      });
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Regras & Eixos Temáticos</h3>

          <form onSubmit={handleSaveSubmissionConfig}>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={submissionsEnabled === 1}
                  onChange={(e) => setSubmissionsEnabled(e.target.checked ? 1 : 0)}
                  style={{ width: '18px', height: '18px' }}
                />
                Habilitar Envio de Trabalhos / Chamada Científica
              </label>
            </div>

            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
              <div>
                <label className="form-label">Eixos Temáticos (adicione individualmente) *</label>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px', 
                  marginBottom: '8px', 
                  minHeight: '36px', 
                  padding: '6px 10px', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-sm)', 
                  background: 'rgba(255, 255, 255, 0.03)' 
                }}>
                  {thematicAxes.length === 0 ? (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Nenhum eixo adicionado ainda. Insira abaixo.</span>
                  ) : (
                    thematicAxes.map((axis, idx) => (
                      <span key={idx} className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}>
                        {axis}
                        <button 
                          type="button" 
                          onClick={() => setThematicAxes(thematicAxes.filter((_, i) => i !== idx))}
                          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, fontSize: '0.95rem', lineHeight: 1, fontWeight: 'bold' }}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    id="new-axis-input"
                    className="form-input"
                    placeholder="Nome do eixo (ex: Didática da Matemática)..."
                    style={{ flex: 1 }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.target.value.trim();
                        if (val) {
                          if (thematicAxes.includes(val)) {
                            showToast('Este eixo temático já foi adicionado', 'warning');
                            return;
                          }
                          setThematicAxes([...thematicAxes, val]);
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      const input = document.getElementById('new-axis-input');
                      const val = input ? input.value.trim() : '';
                      if (val) {
                        if (thematicAxes.includes(val)) {
                          showToast('Este eixo temático já foi adicionado', 'warning');
                          return;
                        }
                        setThematicAxes([...thematicAxes, val]);
                        input.value = '';
                      }
                    }}
                    style={{ padding: '8px 14px', whiteSpace: 'nowrap' }}
                  >
                    Add
                  </button>
                </div>
              </div>
              <div>
                <label className="form-label">Máx. Coautores *</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  className="form-input"
                  value={maxCoauthors}
                  onChange={(e) => setMaxCoauthors(parseInt(e.target.value, 10) || 0)}
                />
              </div>
            </div>

            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label className="form-label">Prazo de Início de Envio</label>
                <input
                  type="date"
                  className="form-input"
                  value={submissionStartDate}
                  onChange={(e) => setSubmissionStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Prazo de Fim de Envio</label>
                <input
                  type="date"
                  className="form-input"
                  value={submissionDeadline}
                  onChange={(e) => setSubmissionDeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label className="form-label">Prazo Limite de Avaliação</label>
                <input
                  type="date"
                  className="form-input"
                  value={evaluationDeadline}
                  onChange={(e) => setEvaluationDeadline(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Prazo dos Resultados Finais</label>
                <input
                  type="date"
                  className="form-input"
                  value={resultsDeadline}
                  onChange={(e) => setResultsDeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Regras e Instruções para Submissão</label>
              <textarea
                className="form-textarea"
                placeholder="Insira as diretrizes de envio, formatação, número máximo de páginas, etc."
                style={{ minHeight: '80px' }}
                value={submissionRules}
                onChange={(e) => setSubmissionRules(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Salvar Ajustes de Submissão</button>
          </form>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '16px' }}>Arquivos e Modelos do Evento</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Faça upload de editais, templates de formatação ou outros arquivos essenciais para autores e avaliadores.
          </p>

          <form onSubmit={handleAddRulesFile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px', background: 'var(--surface-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Nome de Exibição do Documento</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                placeholder="Ex: Edital de Submissão, Template de Resumo"
                value={newRulesFileName}
                onChange={(e) => setNewRulesFileName(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Arquivo *</label>
              <input
                type="file"
                id="rules-file-input"
                className="form-input"
                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                required
                onChange={(e) => setNewRulesFile(e.target.files[0])}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '8px 12px', fontSize: '0.82rem' }} disabled={uploadingRulesFile}>
                {uploadingRulesFile ? 'Enviando...' : 'Adicionar'}
              </button>
            </div>
          </form>

          {rulesFiles.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem', textAlign: 'center' }}>Nenhum arquivo enviado.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rulesFiles.map((file, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} style={{ color: 'var(--primary-light)' }} />
                    <a href={`${API_URL}${file.url}`} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
                      {file.name}
                    </a>
                  </div>
                  <button type="button" className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={() => handleRemoveRulesFile(idx)}>
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <AdminSubmissionsView token={token} showToast={showToast} selectedEventId={selectedEventForManagement.id} />
        </div>
      </div>
    );
  };

  const renderCheckinTab = () => {
    const handleSaveCategories = async (e) => {
      e.preventDefault();
      await saveEventDetails({ registration_categories: regCategories });
    };

    const handleAddCategory = () => {
      setRegCategories(prev => [...prev, { name: '' }]);
    };

    const handleRemoveCategory = (index) => {
      setRegCategories(prev => prev.filter((_, i) => i !== index));
    };

    const handleCategoryChange = (index, value) => {
      setRegCategories(prev => prev.map((cat, i) => i === index ? { ...cat, name: value } : cat));
    };

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '30px' }}>
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Credenciamento & Quiosque</h3>

          <form onSubmit={handleSaveCategories} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>Categorias de Inscrição <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--success)' }}>(todas gratuitas)</span></h4>

            {regCategories.map((cat, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Estudante da Graduação"
                  required
                  value={cat.name}
                  onChange={(e) => handleCategoryChange(idx, e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                />
                <button type="button" className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => handleRemoveCategory(idx)}>&times;</button>
              </div>
            ))}

            <button type="button" className="btn btn-secondary" style={{ width: '100%', marginBottom: '10px', padding: '8px' }} onClick={handleAddCategory}>
              + Adicionar Categoria
            </button>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>Salvar Categorias</button>
          </form>

          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>Relatórios de Frequência</h4>
          <button
            type="button"
            onClick={async () => {
              showToast('Baixando planilha de presenças...');
              try {
                const res = await fetch(`${API_URL}/api/events/${selectedEventForManagement.id}/registrations/export`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `frequencia-${selectedEventForManagement.slug}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  showToast('Frequência exportada com sucesso!');
                } else {
                  showToast('Erro ao exportar frequência', 'danger');
                }
              } catch (err) {
                console.error(err);
                showToast('Erro ao conectar ao servidor', 'danger');
              }
            }}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '10px' }}
          >
            Exportar CSV de Presenças
          </button>
        </div>

        <div>
          <AdminCheckinView token={token} showToast={showToast} selectedEventId={selectedEventForManagement.id} />
        </div>
      </div>
    );
  };

  const renderCertificatesTab = () => {
    // Add template upload image handler helper
    const handleBgImageUpload = async (file, type) => {
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);

      showToast('Enviando imagem de fundo...');
      try {
        const res = await fetch(`${API_URL}/api/upload-image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          if (type === 'front') {
            setTemplateForm(prev => ({ ...prev, bg_front_url: data.image_url }));
          } else {
            setTemplateForm(prev => ({ ...prev, bg_back_url: data.image_url }));
          }
          showToast('Imagem de fundo enviada com sucesso!');
        } else {
          showToast(data.error || 'Erro ao enviar imagem', 'danger');
        }
      } catch (err) {
        console.error(err);
        showToast('Erro de conexão ao enviar imagem', 'danger');
      }
    };

    const handleSaveTemplate = async (e) => {
      e.preventDefault();
      if (!templateForm.name) {
        showToast('O nome do certificado é obrigatório.', 'danger');
        return;
      }

      try {
        const url = editingTemplateId 
          ? `${API_URL}/api/certificates/templates/${editingTemplateId}`
          : `${API_URL}/api/certificates/templates`;
        
        const method = editingTemplateId ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(templateForm)
        });

        const data = await res.json();
        if (res.ok) {
          showToast(editingTemplateId ? 'Template atualizado com sucesso!' : 'Template criado com sucesso!');
          setTemplateForm({ name: '', bg_front_url: '', bg_back_url: '', text_template: '' });
          setEditingTemplateId(null);
          fetchCertTemplates();
        } else {
          showToast(data.error || 'Erro ao salvar template', 'danger');
        }
      } catch (err) {
        console.error(err);
        showToast('Erro de rede ao salvar template', 'danger');
      }
    };

    const handleEditClick = (tpl) => {
      setEditingTemplateId(tpl.id);
      setTemplateForm({
        name: tpl.name || '',
        bg_front_url: tpl.bg_front_url || '',
        bg_back_url: tpl.bg_back_url || '',
        text_template: tpl.text_template || ''
      });
    };

    const handleDeleteClick = async (id) => {
      if (!window.confirm('Tem certeza de que deseja excluir este modelo de certificado?')) return;
      try {
        const res = await fetch(`${API_URL}/api/certificates/templates/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          showToast('Template excluído com sucesso!');
          fetchCertTemplates();
        } else {
          const data = await res.json();
          showToast(data.error || 'Erro ao excluir template', 'danger');
        }
      } catch (err) {
        console.error(err);
        showToast('Erro de rede ao excluir template', 'danger');
      }
    };

    const getCertTypeLabel = (t) => {
      const labels = {
        'participation': 'Participação',
        'organization': 'Comissão Organizadora',
        'presentation': 'Apresentação de Trabalho',
        'guest': 'Convidado / Palestrante',
        'organization_general': 'Organização (Geral)',
        'organization_coordinator': 'Organização (Coordenador)',
        'organization_technical': 'Organização (Técnico)',
        'submission': 'Submissão de Trabalho',
        'guest_speaker': 'Convidado (Palestrante)',
        'guest_mediator': 'Convidado (Mediador)',
        'workshop': 'Minicurso / Oficina'
      };
      return labels[t] || t;
    };

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Painel de Templates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>
                {editingTemplateId ? '✏️ Editar Modelo' : '🆕 Novo Modelo de Certificado'}
              </h3>
              {editingTemplateId && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => { setEditingTemplateId(null); setTemplateForm({ name: '', bg_front_url: '', bg_back_url: '', text_template: '' }); }}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  Cancelar Edição
                </button>
              )}
            </div>

            <form onSubmit={handleSaveTemplate}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Nome do Certificado *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Certificado de Palestrante G-TERCOA"
                  required
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Frente do Certificado (Upload PNG) *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="URL da imagem da frente (.png)..."
                    value={templateForm.bg_front_url}
                    onChange={(e) => setTemplateForm({ ...templateForm, bg_front_url: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => document.getElementById('template-bg-front-file').click()}
                    style={{ padding: '8px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  >
                    Upload
                  </button>
                  <input
                    type="file"
                    id="template-bg-front-file"
                    accept="image/png"
                    style={{ display: 'none' }}
                    onChange={(e) => handleBgImageUpload(e.target.files[0], 'front')}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Verso do Certificado (Upload PNG - Opcional)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="URL da imagem do verso (.png)..."
                    value={templateForm.bg_back_url}
                    onChange={(e) => setTemplateForm({ ...templateForm, bg_back_url: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => document.getElementById('template-bg-back-file').click()}
                    style={{ padding: '8px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  >
                    Upload
                  </button>
                  <input
                    type="file"
                    id="template-bg-back-file"
                    accept="image/png"
                    style={{ display: 'none' }}
                    onChange={(e) => handleBgImageUpload(e.target.files[0], 'back')}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Personalização de Texto *</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  required
                  placeholder="Escreva o texto padrão do certificado..."
                  value={templateForm.text_template}
                  onChange={(e) => setTemplateForm({ ...templateForm, text_template: e.target.value })}
                  style={{ minHeight: '100px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px dashed var(--primary-light)', padding: '10px 14px', borderRadius: '4px', marginBottom: '15px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', color: 'var(--primary)', marginBottom: '5px' }}>📌 Tags Disponíveis para Personalização:</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', lineHeight: '1.4' }}>
                  Use as tags abaixo no texto. Elas serão trocadas pelos dados reais ao emitir:<br />
                  <strong>{`{nome}`}</strong>: Nome do destinatário<br />
                  <strong>{`{cpf}`}</strong>: CPF do destinatário<br />
                  <strong>{`{evento}`}</strong>: Nome do evento<br />
                  <strong>{`{periodo}`}</strong>: Data/Período do evento<br />
                  <strong>{`{carga_horaria}`}</strong>: Carga horária em horas<br />
                  <strong>{`{titulo_trabalho}`}</strong>: Nome do trabalho / palestra (se aplicável)
                </span>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {editingTemplateId ? 'Salvar Alterações' : 'Criar Modelo'}
              </button>
            </form>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '12px' }}>📋 Modelos Cadastrados</h3>
            {certTemplates.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nenhum modelo cadastrado ainda.</p>
            ) : (
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <table className="table" style={{ fontSize: '0.8rem', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '6px' }}>Nome</th>
                      <th style={{ padding: '6px', textAlign: 'center' }}>Frente</th>
                      <th style={{ padding: '6px', textAlign: 'center' }}>Verso</th>
                      <th style={{ padding: '6px', textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certTemplates.map(tpl => (
                      <tr key={tpl.id}>
                        <td style={{ padding: '6px', fontWeight: 600 }}>{tpl.name}</td>
                        <td style={{ padding: '6px', textAlign: 'center' }}>{tpl.bg_front_url ? '🟢' : '🔴'}</td>
                        <td style={{ padding: '6px', textAlign: 'center' }}>{tpl.bg_back_url ? '🟢' : '🔴'}</td>
                        <td style={{ padding: '6px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button className="btn btn-secondary" onClick={() => handleEditClick(tpl)} style={{ padding: '2px 6px', fontSize: '0.7rem', marginRight: '4px' }}>✏️</button>
                          <button className="btn btn-danger" onClick={() => handleDeleteClick(tpl.id)} style={{ padding: '2px 6px', fontSize: '0.7rem' }}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Emissão e Listagem */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-card">
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Emissão de Certificados</h3>

            {/* Lote / Bulk */}
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '15px', marginBottom: '15px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>A. Emissão Automática em Lote (Participantes Presenciais)</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Emite certificados em massa para os inscritos que tiveram presença confirmada (check-in) e ainda não possuem certificados de participação.
              </p>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Escolha o Modelo de Certificado *</label>
                <select
                  className="form-select"
                  value={selectedTemplateIdLote}
                  onChange={(e) => setSelectedTemplateIdLote(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                >
                  <option value="">-- Modelo Padrão do Sistema (Sem Imagem) --</option>
                  {certTemplates.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                disabled={isIssuing}
                onClick={handleBulkGenerateCertificates}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                {isIssuing ? 'Emitindo...' : 'Emitir em Lote para Credenciados'}
              </button>
            </div>

            {/* Individual */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>B. Emissão Individual Customizada</h4>

              <form onSubmit={handleIssueCertificate}>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Escolha o Modelo de Certificado *</label>
                  <select
                    className="form-select"
                    value={selectedTemplateIdIndividual}
                    onChange={(e) => setSelectedTemplateIdIndividual(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                  >
                    <option value="">-- Modelo Padrão do Sistema (Sem Imagem) --</option>
                    {certTemplates.map(tpl => (
                      <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Tipo do Certificado</label>
                  <select
                    className="form-select"
                    value={issueCertType}
                    onChange={(e) => {
                      setIssueCertType(e.target.value);
                      if (e.target.value === 'presentation' || e.target.value === 'submission') {
                        setIssueWorkload('10');
                      } else if (e.target.value === 'workshop') {
                        setIssueWorkload('4');
                      } else {
                        setIssueWorkload(selectedEventForManagement.workload_hours.toString());
                      }
                    }}
                    style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                  >
                    <option value="participation">Participação Geral</option>
                    <option value="organization_general">Organização (Geral)</option>
                    <option value="organization_coordinator">Organização (Coordenador)</option>
                    <option value="organization_technical">Organização (Técnico)</option>
                    <option value="submission">Submissão de Trabalho</option>
                    <option value="guest_speaker">Convidado (Palestrante)</option>
                    <option value="guest_mediator">Convidado (Mediador)</option>
                    <option value="workshop">Minicurso ou Oficina</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>E-mail do Destinatário *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="email@exemplo.com"
                    required
                    value={issueUserEmail}
                    onChange={(e) => setIssueUserEmail(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                  />
                  {registrationsList.length > 0 && (
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Vincular inscrito:</span>
                      <select
                        className="form-select"
                        style={{ width: 'auto', padding: '2px 8px', fontSize: '0.75rem', height: 'auto', border: '1px solid var(--border)' }}
                        onChange={(e) => setIssueUserEmail(e.target.value)}
                        value={issueUserEmail}
                      >
                        <option value="">-- Escolher Participante --</option>
                        {registrationsList.map(r => (
                          <option key={r.id} value={r.user_email}>{r.user_name} ({r.user_email})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Carga Horária (horas)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={issueWorkload}
                    onChange={(e) => setIssueWorkload(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                  />
                </div>

                {(issueCertType === 'presentation' || issueCertType === 'submission' || issueCertType === 'workshop') && (
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Título do Trabalho Apresentado *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Título completo do artigo..."
                      required
                      value={issuePresentationTitle}
                      onChange={(e) => setIssuePresentationTitle(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                    />
                    {submissionsList.length > 0 && (
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Puxar trabalho aceito:</span>
                        <select
                          className="form-select"
                          style={{ width: 'auto', padding: '2px 8px', fontSize: '0.75rem', height: 'auto', border: '1px solid var(--border)' }}
                          onChange={(e) => {
                            const subId = e.target.value;
                            const selected = submissionsList.find(s => s.id === subId);
                            if (selected) {
                              setIssuePresentationTitle(selected.title);
                              setIssueUserEmail(selected.submitter_email || '');
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="">-- Escolher Trabalho --</option>
                          {submissionsList.map(s => (
                            <option key={s.id} value={s.id}>{s.title} ({s.submitter_name})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {issueCertType === 'guest' && guestsList.length > 0 && (
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: 'center', display: 'block', marginBottom: '2px' }}>Puxar palestrante:</span>
                    <select
                      className="form-select"
                      style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem', border: '1px solid var(--border)' }}
                      onChange={(e) => {
                        const guest = guestsList.find(g => g.name === e.target.value);
                        if (guest) {
                          showToast(`Convidado selecionado: ${guest.name}. Por favor informe o e-mail cadastrado deste convidado.`);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">-- Escolher Convidado --</option>
                      {guestsList.map(g => (
                        <option key={g.id} value={g.name}>{g.name} ({g.role})</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px' }}
                  disabled={isIssuing}
                >
                  {isIssuing ? 'Emitindo...' : 'Emitir Certificado'}
                </button>
              </form>
            </div>
          </div>

          {/* List of certificates */}
          <div className="glass-card" style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Emitidos ({certificatesList.length})</h3>
            {certificatesList.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum certificado emitido.</div>
            ) : (
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <table className="custom-table" style={{ fontSize: '0.8rem', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Inscrito</th>
                      <th style={{ textAlign: 'left' }}>Tipo</th>
                      <th style={{ textAlign: 'left' }}>Carga</th>
                      <th style={{ textAlign: 'right' }}>PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificatesList.map(c => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{c.user_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{c.user_email}</div>
                          {c.presentation_title && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Artigo: {c.presentation_title}</div>}
                        </td>
                        <td>
                          <span className={`badge ${c.type === 'participation' ? 'badge-primary' : c.type && c.type.startsWith('organization') ? 'badge-success' : (c.type === 'presentation' || c.type === 'submission') ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                            {getCertTypeLabel(c.type)}
                          </span>
                        </td>
                        <td>{c.workload_hours}h</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '3px 6px', fontSize: '0.72rem' }}
                            onClick={() => handleViewCertificatePDF(c.id)}
                          >
                            Visualizar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    );
  };

  const renderAssignmentsTab = () => {
    return (
      <AdminAssignmentsView
        token={token}
        showToast={showToast}
        selectedEventForManagement={selectedEventForManagement}
        assignmentsList={assignmentsList}
        fetchAssignments={fetchAssignments}
        usersPool={systemUsers}
      />
    );
  };

  const fetchEventNotifications = async (eventId) => {
    setLoadingNotifs(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifsList(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      showToast('Preencha o título e a mensagem', 'warning');
      return;
    }
    setIsSendingNotif(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${selectedEventForManagement.id}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: notifTitle,
          message: notifMessage,
          target_audience: notifTargetAudience
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Comunicado enviado com sucesso!');
        setNotifTitle('');
        setNotifMessage('');
        setNotifTargetAudience('all');
        fetchEventNotifications(selectedEventForManagement.id);
      } else {
        showToast(data.error || 'Erro ao enviar comunicado', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão', 'danger');
    } finally {
      setIsSendingNotif(false);
    }
  };

  useEffect(() => {
    if (selectedEventForManagement && workspaceTab === 'communication') {
      fetchEventNotifications(selectedEventForManagement.id);
    }
  }, [workspaceTab, selectedEventForManagement]);

  const renderCommunicationTab = () => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Novo Comunicado</h3>
          <form onSubmit={handleSendNotification}>
            <div className="form-group">
              <label className="form-label">Título / Assunto *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ex: Prorrogada a data de submissão"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Público-Alvo *</label>
              <select 
                className="form-select"
                value={notifTargetAudience}
                onChange={(e) => setNotifTargetAudience(e.target.value)}
                required
              >
                <option value="all">Todos os Inscritos</option>
                <option value="present">Apenas Credenciados (Presentes)</option>
                <option value="authors">Apenas Autores (Com Trabalhos Enviados)</option>
                <option value="evaluators">Apenas Avaliadores Científicos</option>
                <option value="coordinators">Apenas Coordenadores de Eixo</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Mensagem / Conteúdo *</label>
              <textarea 
                className="form-textarea" 
                placeholder="Escreva aqui a mensagem do comunicado aos usuários..."
                style={{ minHeight: '150px' }}
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSendingNotif}>
              {isSendingNotif ? 'Enviando...' : 'Enviar Comunicado'}
            </button>
          </form>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Histórico de Comunicados</h3>
          {loadingNotifs ? (
            <div>Carregando histórico...</div>
          ) : notifsList.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center' }}>Nenhum comunicado enviado ainda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '500px', overflowY: 'auto', paddingRight: '5px' }}>
              {notifsList.map(n => (
                <div key={n.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary-light)' }}>{n.title}</span>
                    <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>
                      {n.target_audience === 'all' ? 'Todos' :
                       n.target_audience === 'present' ? 'Credenciados' :
                       n.target_audience === 'authors' ? 'Autores' :
                       n.target_audience === 'evaluators' ? 'Avaliadores' : 'Coordenadores'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', marginBottom: '10px' }}>{n.message}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>Por: {n.sender_name || 'Gestor'}</span>
                    <span>{new Date(n.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDeleteEventTab = () => {
    const isConfirmValid =
      deleteReason.trim() !== '' &&
      deleteConfirmName === selectedEventForManagement.name &&
      deleteConfirmCheckbox;

    const handleDeleteEvent = async (e) => {
      e.preventDefault();
      if (!isConfirmValid) return;

      setIsDeleting(true);
      try {
        const res = await fetch(`${API_URL}/api/events/${selectedEventForManagement.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reason: deleteReason })
        });
        const data = await res.json();
        if (res.ok) {
          showToast(data.message || 'Evento excluído com sucesso!');
          setDeleteReason('');
          setDeleteConfirmName('');
          setDeleteConfirmCheckbox(false);
          setSelectedEventForManagement(null);
          fetchEvents();
        } else {
          showToast(data.error || 'Erro ao excluir evento', 'danger');
        }
      } catch (err) {
        console.error(err);
        showToast('Erro ao conectar ao servidor', 'danger');
      } finally {
        setIsDeleting(false);
      }
    };

    return (
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        <div className="glass-card" style={{ border: '1px solid #feb2b2', background: 'rgba(254, 242, 242, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 'var(--radius-sm)' }}>
              <Trash2 size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#ef4444', margin: 0, fontWeight: 700 }}>Zona de Perigo: Excluir Evento</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Esta ação é permanente e irreversível.</p>
            </div>
          </div>

          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            borderLeft: '4px solid #ef4444',
            padding: '12px 16px',
            borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
            fontSize: '0.85rem',
            lineHeight: '1.4',
            color: 'var(--text-primary)',
            marginBottom: '20px'
          }}>
            <strong>Atenção:</strong> Ao confirmar a exclusão deste evento, todas as inscrições, credenciamentos, presenças em atividades, submissões de artigos e certificados vinculados a ele serão apagados do banco de dados definitivamente. Não será possível recuperar estas informações.
          </div>

          <form onSubmit={handleDeleteEvent} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Motivo da Exclusão *</label>
              <select
                className="form-input"
                value={deleteReason.startsWith('Outro: ') ? 'Outro' : deleteReason}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'Outro') {
                    setDeleteReason('Outro: ');
                  } else {
                    setDeleteReason(val);
                  }
                }}
                required
              >
                <option value="">-- Selecione o motivo --</option>
                <option value="Cancelamento do evento">Cancelamento do evento</option>
                <option value="Erro de cadastro / Duplicidade">Erro de cadastro / Duplicidade</option>
                <option value="Substituição por nova edição">Substituição por nova edição</option>
                <option value="Outro">Outro (especifique abaixo)</option>
              </select>
            </div>

            {deleteReason.startsWith('Outro: ') && (
              <div className="form-group">
                <label className="form-label">Por favor, especifique o motivo *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Descreva o motivo detalhado..."
                  style={{ minHeight: '60px' }}
                  required
                  value={deleteReason.replace('Outro: ', '')}
                  onChange={(e) => setDeleteReason('Outro: ' + e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Para confirmar, digite o nome do evento abaixo:
              </label>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', padding: '6px 12px', background: 'var(--surface-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'inline-block', fontFamily: 'monospace' }}>
                {selectedEventForManagement.name}
              </div>
              <input
                type="text"
                className="form-input"
                placeholder="Digite o nome exato do evento"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                required
                disabled={isDeleting}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="checkbox"
                id="confirm-delete-checkbox"
                checked={deleteConfirmCheckbox}
                onChange={(e) => setDeleteConfirmCheckbox(e.target.checked)}
                style={{ width: '18px', height: '18px', marginTop: '3px', cursor: 'pointer' }}
                disabled={isDeleting}
              />
              <label htmlFor="confirm-delete-checkbox" style={{ fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
                Estou ciente de que esta ação é irreversível e removerá permanentemente o evento, inscrições, certificados e todos os dados associados.
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setWorkspaceTab('basic')}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-danger"
                style={{
                  opacity: isConfirmValid ? 1 : 0.5,
                  cursor: isConfirmValid ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                disabled={!isConfirmValid || isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Excluir Evento Permanentemente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Main UI render logic
  return (
    <div>
      {selectedEventForManagement ? (
        // Event Workspace Layout
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header */}
          <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedEventForManagement(null);
                  fetchEvents();
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', padding: '6px 12px', fontSize: '0.85rem' }}
              >
                &larr; Voltar para Edições
              </button>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                {selectedEventForManagement.name}
              </h2>
              <div style={{ display: 'flex', gap: '15px', marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                <span><strong>Formato:</strong> {getFormatLabel(selectedEventForManagement.type)}</span>
                <span><strong>Período:</strong> {formatLocalDate(selectedEventForManagement.start_date)} a {formatLocalDate(selectedEventForManagement.end_date)}</span>
                <span><strong>Local:</strong> {selectedEventForManagement.location || 'Auditório Principal'}</span>
              </div>
            </div>

            <div>
              {selectedEventForManagement.transmission_link && (
                <a
                  href={selectedEventForManagement.transmission_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.9rem' }}
                >
                  <ExternalLink size={16} /> Assistir Transmissão
                </a>
              )}
            </div>
          </div>

          {/* Nav Tabs */}
          {(() => {
            const currentEventRole = myAssignments.find(as => as.event_id === selectedEventForManagement.id)?.role;
            const isEventAdminOrMgr = user && (user.role === 'admin' || user.role === 'moderator' || currentEventRole === 'event_coordinator');
            const isCommCoordinator = currentEventRole === 'communication_coordinator';

            return (
              <>
                <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', overflowX: 'auto' }}>
                  {isEventAdminOrMgr && (
                    <>
                      <button
                        style={tabStyle(workspaceTab === 'basic')}
                        onClick={() => setWorkspaceTab('basic')}
                      >
                        <Info size={16} /> Informações Básicas
                      </button>
                      <button
                        style={tabStyle(workspaceTab === 'guests')}
                        onClick={() => setWorkspaceTab('guests')}
                      >
                        <Users size={16} /> Convidados
                      </button>
                      <button
                        style={tabStyle(workspaceTab === 'activities')}
                        onClick={() => setWorkspaceTab('activities')}
                      >
                        <Calendar size={16} /> Programação
                      </button>
                      <button
                        style={tabStyle(workspaceTab === 'submissions')}
                        onClick={() => setWorkspaceTab('submissions')}
                      >
                        <BookOpen size={16} /> Envio de Trabalhos
                      </button>
                      <button
                        style={tabStyle(workspaceTab === 'checkin')}
                        onClick={() => setWorkspaceTab('checkin')}
                      >
                        <CheckCircle size={16} /> Credenciamento & Inscrições
                      </button>
                      <button
                        style={tabStyle(workspaceTab === 'assignments')}
                        onClick={() => setWorkspaceTab('assignments')}
                      >
                        <Users size={16} /> Comissão & Avaliadores
                      </button>
                      <button
                        style={tabStyle(workspaceTab === 'certificates')}
                        onClick={() => setWorkspaceTab('certificates')}
                      >
                        <Award size={16} /> Certificados
                      </button>
                    </>
                  )}
                  {(isEventAdminOrMgr || isCommCoordinator) && (
                    <button
                      style={tabStyle(workspaceTab === 'communication')}
                      onClick={() => setWorkspaceTab('communication')}
                    >
                      <Bell size={16} /> Comunicação
                    </button>
                  )}
                  {user.role === 'admin' && (
                    <button
                      style={{
                        ...tabStyle(workspaceTab === 'delete'),
                        color: workspaceTab === 'delete' ? '#ef4444' : 'var(--text-secondary)'
                      }}
                      onClick={() => setWorkspaceTab('delete')}
                    >
                      <Trash2 size={16} /> Excluir Evento
                    </button>
                  )}
                </div>

                {/* Tab content */}
                <div style={{ marginTop: '10px' }}>
                  {workspaceTab === 'basic' && isEventAdminOrMgr && renderBasicInfoTab()}
                  {workspaceTab === 'guests' && isEventAdminOrMgr && renderGuestsTab()}
                  {workspaceTab === 'activities' && isEventAdminOrMgr && renderActivitiesTab()}
                  {workspaceTab === 'submissions' && isEventAdminOrMgr && renderSubmissionsTab()}
                  {workspaceTab === 'checkin' && isEventAdminOrMgr && renderCheckinTab()}
                  {workspaceTab === 'assignments' && isEventAdminOrMgr && renderAssignmentsTab()}
                  {workspaceTab === 'certificates' && isEventAdminOrMgr && renderCertificatesTab()}
                  {workspaceTab === 'communication' && (isEventAdminOrMgr || isCommCoordinator) && renderCommunicationTab()}
                  {workspaceTab === 'delete' && user.role === 'admin' && renderDeleteEventTab()}
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: (user && (user.role === 'admin' || user.role === 'moderator')) ? '400px 1fr' : '1fr', 
          gap: '30px' 
        }}>
          {(user && (user.role === 'admin' || user.role === 'moderator')) && (
            <div className="glass-card" style={{ height: 'fit-content' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Criar Nova Edição</h3>

              <form onSubmit={handleCreateEventSubmit}>
                <div className="form-group">
                  <label className="form-label">Nome do Evento *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: IV Workshop do G-TERCOA"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">URL Amigável (Slug) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: iv-workshop"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Formato de Evento *</label>
                  <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="workshop">Workshop</option>
                    <option value="school_of_summer">Escola de Verão</option>
                    <option value="dima">Diálogos da Matemática com a Pedagogia (DIMA)</option>
                    <option value="live_cycle">Ciclo de Lives</option>
                  </select>
                </div>
                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label">Data de Início *</label>
                    <input type="date" className="form-input" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Data de Fim *</label>
                    <input type="date" className="form-input" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label">Início das Inscrições</label>
                    <input type="date" className="form-input" value={registrationStartDate} onChange={(e) => setRegistrationStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Fim das Inscrições</label>
                    <input type="date" className="form-input" value={registrationEndDate} onChange={(e) => setRegistrationEndDate(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Local de Realização *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição Resumida</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Informações gerais e objetivos do evento..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ minHeight: '80px' }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                  Criar Evento (Passo 1/3)
                </button>
              </form>
            </div>
          )}

          {/* List of current events in a premium Grid of Cards */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Workspace de Eventos</h3>

            {loading ? (
              <div>Carregando edições...</div>
            ) : events.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>Nenhum evento criado ainda. Preencha o formulário ao lado para criar o primeiro.</div>
            ) : (
              <div className="grid-cards">
                {events.map(ev => (
                  <div
                    key={ev.id}
                    className="glass-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '20px',
                      gap: '15px',
                      borderLeft: `5px solid ${ev.cert_border_color || 'var(--primary-light)'}`,
                      height: '100%'
                    }}
                  >
                    <div>
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem', marginBottom: '8px' }}>
                        {getFormatLabel(ev.type)}
                      </span>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 8px' }}>{ev.name}</h4>

                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div>📅 {formatLocalDate(ev.start_date)} a {formatLocalDate(ev.end_date)}</div>
                        <div>📍 {ev.location || 'Auditório Principal'}</div>
                        {ev.workload_hours && <div>⏱️ Carga horária: {ev.workload_hours}h</div>}
                      </div>
                    </div>

                    <div style={{ display: 'flex' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleSelectEventForManagement(ev)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: 'var(--primary-glow)',
                          color: 'var(--primary-light)',
                          border: 'none',
                          fontSize: '0.9rem',
                          padding: '10px'
                        }}
                      >
                        Gerenciar &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

function AdminAssignmentsView({
  token,
  showToast,
  selectedEventForManagement,
  assignmentsList,
  fetchAssignments,
  usersPool = []
}) {
  const [selectedUser, setSelectedUser] = useState('');
  const [assignedRole, setAssignedRole] = useState('evaluator');
  const [selectedAxis, setSelectedAxis] = useState('');
  const [isAssigningUser, setIsAssigningUser] = useState(false);
  const [assignmentToDeleteId, setAssignmentToDeleteId] = useState(null);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!selectedUser || !assignedRole) {
      showToast('Selecione o membro e o papel', 'danger');
      return;
    }
    if (assignedRole === 'coordinator' && !selectedAxis) {
      showToast('Selecione o eixo para o coordenador', 'danger');
      return;
    }
    if ((assignedRole === 'organizer' || assignedRole === 'event_coordinator') && !selectedAxis) {
      showToast('Selecione a tarefa / área de atuação', 'danger');
      return;
    }

    setIsAssigningUser(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${selectedEventForManagement.id}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: selectedUser,
          role: assignedRole,
          axis: (assignedRole === 'coordinator' || assignedRole === 'organizer' || assignedRole === 'event_coordinator') ? selectedAxis : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Membro designado com sucesso!');
        setSelectedUser('');
        setSelectedAxis('');
        fetchAssignments(selectedEventForManagement.id);
      } else {
        showToast(data.error || 'Erro ao realizar designação', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao realizar designação', 'danger');
    } finally {
      setIsAssigningUser(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${selectedEventForManagement.id}/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Designação removida com sucesso!');
        fetchAssignments(selectedEventForManagement.id);
        setAssignmentToDeleteId(null);
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao remover designação', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao remover designação', 'danger');
    }
  };

  const coordinators = assignmentsList.filter(a => a.role === 'coordinator');
  const evaluators = assignmentsList.filter(a => a.role === 'evaluator');
  const organizers = assignmentsList.filter(a => a.role === 'organizer');
  const eventCoordinators = assignmentsList.filter(a => a.role === 'event_coordinator');
  const communicationCoordinators = assignmentsList.filter(a => a.role === 'communication_coordinator');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '30px' }}>
      <div className="glass-card" style={{ height: 'fit-content' }}>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Designar Membro da Comissão</h3>

        <form onSubmit={handleCreateAssignment}>
          <div className="form-group">
            <label className="form-label">Selecionar Membro *</label>
            <select
              className="form-select"
              required
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Selecione um usuário cadastrado...</option>
              {usersPool.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email}) - {
                    u.role === 'admin' ? 'Admin' :
                      u.role === 'moderator' ? 'Moderador' :
                        u.role === 'evaluator' ? 'Avaliador' :
                          'Participante'
                  }
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Papel no Evento *</label>
            <select
              className="form-select"
              required
              value={assignedRole}
              onChange={(e) => {
                setAssignedRole(e.target.value);
                setSelectedAxis('');
              }}
            >
              <option value="evaluator">Avaliador Científico (Geral)</option>
              <option value="coordinator">Coordenador de Eixo Temático</option>
              <option value="organizer">Organizador do Evento</option>
              <option value="event_coordinator">Coordenador de Área do Evento</option>
              <option value="communication_coordinator">Coordenador de Comunicação</option>
            </select>
          </div>

          {assignedRole === 'coordinator' && (
            <div className="form-group">
              <label className="form-label">Eixo Temático Responsável *</label>
              <select
                className="form-select"
                required={assignedRole === 'coordinator'}
                value={selectedAxis}
                onChange={(e) => setSelectedAxis(e.target.value)}
              >
                <option value="">Selecione o eixo do evento...</option>
                {selectedEventForManagement.thematic_axes && selectedEventForManagement.thematic_axes.map((axis, i) => (
                  <option key={i} value={axis}>{axis}</option>
                ))}
              </select>
            </div>
          )}

          {(assignedRole === 'organizer' || assignedRole === 'event_coordinator') && (
            <div className="form-group">
              <label className="form-label">Tarefa / Área de Atuação *</label>
              <select
                className="form-select"
                required={assignedRole === 'organizer' || assignedRole === 'event_coordinator'}
                value={selectedAxis}
                onChange={(e) => setSelectedAxis(e.target.value)}
              >
                <option value="">Selecione a tarefa...</option>
                <option value="organização geral">Organização Geral</option>
                <option value="logística">Logística</option>
                <option value="técnica">Suporte Técnico</option>
                <option value="publicidade">Publicidade / Marketing</option>
                <option value="financeiro">Financeiro / Tesouraria</option>
                <option value="secretaria">Secretaria</option>
                <option value="outro">Outro / Geral</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isAssigningUser}>
            {isAssigningUser ? 'Processando...' : 'Designar Membro'}
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {/* Organizadores */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Organizadores do Evento</h3>
          {organizers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Nenhum organizador designado para este evento.</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Tarefa / Área</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {organizers.map(org => (
                    <tr key={org.id}>
                      <td style={{ fontWeight: 600 }}>{org.user_name}</td>
                      <td>{org.user_email}</td>
                      <td style={{ color: 'var(--accent)', fontWeight: 600, textTransform: 'capitalize' }}>{org.axis}</td>
                      <td style={{ textAlign: 'center' }}>
                        {assignmentToDeleteId === org.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Confirmar?</span>
                            <button type="button" className="btn btn-danger" style={{ padding: '3px 6px', fontSize: '0.7rem' }} onClick={() => handleRemoveAssignment(org.id)}>Sim</button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '3px 6px', fontSize: '0.7rem' }} onClick={() => setAssignmentToDeleteId(null)}>Não</button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            onClick={() => setAssignmentToDeleteId(org.id)}
                          >
                            Remover
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Coordenadores de Área */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Coordenadores de Área</h3>
          {eventCoordinators.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Nenhum coordenador de área designado para este evento.</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Área de Atuação</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {eventCoordinators.map(ec => (
                    <tr key={ec.id}>
                      <td style={{ fontWeight: 600 }}>{ec.user_name}</td>
                      <td>{ec.user_email}</td>
                      <td style={{ color: 'var(--primary-light)', fontWeight: 600, textTransform: 'capitalize' }}>{ec.axis}</td>
                      <td style={{ textAlign: 'center' }}>
                        {assignmentToDeleteId === ec.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Confirmar?</span>
                            <button type="button" className="btn btn-danger" style={{ padding: '3px 6px', fontSize: '0.7rem' }} onClick={() => handleRemoveAssignment(ec.id)}>Sim</button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '3px 6px', fontSize: '0.7rem' }} onClick={() => setAssignmentToDeleteId(null)}>Não</button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            onClick={() => setAssignmentToDeleteId(ec.id)}
                          >
                            Remover
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Coordenadores de Comunicação */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Coordenadores de Comunicação</h3>
          {communicationCoordinators.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Nenhum coordenador de comunicação designado para este evento.</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {communicationCoordinators.map(cc => (
                    <tr key={cc.id}>
                      <td style={{ fontWeight: 600 }}>{cc.user_name}</td>
                      <td>{cc.user_email}</td>
                      <td style={{ textAlign: 'center' }}>
                        {assignmentToDeleteId === cc.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Confirmar?</span>
                            <button type="button" className="btn btn-danger" style={{ padding: '3px 6px', fontSize: '0.7rem' }} onClick={() => handleRemoveAssignment(cc.id)}>Sim</button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '3px 6px', fontSize: '0.7rem' }} onClick={() => setAssignmentToDeleteId(null)}>Não</button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            onClick={() => setAssignmentToDeleteId(cc.id)}
                          >
                            Remover
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Coordenadores de Eixos */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Coordenadores de Eixos Temáticos</h3>
          {coordinators.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Nenhum coordenador de eixo designado para este evento.</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Eixo Temático</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {coordinators.map(coord => (
                    <tr key={coord.id}>
                      <td style={{ fontWeight: 600 }}>{coord.user_name}</td>
                      <td>{coord.user_email}</td>
                      <td style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{coord.axis}</td>
                      <td style={{ textAlign: 'center' }}>
                        {assignmentToDeleteId === coord.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Confirmar?</span>
                            <button type="button" className="btn btn-danger" style={{ padding: '3px 6px', fontSize: '0.7rem' }} onClick={() => handleRemoveAssignment(coord.id)}>Sim</button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '3px 6px', fontSize: '0.7rem' }} onClick={() => setAssignmentToDeleteId(null)}>Não</button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            onClick={() => setAssignmentToDeleteId(coord.id)}
                          >
                            Remover
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Avaliadores Gerais */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Avaliadores Científicos Gerais</h3>
          {evaluators.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Nenhum avaliador designado para este evento.</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluators.map(ev => (
                    <tr key={ev.id}>
                      <td style={{ fontWeight: 600 }}>{ev.user_name}</td>
                      <td>{ev.user_email}</td>
                      <td style={{ textAlign: 'center' }}>
                        {assignmentToDeleteId === ev.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Confirmar?</span>
                            <button type="button" className="btn btn-danger" style={{ padding: '3px 6px', fontSize: '0.7rem' }} onClick={() => handleRemoveAssignment(ev.id)}>Sim</button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '3px 6px', fontSize: '0.7rem' }} onClick={() => setAssignmentToDeleteId(null)}>Não</button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            onClick={() => setAssignmentToDeleteId(ev.id)}
                          >
                            Remover
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// COMPONENTE PARA GERENCIAMENTO DE USUÁRIOS E PAPÉIS (ADMIN)
function AdminUsersView({ token, showToast }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit user modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '', email: '', cpf: '', role: '', password: '',
    institution: '', position: '', lattes_link: '', orcid: ''
  });
  const [isSavingUser, setIsSavingUser] = useState(false);

  // User event assignments modal states
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);
  const [userAssignments, setUserAssignments] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [newAssignment, setNewAssignment] = useState({
    eventId: '', role: 'evaluator', axis: ''
  });
  const [axesList, setAxesList] = useState([]);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        showToast('Erro ao carregar usuários', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de rede ao buscar usuários', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  // Edit User handlers
  const openEditModal = (u) => {
    setSelectedUser(u);
    setEditForm({
      name: u.name || '',
      email: u.email || '',
      cpf: u.cpf || '',
      role: u.role || 'participant',
      password: '',
      institution: u.institution || '',
      position: u.position || '',
      lattes_link: u.lattes_link || '',
      orcid: u.orcid || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.email || !editForm.cpf) {
      showToast('Nome, E-mail e CPF são obrigatórios.', 'danger');
      return;
    }
    setIsSavingUser(true);
    try {
      const res = await fetch(`${API_URL}/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Dados do usuário atualizados com sucesso!');
        setShowEditModal(false);
        fetchUsers();
      } else {
        showToast(data.error || 'Erro ao salvar alterações', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao conectar ao servidor', 'danger');
    } finally {
      setIsSavingUser(false);
    }
  };

  // Assignments Handlers
  const fetchUserAssignments = async (userId) => {
    setLoadingAssignments(true);
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/assignments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserAssignments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchAllEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events`);
      if (res.ok) {
        const data = await res.json();
        setAllEvents(data);
        if (data.length > 0) {
          setNewAssignment(prev => ({ ...prev, eventId: data[0].id }));
          setAxesList(data[0].thematic_axes || []);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openAssignmentsModal = async (u) => {
    setSelectedUser(u);
    await fetchUserAssignments(u.id);
    await fetchAllEvents();
    setShowAssignmentsModal(true);
  };

  const handleEventSelect = (eventId) => {
    const selected = allEvents.find(e => e.id === eventId);
    setNewAssignment(prev => ({ ...prev, eventId }));
    setAxesList(selected?.thematic_axes || []);
  };

  const handleAddAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!newAssignment.eventId) {
      showToast('Selecione um evento', 'danger');
      return;
    }
    setIsAddingAssignment(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${newAssignment.eventId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          role: newAssignment.role,
          axis: newAssignment.axis
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Papel designado com sucesso no evento!');
        setNewAssignment(prev => ({ ...prev, axis: '' }));
        fetchUserAssignments(selectedUser.id);
      } else {
        showToast(data.error || 'Erro ao adicionar designação', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de rede', 'danger');
    } finally {
      setIsAddingAssignment(false);
    }
  };

  const handleRemoveAssignment = async (eventId, assignmentId) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Designação removida do evento!');
        fetchUserAssignments(selectedUser.id);
      } else {
        showToast('Erro ao remover designação', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de rede', 'danger');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.cpf && u.cpf.includes(searchTerm))
  );

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 800, margin: 0 }}>Gerenciamento de Usuários</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Pesquise usuários cadastrados, gerencie seus dados, redefina senhas ou designe múltiplos papéis nos eventos.
          </p>
        </div>
        <div style={{ position: 'relative', width: '300px' }}>
          <input
            type="text"
            placeholder="Pesquisar por nome, e-mail ou CPF..."
            className="form-input"
            style={{ paddingRight: '40px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Carregando lista de usuários...</div>
      ) : filteredUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Nenhum usuário cadastrado ou correspondente à pesquisa foi encontrado.
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>CPF</th>
                <th>Papel Atual</th>
                <th style={{ width: '340px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td style={{ fontFamily: 'monospace' }}>{u.cpf || 'Não informado'}</td>
                  <td>
                    <span
                      className={`badge ${u.role === 'admin' ? 'badge-primary' :
                          u.role === 'moderator' ? 'badge-warning' :
                            u.role === 'evaluator' ? 'badge-success' :
                              'badge-outline'
                        }`}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {u.role === 'admin' ? 'Administrador' :
                        u.role === 'moderator' ? 'Moderador' :
                          u.role === 'evaluator' ? 'Avaliador' :
                            'Participante'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={() => openEditModal(u)}>
                        ✏️ Editar Cadastro
                      </button>
                      <button className="btn btn-accent" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={() => openAssignmentsModal(u)}>
                        🔑 Papéis em Eventos
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 1: Editar Dados do Usuário */}
      {showEditModal && selectedUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-card" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', animation: 'modalEnter 0.25s ease-out' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Editar Cadastro do Usuário</h3>
            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input type="text" className="form-input" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail *</label>
                  <input type="email" className="form-input" required value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">CPF *</label>
                  <input type="text" className="form-input" required value={editForm.cpf} onChange={(e) => setEditForm({ ...editForm, cpf: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Papel no Sistema *</label>
                  <select className="form-select" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                    <option value="participant">Participante</option>
                    <option value="evaluator">Avaliador Científico</option>
                    <option value="moderator">Moderador (Criar Eventos)</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Instituição</label>
                  <input type="text" className="form-input" value={editForm.institution} onChange={(e) => setEditForm({ ...editForm, institution: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cargo / Função</label>
                  <input type="text" className="form-input" value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Link Currículo Lattes</label>
                  <input type="text" className="form-input" value={editForm.lattes_link} onChange={(e) => setEditForm({ ...editForm, lattes_link: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Identificador ORCID</label>
                  <input type="text" className="form-input" value={editForm.orcid} onChange={(e) => setEditForm({ ...editForm, orcid: e.target.value })} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label">Nova Senha (deixe em branco para não alterar)</label>
                <input type="password" placeholder="Nova senha de acesso" className="form-input" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" disabled={isSavingUser}>
                  {isSavingUser ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Gerenciar Designações/Papéis em Eventos */}
      {showAssignmentsModal && selectedUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-card" style={{ width: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', animation: 'modalEnter 0.25s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>Designações de {selectedUser.name} em Eventos</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setShowAssignmentsModal(false)}>&times;</button>
            </div>

            {/* List of active assignments */}
            <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '10px', color: 'var(--primary)' }}>Papéis Ativos</h4>
            {loadingAssignments ? (
              <div style={{ padding: '15px 0' }}>Carregando atribuições...</div>
            ) : userAssignments.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '20px' }}>Nenhum papel designado para este usuário em eventos específicos.</p>
            ) : (
              <div className="table-container" style={{ marginBottom: '25px' }}>
                <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Evento</th>
                      <th>Papel</th>
                      <th>Eixo/Área</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userAssignments.map(as => (
                      <tr key={as.id}>
                        <td style={{ fontWeight: 600 }}>{as.event_name}</td>
                        <td style={{ textTransform: 'capitalize', fontWeight: 'bold', color: 'var(--primary)' }}>
                          {as.role === 'coordinator' ? 'Coordenador' :
                           as.role === 'evaluator' ? 'Avaliador' :
                           as.role === 'organizer' ? 'Organizador' :
                           as.role === 'event_coordinator' ? 'Coord. Geral do Evento' :
                           as.role === 'communication_coordinator' ? 'Coord. de Comunicação' : as.role}
                        </td>
                        <td>{as.axis || 'Nenhum'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleRemoveAssignment(as.event_id, as.id)}>
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Form to add a new assignment */}
            <div style={{ background: 'var(--surface-secondary)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '15px', color: 'var(--primary)' }}>Designar Novo Papel em Evento</h4>
              {allEvents.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>Nenhum evento disponível para designação.</p>
              ) : (
                <form onSubmit={handleAddAssignmentSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', alignItems: 'end' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Selecionar Evento</label>
                    <select className="form-select" value={newAssignment.eventId} onChange={(e) => handleEventSelect(e.target.value)}>
                      {allEvents.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Papel a Designar</label>
                    <select className="form-select" value={newAssignment.role} onChange={(e) => setNewAssignment({ ...newAssignment, role: e.target.value, axis: '' })}>
                      <option value="evaluator">Avaliador Geral</option>
                      <option value="coordinator">Coordenador de Eixo</option>
                      <option value="organizer">Organizador (Staff)</option>
                      <option value="event_coordinator">Coordenador do Evento</option>
                      <option value="communication_coordinator">Coordenador de Comunicação</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    {newAssignment.role === 'coordinator' ? (
                      <>
                        <label className="form-label">Eixo Temático *</label>
                        <select className="form-select" required value={newAssignment.axis} onChange={(e) => setNewAssignment({ ...newAssignment, axis: e.target.value })}>
                          <option value="">Escolha o eixo...</option>
                          {axesList.map((axis, i) => (
                            <option key={i} value={axis}>{axis}</option>
                          ))}
                        </select>
                      </>
                    ) : (newAssignment.role === 'organizer' || newAssignment.role === 'event_coordinator') ? (
                      <>
                        <label className="form-label">Tarefa / Área de Atuação *</label>
                        <input type="text" className="form-input" placeholder="Ex: Credenciamento, Logística" required value={newAssignment.axis} onChange={(e) => setNewAssignment({ ...newAssignment, axis: e.target.value })} />
                      </>
                    ) : (
                      <>
                        <label className="form-label">Área / Eixo (Opcional)</label>
                        <input type="text" className="form-input" disabled placeholder="Não aplicável" value="" />
                      </>
                    )}
                  </div>
                  <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="submit" className="btn btn-primary" disabled={isAddingAssignment}>
                      {isAddingAssignment ? 'Adicionando...' : 'Designar Papel'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAssignmentsModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// C. CREDENCIAMENTO E CHECK-IN (QR READER SIMULATION & NAME SEARCH)
function AdminCheckinView({ token, showToast, selectedEventId: propEventId }) {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(propEventId || '');
  const [registrations, setRegistrations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // simulated QR camera
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [scanning, setScanning] = useState(false);

  // Kiosk Mode & Advanced states
  const [kioskMode, setKioskMode] = useState(false);
  const [kioskInput, setKioskInput] = useState('');
  const [kioskStatus, setKioskStatus] = useState('idle'); // idle | loading | success | error
  const [kioskMessage, setKioskMessage] = useState('');

  // Activity frequency states
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [eventActivities, setEventActivities] = useState([]);
  const [activityPresences, setActivityPresences] = useState([]);

  useEffect(() => {
    if (!propEventId) {
      fetchEvents();
    } else {
      setSelectedEventId(propEventId);
    }
  }, [propEventId]);

  useEffect(() => {
    if (selectedEventId) {
      fetchAttendees(selectedEventId);
      fetchEventActivities(selectedEventId);
      setSelectedActivityId('');
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (selectedActivityId) {
      fetchActivityPresences(selectedActivityId);
    } else {
      setActivityPresences([]);
    }
  }, [selectedActivityId]);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events`);
      const data = await res.json();
      setEvents(data);
      if (data.length > 0) setSelectedEventId(data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendees = async (eventId) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/registrations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEventActivities = async (eventId) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/activities`);
      if (res.ok) {
        const data = await res.json();
        setEventActivities(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActivityPresences = async (activityId) => {
    try {
      const res = await fetch(`${API_URL}/api/activities/${activityId}/presences`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActivityPresences(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckinToggle = async (attendee, isPresent) => {
    if (selectedActivityId) {
      // Activity Check-in Toggle
      try {
        const res = await fetch(`${API_URL}/api/activities/${selectedActivityId}/checkin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ user_id: attendee.user_id, status: isPresent ? 0 : 1 })
        });
        if (res.ok) {
          showToast(isPresent ? 'Presença removida da atividade.' : 'Check-in na atividade realizado!');
          fetchActivityPresences(selectedActivityId);
        } else {
          showToast('Erro ao atualizar presença na atividade', 'danger');
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // General Event Check-in Toggle
      try {
        const res = await fetch(`${API_URL}/api/registrations/${attendee.id}/checkin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: isPresent ? 0 : 1 })
        });

        if (res.ok) {
          showToast(isPresent ? 'Presença geral removida.' : 'Check-in geral realizado com sucesso!');
          fetchAttendees(selectedEventId);
        } else {
          showToast('Erro ao atualizar presença geral', 'danger');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleExportCSV = async () => {
    if (!selectedEventId) return;
    showToast('Iniciando exportação da lista de presença...');
    try {
      const response = await fetch(`${API_URL}/api/events/${selectedEventId}/registrations/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const eventName = events.find(e => e.id === selectedEventId)?.name || 'evento';
        const safeName = eventName.toLowerCase().replace(/[^a-z0-9]/gi, '_');
        a.href = url;
        a.download = `lista_presenca_${safeName}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast('Lista exportada em CSV com sucesso!');
      } else {
        showToast('Erro ao exportar lista de presença', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao exportar CSV', 'danger');
    }
  };

  const playBeep = (success) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (success) {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
      } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.45);
      }
    } catch (e) {
      console.warn('Audio Context is not supported or blocked.', e);
    }
  };

  const handleKioskSubmit = async (e) => {
    e.preventDefault();
    if (!kioskInput.trim()) return;

    setKioskStatus('loading');
    const formattedInput = kioskInput.trim();

    if (selectedActivityId) {
      // Activity Check-in Kiosk Mode
      try {
        const res = await fetch(`${API_URL}/api/activities/${selectedActivityId}/checkin-kiosk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ identifier: formattedInput })
        });
        const data = await res.json();
        if (res.ok) {
          setKioskStatus('success');
          setKioskMessage(data.message);
          playBeep(true);
          setKioskInput('');
          fetchActivityPresences(selectedActivityId);
          setTimeout(() => {
            setKioskStatus('idle');
            setKioskMessage('');
          }, 3500);
        } else {
          setKioskStatus('error');
          setKioskMessage(data.error || 'Erro ao realizar credenciamento na atividade');
          playBeep(false);
          setKioskInput('');
          setTimeout(() => {
            setKioskStatus('idle');
            setKioskMessage('');
          }, 3500);
        }
      } catch (err) {
        console.error(err);
        setKioskStatus('error');
        setKioskMessage('Erro de conexão ao buscar credencial.');
        playBeep(false);
      }
    } else {
      // General Event Check-in Kiosk Mode
      try {
        const resRegs = await fetch(`${API_URL}/api/events/${selectedEventId}/registrations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resRegs.ok) {
          const regs = await resRegs.json();
          setRegistrations(regs);

          const match = regs.find(r => r.id === formattedInput || r.user_cpf.replace(/[^0-9]/g, '') === formattedInput.replace(/[^0-9]/g, ''));
          if (match) {
            if (match.checked_in) {
              setKioskStatus('error');
              setKioskMessage(`${match.user_name} já credenciado(a) anteriormente!`);
              playBeep(false);
              setKioskInput('');
              setTimeout(() => {
                setKioskStatus('idle');
                setKioskMessage('');
              }, 3500);
            } else {
              const checkinRes = await fetch(`${API_URL}/api/registrations/${match.id}/checkin`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 1 })
              });
              if (checkinRes.ok) {
                setKioskStatus('success');
                setKioskMessage(`Check-in realizado! Seja bem-vindo(a), ${match.user_name}!`);
                playBeep(true);
                setKioskInput('');
                fetchAttendees(selectedEventId);
                setTimeout(() => {
                  setKioskStatus('idle');
                  setKioskMessage('');
                }, 3500);
              } else {
                setKioskStatus('error');
                setKioskMessage('Falha ao processar credenciamento no servidor.');
                playBeep(false);
              }
            }
          } else {
            setKioskStatus('error');
            setKioskMessage('Participante ou código credencial não localizado neste evento!');
            playBeep(false);
            setKioskInput('');
            setTimeout(() => {
              setKioskStatus('idle');
              setKioskMessage('');
            }, 3500);
          }
        }
      } catch (err) {
        console.error(err);
        setKioskStatus('error');
        setKioskMessage('Erro de conexão ao buscar credencial.');
        playBeep(false);
      }
    }
  };

  // Simulated QR check-in
  const handleQRScanSubmit = (e) => {
    e.preventDefault();
    if (!qrCodeInput.trim()) return;

    // Search matching registration in the attendee list
    const match = registrations.find(r => r.id === qrCodeInput.trim() || r.user_cpf === qrCodeInput.trim());
    if (match) {
      const isPresent = selectedActivityId
        ? activityPresences.some(ap => ap.user_id === match.user_id)
        : match.checked_in === 1;
      handleCheckinToggle(match, isPresent);
      setQrCodeInput('');
      setScanning(false);
    } else {
      showToast('Credencial/QR Code não encontrado para este evento.', 'danger');
    }
  };

  // Automated certificates issuance trigger
  const handleBulkIssueCertificates = async () => {
    if (!selectedEventId) return;
    try {
      const res = await fetch(`${API_URL}/api/events/${selectedEventId}/certificates/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
      } else {
        showToast(data.error || 'Erro ao gerar certificados', 'danger');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAttendees = registrations.filter(r =>
    r.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.user_cpf.includes(searchTerm)
  );

  const totalRegistered = registrations.length;
  const totalPresent = selectedActivityId
    ? activityPresences.length
    : registrations.filter(r => r.checked_in === 1).length;
  const totalAbsent = totalRegistered - totalPresent;
  const attendancePercent = totalRegistered > 0 ? Math.round((totalPresent / totalRegistered) * 100) : 0;

  if (kioskMode) {
    const activeEvent = events.find(e => e.id === selectedEventId);
    const activeActivity = eventActivities.find(a => a.id === selectedActivityId);
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        color: '#fff',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        textAlign: 'center'
      }}>
        <button
          className="btn"
          style={{ position: 'absolute', top: '30px', right: '30px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 20px', fontWeight: 'bold' }}
          onClick={() => { setKioskMode(false); setKioskStatus('idle'); setKioskMessage(''); }}
        >
          Sair do Modo Quiosque
        </button>

        <div style={{ maxWidth: '600px', width: '100%' }}>
          <span className="badge badge-accent" style={{ fontSize: '0.9rem', padding: '6px 16px', background: '#d97706', marginBottom: '15px' }}>
            Autoatendimento
          </span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginBottom: '10px' }}>G-TERCOA Credenciamento</h1>
          <p style={{ fontSize: '1.2rem', color: '#93c5fd', marginBottom: '40px' }}>
            Edição: <strong>{activeEvent ? activeEvent.name : 'Carregando...'}</strong>
            {activeActivity && (
              <span style={{ display: 'block', color: 'var(--accent)', fontSize: '1.1rem', marginTop: '5px' }}>
                Atividade: <strong>{activeActivity.title}</strong>
              </span>
            )}
          </p>

          {kioskStatus === 'idle' && (
            <div className="glass-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '40px 30px', borderRadius: '24px' }}>
              <QrCode size={80} style={{ color: '#93c5fd', margin: '0 auto 24px', animation: 'pulse 2s infinite' }} />
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '20px' }}>Aproxime seu QR Code ou Digite seu CPF</h2>

              <form onSubmit={handleKioskSubmit}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ textAlign: 'center', fontSize: '1.5rem', padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                    placeholder="Ex: CPF ou Código de Inscrição"
                    autoFocus
                    required
                    value={kioskInput}
                    onChange={(e) => setKioskInput(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-accent" style={{ width: '100%', padding: '16px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  Confirmar Presença
                </button>
              </form>
            </div>
          )}

          {kioskStatus === 'loading' && (
            <div style={{ padding: '60px' }}>
              <div style={{ width: '50px', height: '50px', border: '5px solid #94a3b8', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s infinite linear', margin: '0 auto 20px' }}></div>
              <h3>Processando credenciamento...</h3>
            </div>
          )}

          {kioskStatus === 'success' && (
            <div className="glass-card" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981', padding: '50px 30px', borderRadius: '24px' }}>
              <CheckCircle size={80} style={{ color: '#10b981', margin: '0 auto 20px' }} />
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginBottom: '15px' }}>Presença Confirmada!</h2>
              <p style={{ fontSize: '1.3rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                {kioskMessage}
              </p>
              <div style={{ marginTop: '30px', fontSize: '0.9rem', color: '#94a3b8' }}>
                Retornando em instantes...
              </div>
            </div>
          )}

          {kioskStatus === 'error' && (
            <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '2px solid #ef4444', padding: '50px 30px', borderRadius: '24px' }}>
              <Info size={80} style={{ color: '#ef4444', margin: '0 auto 20px' }} />
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444', marginBottom: '15px' }}>Não Credenciado!</h2>
              <p style={{ fontSize: '1.3rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                {kioskMessage}
              </p>
              <div style={{ marginTop: '30px', fontSize: '0.9rem', color: '#94a3b8' }}>
                Retornando em instantes...
              </div>
            </div>
          )}
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '30px' }}>
      {/* Search & Checklist */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>Controle de Acesso / Chamada</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-accent" style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleBulkIssueCertificates}>
              <Award size={14} /> Emitir Certificados
            </button>
            <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleExportCSV}>
              <FileText size={14} /> Exportar CSV
            </button>
            <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary)', color: '#fff' }} onClick={() => setKioskMode(true)}>
              <QrCode size={14} /> Modo Quiosque
            </button>
          </div>
        </div>

        {/* Dropdown selectors for Event and Activity */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {!propEventId && (
            <div style={{ minWidth: '220px' }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Selecionar Evento</label>
              <select className="form-select" value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Tipo de Controle / Chamada</label>
            <select className="form-select" value={selectedActivityId} onChange={(e) => setSelectedActivityId(e.target.value)}>
              <option value="">Credenciamento Geral do Evento</option>
              {eventActivities.map(act => (
                <option key={act.id} value={act.id}>Presença em: {act.title} ({act.type.replace('_', ' ')})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Attendance Metrics Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: 'var(--surface-secondary)', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inscritos</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2px' }}>{totalRegistered}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Presentes</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)', marginTop: '2px' }}>{totalPresent}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ausentes</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--danger)', marginTop: '2px' }}>{totalAbsent}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Presença</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-light)', marginTop: '2px' }}>{attendancePercent}%</div>
          </div>
        </div>

        <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Buscar por Nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container" style={{ marginTop: '20px' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nome do Participante</th>
                <th>CPF</th>
                <th>Categoria</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendees.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Nenhum participante inscrito neste evento.</td></tr>
              ) : (
                filteredAttendees.map(att => {
                  const isPresent = selectedActivityId
                    ? activityPresences.some(ap => ap.user_id === att.user_id)
                    : att.checked_in === 1;
                  return (
                    <tr key={att.id} style={{ background: isPresent ? 'rgba(5, 150, 105, 0.03)' : '#fff' }}>
                      <td style={{ fontWeight: 600 }}>{att.user_name}</td>
                      <td>{att.user_cpf}</td>
                      <td>{att.category}</td>
                      <td>
                        <span className={`badge ${isPresent ? 'badge-success' : 'badge-danger'}`}>
                          {isPresent ? 'Presente' : 'Faltando'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn ${isPresent ? 'btn-danger' : 'btn-primary'}`}
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => handleCheckinToggle(att, isPresent)}
                        >
                          {isPresent ? 'Remover' : 'Credenciar'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR scanner simulator */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Leitor QR Code (Simulador)</h3>

          {/* Simulated Webcam View */}
          <div style={{
            height: '220px',
            background: '#000',
            borderRadius: 'var(--radius-sm)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            color: '#fff',
            marginBottom: '20px'
          }}>
            {scanning ? (
              <>
                {/* Visual scan animation line */}
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '100%',
                  height: '3px',
                  background: 'var(--success)',
                  boxShadow: '0 0 10px var(--success)',
                  animation: 'qrScannerLine 2.5s infinite linear'
                }}></div>
                <div style={{ textAlign: 'center', zIndex: 10 }}>
                  <QrCode size={48} className="animate-pulse" style={{ color: 'var(--success)', margin: '0 auto 10px' }} />
                  <p style={{ fontSize: '0.85rem' }}>Buscando QR Code nos arredores...</p>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setScanning(true)}>
                <QrCode size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
                <p style={{ fontSize: '0.85rem' }}>Clique para ativar câmera de credenciamento</p>
              </div>
            )}
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes qrScannerLine {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
          `}} />

          {/* Test panel inside the QR simulator */}
          <form onSubmit={handleQRScanSubmit}>
            <div className="form-group">
              <label className="form-label">Simular Entrada do Scanner (ID ou CPF)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Insira o ID da credencial ou CPF do participante"
                value={qrCodeInput}
                onChange={(e) => setQrCodeInput(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Simular Leitura QR</button>
          </form>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginTop: '15px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <strong>Dica de Teste:</strong> Clique em "Ver QR Credencial" na área do participante para abrir a credencial, copie o ID ou digite o CPF de algum inscrito nesta caixa.
        </div>
      </div>
    </div>
  );
}

// D. ALLOCATIONS AND REVIEW ASSIGNMENTS
function AdminSubmissionsView({ token, showToast, selectedEventId: propEventId }) {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(propEventId || '');
  const [submissions, setSubmissions] = useState([]);
  const [evaluators, setEvaluators] = useState([]);

  // Read-only structured form modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [formModalTitle, setFormModalTitle] = useState('');
  const [formModalData, setFormModalData] = useState(null);

  const openFormViewModal = (title, formStr, commentsVal) => {
    let formData = null;
    if (formStr) {
      try {
        formData = typeof formStr === 'string' ? JSON.parse(formStr) : formStr;
      } catch (e) {
        console.error('Error parsing evaluation form', e);
      }
    }
    setFormModalTitle(title);
    setFormModalData({
      answers: formData?.answers || {},
      recommendation: formData?.recommendation || '',
      comments: commentsVal || ''
    });
    setShowFormModal(true);
  };

  useEffect(() => {
    if (!propEventId) {
      fetchEvents();
    } else {
      setSelectedEventId(propEventId);
    }
    fetchEvaluators();
  }, [propEventId]);

  useEffect(() => {
    if (selectedEventId) {
      fetchSubmissions(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events`);
      const data = await res.json();
      setEvents(data);
      if (data.length > 0) setSelectedEventId(data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEvaluators = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/evaluators`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluators(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubmissions = async (eventId) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignReviewer = async (subId, reviewerId, slot) => {
    try {
      const res = await fetch(`${API_URL}/api/submissions/${subId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          reviewer_id: reviewerId || null, 
          reviewer_slot: slot 
        })
      });

      if (res.ok) {
        showToast(reviewerId ? 'Avaliador alocado com sucesso!' : 'Avaliador removido com sucesso!');
        fetchSubmissions(selectedEventId);
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao alocar avaliador', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao alocar avaliador', 'danger');
    }
  };

  return (
    <div className="glass-card">
      <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '20px' }}>Alocação de Pareceristas e Eixos Temáticos</h3>

      {!propEventId && (
        <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
          <select className="form-select" style={{ maxWidth: '300px' }} value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="table-container" style={{ marginTop: '20px' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Título do Trabalho</th>
              <th>Autor Principal</th>
              <th>Eixo Temático</th>
              <th style={{ minWidth: '180px' }}>Avaliadores Alocados (1 & 2)</th>
              <th>Status</th>
              <th>Parecer Final</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>Nenhum trabalho submetido para esta edição.</td></tr>
            ) : (
              submissions.map(sub => (
                <tr key={sub.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{sub.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Coautores: {sub.authors || 'Nenhum'}</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <a href={`${API_URL}${sub.file_path}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.72rem', textDecoration: 'none' }}>
                        Cego (Sem Id.)
                      </a>
                      {sub.file_path_identified && (
                        <a href={`${API_URL}${sub.file_path_identified}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.72rem', textDecoration: 'none' }}>
                          Identificado
                        </a>
                      )}
                    </div>
                  </td>
                  <td>{sub.submitter_name}</td>
                  <td><span className="badge badge-primary">{sub.thematic_axis}</span></td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Avaliador 1:</span>
                        <select
                          className="form-select"
                          style={{ padding: '4px 8px', fontSize: '0.8rem', marginTop: '2px' }}
                          value={sub.reviewer_id || ''}
                          onChange={(e) => handleAssignReviewer(sub.id, e.target.value, 1)}
                        >
                          <option value="">Nenhum / Escolher...</option>
                          {evaluators.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.name}</option>
                          ))}
                        </select>
                        {sub.reviewer_evaluation_form && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '2px 6px', fontSize: '0.68rem', marginTop: '4px', display: 'block', width: '100%', textAlign: 'center' }}
                            onClick={() => openFormViewModal('Ficha de Avaliação 1', sub.reviewer_evaluation_form, sub.reviewer_comments)}
                          >
                            👁️ Ver Ficha 1
                          </button>
                        )}
                      </div>
                      <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Avaliador 2:</span>
                        <select
                          className="form-select"
                          style={{ padding: '4px 8px', fontSize: '0.8rem', marginTop: '2px' }}
                          value={sub.reviewer_2_id || ''}
                          onChange={(e) => handleAssignReviewer(sub.id, e.target.value, 2)}
                        >
                          <option value="">Nenhum / Escolher...</option>
                          {evaluators.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.name}</option>
                          ))}
                        </select>
                        {sub.reviewer_2_evaluation_form && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '2px 6px', fontSize: '0.68rem', marginTop: '4px', display: 'block', width: '100%', textAlign: 'center' }}
                            onClick={() => openFormViewModal('Ficha de Avaliação 2', sub.reviewer_2_evaluation_form, sub.reviewer_2_comments)}
                          >
                            👁️ Ver Ficha 2
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${sub.status === 'under_review' ? 'badge-warning' : sub.status === 'accepted' ? 'badge-success' : sub.status === 'rejected' ? 'badge-danger' : 'badge-primary'
                      }`}>
                      {sub.status === 'under_review' ? 'Sob Avaliação' : sub.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem' }}>{sub.review_comments || 'Pendente de revisão'}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      {showFormModal && formModalData && (
        <EvaluationFormViewModal
          title={formModalTitle}
          data={formModalData}
          onClose={() => { setShowFormModal(false); setFormModalData(null); }}
        />
      )}
      </div>
    </div>
  );
}

// ==========================================
// AUTH MODALS
// ==========================================

// Login Modal
function LoginModal({ onClose, onLoginSuccess, showToast }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.token, data.user);
        showToast('Login realizado com sucesso! Bem-vindo(a).');
        onClose();
        navigate('/dashboard');
      } else {
        showToast(data.error || 'Erro ao realizar login', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao conectar ao servidor', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', position: 'relative', width: '100%', padding: '20px 24px 10px 24px' }}>
          <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', position: 'absolute', top: '15px', right: '15px' }} onClick={onClose}>&times;</button>
          <img src={logoLight} alt="G-TERCOA Logo" style={{ height: '75px', width: 'auto', objectFit: 'contain', marginTop: '10px' }} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Entrar na Plataforma</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input id="login-email" type="email" className="form-input" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input id="login-password" type="password" className="form-input" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div style={{ marginTop: '16px', padding: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: '#1e40af' }}>
              <strong>Dica de Acesso:</strong> Acesse com o e-mail do administrador cadastrado na plataforma ou seu acesso de participantet.
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button id="login-submit-btn" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Register Modal
function RegisterModal({ onClose, showToast, setShowLoginModal }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [role, setRole] = useState('participant');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, cpf, role })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Cadastro realizado com sucesso! Faça seu login.');
        onClose();
        setShowLoginModal(true);
      } else {
        showToast(data.error || 'Erro ao realizar cadastro', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao registrar', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', position: 'relative', width: '100%', padding: '20px 24px 10px 24px' }}>
          <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', position: 'absolute', top: '15px', right: '15px' }} onClick={onClose}>&times;</button>
          <img src={logoLight} alt="G-TERCOA Logo" style={{ height: '75px', width: 'auto', objectFit: 'contain', marginTop: '10px' }} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Criar Conta de Acesso</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="form-group">
              <label className="form-label">Nome Completo *</label>
              <input id="register-name" type="text" className="form-input" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail *</label>
              <input id="register-email" type="email" className="form-input" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">CPF *</label>
              <input
                id="register-cpf"
                type="text"
                className="form-input"
                placeholder="000.000.000-00"
                required
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Senha *</label>
              <input id="register-password" type="password" className="form-input" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Papel de Usuário *</label>
              <select id="register-role" className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="participant">Participante / Autor</option>
                <option value="evaluator">Avaliador (Parecerista)</option>
              </select>
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Nota: O papel de Administrador Geral é gerado por padrão na inicialização do banco.
              </small>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button id="register-submit-btn" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminActivitiesView({ token, showToast, selectedEventId: propEventId, eventGuests }) {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(propEventId || '');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Activity form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState('palestra');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [transmissionLink, setTransmissionLink] = useState('');
  const [actAdditionalLinks, setActAdditionalLinks] = useState([]);
  const [newActLinkLabel, setNewActLinkLabel] = useState('');
  const [newActLinkUrl, setNewActLinkUrl] = useState('');

  // Guest list state for the new activity
  const [guests, setGuests] = useState([]);
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [activityToDeleteId, setActivityToDeleteId] = useState(null);

  const handleAddActLink = () => {
    if (!newActLinkLabel.trim() || !newActLinkUrl.trim()) {
      showToast('Preencha o nome e a URL do link', 'warning');
      return;
    }
    let url = newActLinkUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    setActAdditionalLinks(prev => [...prev, { label: newActLinkLabel.trim(), url }]);
    setNewActLinkLabel('');
    setNewActLinkUrl('');
  };

  const handleRemoveActLink = (index) => {
    setActAdditionalLinks(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!propEventId) {
      fetchEvents();
    } else {
      setSelectedEventId(propEventId);
    }
  }, [propEventId]);

  useEffect(() => {
    if (selectedEventId) {
      fetchActivities(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events`);
      const data = await res.json();
      setEvents(data);
      if (data.length > 0) {
        setSelectedEventId(data[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActivities = async (eventId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/activities`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGuest = (e) => {
    e.preventDefault();
    if (!selectedGuestId) {
      showToast('Selecione um convidado do evento', 'danger');
      return;
    }
    const selected = eventGuests.find(g => g.id === selectedGuestId);
    if (!selected) return;

    if (guests.some(g => g.id === selected.id)) {
      showToast('Este convidado já está vinculado a esta atividade', 'warning');
      return;
    }

    setGuests(prev => [
      ...prev,
      {
        id: selected.id,
        name: selected.name,
        role: selected.role || 'palestrante',
        institution: selected.institution || ''
      }
    ]);
    setSelectedGuestId('');
  };

  const handleRemoveGuest = (index) => {
    setGuests(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitActivity = async (e) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) {
      showToast('Preencha os campos obrigatórios', 'danger');
      return;
    }

    const payload = {
      title,
      type,
      start_time: startTime,
      end_time: endTime,
      location,
      description,
      guests,
      transmission_link: transmissionLink,
      additional_links: actAdditionalLinks
    };

    try {
      let res;
      if (editingActivityId) {
        res = await fetch(`${API_URL}/api/activities/${editingActivityId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/api/events/${selectedEventId}/activities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (res.ok) {
        showToast(editingActivityId ? 'Atividade atualizada com sucesso!' : 'Atividade adicionada com sucesso à programação!');
        setTitle('');
        setStartTime('');
        setEndTime('');
        setLocation('');
        setDescription('');
        setTransmissionLink('');
        setActAdditionalLinks([]);
        setNewActLinkLabel('');
        setNewActLinkUrl('');
        setGuests([]);
        setEditingActivityId(null);
        fetchActivities(selectedEventId);
      } else {
        showToast(data.error || 'Erro ao salvar atividade', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao conectar ao servidor', 'danger');
    }
  };

  const handleEditClick = (act) => {
    setEditingActivityId(act.id);
    setTitle(act.title || '');
    setType(act.type || 'palestra');
    setStartTime(act.start_time || '');
    setEndTime(act.end_time || '');
    setLocation(act.location || '');
    setDescription(act.description || '');
    setTransmissionLink(act.transmission_link || '');
    setActAdditionalLinks(act.additional_links || []);
    setGuests(act.guests || []);
    document.getElementById('act-title')?.focus();
  };

  const handleCancelEdit = () => {
    setEditingActivityId(null);
    setTitle('');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setDescription('');
    setTransmissionLink('');
    setActAdditionalLinks([]);
    setNewActLinkLabel('');
    setNewActLinkUrl('');
    setGuests([]);
  };

  const handleDeleteActivity = async (actId) => {
    try {
      const res = await fetch(`${API_URL}/api/activities/${actId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showToast('Atividade removida com sucesso!');
        fetchActivities(selectedEventId);
      } else {
        showToast('Erro ao remover atividade', 'danger');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Activity Form */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>
          {editingActivityId ? 'Editar Atividade' : 'Criar Atividade'}
        </h3>

        {!propEventId && (
          <div className="form-group">
            <label className="form-label">Selecionar Edição do Evento *</label>
            <select className="form-select" value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSubmitActivity}>
          <div className="form-group">
            <label className="form-label">Título da Atividade *</label>
            <input
              id="act-title"
              type="text"
              className="form-input"
              placeholder="Ex: Palestra Magna: O Futuro da Educação"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de Atividade *</label>
            <select id="act-type" className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="palestra">Palestra</option>
              <option value="mesa_redonda">Mesa Redonda</option>
              <option value="minicurso">Minicurso</option>
              <option value="outro">Abertura / Encerramento / Outro</option>
            </select>
          </div>

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Data/Hora Início *</label>
              <input
                id="act-start-time"
                type="datetime-local"
                className="form-input"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Data/Hora Fim *</label>
              <input
                id="act-end-time"
                type="datetime-local"
                className="form-input"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Local / Link Virtual</label>
            <input
              id="act-location"
              type="text"
              className="form-input"
              placeholder="Ex: Auditório B ou Link Zoom"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Link de Transmissão (YouTube/Meet/etc.)</label>
            <input
              id="act-transmission-link"
              type="text"
              className="form-input"
              placeholder="Ex: https://youtube.com/live/..."
              value={transmissionLink}
              onChange={(e) => setTransmissionLink(e.target.value)}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginTop: '15px', marginBottom: '15px' }}>
            <label className="form-label" style={{ fontWeight: 700 }}>Outros Links / Recursos (Slides, Material, etc.)</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Nome do link (ex: Slides, Drive)"
                value={newActLinkLabel}
                onChange={(e) => setNewActLinkLabel(e.target.value)}
              />
              <input
                type="text"
                className="form-input"
                style={{ flex: 2 }}
                placeholder="URL (https://...)"
                value={newActLinkUrl}
                onChange={(e) => setNewActLinkUrl(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddActLink}
                style={{ whiteSpace: 'nowrap', padding: '0 15px' }}
              >
                + Add
              </button>
            </div>
            {actAdditionalLinks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--surface-secondary)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                {actAdditionalLinks.map((link, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', background: '#fff', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                    <div style={{ wordBreak: 'break-all' }}>
                      <strong>{link.label || 'Link'}:</strong> <a href={link.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-light)', textDecoration: 'underline' }}>{link.url}</a>
                    </div>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem', marginLeft: '10px' }}
                      onClick={() => handleRemoveActLink(idx)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Resumo / Descrição</label>
            <textarea
              id="act-description"
              className="form-textarea"
              style={{ minHeight: '60px' }}
              placeholder="Breve descrição da programação..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Sub-form: Invite guests */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginTop: '15px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>Adicionar Convidados (Palestrante/Mediador)</h4>

            {(!eventGuests || eventGuests.length === 0) ? (
              <div style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '15px'
              }}>
                Nenhum convidado cadastrado no evento. Por favor, cadastre os convidados primeiro na aba <strong>Convidados & Programação</strong>.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '15px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Selecionar Convidado do Evento *</label>
                  <select
                    className="form-select"
                    value={selectedGuestId}
                    onChange={(e) => setSelectedGuestId(e.target.value)}
                  >
                    <option value="">-- Escolher Convidado --</option>
                    {eventGuests.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.role}) {g.institution ? `@ ${g.institution}` : ''}</option>
                    ))}
                  </select>
                </div>
                <button
                  id="add-guest-btn"
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '8px' }}
                  onClick={handleLinkGuest}
                >
                  <Plus size={16} /> Vincular Convidado à Atividade
                </button>
              </div>
            )}

            {/* Render guests list preview */}
            {guests.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--surface-secondary)', padding: '10px', borderRadius: 'var(--radius-sm)', marginBottom: '15px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Convidados adicionados para esta atividade:</span>
                {guests.map((g, idx) => (
                  <div key={idx} style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', fontSize: '0.85rem', background: '#fff', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                    <div>
                      <strong>{g.name}</strong> ({g.role === 'palestrante' ? 'Palestrante' : 'Mediador'}) - {g.institution || 'S/I'}
                    </div>
                    <button type="button" style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem' }} onClick={() => handleRemoveGuest(idx)}>&times;</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button id="act-submit-btn" type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              {editingActivityId ? 'Salvar Alterações' : 'Adicionar Atividade à Programação'}
            </button>
            {editingActivityId && (
              <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                Cancelar Edição
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Program list table */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Programação Cadastrada</h3>

        {loading ? (
          <div>Carregando atividades...</div>
        ) : activities.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>Nenhuma atividade cadastrada para este evento. Use o formulário ao lado para adicionar.</div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Horário / Tipo</th>
                  <th>Atividade</th>
                  <th>Local</th>
                  <th>Convidados</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {activities.map(act => (
                  <tr key={act.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {new Date(act.start_time).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        até {new Date(act.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <span className={`badge ${act.type === 'palestra' ? 'badge-primary' : act.type === 'minicurso' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem', marginTop: '6px' }}>
                        {act.type}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{act.title}</div>
                      {act.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{act.description}</div>}
                    </td>
                    <td>
                      <div>{act.location || 'Não especificado'}</div>
                      {act.transmission_link && (
                        <div style={{ marginTop: '4px', fontSize: '0.8rem' }}>
                          <a href={act.transmission_link} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary-light)', textDecoration: 'underline' }}>
                            <ExternalLink size={12} />
                            Transmissão
                          </a>
                        </div>
                      )}
                      {act.additional_links && act.additional_links.length > 0 && (
                        <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem' }}>
                          {act.additional_links.map((link, idx) => (
                            <a key={idx} href={link.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', textDecoration: 'underline' }}>
                              <ExternalLink size={10} />
                              {link.label || 'Link'}
                            </a>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      {act.guests && act.guests.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                          {act.guests.map((g, idx) => (
                            <div key={idx} style={{ color: g.role === 'palestrante' ? 'var(--primary-light)' : 'var(--accent)' }}>
                              • <strong>{g.name}</strong> ({g.role === 'palestrante' ? 'Palestrante' : 'Mediador'}) - {g.institution}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>Sem convidados</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }} onClick={() => handleEditClick(act)}>
                          Editar
                        </button>
                        {activityToDeleteId === act.id ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '0.8rem', fontWeight: 'bold' }} onClick={() => { handleDeleteActivity(act.id); setActivityToDeleteId(null); }}>
                              Sim
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }} onClick={() => setActivityToDeleteId(null)}>
                              Não
                            </button>
                          </div>
                        ) : (
                          <button className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '0.8rem' }} onClick={() => setActivityToDeleteId(act.id)}>
                            Remover
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// STRUCTURAL WORK EVALUATION FORM VIEW MODAL (Reusable)
// ──────────────────────────────────────────
function EvaluationFormViewModal({ title, data, onClose }) {
  if (!data) return null;

  const EVALUATION_QUESTIONS = [
    { id: 'q1', text: '1. O texto traz uma contribuição importante para o conhecimento da área em que se insere?' },
    { id: 'q2', text: '2. O título e o resumo são coerentes com o conteúdo do texto?' },
    { id: 'q3', text: '3. O Resumo apresenta os elementos principais?' },
    { id: 'q4', text: '4. O tema proposto está bem desenvolvido, com articulação entre as partes do texto?' },
    { id: 'q5', text: '5. O texto apresenta o método de pesquisa, descrevendo os instrumentos e técnicas adotados na pesquisa?' },
    { id: 'q6', text: '6. De um modo geral, o texto alcança e/ou responde aos objetivos/questões propostos?' },
    { id: 'q7', text: '7. O texto apresenta os principais resultados encontrados, com os dados e informações que contribuem para o atendimento do objetivo proposto?' },
    { id: 'q8', text: '8. O texto apresenta as considerações sobre o estudo, sintetizando os aspectos mais importantes da pesquisa?' },
    { id: 'q9', text: '9. As referências são atualizadas e/ou relevantes ao texto?' },
    { id: 'q10', text: '10. Apresenta todas as referências citadas no texto?' },
    { id: 'q11', text: '11. Quanto aos aspectos ortográfico e gramatical, o texto está bem escrito?' },
    { id: 'q12', text: '12. Quanto à adequação da linguagem está clara?' },
    { id: 'q13', text: '13. O texto segue rigorosamente as normas da ABNT?' }
  ];

  const getOptionLabel = (val) => {
    const labels = {
      sim: 'Sim',
      razoavel: 'Razoável',
      pouco: 'Pouco',
      nao: 'Não'
    };
    return labels[val] || 'Não respondido';
  };

  const getRecommendationLabel = (val) => {
    const labels = {
      publish_as_is: 'Publicar o texto integralmente, sem alterações.',
      publish_with_minor: 'Publicar o texto, sem retorno ao(s) autor(es), após pequenas correções, conforme sugestões anexas.',
      publish_with_major: 'Publicar o texto após o retorno ao(s) autor(es) para significativas correções e alterações, conforme sugestões anexas.',
      reject: 'Não publicar, devido aos motivos indicados a seguir.'
    };
    return labels[val] || 'Não selecionada';
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000
    }}>
      <div className="glass-card" style={{ width: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', animation: 'modalEnter 0.25s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>{title}</h3>
          <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={onClose}>&times;</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'var(--surface-secondary)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '10px', color: 'var(--primary)' }}>Critérios Avaliados</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {EVALUATION_QUESTIONS.map(q => {
                const answer = data.answers?.[q.id];
                return (
                  <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', borderBottom: '1px solid rgba(0,0,0,0.03)', paddingBottom: '6px' }}>
                    <span style={{ maxWidth: '80%', color: 'var(--text-primary)' }}>{q.text}</span>
                    <span style={{
                      fontWeight: 'bold', 
                      color: answer === 'sim' ? 'var(--success)' : answer === 'nao' ? 'var(--danger)' : 'var(--primary-light)',
                      background: 'rgba(0,0,0,0.02)',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {getOptionLabel(answer)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: 'var(--surface-secondary)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--primary)' }}>Recomendação Oficial</h4>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: data.recommendation === 'reject' ? 'var(--danger)' : 'var(--success)' }}>
              {getRecommendationLabel(data.recommendation)}
            </div>
          </div>

          <div style={{ background: 'var(--surface-secondary)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--primary)' }}>Comentários ao Texto</h4>
            <div style={{ fontSize: '0.88rem', fontStyle: 'italic', whiteSpace: 'pre-wrap', background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #e2e8f0', color: 'var(--text-primary)' }}>
              {data.comments || 'Sem comentários adicionais.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
