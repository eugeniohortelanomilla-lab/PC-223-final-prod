// ============================================================
// ADMIN — BORROWERS MANAGEMENT
// ============================================================

let activeBorrowFilter = 'All';

function setBorrowFilter(filter, btn) {
  activeBorrowFilter = filter;
  document.querySelectorAll('#page-borrowers .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderBorrowersPage();
}

function renderBorrowersPage() {
  updateBorrowStats();

  const search = (document.getElementById('borrow-search')?.value || '').toLowerCase();
  let requests = getBorrowRequests();

  // Filter by status
  if (activeBorrowFilter !== 'All') {
    requests = requests.filter(r => r.status === activeBorrowFilter);
  }
  // Filter by search
  if (search) {
    requests = requests.filter(r =>
      r.name.toLowerCase().includes(search) ||
      r.bookTitle.toLowerCase().includes(search) ||
      r.idNum.toLowerCase().includes(search)
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
                <div style="font-weight:600;">${r.bookTitle}</div>
                <div style="font-size:.75rem;color:rgba(240,236,228,.5);">by ${r.bookAuthor}</div>
              </td>
              <td style="padding:12px 8px;vertical-align:top;">
                <div style="font-weight:600;">${r.name}</div>
                <div style="font-size:.75rem;color:rgba(240,236,228,.5);">${r.idNum} · ${r.role}${r.role === 'Student' ? ` · ${r.course} ${r.section}` : ''}</div>
              </td>
              <td style="padding:12px 8px;vertical-align:top;">
                <span style="color:${statusColor};font-weight:600;text-transform:uppercase;letter-spacing:.05em;">${r.status}</span>
              </td>
              <td style="padding:12px 8px;vertical-align:top;">${r.date}</td>
              <td style="padding:12px 8px;vertical-align:top;">
                <div>${r.submittedAt}</div>
                ${r.approvedAt ? `<div style="font-size:.75rem;color:rgba(240,236,228,.5);margin-top:4px;">Approved: ${r.approvedAt}</div>` : ''}
                ${r.returnedAt ? `<div style="font-size:.75rem;color:rgba(240,236,228,.5);margin-top:4px;">Returned: ${r.returnedAt}</div>` : ''}
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
  const all = getBorrowRequests();
  const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  el('br-stat-pending',  all.filter(r => r.status === 'Pending').length);
  el('br-stat-active',   all.filter(r => r.status === 'Approved').length);
  el('br-stat-returned', all.filter(r => r.status === 'Returned').length);
  el('br-stat-total',    all.length);
}

function approveBorrow(id) {
  const requests = getBorrowRequests();
  const r = requests.find(x => x.id === id);
  if (!r) return;

  const book = books.find(b => b.title.toLowerCase() === r.bookTitle.toLowerCase());
  if (!book || book.status !== 'Available') {
    toast('Cannot approve — the book is no longer available.', 'error');
    return;
  }

  book.status = 'Borrowed';
  book.borrowerName = r.name;
  book.borrowerId = r.idNum;
  saveBooks();

  r.status = 'Approved';
  r.approvedAt = new Date().toLocaleString();
  saveBorrowRequests(requests);

  // Notify reader
  localStorage.setItem(`notif_${r.user}`, `✅ Your borrow request for "${r.bookTitle}" has been approved! You may pick it up at the library.`);

  toast(`Approved. "${r.bookTitle}" marked as borrowed.`, 'success');
  renderBorrowersPage();
  renderBooks();
  renderAdminStats();
  renderAdminBorrowerLog();
}

function rejectBorrow(id) {
  const requests = getBorrowRequests();
  const r = requests.find(x => x.id === id);
  if (!r) return;

  const reason = prompt(`Reason for rejecting "${r.bookTitle}"?`, 'Book is currently unavailable.');
  if (reason === null) return;

  r.status = 'Rejected';
  r.rejectedAt = new Date().toLocaleString();
  saveBorrowRequests(requests);

  // Notify reader
  localStorage.setItem(`notif_${r.user}`, `❌ Your borrow request for "${r.bookTitle}" was rejected. Reason: ${reason}`);

  toast(`Borrow request rejected.`, 'info');
  renderBorrowersPage();
  renderAdminBorrowerLog();
}

function markReturned(id) {
  const requests = getBorrowRequests();
  const r = requests.find(x => x.id === id);
  if (!r) return;

  // Mark book as Available again
  const book = books.find(b => b.title.toLowerCase() === r.bookTitle.toLowerCase());
  if (book) {
    book.status = 'Available';
    delete book.borrowerName;
    delete book.borrowerId;
    saveBooks();
  }

  r.status = 'Returned';
  r.returnedAt = new Date().toLocaleString();
  saveBorrowRequests(requests);

  // Notify reader
  localStorage.setItem(`notif_${r.user}`, `📦 "${r.bookTitle}" has been marked as returned. Thank you!`);

  toast(`"${r.bookTitle}" marked as returned and is now available.`, 'success');
  renderBorrowersPage();
  renderBooks();
  renderAdminStats();
  renderAdminBorrowerLog();
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
  const pending = getPending();
  if (!pending.length) { list.innerHTML = '<p style="color:rgba(240,236,228,.35);font-size:.85rem;">No pending suggestions.</p>'; return; }
  list.innerHTML = pending.map((b,i) => `
    <div class="pending-card">
      <div class="pending-info"><h4>${b.title}</h4><p>${b.author} · Suggested by ${b.suggestedBy || 'Unknown'}</p></div>
      <div class="pending-actions">
        <button class="approve-btn" onclick="approveSuggestion(${i})">Approve</button>
        <button class="reject-btn" onclick="rejectSuggestion(${i})">Reject</button>
      </div>
    </div>`).join('');
}

function approveSuggestion(i) {
  const pending = getPending();
  const b = pending[i];
  books.push({title:b.title, author:b.author, year:'2026', category:'Suggestion', condition:'New', status:'Available', cover:'https://via.placeholder.com/150?text=New'});
  saveBooks();
  if (b.suggestedBy) localStorage.setItem(`notif_${b.suggestedBy}`, `✅ Approved: Your suggestion "${b.title}" is now in the library!`);
  pending.splice(i, 1); savePending(pending);
  renderAdminPending(); renderAdminStats(); renderBooks();
  toast('Suggestion approved and added to library.', 'success');
}

function rejectSuggestion(i) {
  const pending = getPending();
  const b = pending[i];
  const reason = prompt(`Reason for rejecting "${b.title}"?`, 'Not suitable for the collection.');
  if (reason === null) return;
  if (b.suggestedBy) localStorage.setItem(`notif_${b.suggestedBy}`, `❌ Rejected: "${b.title}". Reason: ${reason}`);
  pending.splice(i, 1); savePending(pending);
  renderAdminPending();
  toast('Suggestion rejected.', 'info');
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
      <div class="pending-info"><h4>${b.name} — ${b.purpose}</h4><p>${b.date} · ${b.time} · ${b.pax} person(s) · ID: ${b.sid}</p></div>
      <div class="pending-actions">
        ${b.status === 'Pending' ? `<button class="approve-btn" onclick="confirmBooking(${b.id})">Confirm</button>` : '<span style="color:#4ade80;font-size:.8rem;">✓ Confirmed</span>'}
        <button class="reject-btn" onclick="deleteBooking(${b.id})">Delete</button>
      </div>
    </div>`).join('');
}

function confirmBooking(id) {
  let bookings = getBookings();
  const b = bookings.find(x => x.id === id);
  if (b) { b.status = 'Confirmed'; if (b.user) localStorage.setItem(`notif_${b.user}`, `✅ Your Graduate Room booking on ${b.date} (${b.time}) has been confirmed!`); }
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
  const available  = books.filter(b => b.status === 'Available').length;
  const borrowed   = books.filter(b => b.status === 'Borrowed').length;
  const pending    = getPending().length;
  const donations  = getDonations().filter(d => d.status === 'Pending').length;
  const bookings   = getBookings().length;
  const borrowReqs = getBorrowRequests().filter(r => r.status === 'Pending').length;
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
  const requests = getBorrowRequests().slice().sort((a,b) => b.id - a.id).slice(0, 6);
  if (!requests.length) {
    el.innerHTML = '<p style="font-size:.85rem;color:rgba(240,236,228,.4);">No borrow logs yet.</p>';
    return;
  }
  el.innerHTML = requests.map(r => {
    const statusLabel = r.status === 'Returned' ? 'RETURNED' : r.status === 'Approved' ? 'APPROVED' : r.status === 'Rejected' ? 'REJECTED' : 'PENDING';
    const statusColor = r.status === 'Returned' ? '#4ade80' : r.status === 'Approved' ? '#60a5fa' : r.status === 'Rejected' ? '#f87171' : '#fbbf24';
    const returnedInfo = r.returnedAt ? `<div style="font-size:.75rem;color:rgba(240,236,228,.6);">Returned: ${r.returnedAt}</div>` : '';
    return `
      <div style="padding:12px;background:rgba(255,255,255,.03);border-radius:10px;border:1px solid var(--border);">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div style="font-size:.9rem;font-weight:700;">${r.bookTitle}</div>
          <div style="font-size:.75rem;font-weight:700;color:${statusColor};text-transform:uppercase;letter-spacing:.08em;">${statusLabel}</div>
        </div>
        <div style="font-size:.78rem;color:rgba(240,236,228,.6);margin:8px 0;">${r.name} · ${r.idNum} · ${r.role}${r.role === 'Student' ? ` · ${r.course} ${r.section}` : ''}</div>
        <div style="font-size:.78rem;color:rgba(240,236,228,.5);">${r.date} · ${r.purpose}</div>
        <div style="font-size:.78rem;color:rgba(240,236,228,.5);">Submitted: ${r.submittedAt}</div>
        ${r.approvedAt ? `<div style="font-size:.78rem;color:rgba(240,236,228,.5);">Approved: ${r.approvedAt}</div>` : ''}
        ${returnedInfo}
      </div>`;
  }).join('');
}

// ============================================================
// BORROWER MODAL
// ============================================================
function openBorrowerModal(id) {
  const requests = getBorrowRequests();
  const r = requests.find(x => x.id === id);
  if (!r) return;

  document.getElementById('bm-book').textContent = r.bookTitle;
  document.getElementById('bm-author').textContent = r.bookAuthor;
  document.getElementById('bm-name').textContent = r.name;
  document.getElementById('bm-id').textContent = r.idNum;
  document.getElementById('bm-role').textContent = r.role;
  document.getElementById('bm-course-row').style.display = r.role === 'Student' ? 'block' : 'none';
  document.getElementById('bm-course').textContent = r.course;
  document.getElementById('bm-section-row').style.display = r.role === 'Student' ? 'block' : 'none';
  document.getElementById('bm-section').textContent = r.section;
  document.getElementById('bm-date').textContent = r.date;
  document.getElementById('bm-purpose').textContent = r.purpose;
  document.getElementById('bm-status').textContent = r.status;
  document.getElementById('bm-submitted').textContent = r.submittedAt;
  document.getElementById('bm-approved-row').style.display = r.approvedAt ? 'block' : 'none';
  document.getElementById('bm-approved').textContent = r.approvedAt || '';
  document.getElementById('bm-returned-row').style.display = r.returnedAt ? 'block' : 'none';
  document.getElementById('bm-returned').textContent = r.returnedAt || '';

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
  loadState();
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
}
