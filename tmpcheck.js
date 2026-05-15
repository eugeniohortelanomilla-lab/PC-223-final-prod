
// ============================================================
// STATE
// ============================================================
let currentUser = null;
let isAdmin = false;
let books = [];
let librarians = [];
let activeCatFilter = 'All';
let currentBookIndex = null;
let selectedChessId = null;

function loadState() {
  books = JSON.parse(localStorage.getItem('lib_books')) || JSON.parse(JSON.stringify(BOOKS_DEFAULT));
  librarians = JSON.parse(JSON.stringify(LIBRARIANS_DEFAULT));
  localStorage.setItem('lib_librarians', JSON.stringify(librarians));
  if (!localStorage.getItem('lib_users')) {
    saveUsers(JSON.parse(JSON.stringify(USERS_DEFAULT)));
  }
}
function reloadBooks() {
  books = JSON.parse(localStorage.getItem('lib_books')) || JSON.parse(JSON.stringify(BOOKS_DEFAULT));
}
function saveBooks() { localStorage.setItem('lib_books', JSON.stringify(books)); }
function getPending() { return JSON.parse(localStorage.getItem('lib_pending')) || []; }
function savePending(p) { localStorage.setItem('lib_pending', JSON.stringify(p)); }
function getDonations() { return JSON.parse(localStorage.getItem('lib_donations')) || []; }
function saveDonations(d) { localStorage.setItem('lib_donations', JSON.stringify(d)); }
function getBookings() { return JSON.parse(localStorage.getItem('lib_bookings')) || []; }
function saveBookings(b) { localStorage.setItem('lib_bookings', JSON.stringify(b)); }
function getChessState() { return JSON.parse(localStorage.getItem('lib_chess')) || {}; }
function saveChessState(c) { localStorage.setItem('lib_chess', JSON.stringify(c)); }
function getUsers() {
  let users;
  try {
    users = JSON.parse(localStorage.getItem('lib_users'));
  } catch (err) {
    users = null;
  }
  if (!Array.isArray(users)) {
    users = JSON.parse(JSON.stringify(USERS_DEFAULT));
  }
  const hasAdmin = users.some(u => u.username === 'admin' && u.role === 'admin');
  if (!hasAdmin) {
    users.unshift({id:1, username:'admin', password:'admin123', name:'Administrator', role:'admin'});
  }
  localStorage.setItem('lib_users', JSON.stringify(users));
  return users;
}
function saveUsers(u) { localStorage.setItem('lib_users', JSON.stringify(u)); }

// ---- Borrow Requests ----
function getBorrowRequests() { return JSON.parse(localStorage.getItem('lib_borrow_requests')) || []; }
function saveBorrowRequests(r) { localStorage.setItem('lib_borrow_requests', JSON.stringify(r)); }

// ============================================================
// AUTH
// ============================================================
function login() {
  const u = document.getElementById('l-user').value.trim();
  const p = document.getElementById('l-pass').value;
  document.getElementById('login-err').textContent = '';
  const users = getUsers();
  const found = users.find(x => x.username === u && x.password === p);
  if (found) {
    currentUser = found.username;
    isAdmin = found.role === 'admin';
    localStorage.setItem('user', JSON.stringify(found));
    localStorage.setItem('currentUser', currentUser);
    localStorage.setItem('isAdmin', isAdmin);
    localStorage.setItem('userId', found.id);
    startApp();
  } else {
    document.getElementById('login-err').textContent = 'Invalid username or password.';
  }
}
function registerAccount() {
  const u = document.getElementById('r-user').value.trim();
  const p = document.getElementById('r-pass').value;
  const n = document.getElementById('r-name').value.trim();
  if (!u || !p || !n) { document.getElementById('reg-err').textContent = 'All fields required.'; return; }
  const users = getUsers();
  if (users.find(x => x.username === u)) { document.getElementById('reg-err').textContent = 'Username already taken.'; return; }
  users.push({id: Date.now(), username: u, password: p, name: n, role: 'Student'});
  saveUsers(users);
  toast('Account created! You can now log in.', 'success');
  showLoginPage();
}
function logout() {
  currentUser = null; isAdmin = false;
  localStorage.removeItem('user');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('userId');
  document.getElementById('app').classList.remove('active');
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('l-user').value = '';
  document.getElementById('l-pass').value = '';
}
function showRegisterPage() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('register-page').classList.add('active');
  document.getElementById('reg-err').textContent = '';
}
function showLoginPage() {
  document.getElementById('register-page').classList.remove('active');
  document.getElementById('login-page').style.display = 'flex';
}
async function startApp() {
  await loadState();
  localStorage.setItem('currentUser', currentUser);
  localStorage.setItem('isAdmin', isAdmin);
  localStorage.setItem('userId', localStorage.getItem('userId') || '');
  const destination = isAdmin ? 'admin/admin.html' : 'reader/reader.html';
  window.location.href = destination;
}

// ============================================================
// NOTIFICATIONS
// ============================================================
function checkNotifications() {
  const key = `notif_${currentUser}`;
  const note = localStorage.getItem(key);
  if (note) {
    const b = document.getElementById('notif-banner');
    document.getElementById('notif-text').textContent = note;
    b.classList.add('show');
    localStorage.removeItem(key);
  }
}
function closeNotif() { document.getElementById('notif-banner').classList.remove('show'); }

// ============================================================
// PAGE SWITCHING
// ============================================================
function switchPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.querySelector(`[data-page="${id}"]`).classList.add('active');
  if (id === 'library') renderBooks();
  if (id === 'admin') { renderAdminPending(); renderAdminDonations(); renderAdminBookings(); renderAdminStats(); renderAdminBorrowers(); }
  if (id === 'booking') renderMyBookings();
  if (id === 'donate' && isAdmin) renderAdminDonationsInDonate();
  if (id === 'borrow') { populateBookSuggestions(); renderMyBorrows(); }
}

// ============================================================
// BOOKS
// ============================================================
function getCategories() {
  return ['All', ...new Set(books.map(b => b.category))];
}
function buildCatFilters() {
  const wrap = document.getElementById('cat-filters');
  wrap.innerHTML = '';
  getCategories().forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (cat === activeCatFilter ? ' active' : '');
    btn.textContent = cat;
    btn.onclick = () => setCatFilter(cat, btn);
    wrap.appendChild(btn);
  });
}
function setCatFilter(cat, btn) {
  activeCatFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderBooks();
}
function filterBooks() { renderBooks(); }
function renderBooks() {
  buildCatFilters();
  const search = (document.getElementById('book-search').value || '').toLowerCase();
  let list = books.filter(b => {
    const matchCat = activeCatFilter === 'All' || b.category === activeCatFilter;
    const matchSearch = b.title.toLowerCase().includes(search) || b.author.toLowerCase().includes(search);
    return matchCat && matchSearch;
  });
  const grid = document.getElementById('book-grid');
  grid.innerHTML = '';
  if (!list.length) { grid.innerHTML = '<div class="empty-state">No books found.</div>'; }
  list.forEach((book, i) => {
    const realIdx = books.indexOf(book);
    const div = document.createElement('div');
    div.className = 'book-card';
    div.innerHTML = `
      <img class="book-cover" src="${book.cover || 'https://via.placeholder.com/150'}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/150'">
      <div class="book-body">
        <span class="book-cat-tag">${book.category}</span>
        <div class="book-title">${book.title}</div>
        <div class="book-author">${book.author} · ${book.year}</div>
        <span class="book-status ${book.status === 'Available' ? 'available' : 'borrowed'}">${book.status === 'Available' ? '✓' : '✕'} ${book.status}</span>
      </div>`;
    div.onclick = () => openModal(realIdx);
    grid.appendChild(div);
  });
  document.getElementById('book-count-label').textContent = `${list.length} book${list.length !== 1 ? 's' : ''} found`;
}

// ============================================================
// MODAL
// ============================================================
function openModal(idx) {
  currentBookIndex = idx;
  const b = books[idx];
  document.getElementById('m-cover').src = b.cover || 'https://via.placeholder.com/150';
  document.getElementById('m-title').textContent = b.title;
  document.getElementById('m-author').textContent = 'By ' + b.author;
  document.getElementById('m-year').textContent = b.year;
  document.getElementById('m-cat').textContent = b.category;
  document.getElementById('m-cond').textContent = b.condition || 'Unknown';
  document.getElementById('m-status').textContent = b.status;
  const readBtn = document.getElementById('m-read-btn');
  readBtn.style.display = (b.readLink || b.readlink) ? 'block' : 'none';
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }
function showSuggestForm() { document.getElementById('suggest-overlay').classList.add('open'); }
function closeSuggestModal() { document.getElementById('suggest-overlay').classList.remove('open'); }
function submitSuggestion() {
  const title = document.getElementById('s-title').value.trim();
  const author = document.getElementById('s-author').value.trim();
  const category = document.getElementById('s-cat').value;
  const reason = document.getElementById('s-reason').value.trim();
  if (!title || !author) { toast('Please fill in title and author.', 'error'); return; }
  const suggestions = getPending();
  suggestions.push({
    id: Date.now(),
    user: currentUser,
    suggested_by: currentUser,
    title,
    author,
    category,
    reason,
    status: 'Pending',
    submitted_at: new Date().toLocaleString()
  });
  savePending(suggestions);
  toast('Suggestion submitted! Awaiting librarian approval.', 'success');
  ['s-title','s-author','s-reason'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  closeSuggestModal();
}
function startReading() {
  const b = books[currentBookIndex];
  const link = b.readLink || b.readlink;
  if (link) window.open(link, '_blank');
}
function addToShelfFromModal() {
  if (currentBookIndex === null) return;
  const b = books[currentBookIndex];
  const key = `shelf_${currentUser}`;
  let shelf = JSON.parse(localStorage.getItem(key)) || [];
  if (shelf.find(x => x.title === b.title)) { toast('Already in your shelf.', 'info'); return; }
  shelf.push(b);
  localStorage.setItem(key, JSON.stringify(shelf));
  toast(`"${b.title}" added to your shelf!`, 'success');
  closeModal();
}

// ============================================================
// BORROW BOOKS
// ============================================================

// Show/hide Section field depending on role
function toggleSectionField() {
  const role = document.getElementById('br-role').value;
  const row = document.getElementById('br-section-row');
  row.style.display = role === 'Student' ? 'flex' : 'none';
}

// Populate the book title datalist so users can pick from available books
function populateBookSuggestions() {
  const dl = document.getElementById('book-suggestions');
  if (!dl) return;
  dl.innerHTML = books
    .filter(b => b.status === 'Available')
    .map(b => `<option value="${b.title}">`)
    .join('');
}

// Submit a borrow request
async function submitBorrowRequest() {
  const role    = document.getElementById('br-role').value;
  const name    = document.getElementById('br-name').value.trim();
  const idNum   = document.getElementById('br-id').value.trim();
  const course  = document.getElementById('br-course') ? document.getElementById('br-course').value.trim() : '';
  const section = document.getElementById('br-section') ? document.getElementById('br-section').value.trim() : '';
  const bookTitle = document.getElementById('br-book').value.trim();
  const date    = document.getElementById('br-date').value;
  const purpose = document.getElementById('br-purpose').value;

  // Validation
  if (!name || !idNum || !bookTitle || !date) {
    toast('Please fill in all required fields.', 'error'); return;
  }
  if (role === 'Student' && (!course || !section)) {
    toast('Please fill in your Course, Year, and Section.', 'error'); return;
  }

  // Check if book exists and is available
  const book = books.find(b => b.title.toLowerCase() === bookTitle.toLowerCase());
  if (!book) {
    toast('Book not found. Please check the title and try again.', 'error'); return;
  }
  if (book.status !== 'Available') {
    toast('Sorry, this book is currently borrowed. Please check back later.', 'error'); return;
  }

  const borrowRequests = getBorrowRequests();
  borrowRequests.push({
    id: Date.now(),
    user: currentUser,
    role,
    name,
    id_num: idNum,
    course: role === 'Student' ? course : '',
    section: role === 'Student' ? section : '',
    book_title: book.title,
    book_author: book.author,
    date_needed: date,
    purpose,
    status: 'Pending',
    submitted_at: new Date().toLocaleString(),
    approved_at: null,
    rejected_at: null,
    returned_at: null
  });
  saveBorrowRequests(borrowRequests);
  toast(`Borrow request for "${book.title}" submitted! Awaiting librarian approval.`, 'success');
  ['br-name','br-id','br-course','br-section','br-book'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  renderMyBorrows();
}

// Render this user's borrow history below the form
function renderMyBorrows() {
  const wrap = document.getElementById('my-borrows-wrap');
  const list = document.getElementById('my-borrows-list');
  if (!wrap || !list) return;

  try {
    const myRequests = getBorrowRequests().filter(r => r.user === currentUser);
    if (!myRequests.length) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';
    list.innerHTML = myRequests.map(r => `
      <div class="pending-card" style="margin-bottom:12px;">
        <h4 style="font-size:1rem;margin-bottom:4px;">📖 ${r.book_title}</h4>
        <p style="font-size:.85rem;color:rgba(240,236,228,.6);margin-bottom:8px;">Status: <span style="color:${r.status === 'Approved' ? '#4ade80' : r.status === 'Rejected' ? '#f87171' : '#fbbf24'}">${r.status}</span></p>
        <p style="font-size:.8rem;color:rgba(240,236,228,.5);">Submitted: ${r.submitted_at}</p>
        ${r.approved_at ? `<p style="font-size:.8rem;color:rgba(240,236,228,.5);">Approved: ${r.approved_at}</p>` : ''}
        ${r.returned_at ? `<p style="font-size:.8rem;color:rgba(240,236,228,.5);">Returned: ${r.returned_at}</p>` : ''}
      </div>
    `).join('');
  } catch (err) {
    console.error('Render my borrows error:', err);
    wrap.style.display = 'none';
  }
}

// ============================================================
// HOURS & LIBRARIANS
// ============================================================
function renderHours() {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const today = days[new Date().getDay()];
  const grid = document.getElementById('hours-grid');
  grid.innerHTML = '';
  HOURS_DATA.forEach(h => {
    const isToday = h.day === today;
    const div = document.createElement('div');
    div.className = 'hour-cell' + (isToday ? ' today' : '') + (h.closed ? ' closed' : '');
    div.innerHTML = `<div class="hour-day">${h.day}${isToday ? ' ★' : ''}</div><div class="hour-time">${h.closed ? 'Closed' : h.open + ' – ' + h.close}</div>`;
    grid.appendChild(div);
  });
  // today status
  const todayData = HOURS_DATA.find(h => h.day === today);
  const el = document.getElementById('today-open-status');
  const sub = document.getElementById('today-hours-sub');
  if (todayData && !todayData.closed) {
    el.textContent = 'Open'; el.className = 'info-card-value status-open';
    sub.textContent = todayData.open + ' – ' + todayData.close;
  } else {
    el.textContent = 'Closed Today'; el.className = 'info-card-value status-closed';
    sub.textContent = 'See schedule below';
  }
}
function renderLibrarians() {
  const grid = document.getElementById('librarian-grid');
  grid.innerHTML = '';
  librarians.forEach(l => {
    const div = document.createElement('div');
    div.className = 'librarian-card';
    div.innerHTML = `
      <div class="lib-avatar">${l.initial}</div>
      <div class="lib-name">${l.name}</div>
      <div class="lib-role">${l.role}</div>
      <span class="lib-status ${l.status}">${l.status === 'available' ? '● Available' : '○ Unavailable'}</span>
      <div class="lib-schedule">${l.schedule}</div>`;
    grid.appendChild(div);
  });
}

// ============================================================
// CHESS BORROWING
// ============================================================
function renderChess() {
  const grid = document.getElementById('chess-grid');
  const chess = getChessState();
  grid.innerHTML = '';
  CHESS_SETS.forEach(s => {
    const borrowed = chess[s.id];
    const div = document.createElement('div');
    div.className = 'chess-card';
    div.innerHTML = `
      <div class="chess-icon">${s.icon}</div>
      <div class="chess-name">${s.name}</div>
      <div class="chess-set-status" style="color:${borrowed ? '#f87171' : '#4ade80'}">${borrowed ? `Borrowed by ${borrowed.name}` : 'Available'}</div>
      <button class="borrow-chess-btn ${borrowed ? 'cant' : 'can'}" onclick="${borrowed ? '' : `openChessForm(${s.id})`}">${borrowed ? '✕ Unavailable' : '♟️ Borrow'}</button>`;
    if (isAdmin && borrowed) {
      div.innerHTML += `<button class="admin-btn red" style="width:100%;margin-top:8px;" onclick="returnChess(${s.id})">Return Set</button>`;
    }
    grid.appendChild(div);
  });
}
function openChessForm(id) {
  selectedChessId = id;
  const s = CHESS_SETS.find(x => x.id === id);
  document.getElementById('chess-form-title').textContent = `♟️ Borrow ${s.name}`;
  document.getElementById('chess-form-wrap').style.display = 'block';
  document.getElementById('chess-form-wrap').scrollIntoView({behavior:'smooth'});
}
function cancelChessForm() {
  selectedChessId = null;
  document.getElementById('chess-form-wrap').style.display = 'none';
}
function confirmChessBorrow() {
  const name = document.getElementById('c-name').value.trim();
  const id = document.getElementById('c-id').value.trim();
  if (!name || !id) { toast('Please fill in all fields.', 'error'); return; }
  const chess = getChessState();
  chess[selectedChessId] = {name, id, borrowedAt: new Date().toLocaleString()};
  saveChessState(chess);
  toast(`Chess Set borrowed! Please return before closing time.`, 'success');
  cancelChessForm();
  renderChess();
  document.getElementById('c-name').value = '';
  document.getElementById('c-id').value = '';
}
function returnChess(id) {
  const chess = getChessState();
  delete chess[id];
  saveChessState(chess);
  renderChess();
  toast('Chess set marked as returned.', 'success');
}

// ============================================================
// ROOM BOOKING
// ============================================================
const FACILITIES = {
  'Graduate School Area': { capacity: '12 persons', capacitySub: 'Tables & whiteboards available', limit: '3 hours max', limitSub: 'Extendable if no conflict', times: ['8:00 AM – 11:00 AM', '11:00 AM – 2:00 PM', '2:00 PM – 5:00 PM'] },
  'Computer and Internet Access Area (LAB)': { capacity: '10 computers', capacitySub: '30 mins per student', limit: '30 mins max', limitSub: 'Per session', times: ['8:00 AM – 8:30 AM', '8:30 AM – 9:00 AM', '9:00 AM – 9:30 AM', '9:30 AM – 10:00 AM', '10:00 AM – 10:30 AM', '10:30 AM – 11:00 AM', '11:00 AM – 11:30 AM', '11:30 AM – 12:00 PM', '12:00 PM – 12:30 PM', '12:30 PM – 1:00 PM', '1:00 PM – 1:30 PM', '1:30 PM – 2:00 PM', '2:00 PM – 2:30 PM', '2:30 PM – 3:00 PM', '3:00 PM – 3:30 PM', '3:30 PM – 4:00 PM', '4:00 PM – 4:30 PM', '4:30 PM – 5:00 PM', '5:00 PM – 5:30 PM', '5:30 PM – 6:00 PM'] },
  'Photo Copy Area': { capacity: '1-2 persons', capacitySub: 'Depends on staff availability', limit: 'As needed', limitSub: 'Staff assisted', times: ['8:00 AM – 6:00 PM'] },
  'Discussion Room 1': { capacity: '6 persons', capacitySub: 'Tables & chairs available', limit: '2 hours max', limitSub: 'Subject to availability', times: ['8:00 AM – 10:00 AM', '10:00 AM – 12:00 PM', '1:00 PM – 3:00 PM', '3:00 PM – 5:00 PM'] },
  'Discussion Room 2': { capacity: '6 persons', capacitySub: 'Tables & chairs available', limit: '2 hours max', limitSub: 'Subject to availability', times: ['8:00 AM – 10:00 AM', '10:00 AM – 12:00 PM', '1:00 PM – 3:00 PM', '3:00 PM – 5:00 PM'] },
  'Smart Room (AVR)': { capacity: '20 persons', capacitySub: 'Projector & audio system', limit: '3 hours max', limitSub: 'Extendable if no conflict', times: ['8:00 AM – 11:00 AM', '11:00 AM – 2:00 PM', '2:00 PM – 5:00 PM'] }
};

function updateFacilityInfo() {
  const facility = document.getElementById('b-facility').value;
  const timeSelect = document.getElementById('b-time');
  const capacityEl = document.getElementById('facility-capacity');
  const capacitySubEl = document.getElementById('facility-capacity-sub');
  const limitEl = document.getElementById('facility-limit');
  const limitSubEl = document.getElementById('facility-limit-sub');

  if (!facility || !FACILITIES[facility]) {
    timeSelect.innerHTML = '<option value="">Select a facility first</option>';
    if (capacityEl) capacityEl.textContent = '—';
    if (capacitySubEl) capacitySubEl.textContent = '—';
    if (limitEl) limitEl.textContent = '—';
    if (limitSubEl) limitSubEl.textContent = '—';
    return;
  }

  const f = FACILITIES[facility];
  timeSelect.innerHTML = '<option value="">Select a slot</option>' + f.times.map(t => `<option>${t}</option>`).join('');
  if (capacityEl) capacityEl.textContent = f.capacity;
  if (capacitySubEl) capacitySubEl.textContent = f.capacitySub;
  if (limitEl) limitEl.textContent = f.limit;
  if (limitSubEl) limitSubEl.textContent = f.limitSub;
}

function submitBooking() {
  const facility = document.getElementById('b-facility').value;
  const name = document.getElementById('b-name').value.trim();
  const sid = document.getElementById('b-id').value.trim();
  const date = document.getElementById('b-date').value;
  const time = document.getElementById('b-time').value;
  const pax = document.getElementById('b-pax').value;
  const purpose = document.getElementById('b-purpose').value;
  if (!facility || !name || !sid || !date || !time || !pax) { toast('Please fill in all required fields.', 'error'); return; }
  const bookings = getBookings();
  bookings.push({
    id: Date.now(),
    user: currentUser,
    facility,
    name,
    sid,
    date,
    time,
    pax,
    purpose,
    status: 'Pending'
  });
  saveBookings(bookings);
  toast('Booking submitted! Awaiting librarian confirmation.', 'success');
  ['b-name','b-id','b-date','b-time','b-pax'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  renderMyBookings();
}
function renderMyBookings() {
  const bookings = getBookings().filter(b => b.user === currentUser || isAdmin);
  const wrap = document.getElementById('my-bookings-wrap');
  const list = document.getElementById('my-bookings-list');
  if (!bookings.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  list.innerHTML = '';
  bookings.forEach(b => {
    const div = document.createElement('div');
    div.className = 'booking-item';
    div.innerHTML = `
      <div class="booking-icon">🏛️</div>
      <div class="booking-info">
        <div class="booking-name">${b.facility || 'Graduate Room'} — ${b.name} — ${b.purpose}</div>
        <div class="booking-meta">${b.date} · ${b.time} · ${b.pax} person(s) · ID: ${b.sid}</div>
      </div>
      <span class="booking-badge ${b.status === 'Confirmed' ? 'confirmed' : 'pending'}">${b.status}</span>
      ${(b.user === currentUser) ? `<button class="cancel-booking" onclick="cancelBooking(${b.id})">Cancel</button>` : ''}`;
    list.appendChild(div);
  });
}
function cancelBooking(id) {
  let bookings = getBookings();
  bookings = bookings.filter(b => b.id !== id);
  saveBookings(bookings);
  renderMyBookings();
  toast('Booking cancelled.', 'info');
}

// ============================================================
// DONATIONS
// ============================================================
function submitDonation() {
  const name = document.getElementById('d-name').value.trim();
  const title = document.getElementById('d-title').value.trim();
  const author = document.getElementById('d-author').value.trim();
  if (!name || !title || !author) { toast('Please fill in Donor Name, Title, and Author.', 'error'); return; }
  const donations = getDonations();
  donations.push({
    id: Date.now(),
    donor: name,
    contact: document.getElementById('d-contact').value,
    title,
    author,
    category: document.getElementById('d-cat').value,
    condition: document.getElementById('d-cond').value,
    notes: document.getElementById('d-notes').value,
    submitted_by: currentUser,
    status: 'Pending',
    submitted_at: new Date().toLocaleString()
  });
  saveDonations(donations);
  toast('Thank you! Your donation has been submitted for review.', 'success');
  ['d-name','d-contact','d-title','d-author','d-notes'].forEach(id => document.getElementById(id).value = '');
}
function renderAdminDonationsInDonate() {
  const wrap = document.getElementById('donations-admin');
  const list = document.getElementById('donations-list');
  const donations = getDonations().filter(d => d.status === 'Pending');
  if (!isAdmin || !donations.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  list.innerHTML = donations.map(d => `
    <div class="pending-card">
      <div class="pending-info"><h4>${d.title}</h4><p>${d.author} · ${d.category} · ${d.condition} · Donor: ${d.donor}</p></div>
      <div class="pending-actions">
        <button class="approve-btn" onclick="approveDonation(${d.id})">Accept</button>
        <button class="reject-btn" onclick="rejectDonation(${d.id})">Reject</button>
      </div>
    </div>`).join('');
}
function approveDonation(id) {
  let donations = getDonations();
  const d = donations.find(x => x.id === id);
  if (!d) return;
  // Add to library
  books.push({title:d.title, author:d.author, year:'2026', category:d.category, condition:d.condition, status:'Available', cover:'https://via.placeholder.com/150?text=Donated'});
  saveBooks();
  d.status = 'Approved';
  saveDonations(donations);
  toast(`"${d.title}" added to the library!`, 'success');
  renderAdminDonations(); renderAdminDonationsInDonate(); renderAdminStats();
}
function rejectDonation(id) {
  let donations = getDonations();
  const d = donations.find(x => x.id === id);
  if (!d) return;
  d.status = 'Rejected';
  saveDonations(donations);
  toast('Donation rejected.', 'info');
  renderAdminDonations(); renderAdminDonationsInDonate();
}

// ============================================================
// ADMIN PANEL
// ============================================================
function adminAddBook() {
  const title = document.getElementById('a-title').value.trim();
  if (!title) { toast('Title is required.', 'error'); return; }
  books.push({
    title, author: document.getElementById('a-author').value || 'Unknown',
    year: document.getElementById('a-year').value || '2026',
    category: document.getElementById('a-category').value || 'General',
    cover: document.getElementById('a-cover').value || 'https://via.placeholder.com/150',
    readLink: document.getElementById('a-readlink').value || '',
    condition: 'Good',
    status: document.getElementById('a-status').value
  });
  saveBooks();
  ['a-title','a-author','a-year','a-category','a-cover','a-readlink'].forEach(id => document.getElementById(id).value = '');
  toast(`"${title}" added to the library.`, 'success');
  renderAdminStats(); renderBooks();
}
function adminDeleteBook() {
  const title = document.getElementById('a-title').value.trim();
  if (!title) { toast('Enter the exact title in the Title field.', 'error'); return; }
  const before = books.length;
  books = books.filter(b => b.title.toLowerCase() !== title.toLowerCase());
  if (books.length < before) { saveBooks(); toast(`"${title}" removed.`, 'success'); renderAdminStats(); renderBooks(); }
  else toast('Book not found. Check the spelling.', 'error');
}
function renderAdminLibSelect() {
  const sel = document.getElementById('a-lib-select');
  if (!sel) return;
  sel.innerHTML = librarians.map((l,i) => `<option value="${i}">${l.name}</option>`).join('');
}
function updateLibrarianStatus() {
  const idx = parseInt(document.getElementById('a-lib-select').value);
  librarians[idx].status = document.getElementById('a-lib-status').value;
  const sched = document.getElementById('a-lib-schedule').value.trim();
  if (sched) librarians[idx].schedule = sched;
  saveLibrarians();
  renderLibrarians();
  toast('Staff status updated.', 'success');
}
function renderAdminPending() {
  const list = document.getElementById('admin-pending-list');
  const pending = getPending().filter(s => s.status === 'Pending');
  if (!pending.length) {
    list.innerHTML = '<p style="color:rgba(240,236,228,.35);font-size:.85rem;">No pending suggestions.</p>';
    return;
  }
  list.innerHTML = pending.map((b) => `
    <div class="pending-card">
      <div class="pending-info"><h4>${b.title}</h4><p>${b.author} · Suggested by ${b.suggested_by || 'Unknown'}</p></div>
      <div class="pending-actions">
        <button class="approve-btn" onclick="approveSuggestion(${b.id})">Approve</button>
        <button class="reject-btn" onclick="rejectSuggestion(${b.id})">Reject</button>
      </div>
    </div>`).join('');
}
function approveSuggestion(id) {
  const pending = getPending();
  const suggestion = pending.find(x => x.id === id);
  if (!suggestion) return;
  suggestion.status = 'Approved';
  savePending(pending);
  books.push({
    title: suggestion.title,
    author: suggestion.author,
    year: suggestion.category || '2026',
    category: suggestion.category || 'General',
    condition: 'Good',
    status: 'Available',
    cover: 'https://via.placeholder.com/150?text=Suggested'
  });
  saveBooks();
  toast('Suggestion approved and added to library.', 'success');
  renderAdminPending(); renderAdminStats(); renderBooks();
}
function rejectSuggestion(id) {
  const reason = prompt('Reason for rejecting this suggestion?', 'Not suitable for the collection.');
  if (reason === null) return;
  const pending = getPending();
  const suggestion = pending.find(x => x.id === id);
  if (!suggestion) return;
  suggestion.status = 'Rejected';
  suggestion.rejection_reason = reason;
  savePending(pending);
  toast('Suggestion rejected.', 'info');
  renderAdminPending();
}
function renderAdminDonations() {
  const list = document.getElementById('admin-donations-list');
  if (!list) return;
  const donations = getDonations().filter(d => d.status === 'Pending');
  if (!donations.length) { list.innerHTML = '<p style="color:rgba(240,236,228,.35);font-size:.85rem;">No pending donations.</p>'; return; }
  list.innerHTML = donations.map(d => `
    <div class="pending-card">
      <div class="pending-info"><h4>${d.title}</h4><p>${d.author} · ${d.category} · Donor: ${d.donor}</p></div>
      <div class="pending-actions">
        <button class="approve-btn" onclick="approveDonation(${d.id})">Accept</button>
        <button class="reject-btn" onclick="rejectDonation(${d.id})">Reject</button>
      </div>
    </div>`).join('');
}
function renderAdminBookings() {
  const list = document.getElementById('admin-bookings-list');
  if (!list) return;
  const bookings = getBookings();
  if (!bookings.length) { list.innerHTML = '<p style="color:rgba(240,236,228,.35);font-size:.85rem;">No bookings yet.</p>'; return; }
  list.innerHTML = bookings.map(b => `
    <div class="pending-card">
      <div class="pending-info"><h4>${b.facility || 'Graduate Room'} — ${b.name} — ${b.purpose}</h4><p>${b.date} · ${b.time} · ${b.pax} person(s) · ID: ${b.sid}</p></div>
      <div class="pending-actions">
        ${b.status === 'Pending' ? `<button class="approve-btn" onclick="confirmBooking(${b.id})">Confirm</button>` : '<span style="color:#4ade80;font-size:.8rem;">✓ Confirmed</span>'}
        <button class="reject-btn" onclick="deleteBooking(${b.id})">Delete</button>
      </div>
    </div>`).join('');
}
function confirmBooking(id) {
  let bookings = getBookings();
  const b = bookings.find(x => x.id === id);
  if (b) { b.status = 'Confirmed'; if (b.user) localStorage.setItem(`notif_${b.user}`, `✅ Your ${b.facility || 'Graduate Room'} booking on ${b.date} (${b.time}) has been confirmed!`); }
  saveBookings(bookings); renderAdminBookings();
  toast('Booking confirmed.', 'success');
}
function deleteBooking(id) {
  let bookings = getBookings().filter(b => b.id !== id);
  saveBookings(bookings); renderAdminBookings();
  toast('Booking deleted.', 'info');
}
function renderAdminStats() {
  const el = document.getElementById('admin-stats');
  if (!el) return;
  const available = books.filter(b => b.status === 'Available').length;
  const borrowed = books.filter(b => b.status === 'Borrowed').length;
  const pendingSuggestions = getPending().filter(d => d.status === 'Pending').length;
  const pendingDonations = getDonations().filter(d => d.status === 'Pending').length;
  const bookings = getBookings().length;
  const borrowReqs = getBorrowRequests().filter(r => r.status === 'Pending').length;
  el.innerHTML = [
    ['📚 Total Books', books.length],
    ['✅ Available', available],
    ['📖 Borrowed', borrowed],
    ['📋 Pending Borrow Requests', borrowReqs],
    ['📬 Pending Suggestions', pendingSuggestions],
    ['📦 Pending Donations', pendingDonations],
    ['🏛️ Room Bookings', bookings]
  ].map(([label, val]) => `
    <div style="display:flex;justify-content:space-between;padding:10px 14px;background:rgba(255,255,255,.04);border-radius:10px;border:1px solid var(--border);">
      <span style="font-size:.88rem;color:rgba(240,236,228,.6)">${label}</span>
      <span style="font-weight:700;color:var(--gold-light)">${val}</span>
    </div>`).join('');
  renderAdminBorrowerLog();
}

function renderAdminBorrowers() {
  const el = document.getElementById('admin-borrowers-list');
  if (!el) return;
  const requests = getBorrowRequests();
  if (!requests.length) {
    el.innerHTML = '<p style="font-size:.8rem;color:rgba(240,236,228,.4);text-align:center;padding:20px;">No borrow requests yet.</p>';
    return;
  }
  el.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:.88rem;">
      <thead>
        <tr style="background:rgba(255,255,255,.05);">
          <th style="padding:12px 8px;text-align:left;border-bottom:1px solid var(--border);">Book</th>
          <th style="padding:12px 8px;text-align:left;border-bottom:1px solid var(--border);">Borrower</th>
          <th style="padding:12px 8px;text-align:left;border-bottom:1px solid var(--border);">Status</th>
          <th style="padding:12px 8px;text-align:left;border-bottom:1px solid var(--border);">Submitted</th>
          <th style="padding:12px 8px;text-align:left;border-bottom:1px solid var(--border);">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${requests.map(r => {
          const statusColor = r.status === 'Approved' ? '#4ade80' : r.status === 'Rejected' ? '#f87171' : r.status === 'Pending' ? '#fbbf24' : '#60a5fa';
          const actions = r.status === 'Pending' ? `
            <button class="approve-btn" onclick="approveBorrow(${r.id}); event.stopPropagation();">✅ Accept</button>
            <button class="reject-btn" onclick="rejectBorrow(${r.id}); event.stopPropagation();">❌ Reject</button>
          ` : r.status === 'Approved' ? `
            <button class="approve-btn" style="background:rgba(99,102,241,.15);border-color:rgba(99,102,241,.3);color:#a5b4fc;" onclick="markReturned(${r.id}); event.stopPropagation();">📦 Mark Returned</button>
          ` : `<span style="font-size:.78rem;color:rgba(240,236,228,.35);">—</span>`;
          return `
            <tr style="border-bottom:1px solid rgba(255,255,255,.05);">
              <td style="padding:12px 8px;vertical-align:top;">
                <div style="font-weight:600;">${r.book_title}</div>
                <div style="font-size:.75rem;color:rgba(240,236,228,.5);">by ${r.book_author}</div>
              </td>
              <td style="padding:12px 8px;vertical-align:top;">
                <div style="font-weight:600;">${r.name}</div>
                <div style="font-size:.75rem;color:rgba(240,236,228,.5);">${r.id_num} · ${r.role}</div>
              </td>
              <td style="padding:12px 8px;vertical-align:top;"><span style="color:${statusColor};font-weight:700;text-transform:uppercase;letter-spacing:.05em;">${r.status}</span></td>
              <td style="padding:12px 8px;vertical-align:top;">${r.submitted_at}</td>
              <td style="padding:12px 8px;vertical-align:top;min-width:170px;">${actions}</td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function approveBorrow(id) {
  const requests = getBorrowRequests();
  const request = requests.find(r => r.id === id);
  if (!request) return;
  request.status = 'Approved';
  request.approved_at = new Date().toLocaleString();
  const book = books.find(b => b.title === request.book_title);
  if (book) book.status = 'Borrowed';
  saveBorrowRequests(requests);
  saveBooks();
  renderAdminBorrowers(); renderAdminStats(); renderBooks(); renderMyBorrows();
  toast('Request approved.', 'success');
}

function rejectBorrow(id) {
  const reason = prompt(`Reason for rejecting the request?`, 'Book is currently unavailable.');
  if (reason === null) return;
  const requests = getBorrowRequests();
  const request = requests.find(r => r.id === id);
  if (!request) return;
  request.status = 'Rejected';
  request.rejected_at = reason;
  saveBorrowRequests(requests);
  renderAdminBorrowers(); renderAdminStats(); renderMyBorrows();
  toast('Request rejected.', 'info');
}

function markReturned(id) {
  const requests = getBorrowRequests();
  const request = requests.find(r => r.id === id);
  if (!request) return;
  request.status = 'Returned';
  request.returned_at = new Date().toLocaleString();
  const book = books.find(b => b.title === request.book_title);
  if (book) book.status = 'Available';
  saveBorrowRequests(requests);
  saveBooks();
  renderAdminBorrowers(); renderAdminStats(); renderBooks(); renderMyBorrows();
  toast('Book marked as returned.', 'success');
}

// ============================================================
// TOAST
// ============================================================
function toast(msg, type='info') {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = {success:'✓', error:'✕', info:'ℹ'};
  t.innerHTML = `<span>${icons[type]||'ℹ'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(100%)'; t.style.transition = '.4s'; setTimeout(() => t.remove(), 400); }, 3500);
}

// ============================================================
// INIT
// ============================================================
document.getElementById('b-date').min = new Date().toISOString().split('T')[0];

// Check for persisted login
const persistedUserJson = localStorage.getItem('user');
if (persistedUserJson) {
  try {
    const userObj = JSON.parse(persistedUserJson);
    currentUser = userObj.username;
    isAdmin = userObj.role === 'admin';
    localStorage.setItem('currentUser', currentUser);
    localStorage.setItem('isAdmin', isAdmin);
    localStorage.setItem('userId', userObj.id);
    const destination = isAdmin ? 'admin/admin.html' : 'reader/reader.html';
    window.location.href = destination;
  } catch (err) {
    console.error('Persisted user parse error:', err);
  }
}
