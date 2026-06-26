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
  Trash2
} from 'lucide-react';

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



  const fetchUserProfile = async (authToken) => {
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
        // Set default dashboard view depending on role
        if (data.role === 'admin') setDashboardSubView('admin-metrics');
        else if (data.role === 'evaluator') setDashboardSubView('evaluator-reviews');
        else setDashboardSubView('participant-events');
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
        <div className="logo-container" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <BookOpen size={24} />
          <span>G-TERCOA <span style={{ color: 'var(--accent-light)', fontWeight: 500 }}>Eventos</span></span>
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
        <p>&copy; {new Date().getFullYear()} G-TERCOA - Grupo de Estudo e Pesquisa em Educação Matemática e Pedagogia.</p>
        <p style={{ fontSize: '0.75rem', marginTop: '6px' }}>Plataforma integrada inspirada na arquitetura multi-tenant Even3.</p>
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
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '15px' }}>Plataforma de Eventos Acadêmicos G-TERCOA</h1>
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
  
  // Submission Form State
  const [subTitle, setSubTitle] = useState('');
  const [subAuthors, setSubAuthors] = useState('');
  const [subAffiliation, setSubAffiliation] = useState('');
  const [subAxis, setSubAxis] = useState('');
  const [submittingWork, setSubmittingWork] = useState(false);

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
    if (!subTitle || !subAuthors || !subAffiliation || !subAxis || !submissionFile) {
      showToast('Preencha todos os campos e anexe o arquivo', 'danger');
      return;
    }

    setSubmittingWork(true);
    const formData = new FormData();
    formData.append('title', subTitle);
    formData.append('authors', subAuthors);
    formData.append('affiliation', subAffiliation);
    formData.append('thematic_axis', subAxis);
    formData.append('file', submissionFile);

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
        setSubAuthors('');
        setSubAffiliation('');
        setSubAxis('');
        setSubmissionFile(null);
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
        {checkingReg ? null : isRegistered ? (
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'inline-block', width: '4px', height: '22px', background: '#f59e0b', borderRadius: '2px' }} />
              Submissão de Trabalhos
            </h2>
            <div className="glass-card">
              <div className="abnt-warning-box" style={{ marginBottom: '20px' }}>
                <h4><Info size={18} /> Atenção às Normas da ABNT</h4>
                <p>Todos os resumos e artigos devem estar formatados conforme as diretrizes da ABNT (NBR 6023, NBR 10520). Trabalhos fora das normas serão rejeitados pela comissão examinadora.</p>
              </div>
              {event.submission_rules && (
                <div style={{ background: 'var(--surface-secondary)', padding: '14px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.88rem', whiteSpace: 'pre-wrap' }}>
                  <strong>Regras deste Evento:</strong><br />{event.submission_rules}
                </div>
              )}
              <form onSubmit={handleWorkSubmission}>
                <div className="form-group">
                  <label className="form-label">Título do Trabalho *</label>
                  <input type="text" className="form-input" placeholder="Título completo" required value={subTitle} onChange={(e) => setSubTitle(e.target.value)} />
                </div>
                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="form-label">Coautores (opcional)</label>
                    <input type="text" className="form-input" placeholder="Maria Silva, João Souza" value={subAuthors} onChange={(e) => setSubAuthors(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Filiação Institucional *</label>
                    <input type="text" className="form-input" placeholder="UFC, UECE, IFCE" required value={subAffiliation} onChange={(e) => setSubAffiliation(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Eixo Temático *</label>
                  <select className="form-select" required value={subAxis} onChange={(e) => setSubAxis(e.target.value)}>
                    <option value="">Selecione o eixo...</option>
                    {event.thematic_axes.map((axis, i) => <option key={i} value={axis}>{axis}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Arquivo (PDF/Word) *</label>
                  <div style={{ border: '2px dashed var(--border)', borderRadius: '8px', padding: '28px', textAlign: 'center', cursor: 'pointer', background: submissionFile ? 'rgba(5,150,105,0.05)' : 'transparent', borderColor: submissionFile ? 'var(--success)' : 'var(--border)', transition: 'all 0.2s' }} onClick={() => document.getElementById('file-upload-input').click()}>
                    <Upload size={28} style={{ color: submissionFile ? 'var(--success)' : 'var(--text-muted)', marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.9rem', fontWeight: 500, margin: '0 0 4px' }}>{submissionFile ? submissionFile.name : 'Clique para selecionar o arquivo'}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF ou Word · Máximo 10MB</span>
                    <input type="file" id="file-upload-input" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={(e) => setSubmissionFile(e.target.files[0])} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '13px' }} disabled={submittingWork}>
                  {submittingWork ? 'Submetendo...' : 'Enviar Trabalho para Avaliação'}
                </button>
              </form>
            </div>
          </section>
        ) : null}

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
function DashboardRouter({ user, token, subView, setSubView, showToast }) {
  return (
    <div className="dashboard-grid">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px', padding: '0 10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justify: 'center', fontWeight: 'bold' }}>
            {user.name.charAt(0)}
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{user.name}</h4>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'capitalize' }}>Painel {user.role}</span>
          </div>
        </div>

        {/* Dynamic Sidebar Links depending on Role */}
        {user.role === 'admin' && (
          <>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', margin: '15px 10px 5px' }}>Comissão</div>
            <a href="#" className={`sidebar-link ${subView === 'admin-metrics' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setSubView('admin-metrics'); }}>
              <LayoutDashboard size={18} /> Métrica Geral
            </a>
            <a href="#" className={`sidebar-link ${subView === 'admin-events' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setSubView('admin-events'); }}>
              <Calendar size={18} /> Workspace Eventos
            </a>
          </>
        )}
 
        {(user.role === 'evaluator' || user.role === 'admin') && (
          <>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', margin: '15px 10px 5px' }}>Comissão Científica</div>
            {user.role === 'evaluator' && (
              <a href="#" className={`sidebar-link ${subView === 'evaluator-reviews' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setSubView('evaluator-reviews'); }}>
                <FileText size={18} /> Avaliar Trabalhos
              </a>
            )}
            <a href="#" className={`sidebar-link ${subView === 'coordinator-submissions' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setSubView('coordinator-submissions'); }}>
              <Users size={18} /> Coordenação de Eixos
            </a>
          </>
        )}
 
        {/* All users have access to Participant section */}
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', margin: '15px 10px 5px' }}>Participante</div>
        <a href="#" className={`sidebar-link ${subView === 'participant-events' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setSubView('participant-events'); }}>
          <Calendar size={18} /> Minhas Inscrições
        </a>
        <a href="#" className={`sidebar-link ${subView === 'participant-submissions' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setSubView('participant-submissions'); }}>
          <FileText size={18} /> Minhas Submissões
        </a>
        <a href="#" className={`sidebar-link ${subView === 'participant-certificates' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setSubView('participant-certificates'); }}>
          <Award size={18} /> Meus Certificados
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
        {subView === 'admin-events' && <AdminEventsView token={token} showToast={showToast} />}
      </section>
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
      const res = await fetch(`http://localhost:5000/api/events/${reg.event_id}/my-frequency`, {
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
                    {sub.review_comments ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{sub.review_comments}</span>
                    ) : (
                      <span style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sem comentários adicionais.</span>
                    )}
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
      'guest': 'Convidado / Palestrante'
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

  useEffect(() => {
    fetchSubmissionsToReview();
  }, []);

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
    if (!status) {
      showToast('Selecione o status do parecer', 'danger');
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
        body: JSON.stringify({ status, review_comments: comments })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Parecer acadêmico enviado com sucesso!');
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
            <div className="form-group">
              <label className="form-label">Resultado da Avaliação *</label>
              <select className="form-select" required value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Selecione...</option>
                <option value="accepted">Aceito</option>
                <option value="accepted_with_remarks">Aceito com Ressalvas</option>
                <option value="rejected">Rejeitado</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Justificativa e Comentários Acadêmicos *</label>
              <textarea 
                className="form-input" 
                style={{ minHeight: '100px' }} 
                placeholder="Insira as correções necessárias, sugestões de ABNT e notas detalhadas de revisão..."
                required
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
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
                <th>Data de Envio</th>
                <th>Status Atual</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => (
                <tr key={sub.id}>
                  <td>{sub.event_name}</td>
                  <td style={{ fontWeight: 600 }}>{sub.title}</td>
                  <td>{sub.thematic_axis}</td>
                  <td>{new Date(sub.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <span className={`badge ${
                      sub.status === 'under_review' ? 'badge-warning' : sub.status === 'accepted' ? 'badge-success' : sub.status === 'rejected' ? 'badge-danger' : 'badge-primary'
                    }`}>
                      {sub.status === 'under_review' ? 'Sob Avaliação' : sub.status}
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
  const [isAssigning, setIsAssigning] = useState(false);

  // Final decision form state
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [finalStatus, setFinalStatus] = useState('');
  const [finalComments, setFinalComments] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

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

  const openAssignModal = (sub) => {
    setSelectedSub(sub);
    setSelectedReviewerId(sub.reviewer_id || '');
    fetchEventEvaluators(sub.event_id);
    setShowAssignModal(true);
  };

  const handleAssignReviewer = async (e) => {
    e.preventDefault();
    if (!selectedReviewerId) {
      showToast('Selecione um avaliador', 'danger');
      return;
    }
    setIsAssigning(true);
    try {
      const res = await fetch(`${API_URL}/api/submissions/${selectedSub.id}/assign-evaluator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reviewer_id: selectedReviewerId })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Avaliador alocado com sucesso!');
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
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Alocar Avaliador</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              <strong>Artigo:</strong> {selectedSub.title}<br />
              <strong>Eixo:</strong> {selectedSub.thematic_axis}
            </p>
            <form onSubmit={handleAssignReviewer}>
              <div className="form-group">
                <label className="form-label">Selecionar Avaliador *</label>
                {loadingEvaluators ? (
                  <div>Carregando avaliadores do evento...</div>
                ) : evaluatorsList.length === 0 ? (
                  <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>Nenhum avaliador geral cadastrado para este evento. Adicione avaliadores na tela do Admin.</div>
                ) : (
                  <select 
                    className="form-select" 
                    required 
                    value={selectedReviewerId} 
                    onChange={(e) => setSelectedReviewerId(e.target.value)}
                  >
                    <option value="">Selecione...</option>
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
          <div className="glass-card" style={{ width: '550px', padding: '30px', animation: 'modalEnter 0.25s ease-out' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Decisão Final da Coordenação</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              <strong>Artigo:</strong> {selectedSub.title}<br />
              <strong>Eixo:</strong> {selectedSub.thematic_axis}<br />
              <strong>Parecerista Designado:</strong> {selectedSub.reviewer_name || 'Nenhum'}
            </p>
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
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Evento</th>
                <th>Título do Artigo</th>
                <th>Eixo Temático</th>
                <th>Avaliador Técnico</th>
                <th>Status</th>
                <th>Parecer Final</th>
                <th style={{ width: '220px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => (
                <tr key={sub.id}>
                  <td>{sub.event_name}</td>
                  <td style={{ fontWeight: 600 }}>{sub.title}</td>
                  <td>{sub.thematic_axis}</td>
                  <td>
                    {sub.reviewer_name ? (
                      <span style={{ fontWeight: 'bold', color: 'var(--primary-light)' }}>{sub.reviewer_name}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Não designado</span>
                    )}
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
                      <a href={`${API_URL}${sub.file_path}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block' }}>
                        Documento
                      </a>
                      <button className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.78rem' }} onClick={() => openAssignModal(sub)}>
                        Alocar
                      </button>
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
function AdminEventsView({ token, showToast }) {
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

  // Incremental configurations
  const [bannerUrl, setBannerUrl] = useState('');
  const [workloadHours, setWorkloadHours] = useState('20');
  const [transmissionLink, setTransmissionLink] = useState('');
  const [thematicAxes, setThematicAxes] = useState('');
  const [submissionRules, setSubmissionRules] = useState('');
  const [submissionsEnabled, setSubmissionsEnabled] = useState(1);

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
        setEvents(data);
        
        // If an event is selected, keep it updated
        if (selectedEventForManagement) {
          const current = data.find(ev => ev.id === selectedEventForManagement.id);
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
    setWorkspaceTab('basic');

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

    setWorkloadHours(ev.workload_hours ? ev.workload_hours.toString() : '20');
    setTransmissionLink(ev.transmission_link || '');
    setThematicAxes(ev.thematic_axes ? ev.thematic_axes.join(', ') : '');
    setSubmissionRules(ev.submission_rules || '');
    setSubmissionsEnabled(ev.submissions_enabled !== undefined ? ev.submissions_enabled : 1);

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

    // Fetch lists
    fetchCertificates(ev.id);
    fetchRegistrations(ev.id);
    fetchSubmissions(ev.id);
    fetchAssignments(ev.id);
    fetchSystemUsers();
    fetchEvaluatorsPool();
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
      thematic_axes: overrides.thematic_axes !== undefined ? overrides.thematic_axes : thematicAxes.split(',').map(axis => axis.trim()).filter(Boolean),
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
      supporters: overrides.supporters !== undefined ? overrides.supporters : supportersList
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
        const updated = { ...selectedEventForManagement, ...payload, guests: JSON.stringify(payload.guests), supporters: JSON.stringify(payload.supporters) };
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
          presentation_title: issueCertType === 'presentation' ? issuePresentationTitle.trim() : null
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
          'Authorization': `Bearer ${token}`
        }
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
        thematic_axes: thematicAxes.split(',').map(axis => axis.trim()).filter(Boolean)
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
            
            <div className="form-group">
              <label className="form-label">Eixos Temáticos (separados por vírgula) *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ex: Alfabetização Matemática, Prática Pedagógica"
                value={thematicAxes}
                onChange={(e) => setThematicAxes(e.target.value)}
              />
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
            <button type="submit" className="btn btn-primary">Salvar Ajustes de Submissão</button>
          </form>
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
    const handleSaveTemplates = async (e) => {
      e.preventDefault();
      await saveEventDetails({
        cert_border_color: certBorderColor,
        cert_signature_name: certSignatureName,
        cert_signature_role: certSignatureRole,
        cert_text_template: certTextTemplate,
        cert_text_organization: certTextOrganization,
        cert_text_presentation: certTextPresentation,
        cert_text_guest: certTextGuest
      });
    };

    const getCertTypeLabel = (t) => {
      const labels = {
        'participation': 'Participação',
        'organization': 'Comissão Organizadora',
        'presentation': 'Apresentação',
        'guest': 'Convidado / Palestrante'
      };
      return labels[t] || t;
    };

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Templates Panel */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Modelos de Certificados</h3>
          
          <form onSubmit={handleSaveTemplates}>
            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '15px' }}>
              <div>
                <label className="form-label">Cor Borda</label>
                <input 
                  type="color" 
                  value={certBorderColor}
                  onChange={(e) => setCertBorderColor(e.target.value)}
                  style={{ width: '100%', height: '36px', padding: '2px', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
                />
              </div>
              <div>
                <label className="form-label">Hexadecimal</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={certBorderColor}
                  onChange={(e) => setCertBorderColor(e.target.value)}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label className="form-label">Assinatura (Nome)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={certSignatureName}
                  onChange={(e) => setCertSignatureName(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Assinatura (Cargo)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={certSignatureRole}
                  onChange={(e) => setCertSignatureRole(e.target.value)}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginTop: '15px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>Personalização de Texto</h4>
              
              <div className="form-group">
                <label className="form-label"><strong>1. Participante</strong></label>
                <textarea 
                  className="form-textarea" 
                  value={certTextTemplate}
                  onChange={(e) => setCertTextTemplate(e.target.value)}
                  style={{ minHeight: '60px', fontSize: '0.85rem' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tags: {`{nome}, {cpf}, {evento}, {periodo}, {carga_horaria}`}</span>
              </div>

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label"><strong>2. Comissão Organizadora</strong></label>
                <textarea 
                  className="form-textarea" 
                  value={certTextOrganization}
                  onChange={(e) => setCertTextOrganization(e.target.value)}
                  style={{ minHeight: '60px', fontSize: '0.85rem' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tags: {`{nome}, {cpf}, {evento}, {periodo}, {carga_horaria}`}</span>
              </div>

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label"><strong>3. Apresentador de Trabalho</strong></label>
                <textarea 
                  className="form-textarea" 
                  value={certTextPresentation}
                  onChange={(e) => setCertTextPresentation(e.target.value)}
                  style={{ minHeight: '60px', fontSize: '0.85rem' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tags: {`{nome}, {cpf}, {evento}, {periodo}, {carga_horaria}, {titulo_trabalho}`}</span>
              </div>

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label"><strong>4. Palestrante / Convidado</strong></label>
                <textarea 
                  className="form-textarea" 
                  value={certTextGuest}
                  onChange={(e) => setCertTextGuest(e.target.value)}
                  style={{ minHeight: '60px', fontSize: '0.85rem' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tags: {`{nome}, {cpf}, {evento}, {periodo}, {carga_horaria}`}</span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>Salvar Templates</button>
          </form>
        </div>

        {/* Issuance and listing Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-card">
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Emissão de Certificados</h3>
            
            {/* Lote / Bulk */}
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '15px', marginBottom: '15px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>A. Emissão Automática em Lote (Participantes Presenciais)</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Emite certificados em massa para os inscritos que tiveram presença confirmada (check-in) e ainda não possuem certificados de participação.
              </p>
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
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Tipo do Certificado</label>
                  <select 
                    className="form-select"
                    value={issueCertType}
                    onChange={(e) => {
                      setIssueCertType(e.target.value);
                      if (e.target.value === 'presentation') {
                        setIssueWorkload('10');
                      } else {
                        setIssueWorkload(selectedEventForManagement.workload_hours.toString());
                      }
                    }}
                    style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                  >
                    <option value="organization">Organização (Comissão)</option>
                    <option value="presentation">Apresentação de Trabalho</option>
                    <option value="guest">Convidado / Palestrante</option>
                    <option value="participation">Participante Individual</option>
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

                {issueCertType === 'presentation' && (
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
                <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Inscrito</th>
                      <th>Tipo</th>
                      <th>Carga</th>
                      <th>PDF</th>
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
                          <span className={`badge ${c.type === 'participation' ? 'badge-primary' : c.type === 'organization' ? 'badge-success' : c.type === 'presentation' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                            {getCertTypeLabel(c.type)}
                          </span>
                        </td>
                        <td>{c.workload_hours}h</td>
                        <td>
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
        evaluatorsPool={evaluatorsPool}
      />
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
          <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', overflowX: 'auto' }}>
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
            <button 
              style={{
                ...tabStyle(workspaceTab === 'delete'),
                color: workspaceTab === 'delete' ? '#ef4444' : 'var(--text-secondary)'
              }}
              onClick={() => setWorkspaceTab('delete')}
            >
              <Trash2 size={16} /> Excluir Evento
            </button>
          </div>

          {/* Tab content */}
          <div style={{ marginTop: '10px' }}>
            {workspaceTab === 'basic' && renderBasicInfoTab()}
            {workspaceTab === 'guests' && renderGuestsTab()}
            {workspaceTab === 'activities' && renderActivitiesTab()}
            {workspaceTab === 'submissions' && renderSubmissionsTab()}
            {workspaceTab === 'checkin' && renderCheckinTab()}
            {workspaceTab === 'assignments' && renderAssignmentsTab()}
            {workspaceTab === 'certificates' && renderCertificatesTab()}
            {workspaceTab === 'delete' && renderDeleteEventTab()}
          </div>
        </div>
      ) : (
        // Grid of events & Creation Form
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '30px' }}>
          
          {/* Create simple event */}
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
  evaluatorsPool
}) {
  const [selectedUser, setSelectedUser] = useState('');
  const [assignedRole, setAssignedRole] = useState('evaluator');
  const [selectedAxis, setSelectedAxis] = useState('');
  const [isAssigningUser, setIsAssigningUser] = useState(false);
  const [assignmentToDeleteId, setAssignmentToDeleteId] = useState(null);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!selectedUser || !assignedRole) {
      showToast('Selecione o avaliador e o papel', 'danger');
      return;
    }
    if (assignedRole === 'coordinator' && !selectedAxis) {
      showToast('Selecione o eixo para o coordenador', 'danger');
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
          axis: assignedRole === 'coordinator' ? selectedAxis : null
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '30px' }}>
      <div className="glass-card" style={{ height: 'fit-content' }}>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Designar Membro da Comissão</h3>
        
        <form onSubmit={handleCreateAssignment}>
          <div className="form-group">
            <label className="form-label">Selecionar Avaliador *</label>
            <select 
              className="form-select" 
              required 
              value={selectedUser} 
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Selecione um avaliador cadastrado...</option>
              {evaluatorsPool.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Papel na Comissão *</label>
            <select 
              className="form-select" 
              required 
              value={assignedRole} 
              onChange={(e) => {
                setAssignedRole(e.target.value);
                if (e.target.value !== 'coordinator') setSelectedAxis('');
              }}
            >
              <option value="evaluator">Avaliador (Geral)</option>
              <option value="coordinator">Coordenador de Eixo</option>
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

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isAssigningUser}>
            {isAssigningUser ? 'Processando...' : 'Designar Membro'}
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Coordenadores de Eixos Designados</h3>
          {coordinators.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Nenhum coordenador designado para este evento.</p>
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

        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '16px' }}>Avaliadores Gerais Designados</h3>
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
        
        <style dangerouslySetInnerHTML={{__html: `
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

          <style dangerouslySetInnerHTML={{__html: `
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

  const handleAssignReviewer = async (subId, reviewerId) => {
    if (!reviewerId) return;
    try {
      const res = await fetch(`${API_URL}/api/submissions/${subId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reviewer_id: reviewerId })
      });

      if (res.ok) {
        showToast('Avaliador alocado com sucesso!');
        fetchSubmissions(selectedEventId);
      } else {
        showToast('Erro ao alocar avaliador', 'danger');
      }
    } catch (err) {
      console.error(err);
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
              <th>Avaliador Alocado</th>
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
                    <div>
                      <a href={`${API_URL}${sub.file_path}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', textDecoration: 'underline' }}>
                        Baixar Artigo (PDF/Word)
                      </a>
                    </div>
                  </td>
                  <td>{sub.submitter_name}</td>
                  <td><span className="badge badge-primary">{sub.thematic_axis}</span></td>
                  <td>
                    <select 
                      className="form-select" 
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      value={sub.reviewer_id || ''}
                      onChange={(e) => handleAssignReviewer(sub.id, e.target.value)}
                    >
                      <option value="">Designar Avaliador...</option>
                      {evaluators.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${
                      sub.status === 'under_review' ? 'badge-warning' : sub.status === 'accepted' ? 'badge-success' : sub.status === 'rejected' ? 'badge-danger' : 'badge-primary'
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
        <div className="modal-header">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>Entrar na Plataforma</h3>
          <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }} onClick={onClose}>&times;</button>
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
              <strong>Dica de Acesso:</strong> Acesse com o e-mail do administrador <code>tercoa.monitoria@gmail.com</code> e senha <code>G-tercoaufc@2024</code>.
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
        <div className="modal-header">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>Criar Conta de Acesso</h3>
          <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }} onClick={onClose}>&times;</button>
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
  
  // Guest list state for the new activity
  const [guests, setGuests] = useState([]);
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [activityToDeleteId, setActivityToDeleteId] = useState(null);

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
      transmission_link: transmissionLink
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
