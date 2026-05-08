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
  const available = books.filter(b => b.status === 'Available').length;
  const borrowed = books.filter(b => b.status === 'Borrowed').length;
  const pending = getPending().length;
  const donations = getDonations().filter(d => d.status === 'Pending').length;
  const bookings = getBookings().length;
  el.innerHTML = [
    ['📚 Total Books', books.length],
    ['✅ Available', available],
    ['📖 Borrowed', borrowed],
    ['📬 Pending Suggestions', pending],
    ['📦 Pending Donations', donations],
    ['🏛️ Room Bookings', bookings]
  ].map(([label, val]) => `
    <div style="display:flex;justify-content:space-between;padding:10px 14px;background:rgba(255,255,255,.04);border-radius:10px;border:1px solid var(--border);">
      <span style="font-size:.88rem;color:rgba(240,236,228,.6)">${label}</span>
      <span style="font-weight:700;color:var(--gold-light)">${val}</span>
    </div>`).join('');
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
  document.getElementById('tab-admin').style.display = 'inline-block';
  switchPage('library');
  renderHours();
  renderLibrarians();
  renderChess();
  checkNotifications();
  renderAdminLibSelect();
  renderAdminStats();
}