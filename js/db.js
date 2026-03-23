// ============================================================
// LMS Database — localStorage-backed in-memory store
// Simulates MySQL tables: users, books, borrow_requests
// ============================================================

const DB = (() => {
  const KEYS = { users: 'lms_users', books: 'lms_books', requests: 'lms_requests', session: 'lms_session' };

  const defaults = {
    users: [
      { id: 1, name: 'Admin User', email: 'admin@library.edu', password: 'admin123', role: 'admin', studentId: null, course: null, yearLevel: null, address: null, createdAt: '2025-01-01' },
      { id: 2, name: 'Juan dela Cruz', email: 'juan@student.edu', password: 'student123', role: 'student', studentId: '2024-00123', course: 'BS Computer Science', yearLevel: '3rd Year', address: '123 Rizal St, Davao City', createdAt: '2025-01-10' },
      { id: 3, name: 'Maria Santos', email: 'maria@student.edu', password: 'student123', role: 'student', studentId: '2024-00456', course: 'BS Information Technology', yearLevel: '2nd Year', address: '456 Mabini Ave, Davao City', createdAt: '2025-01-15' },
    ],
    books: [
      { id: 1, title: 'Clean Code', author: 'Robert C. Martin', category: 'Technology', isbn: '9780132350884', description: 'A handbook of agile software craftsmanship. Learn how to write clean, readable, maintainable code.', cover: 'https://covers.openlibrary.org/b/isbn/9780132350884-M.jpg', totalCopies: 3, availableCopies: 2, addedAt: '2025-01-05' },
      { id: 2, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Fiction', isbn: '9780743273565', description: 'A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.', cover: 'https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg', totalCopies: 5, availableCopies: 5, addedAt: '2025-01-05' },
      { id: 3, title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', category: 'Technology', isbn: '9780262033848', description: 'A comprehensive introduction to the modern study of computer algorithms.', cover: 'https://covers.openlibrary.org/b/isbn/9780262033848-M.jpg', totalCopies: 2, availableCopies: 0, addedAt: '2025-01-06' },
      { id: 4, title: 'Sapiens', author: 'Yuval Noah Harari', category: 'History', isbn: '9780062316097', description: 'A brief history of humankind from the Stone Age to the present.', cover: 'https://covers.openlibrary.org/b/isbn/9780062316097-M.jpg', totalCopies: 4, availableCopies: 3, addedAt: '2025-01-07' },
      { id: 5, title: 'Atomic Habits', author: 'James Clear', category: 'Self-Help', isbn: '9780735211292', description: 'An easy and proven way to build good habits and break bad ones.', cover: 'https://covers.openlibrary.org/b/isbn/9780735211292-M.jpg', totalCopies: 6, availableCopies: 4, addedAt: '2025-01-08' },
      { id: 6, title: 'The Art of War', author: 'Sun Tzu', category: 'Philosophy', isbn: '9780140439199', description: 'An ancient Chinese military treatise dating from the 5th century BC.', cover: 'https://covers.openlibrary.org/b/isbn/9780140439199-M.jpg', totalCopies: 3, availableCopies: 3, addedAt: '2025-01-09' },
      { id: 7, title: 'Design Patterns', author: 'Gang of Four', category: 'Technology', isbn: '9780201633610', description: 'Elements of reusable object-oriented software — the definitive patterns book.', cover: 'https://covers.openlibrary.org/b/isbn/9780201633610-M.jpg', totalCopies: 2, availableCopies: 2, addedAt: '2025-01-10' },
      { id: 8, title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Fiction', isbn: '9780061935466', description: 'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.', cover: 'https://covers.openlibrary.org/b/isbn/9780061935466-M.jpg', totalCopies: 4, availableCopies: 4, addedAt: '2025-01-11' },
      { id: 9, title: 'Deep Learning', author: 'Ian Goodfellow', category: 'Technology', isbn: '9780262035613', description: 'An introduction to a broad range of topics in deep learning, covering mathematical and conceptual background.', cover: 'https://covers.openlibrary.org/b/isbn/9780262035613-M.jpg', totalCopies: 2, availableCopies: 1, addedAt: '2025-01-12' },
      { id: 10, title: '1984', author: 'George Orwell', category: 'Fiction', isbn: '9780451524935', description: 'A dystopian novel set in a totalitarian society ruled by Big Brother.', cover: 'https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg', totalCopies: 5, availableCopies: 5, addedAt: '2025-01-13' },
      { id: 11, title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', category: 'Psychology', isbn: '9780374533557', description: 'A groundbreaking tour of the mind and explains the two systems that drive the way we think.', cover: 'https://covers.openlibrary.org/b/isbn/9780374533557-M.jpg', totalCopies: 3, availableCopies: 2, addedAt: '2025-01-14' },
      { id: 12, title: 'The Pragmatic Programmer', author: 'Andrew Hunt', category: 'Technology', isbn: '9780135957059', description: 'Your journey to mastery — from novice to practitioner to journeyman.', cover: 'https://covers.openlibrary.org/b/isbn/9780135957059-M.jpg', totalCopies: 3, availableCopies: 3, addedAt: '2025-01-15' },
    ],
    requests: [
      { id: 1, bookId: 3, userId: 2, studentName: 'Juan dela Cruz', studentId: '2024-00123', yearLevel: '3rd Year', course: 'BS Computer Science', address: '123 Rizal St, Davao City', status: 'approved', requestedAt: '2025-03-01', dueDate: '2025-03-15', returnedAt: null, adminNote: '' },
      { id: 2, bookId: 1, userId: 3, studentName: 'Maria Santos', studentId: '2024-00456', yearLevel: '2nd Year', course: 'BS Information Technology', address: '456 Mabini Ave, Davao City', status: 'pending', requestedAt: '2025-03-20', dueDate: null, returnedAt: null, adminNote: '' },
    ]
  };

  const load = (key) => { try { const v = localStorage.getItem(KEYS[key]); return v ? JSON.parse(v) : null; } catch { return null; } };
  const save = (key, data) => { try { localStorage.setItem(KEYS[key], JSON.stringify(data)); } catch(e) { console.error(e); } };
  const init = () => { if (!load('users')) save('users', defaults.users); if (!load('books')) save('books', defaults.books); if (!load('requests')) save('requests', defaults.requests); };

  // --- Users ---
  const getUsers = () => load('users') || [];
  const getUserById = (id) => getUsers().find(u => u.id === +id);
  const getUserByEmail = (email) => getUsers().find(u => u.email === email);
  const addUser = (data) => { const users = getUsers(); const id = Math.max(0, ...users.map(u => u.id)) + 1; const user = { id, ...data, createdAt: new Date().toISOString().split('T')[0] }; users.push(user); save('users', users); return user; };
  const updateUser = (id, data) => { const users = getUsers().map(u => u.id === +id ? { ...u, ...data } : u); save('users', users); };

  // --- Books ---
  const getBooks = () => load('books') || [];
  const getBookById = (id) => getBooks().find(b => b.id === +id);
  const addBook = (data) => { const books = getBooks(); const id = Math.max(0, ...books.map(b => b.id)) + 1; const book = { id, ...data, availableCopies: data.totalCopies, addedAt: new Date().toISOString().split('T')[0] }; books.push(book); save('books', books); return book; };
  const updateBook = (id, data) => { const books = getBooks().map(b => b.id === +id ? { ...b, ...data } : b); save('books', books); return books.find(b => b.id === +id); };
  const deleteBook = (id) => { save('books', getBooks().filter(b => b.id !== +id)); };

  // --- Requests ---
  const getRequests = () => load('requests') || [];
  const getRequestById = (id) => getRequests().find(r => r.id === +id);
  const getRequestsByUser = (userId) => getRequests().filter(r => r.userId === +userId);
  const addRequest = (data) => {
    const requests = getRequests(); const id = Math.max(0, ...requests.map(r => r.id)) + 1;
    const req = { id, ...data, status: 'pending', requestedAt: new Date().toISOString().split('T')[0], dueDate: null, returnedAt: null, adminNote: '' };
    requests.push(req); save('requests', requests);
    // Reduce available copies
    const book = getBookById(data.bookId);
    if (book) updateBook(book.id, { availableCopies: Math.max(0, book.availableCopies - 1) });
    return req;
  };
  const updateRequest = (id, data) => { const requests = getRequests().map(r => r.id === +id ? { ...r, ...data } : r); save('requests', requests); return requests.find(r => r.id === +id); };

  // --- Session ---
  const getSession = () => load('session');
  const setSession = (user) => save('session', user);
  const clearSession = () => localStorage.removeItem(KEYS.session);

  // --- Auth ---
  const login = (email, password) => { const user = getUserByEmail(email); if (user && user.password === password) { setSession(user); return user; } return null; };
  const register = (data) => { if (getUserByEmail(data.email)) return null; return addUser({ ...data, role: 'student' }); };

  init();
  return { getUsers, getUserById, getUserByEmail, addUser, updateUser, getBooks, getBookById, addBook, updateBook, deleteBook, getRequests, getRequestById, getRequestsByUser, addRequest, updateRequest, getSession, setSession, clearSession, login, register };
})();
