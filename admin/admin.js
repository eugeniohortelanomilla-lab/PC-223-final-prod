// ============================================================
// ADMIN — BORROWERS MANAGEMENT
// ============================================================

let activeBorrowFilter = 'All';
let dbBorrowRequests = [];
let dbBookings = [];

function normalizeBorrowRecord(r) {
  return {
    ...r,
    id_num: r.id_num ?? r.idNum ?? '',
    book_title: r.book_title ?? r.bookTitle ?? '',
    book_author: r.book_author ?? r.bookAuthor ?? '',
    date_needed: r.date_needed ?? r.date ?? '',
    submitted_at: r.submitted_at ?? r.submittedAt ?? '',
    approved_at: r.approved_at ?? null,
    returned_at: r.returned_at ?? r.returnedAt ?? null,
    rejection_reason: r.rejection_reason ?? '',
    user: r.user ?? r.username ?? ''
  };
}

function getAdminBorrowRequests() {
  return dbBorrowRequests.length ? dbBorrowRequests : getBorrowRequests().map(normalizeBorrowRecord);
}

function getAdminBookings() {
  return dbBookings.length ? dbBookings : getBookings();
}

async function syncAdminDataFromDb() {
  const [borrowRes, bookingRes] = await Promise.all([
    fetchDbBorrowRequests(),
    fetchDbBookings()
  ]);

  if (borrowRes.success && Array.isArray(borrowRes.data)) {
    dbBorrowRequests = borrowRes.data.map(normalizeBorrowRecord);
  }
  if (bookingRes.success && Array.isArray(bookingRes.data)) {
    dbBookings = bookingRes.data.map(b => ({
      ...b,
      time: b.time_slot ?? b.time ?? ''
    }));
  }
}

function setBorrowFilter(filter, btn) {
  activeBorrowFilter = filter;
  document.querySelectorAll('#page-borrowers .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderBorrowersPage();
}

function renderBorrowersPage() {
  updateBorrowStats();

  const search = (document.getElementById('borrow-search')?.value || '').toLowerCase();
  let requests = getAdminBorrowRequests();

  // Filter by status
  if (activeBorrowFilter !== 'All') {
    requests = requests.filter(r => r.status === activeBorrowFilter);
  }
  // Filter by search
  if (search) {
    requests = requests.filter(r =>
      r.name.toLowerCase().includes(search) ||
      r.book_title.toLowerCase().includes(search) ||
      r.id_num.toLowerCase().includes(search)
    );
  }

  const list = document.getElementById('borrowers-list');
  if (!list) return;

  if (!requests.length) {
    list.innerHTML = '<p style="color:rgba(240,236,228,.35);font-size:.88rem;padding:20px 0;">No records found.</p>';
    return;
  }

  list.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:.88rem;">
      <thead>
        <tr style="background:rgba(255,255,255,.05);">
          <th style="padding:12px 8px;text-align:left;border-bottom:1px solid var(--border);">Book Title</th>
          <th style="padding:12px 8px;text-align:left;border-bottom:1px solid var(--border);">Borrower</th>
          <th style="padding:12px 8px;text-align:left;border-bottom:1px solid var(--border);">Status</th>
          <th style="padding:12px 8px;text-align:left;border-bottom:1px solid var(--border);">Date Needed</th>
          <th style="padding:12px 8px;text-align:left;border-bottom:1px solid var(--border);">Submitted</th>
          <th style="padding:12px 8px;text-align:left;border-bottom:1px solid var(--border);">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${requests.map(r => {
          const statusColor =
            r.status === 'Returned' ? '#4ade80' :
            r.status === 'Approved' ? '#60a5fa' :
            r.status === 'Rejected' ? '#f87171' : '#fbbf24';

          const actions = r.status === 'Pending' ? `
            <button class="approve-btn" onclick="approveBorrow(${r.id}); event.stopPropagation();">✅ Approve</button>
            <button class="reject-btn" onclick="rejectBorrow(${r.id}); event.stopPropagation();">❌ Reject</button>
          ` : r.status === 'Approved' ? `
            <button class="approve-btn" onclick="markReturned(${r.id}); event.stopPropagation();" style="background:rgba(99,102,241,.15);border-color:rgba(99,102,241,.3);color:#a5b4fc;">📦 Mark Returned</button>
          ` : `<span style="font-size:.78rem;color:rgba(240,236,228,.35);">—</span>`;

          return `
            <tr style="border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer;" onclick="openBorrowerModal(${r.id})">
              <td style="padding:12px 8px;vertical-align:top;">
                <div style="font-weight:600;">${r.book_title}</div>
                <div style="font-size:.75rem;color:rgba(240,236,228,.5);">by ${r.book_author}</div>
              </td>
              <td style="padding:12px 8px;vertical-align:top;">
                <div style="font-weight:600;">${r.name}</div>
                <div style="font-size:.75rem;color:rgba(240,236,228,.5);">${r.id_num} · ${r.role}${r.role === 'Student' ? ` · ${r.course} ${r.section}` : ''}</div>
              </td>
              <td style="padding:12px 8px;vertical-align:top;">
                <span style="color:${statusColor};font-weight:600;text-transform:uppercase;letter-spacing:.05em;">${r.status}</span>
              </td>
              <td style="padding:12px 8px;vertical-align:top;">${r.date_needed || '—'}</td>
              <td style="padding:12px 8px;vertical-align:top;">
                <div>${r.submitted_at}</div>
                ${r.approved_at ? `<div style="font-size:.75rem;color:rgba(240,236,228,.5);margin-top:4px;">Approved: ${r.approved_at}</div>` : ''}
                ${r.returned_at ? `<div style="font-size:.75rem;color:rgba(240,236,228,.5);margin-top:4px;">Returned: ${r.returned_at}</div>` : ''}
              </td>
              <td style="padding:12px 8px;vertical-align:top;">
                <div style="display:flex;gap:6px;flex-wrap:wrap;">${actions}</div>
              </td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function updateBorrowStats() {
  const all = getAdminBorrowRequests();
  const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  el('br-stat-pending',  all.filter(r => r.status === 'Pending').length);
  el('br-stat-active',   all.filter(r => r.status === 'Approved').length);
  el('br-stat-returned', all.filter(r => r.status === 'Returned').length);
  el('br-stat-total',    all.length);
}

async function approveBorrow(id) {
  const res = await updateDbBorrowStatus(id, 'Approved');
  if (!res.success) {
    toast('Unable to approve request in database.', 'error');
    return;
  }
  const requests = getAdminBorrowRequests();
  const request = requests.find(r => Number(r.id) === Number(id));
  if (!request) return;
  request.status = 'Approved';
  request.approved_at = new Date().toLocaleString();
  const book = books.find(b => b.title === request.book_title);
  if (book) book.status = 'Borrowed';
  dbBorrowRequests = requests;
  saveBooks();
  toast('Borrow request approved.', 'success');
  renderBorrowersPage();
  updateBorrowStats();
}

async function rejectBorrow(id) {
  const reason = prompt(`Reason for rejecting the request?`, 'Book is currently unavailable.');
  if (reason === null) return;
  const res = await updateDbBorrowStatus(id, 'Rejected', reason);
  if (!res.success) {
    toast('Unable to reject request in database.', 'error');
    return;
  }
  const requests = getAdminBorrowRequests();
  const request = requests.find(r => Number(r.id) === Number(id));
  if (!request) return;
  request.status = 'Rejected';
  request.rejection_reason = reason;
  dbBorrowRequests = requests;
  toast('Borrow request rejected.', 'info');
  renderBorrowersPage();
  updateBorrowStats();
}

async function markReturned(id) {
  const res = await updateDbBorrowStatus(id, 'Returned');
  if (!res.success) {
    toast('Unable to mark returned in database.', 'error');
    return;
  }
  const requests = getAdminBorrowRequests();
  const request = requests.find(r => Number(r.id) === Number(id));
  if (!request) return;
  request.status = 'Returned';
  request.returned_at = new Date().toLocaleString();
  const book = books.find(b => b.title === request.book_title);
  if (book) book.status = 'Available';
  dbBorrowRequests = requests;
  saveBooks();
  toast('Book marked as returned.', 'success');
  renderBorrowersPage();
  updateBorrowStats();
}

// ============================================================
// ADMIN PANEL — BOOKS & STAFF
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
  books.push({title: suggestion.title, author: suggestion.author, year: '2026', category: suggestion.category || 'General', condition: 'Good', status: 'Available', cover: 'https://via.placeholder.com/150?text=Suggested'});
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
  const bookings = getAdminBookings();
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

async function confirmBooking(id) {
  const res = await updateDbBookingStatus(id, 'Confirmed');
  if (!res.success) {
    toast('Unable to confirm booking in database.', 'error');
    return;
  }
  let bookings = getAdminBookings();
  const b = bookings.find(x => Number(x.id) === Number(id));
  if (b) { b.status = 'Confirmed'; if (b.user) localStorage.setItem(`notif_${b.user}`, `✅ Your ${b.facility || 'Graduate Room'} booking on ${b.date} (${b.time}) has been confirmed!`); }
  dbBookings = bookings;
  renderAdminBookings();
  toast('Booking confirmed.', 'success');
}

async function deleteBooking(id) {
  const res = await deleteDbBooking(id);
  if (!res.success) {
    toast('Unable to delete booking in database.', 'error');
    return;
  }
  let bookings = getAdminBookings().filter(b => Number(b.id) !== Number(id));
  dbBookings = bookings;
  renderAdminBookings();
  toast('Booking deleted.', 'info');
}

function renderAdminStats() {
  const el = document.getElementById('admin-stats');
  if (!el) return;
  const available  = books.filter(b => b.status === 'Available').length;
  const borrowed   = books.filter(b => b.status === 'Borrowed').length;
  const pending    = getPending().length;
  const donations  = getDonations().filter(d => d.status === 'Pending').length;
  const bookings   = getAdminBookings().length;
  const borrowReqs = getAdminBorrowRequests().filter(r => r.status === 'Pending').length;
  el.innerHTML = [
    ['📚 Total Books', books.length],
    ['✅ Available', available],
    ['📖 Borrowed', borrowed],
    ['📋 Pending Borrow Requests', borrowReqs],
    ['📬 Pending Suggestions', pending],
    ['📦 Pending Donations', donations],
    ['🏛️ Room Bookings', bookings]
  ].map(([label, val]) => `
    <div style="display:flex;justify-content:space-between;padding:10px 14px;background:rgba(255,255,255,.04);border-radius:10px;border:1px solid var(--border);">
      <span style="font-size:.88rem;color:rgba(240,236,228,.6)">${label}</span>
      <span style="font-weight:700;color:var(--gold-light)">${val}</span>
    </div>`).join('');
  renderAdminBorrowerLog();
}

function renderAdminBorrowerLog() {
  const el = document.getElementById('admin-borrowers-log');
  if (!el) return;
  const requests = getAdminBorrowRequests().slice().sort((a,b) => b.id - a.id).slice(0, 6);
  if (!requests.length) {
    el.innerHTML = '<p style="font-size:.85rem;color:rgba(240,236,228,.4);">No borrow logs yet.</p>';
    return;
  }
  el.innerHTML = requests.map(r => {
    const statusLabel = r.status === 'Returned' ? 'RETURNED' : r.status === 'Approved' ? 'APPROVED' : r.status === 'Rejected' ? 'REJECTED' : 'PENDING';
    const statusColor = r.status === 'Returned' ? '#4ade80' : r.status === 'Approved' ? '#60a5fa' : r.status === 'Rejected' ? '#f87171' : '#fbbf24';
    const returnedInfo = r.returned_at ? `<div style="font-size:.75rem;color:rgba(240,236,228,.6);">Returned: ${r.returned_at}</div>` : '';
    return `
      <div style="padding:12px;background:rgba(255,255,255,.03);border-radius:10px;border:1px solid var(--border);">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div style="font-size:.9rem;font-weight:700;">${r.book_title}</div>
          <div style="font-size:.75rem;font-weight:700;color:${statusColor};text-transform:uppercase;letter-spacing:.08em;">${statusLabel}</div>
        </div>
        <div style="font-size:.78rem;color:rgba(240,236,228,.6);margin:8px 0;">${r.name} · ${r.id_num} · ${r.role}${r.role === 'Student' ? ` · ${r.course} ${r.section}` : ''}</div>
        <div style="font-size:.78rem;color:rgba(240,236,228,.5);">${r.date_needed} · ${r.purpose}</div>
        <div style="font-size:.78rem;color:rgba(240,236,228,.5);">Submitted: ${r.submitted_at}</div>
        ${r.approved_at ? `<div style="font-size:.78rem;color:rgba(240,236,228,.5);">Approved: ${r.approved_at}</div>` : ''}
        ${returnedInfo}
      </div>`;
  }).join('');
}

// ============================================================
// BORROWER MODAL
// ============================================================
function openBorrowerModal(id) {
  const requests = getAdminBorrowRequests();
  const r = requests.find(x => Number(x.id) === Number(id));
  if (!r) return;

  document.getElementById('bm-book').textContent = r.book_title;
  document.getElementById('bm-author').textContent = r.book_author;
  document.getElementById('bm-name').textContent = r.name;
  document.getElementById('bm-id').textContent = r.id_num;
  document.getElementById('bm-role').textContent = r.role;
  document.getElementById('bm-course-row').style.display = r.role === 'Student' ? 'block' : 'none';
  document.getElementById('bm-course').textContent = r.course;
  document.getElementById('bm-section-row').style.display = r.role === 'Student' ? 'block' : 'none';
  document.getElementById('bm-section').textContent = r.section;
  document.getElementById('bm-date').textContent = r.date_needed || r.date;
  document.getElementById('bm-purpose').textContent = r.purpose;
  document.getElementById('bm-status').textContent = r.status;
  document.getElementById('bm-submitted').textContent = r.submitted_at;
  document.getElementById('bm-approved-row').style.display = r.approved_at ? 'block' : 'none';
  document.getElementById('bm-approved').textContent = r.approved_at || '';
  document.getElementById('bm-returned-row').style.display = r.returned_at ? 'block' : 'none';
  document.getElementById('bm-returned').textContent = r.returned_at || '';

  document.getElementById('borrower-modal-overlay').classList.add('open');
}

function closeBorrowerModal() {
  document.getElementById('borrower-modal-overlay').classList.remove('open');
}

// ============================================================
// INIT
// ============================================================
currentUser = localStorage.getItem('currentUser');
isAdmin = localStorage.getItem('isAdmin') === 'true';

if (!currentUser || !isAdmin) {
  window.location.href = '../index.html';
} else {
  (async () => {
    loadState();
    await syncAdminDataFromDb();
    document.getElementById('app').classList.add('active');
    document.getElementById('nav-username').textContent = currentUser;
    switchPage('library');
    renderHours();
    renderLibrarians();
    renderChess();
    checkNotifications();
    renderAdminLibSelect();
    renderAdminStats();

    const bDate = document.getElementById('b-date');
    if (bDate) bDate.min = new Date().toISOString().split('T')[0];
  })();
}
