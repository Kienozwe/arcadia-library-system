// ============================================================
// ARCADIA LMS — App Controller
// ============================================================

const App = (() => {

  // ── Toast ───────────────────────────────────────────────
  const toast = (msg, type = 'info') => {
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const c = document.getElementById('toastContainer');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 300); }, 3200);
  };

  // ── Modal helpers ────────────────────────────────────────
  const openModal = (id) => { const m = document.getElementById(id); if (m) m.classList.add('open'); };
  const closeModal = (id) => { const m = document.getElementById(id); if (m) m.classList.remove('open'); };
  const closeAllModals = () => document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));

  // ── Page routing ─────────────────────────────────────────
  const showSection = (id) => {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const sec = document.getElementById(id);
    if (sec) sec.classList.add('active');
    const nav = document.querySelector(`[data-section="${id}"]`);
    if (nav) nav.classList.add('active');
    // Refresh section content
    if (window.renderSection) renderSection(id);
  };

  // ── Format date ──────────────────────────────────────────
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }) : '—';
  const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-PH', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
  const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };
  const isDue = (d) => d && new Date(d) < new Date();

  // ── Avatar initial ───────────────────────────────────────
  const initials = (name) => name ? name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() : '?';

  // ── Capitalize ───────────────────────────────────────────
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

  // ── Status badge HTML ─────────────────────────────────────
  const statusBadge = (s) => {
    const map = { pending:'badge-pending', approved:'badge-approved', ready:'badge-ready', rejected:'badge-rejected', returned:'badge-returned' };
    const label = { pending:'Pending', approved:'Approved', ready:'Ready for Pickup', rejected:'Rejected', returned:'Returned' };
    return `<span class="badge ${map[s]||''}">${label[s]||cap(s)}</span>`;
  };

  return { toast, openModal, closeModal, closeAllModals, showSection, fmtDate, fmtDateTime, addDays, isDue, initials, statusBadge, cap };
})();

// ============================================================
// AUTH CONTROLLER
// ============================================================
const Auth = (() => {
  const init = () => {
    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
        document.getElementById(tab.dataset.form).classList.remove('hidden');
      });
    });

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', e => { e.preventDefault(); handleLogin(); });

    // Register form
    const regForm = document.getElementById('registerForm');
    if (regForm) regForm.addEventListener('submit', e => { e.preventDefault(); handleRegister(); });
  };

  const handleLogin = () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.querySelector('#loginForm .btn-primary');
    if (!email || !password) { App.toast('Please fill in all fields', 'error'); return; }
    btn.disabled = true; btn.textContent = 'Signing in…';
    setTimeout(() => {
      const user = DB.login(email, password);
      if (user) {
        App.toast(`Welcome back, ${user.name}! 👋`, 'success');
        setTimeout(() => {
          window.location.href = user.role === 'admin' ? 'pages/admin.html' : 'pages/student.html';
        }, 800);
      } else {
        App.toast('Invalid email or password', 'error');
        btn.disabled = false; btn.textContent = 'Sign In';
      }
    }, 600);
  };

  const handleRegister = () => {
    const data = {
      name: document.getElementById('regName').value.trim(),
      email: document.getElementById('regEmail').value.trim(),
      password: document.getElementById('regPassword').value,
      studentId: document.getElementById('regStudentId').value.trim(),
      course: document.getElementById('regCourse').value.trim(),
      yearLevel: document.getElementById('regYearLevel').value,
      address: document.getElementById('regAddress').value.trim(),
      role: 'student'
    };
    for (const [k,v] of Object.entries(data)) {
      if (!v) { App.toast('Please fill in all fields', 'error'); return; }
    }
    const btn = document.querySelector('#registerForm .btn-primary');
    btn.disabled = true; btn.textContent = 'Creating account…';
    setTimeout(() => {
      const user = DB.register(data);
      if (user) {
        App.toast('Account created! Signing you in…', 'success');
        DB.login(data.email, data.password);
        setTimeout(() => { window.location.href = 'pages/student.html'; }, 900);
      } else {
        App.toast('Email already registered', 'error');
        btn.disabled = false; btn.textContent = 'Create Account';
      }
    }, 600);
  };

  return { init };
})();

// ============================================================
// STUDENT DASHBOARD
// ============================================================
const StudentDash = (() => {
  let session = null;
  let activeFilter = 'All';
  let searchQuery = '';
  let selectedBook = null;

  const init = () => {
    session = DB.getSession();
    if (!session || session.role !== 'student') { window.location.href = '../index.html'; return; }

    // Nav
    document.getElementById('userDisplayName').textContent = session.name;
    document.getElementById('userAvatar').textContent = App.initials(session.name);

    document.querySelectorAll('.nav-item[data-section]').forEach(n => {
      n.addEventListener('click', () => { App.showSection(n.dataset.section); closeSidebar(); });
    });

    // Logout
    document.getElementById('btnLogout').addEventListener('click', () => { DB.clearSession(); window.location.href = '../index.html'; });

    // Mobile
    document.getElementById('mobileMenuBtn').addEventListener('click', openSidebar);
    document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

    // Search
    document.getElementById('globalSearch').addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      if (document.getElementById('sec-browse').classList.contains('active')) renderBooks();
    });

    // Borrow modal
    document.getElementById('btnBorrow').addEventListener('click', submitBorrow);
    document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', App.closeAllModals));
    document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) App.closeAllModals(); }));

    // Prefill borrow form
    if (session) {
      document.getElementById('bName').value = session.name || '';
      document.getElementById('bStudentId').value = session.studentId || '';
      document.getElementById('bCourse').value = session.course || '';
      document.getElementById('bYearLevel').value = session.yearLevel || '';
      document.getElementById('bAddress').value = session.address || '';
    }

    window.renderSection = renderSection;
    App.showSection('sec-home');
  };

  const renderSection = (id) => {
    if (id === 'sec-home') renderHome();
    if (id === 'sec-browse') renderBooks();
    if (id === 'sec-requests') renderMyRequests();
  };

  // ── HOME ─────────────────────────────────────────────────
  const renderHome = () => {
    const reqs = DB.getRequestsByUser(session.id);
    document.getElementById('statMyRequests').textContent = reqs.length;
    document.getElementById('statPending').textContent = reqs.filter(r=>r.status==='pending').length;
    document.getElementById('statApproved').textContent = reqs.filter(r=>r.status==='approved'||r.status==='ready').length;
    document.getElementById('statBooks').textContent = DB.getBooks().length;

    // Pending badge in nav
    const pCount = reqs.filter(r=>r.status==='pending').length;
    const badge = document.getElementById('requestsBadge');
    if (badge) { badge.textContent = pCount; badge.style.display = pCount ? '' : 'none'; }

    // Recent requests
    const recent = reqs.slice(-4).reverse();
    const cont = document.getElementById('recentRequests');
    if (!recent.length) { cont.innerHTML = '<div class="empty-state"><div class="empty-icon">📚</div><p>No borrow requests yet</p></div>'; return; }
    cont.innerHTML = recent.map(r => {
      const book = DB.getBookById(r.bookId);
      return `<div class="recent-item">
        <div class="ri-icon" style="background:var(--amber-dim);color:var(--amber)">📖</div>
        <div class="ri-body">
          <div class="ri-title">${book?.title||'Unknown Book'}</div>
          <div class="ri-sub">${App.fmtDate(r.requestedAt)}</div>
        </div>
        ${App.statusBadge(r.status)}
      </div>`;
    }).join('');
  };

  // ── BROWSE BOOKS ─────────────────────────────────────────
  const renderBooks = () => {
    const cats = ['All', ...new Set(DB.getBooks().map(b=>b.category))].sort((a,b)=>a==='All'?-1:b==='All'?1:a.localeCompare(b));
    const chipsEl = document.getElementById('categoryChips');
    chipsEl.innerHTML = cats.map(c => `<span class="chip ${c===activeFilter?'active':''}" data-cat="${c}">${c}</span>`).join('');
    chipsEl.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => { activeFilter = c.dataset.cat; renderBooks(); }));

    let books = DB.getBooks();
    if (activeFilter !== 'All') books = books.filter(b=>b.category===activeFilter);
    if (searchQuery) books = books.filter(b => b.title.toLowerCase().includes(searchQuery) || b.author.toLowerCase().includes(searchQuery) || b.category.toLowerCase().includes(searchQuery));

    const grid = document.getElementById('booksGrid');
    if (!books.length) { grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div><p>No books found</p></div>'; return; }
    grid.innerHTML = books.map(b => `
      <div class="book-card" onclick="StudentDash.openBook(${b.id})">
        <div class="book-cover">
          ${b.cover ? `<img src="${b.cover}" alt="${b.title}" onerror="this.style.display='none'">` : ''}
          <span class="book-cover-placeholder">${b.cover?'':'📚'}</span>
          <span class="book-avail-tag ${b.availableCopies>0?'avail':'unavail'}">${b.availableCopies>0?'Available':'Unavailable'}</span>
        </div>
        <div class="book-info">
          <div class="book-category">${b.category}</div>
          <div class="book-title">${b.title}</div>
          <div class="book-author">${b.author}</div>
          <div class="book-copies">${b.availableCopies}/${b.totalCopies} copies available</div>
        </div>
      </div>`).join('');
  };

  const openBook = (id) => {
    selectedBook = DB.getBookById(id);
    if (!selectedBook) return;
    document.getElementById('modalBookTitle').textContent = selectedBook.title;
    document.getElementById('modalBookAuthor').textContent = selectedBook.author;
    document.getElementById('modalBookCategory').textContent = selectedBook.category;
    document.getElementById('modalBookISBN').textContent = selectedBook.isbn;
    document.getElementById('modalBookCopies').textContent = `${selectedBook.availableCopies} of ${selectedBook.totalCopies} available`;
    document.getElementById('modalBookDesc').textContent = selectedBook.description;
    if (selectedBook.cover) { document.getElementById('modalBookCover').src = selectedBook.cover; document.getElementById('modalBookCover').onerror = function(){this.style.display='none'}; }
    const borrowBtn = document.getElementById('btnBorrow');
    borrowBtn.disabled = selectedBook.availableCopies < 1;
    borrowBtn.textContent = selectedBook.availableCopies < 1 ? 'Not Available' : 'Request to Borrow';
    App.openModal('bookDetailModal');
  };

  const submitBorrow = () => {
    if (!selectedBook) return;
    const data = {
      bookId: selectedBook.id,
      userId: session.id,
      studentName: document.getElementById('bName').value.trim(),
      studentId: document.getElementById('bStudentId').value.trim(),
      yearLevel: document.getElementById('bYearLevel').value.trim(),
      course: document.getElementById('bCourse').value.trim(),
      address: document.getElementById('bAddress').value.trim(),
    };
    for (const [k,v] of Object.entries(data)) {
      if (!v && k !== 'userId') { App.toast('Please fill in all borrower fields', 'error'); return; }
    }
    // Check existing active request for this book
    const existing = DB.getRequestsByUser(session.id).find(r => r.bookId === selectedBook.id && ['pending','approved','ready'].includes(r.status));
    if (existing) { App.toast('You already have an active request for this book', 'warning'); return; }
    DB.addRequest(data);
    App.closeAllModals();
    App.toast('Borrow request submitted successfully! ✓', 'success');
    renderMyRequests();
    renderHome();
  };

  // ── MY REQUESTS ───────────────────────────────────────────
  const renderMyRequests = () => {
    const reqs = DB.getRequestsByUser(session.id).reverse();
    const cont = document.getElementById('myRequestsList');
    if (!reqs.length) { cont.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>No borrow requests yet.<br>Browse books and request to borrow!</p></div>'; return; }
    cont.innerHTML = reqs.map(r => {
      const book = DB.getBookById(r.bookId);
      return `<div class="request-card">
        ${book?.cover ? `<img class="request-card-cover" src="${book.cover}" onerror="this.style.display='none'" alt="">` : `<div class="request-card-cover" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem">📚</div>`}
        <div class="request-card-info">
          <h4>${book?.title||'Unknown Book'}</h4>
          <p>${book?.author||''} &nbsp;·&nbsp; ${book?.category||''}</p>
          <p style="margin-top:0.4rem;font-size:0.78rem;color:var(--text-muted)">Requested: ${App.fmtDate(r.requestedAt)}</p>
          ${r.dueDate ? `<p class="${App.isDue(r.dueDate)?'due-warning':'due-ok'}">Due: ${App.fmtDate(r.dueDate)}${App.isDue(r.dueDate)?'  ⚠ Overdue':''}</p>` : ''}
          ${r.adminNote ? `<p style="font-size:0.78rem;color:var(--text-secondary);margin-top:0.3rem;font-style:italic">Note: ${r.adminNote}</p>` : ''}
        </div>
        <div class="request-card-status">
          ${App.statusBadge(r.status)}
        </div>
      </div>`;
    }).join('');
  };

  const openSidebar = () => { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebarOverlay').classList.add('open'); };
  const closeSidebar = () => { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('open'); };

  return { init, openBook, renderSection };
})();

// ============================================================
// ADMIN DASHBOARD
// ============================================================
const AdminDash = (() => {
  let session = null;
  let editBookId = null;
  let filterStatus = 'all';
  let bookSearch = '';

  const init = () => {
    session = DB.getSession();
    if (!session || session.role !== 'admin') { window.location.href = '../index.html'; return; }

    document.getElementById('adminDisplayName').textContent = session.name;
    document.getElementById('adminAvatar').textContent = App.initials(session.name);

    document.querySelectorAll('.nav-item[data-section]').forEach(n => {
      n.addEventListener('click', () => { App.showSection(n.dataset.section); closeSidebar(); });
    });

    document.getElementById('btnLogoutAdmin').addEventListener('click', () => { DB.clearSession(); window.location.href = '../index.html'; });

    document.getElementById('mobileMenuBtn').addEventListener('click', openSidebar);
    document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

    // Book form
    document.getElementById('bookForm').addEventListener('submit', e => { e.preventDefault(); saveBook(); });

    // Modal closes
    document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', App.closeAllModals));
    document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) App.closeAllModals(); }));

    // Add book btn
    document.getElementById('btnAddBook').addEventListener('click', () => openBookForm(null));
    document.getElementById('btnAddBookTop').addEventListener('click', () => { openBookForm(null); App.showSection('sec-books'); });

    // Request filter
    document.getElementById('requestFilter').addEventListener('change', e => { filterStatus = e.target.value; renderRequests(); });

    // Book search
    document.getElementById('adminBookSearch').addEventListener('input', e => { bookSearch = e.target.value.toLowerCase(); renderBooksTable(); });

    window.renderSection = renderSection;
    App.showSection('sec-dashboard');
  };

  const renderSection = (id) => {
    if (id === 'sec-dashboard') renderDashboard();
    if (id === 'sec-requests') renderRequests();
    if (id === 'sec-books') renderBooksTable();
    if (id === 'sec-users') renderUsers();
    if (id === 'sec-schema') {}
  };

  // ── DASHBOARD ─────────────────────────────────────────────
  const renderDashboard = () => {
    const books = DB.getBooks();
    const reqs = DB.getRequests();
    document.getElementById('dTotalBooks').textContent = books.length;
    document.getElementById('dAvailBooks').textContent = books.filter(b=>b.availableCopies>0).length;
    document.getElementById('dPending').textContent = reqs.filter(r=>r.status==='pending').length;
    document.getElementById('dBorrowed').textContent = reqs.filter(r=>r.status==='approved'||r.status==='ready').length;
    document.getElementById('dTotalStudents').textContent = DB.getUsers().filter(u=>u.role==='student').length;

    const badge = document.getElementById('requestsBadge');
    const pCount = reqs.filter(r=>r.status==='pending').length;
    if (badge) { badge.textContent = pCount; badge.style.display = pCount ? '' : 'none'; }

    // Recent requests
    const recent = [...reqs].reverse().slice(0,5);
    document.getElementById('recentRequestsTable').innerHTML = recent.length
      ? recent.map(r => {
          const book = DB.getBookById(r.bookId);
          return `<tr>
            <td>${r.studentName}</td>
            <td>${book?.title||'—'}</td>
            <td>${App.fmtDate(r.requestedAt)}</td>
            <td>${App.statusBadge(r.status)}</td>
            <td class="td-actions">
              ${r.status==='pending'?`<button class="btn btn-success btn-sm" onclick="AdminDash.approveRequest(${r.id})">Approve</button><button class="btn btn-danger btn-sm" onclick="AdminDash.rejectRequest(${r.id})">Reject</button>`:''}
              ${r.status==='approved'?`<button class="btn btn-teal btn-sm" onclick="AdminDash.markReady(${r.id})">Mark Ready</button>`:''}
            </td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem">No requests yet</td></tr>`;
  };

  // ── REQUESTS ──────────────────────────────────────────────
  const renderRequests = () => {
    let reqs = DB.getRequests();
    if (filterStatus !== 'all') reqs = reqs.filter(r=>r.status===filterStatus);
    reqs = [...reqs].reverse();
    document.getElementById('requestsTable').innerHTML = reqs.length
      ? reqs.map(r => {
          const book = DB.getBookById(r.bookId);
          return `<tr>
            <td><strong>${r.studentName}</strong><br><span style="font-size:0.75rem;color:var(--text-muted)">${r.studentId}</span></td>
            <td>${r.yearLevel}<br><span style="font-size:0.75rem;color:var(--text-muted)">${r.course}</span></td>
            <td>${book?.title||'—'}<br><span style="font-size:0.75rem;color:var(--text-muted)">${book?.author||''}</span></td>
            <td>${App.fmtDate(r.requestedAt)}</td>
            <td>${r.dueDate ? `<span class="${App.isDue(r.dueDate)?'due-warning':'due-ok'}">${App.fmtDate(r.dueDate)}</span>` : '—'}</td>
            <td>${App.statusBadge(r.status)}</td>
            <td class="td-actions">
              ${r.status==='pending'?`<button class="btn btn-success btn-sm" onclick="AdminDash.approveRequest(${r.id})">✓ Approve</button><button class="btn btn-danger btn-sm" onclick="AdminDash.rejectRequest(${r.id})">✕ Reject</button>`:''}
              ${r.status==='approved'?`<button class="btn btn-teal btn-sm" onclick="AdminDash.markReady(${r.id})">📦 Ready</button>`:''}
              ${r.status==='ready'?`<button class="btn btn-secondary btn-sm" onclick="AdminDash.markReturned(${r.id})">↩ Returned</button>`:''}
            </td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem">No requests found</td></tr>`;
  };

  const approveRequest = (id) => {
    const dueDate = App.addDays(new Date().toISOString(), 14);
    DB.updateRequest(id, { status: 'approved', dueDate });
    App.toast('Request approved — due in 14 days', 'success');
    renderRequests(); renderDashboard();
  };

  const rejectRequest = (id) => {
    const req = DB.getRequestById(id);
    if (!req) return;
    DB.updateRequest(id, { status: 'rejected' });
    // Restore copy
    const book = DB.getBookById(req.bookId);
    if (book) DB.updateBook(book.id, { availableCopies: book.availableCopies + 1 });
    App.toast('Request rejected', 'error');
    renderRequests(); renderDashboard();
  };

  const markReady = (id) => {
    DB.updateRequest(id, { status: 'ready' });
    App.toast('Marked as Ready for Pickup 📦', 'info');
    renderRequests(); renderDashboard();
  };

  const markReturned = (id) => {
    const req = DB.getRequestById(id);
    if (!req) return;
    DB.updateRequest(id, { status: 'returned', returnedAt: new Date().toISOString().split('T')[0] });
    // Restore copy
    const book = DB.getBookById(req.bookId);
    if (book) DB.updateBook(book.id, { availableCopies: book.availableCopies + 1 });
    App.toast('Book marked as returned ↩', 'success');
    renderRequests(); renderDashboard();
  };

  // ── BOOKS MANAGEMENT ──────────────────────────────────────
  const renderBooksTable = () => {
    let books = DB.getBooks();
    if (bookSearch) books = books.filter(b => b.title.toLowerCase().includes(bookSearch) || b.author.toLowerCase().includes(bookSearch) || b.category.toLowerCase().includes(bookSearch));
    document.getElementById('booksTable').innerHTML = books.length
      ? books.map(b => {
          const pct = b.totalCopies > 0 ? (b.availableCopies/b.totalCopies)*100 : 0;
          return `<tr>
            <td>${b.cover?`<img class="book-thumb" src="${b.cover}" onerror="this.style.display='none'" alt="">`:''}</td>
            <td><strong>${b.title}</strong></td>
            <td>${b.author}</td>
            <td>${b.category}</td>
            <td style="font-family:var(--font-mono);font-size:0.78rem">${b.isbn}</td>
            <td>
              <div style="font-size:0.8rem">${b.availableCopies}/${b.totalCopies}</div>
              <div class="avail-bar"><div class="avail-bar-fill" style="width:${pct}%"></div></div>
            </td>
            <td>${b.availableCopies>0?'<span class="badge badge-available">Available</span>':'<span class="badge badge-unavailable">Unavailable</span>'}</td>
            <td class="td-actions">
              <button class="btn btn-secondary btn-sm" onclick="AdminDash.openBookForm(${b.id})">✏ Edit</button>
              <button class="btn btn-danger btn-sm" onclick="AdminDash.deleteBook(${b.id})">🗑</button>
            </td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:2rem">No books found</td></tr>`;
  };

  const openBookForm = (id) => {
    editBookId = id;
    const form = document.getElementById('bookForm');
    form.reset();
    document.getElementById('bookFormTitle').textContent = id ? 'Edit Book' : 'Add New Book';
    if (id) {
      const b = DB.getBookById(id);
      if (b) {
        document.getElementById('bfTitle').value = b.title;
        document.getElementById('bfAuthor').value = b.author;
        document.getElementById('bfCategory').value = b.category;
        document.getElementById('bfISBN').value = b.isbn;
        document.getElementById('bfDescription').value = b.description;
        document.getElementById('bfCover').value = b.cover||'';
        document.getElementById('bfCopies').value = b.totalCopies;
      }
    }
    App.openModal('bookFormModal');
  };

  const saveBook = () => {
    const data = {
      title: document.getElementById('bfTitle').value.trim(),
      author: document.getElementById('bfAuthor').value.trim(),
      category: document.getElementById('bfCategory').value.trim(),
      isbn: document.getElementById('bfISBN').value.trim(),
      description: document.getElementById('bfDescription').value.trim(),
      cover: document.getElementById('bfCover').value.trim(),
      totalCopies: parseInt(document.getElementById('bfCopies').value)||1,
    };
    if (!data.title || !data.author) { App.toast('Title and Author are required', 'error'); return; }
    if (editBookId) {
      const current = DB.getBookById(editBookId);
      const diff = data.totalCopies - current.totalCopies;
      DB.updateBook(editBookId, { ...data, availableCopies: Math.max(0, current.availableCopies + diff) });
      App.toast('Book updated successfully', 'success');
    } else {
      DB.addBook(data);
      App.toast('New book added to library 📚', 'success');
    }
    App.closeAllModals();
    renderBooksTable();
    renderDashboard();
  };

  const deleteBook = (id) => {
    if (!confirm('Delete this book? This cannot be undone.')) return;
    DB.deleteBook(id);
    App.toast('Book removed from library', 'warning');
    renderBooksTable(); renderDashboard();
  };

  // ── USERS ─────────────────────────────────────────────────
  const renderUsers = () => {
    const users = DB.getUsers().filter(u=>u.role==='student');
    document.getElementById('usersTable').innerHTML = users.length
      ? users.map(u => {
          const reqs = DB.getRequestsByUser(u.id);
          return `<tr>
            <td><div style="display:flex;align-items:center;gap:0.75rem"><div class="user-avatar" style="flex-shrink:0">${App.initials(u.name)}</div><div><div style="font-weight:600">${u.name}</div><div style="font-size:0.75rem;color:var(--text-secondary)">${u.email}</div></div></div></td>
            <td style="font-family:var(--font-mono);font-size:0.8rem">${u.studentId||'—'}</td>
            <td>${u.course||'—'}</td>
            <td>${u.yearLevel||'—'}</td>
            <td>${reqs.length}</td>
            <td>${reqs.filter(r=>['approved','ready'].includes(r.status)).length}</td>
            <td>${App.fmtDate(u.createdAt)}</td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem">No students registered</td></tr>`;
  };

  const openSidebar = () => { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebarOverlay').classList.add('open'); };
  const closeSidebar = () => { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('open'); };

  return { init, approveRequest, rejectRequest, markReady, markReturned, openBookForm, deleteBook, renderSection };
})();
