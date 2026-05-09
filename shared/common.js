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
  librarians = JSON.parse(localStorage.getItem('lib_librarians')) || JSON.parse(JSON.stringify(LIBRARIANS_DEFAULT));
}
function saveBooks()      { localStorage.setItem('lib_books', JSON.stringify(books)); }
function saveLibrarians() { localStorage.setItem('lib_librarians', JSON.stringify(librarians)); }
function getPending()     { return JSON.parse(localStorage.getItem('lib_pending'))    || []; }
function savePending(p)   { localStorage.setItem('lib_pending',    JSON.stringify(p)); }
function getDonations()   { return JSON.parse(localStorage.getItem('lib_donations'))  || []; }
function saveDonations(d) { localStorage.setItem('lib_donations',  JSON.stringify(d)); }
function getBookings()    { return JSON.parse(localStorage.getItem('lib_bookings'))   || []; }
function saveBookings(b)  { localStorage.setItem('lib_bookings',   JSON.stringify(b)); }
function getChessState()  { return JSON.parse(localStorage.getItem('lib_chess'))      || {}; }
function saveChessState(c){ localStorage.setItem('lib_chess',      JSON.stringify(c)); }
function getUsers()       { return JSON.parse(localStorage.getItem('lib_users'))      || []; }
function saveUsers(u)     { localStorage.setItem('lib_users',      JSON.stringify(u)); }

// ---- Borrow Requests (NEW) ----
function getBorrowRequests()    { return JSON.parse(localStorage.getItem('lib_borrow_requests')) || []; }
function saveBorrowRequests(r)  { localStorage.setItem('lib_borrow_requests', JSON.stringify(r)); }

// ============================================================
// AUTH
// ============================================================
function login() {
  const u = document.getElementById('l-user').value.trim();
  const p = document.getElementById('l-pass').value;
  document.getElementById('login-err').textContent = '';
  if (u === 'admin' && p === '123') {
    currentUser = 'admin'; isAdmin = true;
    startApp();
  } else {
    const users = getUsers();
    const found = users.find(x => x.username === u && x.password === p);
    if (found) {
      currentUser = u; isAdmin = false;
      startApp();
    } else {
      document.getElementById('login-err').textContent = 'Invalid username or password.';
    }
  }
}

function registerAccount() {
  const u = document.getElementById('r-user').value.trim();
  const p = document.getElementById('r-pass').value;
  const n = document.getElementById('r-name').value.trim();
  if (!u || !p || !n) { document.getElementById('reg-err').textContent = 'All fields required.'; return; }
  const users = getUsers();
  if (users.find(x => x.username === u)) { document.getElementById('reg-err').textContent = 'Username already taken.'; return; }
  users.push({username:u, password:p, name:n});
  saveUsers(users);
  toast('Account created! You can now log in.', 'success');
  showLoginPage();
}

function logout() {
  currentUser = null; isAdmin = false;
  localStorage.removeItem('currentUser');
  localStorage.removeItem('isAdmin');
  window.location.href = '../index.html';
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

function startApp() {
  loadState();
  localStorage.setItem('currentUser', currentUser);
  localStorage.setItem('isAdmin', isAdmin);
  if (isAdmin) {
    window.location.href = 'admin/index.html';
  } else {
    window.location.href = 'reader/index.html';
  }
}

// ============================================================
// NOTIFICATIONS
// ============================================================
function checkNotifications() {
  const key = `notif_${currentUser}`;
  const note = localStorage.getItem(key);
  if (note) {
    const b = document.getElementById('notif-banner');
    if (b) {
      document.getElementById('notif-text').textContent = note;
      b.classList.add('show');
    }
    localStorage.removeItem(key);
  }
}
function closeNotif() {
  const b = document.getElementById('notif-banner');
  if (b) b.classList.remove('show');
}

// ============================================================
// PAGE SWITCHING
// ============================================================
function switchPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  const page = document.getElementById('page-' + id);
  const tab  = document.querySelector(`[data-page="${id}"]`);
  if (page) page.classList.add('active');
  if (tab)  tab.classList.add('active');

  // Page-specific renders
  if (id === 'library')   renderBooks();
  if (id === 'booking')   renderMyBookings();
  if (id === 'borrow')    { populateBookSuggestions && populateBookSuggestions(); renderMyBorrows && renderMyBorrows(); }
  if (id === 'borrowers') { renderBorrowersPage && renderBorrowersPage(); }
  if (id === 'admin')     {
    typeof renderAdminPending   === 'function' && renderAdminPending();
    typeof renderAdminDonations === 'function' && renderAdminDonations();
    typeof renderAdminBookings  === 'function' && renderAdminBookings();
    typeof renderAdminStats     === 'function' && renderAdminStats();
  }
  if (id === 'donate' && isAdmin) typeof renderAdminDonationsInDonate === 'function' && renderAdminDonationsInDonate();
}

// ============================================================
// BOOKS
// ============================================================
function getCategories() {
  return ['All', ...new Set(books.map(b => b.category))];
}
function buildCatFilters() {
  const wrap = document.getElementById('cat-filters');
  if (!wrap) return;
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
  const search = (document.getElementById('book-search')?.value || '').toLowerCase();
  let list = books.filter(b => {
    const matchCat    = activeCatFilter === 'All' || b.category === activeCatFilter;
    const matchSearch = b.title.toLowerCase().includes(search) || b.author.toLowerCase().includes(search);
    return matchCat && matchSearch;
  });
  const grid = document.getElementById('book-grid');
  if (!grid) return;
  grid.innerHTML = '';
  if (!list.length) { grid.innerHTML = '<div class="empty-state">No books found.</div>'; }
  list.forEach(book => {
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
  const label = document.getElementById('book-count-label');
  if (label) label.textContent = `${list.length} book${list.length !== 1 ? 's' : ''} found`;
}

// ============================================================
// MODAL (base — overridden per page if needed)
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
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }

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
// HOURS & LIBRARIANS
// ============================================================
function renderHours() {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const today = days[new Date().getDay()];
  const grid = document.getElementById('hours-grid');
  if (!grid) return;
  grid.innerHTML = '';
  HOURS_DATA.forEach(h => {
    const isToday = h.day === today;
    const div = document.createElement('div');
    div.className = 'hour-cell' + (isToday ? ' today' : '') + (h.closed ? ' closed' : '');
    div.innerHTML = `<div class="hour-day">${h.day}${isToday ? ' ★' : ''}</div><div class="hour-time">${h.closed ? 'Closed' : h.open + ' – ' + h.close}</div>`;
    grid.appendChild(div);
  });
  const todayData = HOURS_DATA.find(h => h.day === today);
  const el  = document.getElementById('today-open-status');
  const sub = document.getElementById('today-hours-sub');
  if (!el || !sub) return;
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
  if (!grid) return;
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
  if (!grid) return;
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
  const id   = document.getElementById('c-id').value.trim();
  if (!name || !id) { toast('Please fill in all fields.', 'error'); return; }
  const chess = getChessState();
  chess[selectedChessId] = {name, id, borrowedAt: new Date().toLocaleString()};
  saveChessState(chess);
  toast('Chess Set borrowed! Please return before closing time.', 'success');
  cancelChessForm();
  renderChess();
  document.getElementById('c-name').value = '';
  document.getElementById('c-id').value   = '';
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
function submitBooking() {
  const name    = document.getElementById('b-name').value.trim();
  const sid     = document.getElementById('b-id').value.trim();
  const date    = document.getElementById('b-date').value;
  const time    = document.getElementById('b-time').value;
  const pax     = document.getElementById('b-pax').value;
  const purpose = document.getElementById('b-purpose').value;
  if (!name || !sid || !date || !time || !pax) { toast('Please fill in all required fields.', 'error'); return; }
  const bookings = getBookings();
  bookings.push({id: Date.now(), user: currentUser, name, sid, date, time, pax, purpose, status:'Pending'});
  saveBookings(bookings);
  toast('Booking submitted! Awaiting librarian confirmation.', 'success');
  ['b-name','b-id','b-date','b-time','b-pax'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  renderMyBookings();
}
function renderMyBookings() {
  const bookings = getBookings().filter(b => b.user === currentUser || isAdmin);
  const wrap = document.getElementById('my-bookings-wrap');
  const list = document.getElementById('my-bookings-list');
  if (!wrap || !list) return;
  if (!bookings.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  list.innerHTML = '';
  bookings.forEach(b => {
    const div = document.createElement('div');
    div.className = 'booking-item';
    div.innerHTML = `
      <div class="booking-icon">🏛️</div>
      <div class="booking-info">
        <div class="booking-name">${b.name} — ${b.purpose}</div>
        <div class="booking-meta">${b.date} · ${b.time} · ${b.pax} person(s) · ID: ${b.sid}</div>
      </div>
      <span class="booking-badge ${b.status === 'Confirmed' ? 'confirmed' : 'pending'}">${b.status}</span>
      ${(b.user === currentUser && !isAdmin) ? `<button class="cancel-booking" onclick="cancelBooking(${b.id})">Cancel</button>` : ''}`;
    list.appendChild(div);
  });
}
function cancelBooking(id) {
  let bookings = getBookings().filter(b => b.id !== id);
  saveBookings(bookings);
  renderMyBookings();
  toast('Booking cancelled.', 'info');
}

// ============================================================
// DONATIONS
// ============================================================
function submitDonation() {
  const name   = document.getElementById('d-name').value.trim();
  const title  = document.getElementById('d-title').value.trim();
  const author = document.getElementById('d-author').value.trim();
  if (!name || !title || !author) { toast('Please fill in Donor Name, Title, and Author.', 'error'); return; }
  const donations = getDonations();
  donations.push({
    id: Date.now(), donor: name, contact: document.getElementById('d-contact').value,
    title, author, category: document.getElementById('d-cat').value,
    condition: document.getElementById('d-cond').value, notes: document.getElementById('d-notes').value,
    submittedBy: currentUser, status: 'Pending'
  });
  saveDonations(donations);
  toast('Thank you! Your donation has been submitted for review.', 'success');
  ['d-name','d-contact','d-title','d-author','d-notes'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
}
function renderAdminDonationsInDonate() {
  const wrap = document.getElementById('donations-admin');
  const list = document.getElementById('donations-list');
  const donations = getDonations().filter(d => d.status === 'Pending');
  if (!isAdmin || !donations.length || !wrap || !list) { if(wrap) wrap.style.display = 'none'; return; }
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
  books.push({title:d.title, author:d.author, year:'2026', category:d.category, condition:d.condition, status:'Available', cover:'https://via.placeholder.com/150?text=Donated'});
  saveBooks();
  d.status = 'Approved';
  saveDonations(donations);
  toast(`"${d.title}" added to the library!`, 'success');
  typeof renderAdminDonations        === 'function' && renderAdminDonations();
  typeof renderAdminDonationsInDonate=== 'function' && renderAdminDonationsInDonate();
  typeof renderAdminStats            === 'function' && renderAdminStats();
}
function rejectDonation(id) {
  let donations = getDonations();
  const d = donations.find(x => x.id === id);
  if (!d) return;
  d.status = 'Rejected';
  saveDonations(donations);
  toast('Donation rejected.', 'info');
  typeof renderAdminDonations        === 'function' && renderAdminDonations();
  typeof renderAdminDonationsInDonate=== 'function' && renderAdminDonationsInDonate();
}

// ============================================================
// TOAST
// ============================================================
function toast(msg, type='info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = {success:'✓', error:'✕', info:'ℹ'};
  t.innerHTML = `<span>${icons[type]||'ℹ'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0'; t.style.transform = 'translateX(100%)'; t.style.transition = '.4s';
    setTimeout(() => t.remove(), 400);
  }, 3500);
}
