// ============================================================
// READER-SPECIFIC: BORROW BOOKS
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
function submitBorrowRequest() {
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

  // Save request
  const requests = getBorrowRequests();
  requests.push({
    id: Date.now(),
    user: currentUser,
    role,
    name,
    idNum,
    course: role === 'Student' ? course : '—',
    section: role === 'Student' ? section : '—',
    bookTitle: book.title,
    bookAuthor: book.author,
    date,
    purpose,
    status: 'Pending',
    submittedAt: new Date().toLocaleString()
  });
  saveBorrowRequests(requests);

  // Notify admin
  localStorage.setItem('notif_admin', `📖 New borrow request: "${book.title}" by ${name}`);

  toast(`Borrow request for "${book.title}" submitted! Awaiting librarian approval.`, 'success');

  // Clear form
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

  const myRequests = getBorrowRequests().filter(r => r.user === currentUser);
  if (!myRequests.length) { wrap.style.display = 'none'; return; }

  wrap.style.display = 'block';
  list.innerHTML = myRequests.map(r => {
    const statusClass =
      r.status === 'Approved'  ? 'confirmed' :
      r.status === 'Returned'  ? 'returned'  :
      r.status === 'Rejected'  ? 'rejected'  : 'pending';

    const statusIcon =
      r.status === 'Approved'  ? '✅' :
      r.status === 'Returned'  ? '📦' :
      r.status === 'Rejected'  ? '❌' : '⏳';

    const returnButton = r.status === 'Approved' ? `
      <button class="approve-btn" style="margin-top:10px;" onclick="returnBorrowedBook(${r.id})">📦 Return Book</button>
    ` : '';

    return `
    <div class="booking-item">
      <div class="booking-icon">📖</div>
      <div class="booking-info">
        <div class="booking-name">${r.bookTitle}</div>
        <div class="booking-meta">
          ${r.bookAuthor} · ${r.date} · ${r.purpose}
          ${r.role === 'Student' ? ` · ${r.course} ${r.section}` : ' · Faculty/Staff'}
        </div>
        ${r.returnedAt ? `<div style="font-size:.8rem;color:rgba(240,236,228,.55);margin-top:6px;">Returned: ${r.returnedAt}</div>` : ''}
        ${returnButton}
      </div>
      <span class="booking-badge ${statusClass}">${statusIcon} ${r.status}</span>
    </div>`;
  }).join('');
}

function returnBorrowedBook(id) {
  const requests = getBorrowRequests();
  const r = requests.find(x => x.id === id);
  if (!r || r.status !== 'Approved') return;

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

  localStorage.setItem('notif_admin', `📦 Return notice: "${r.bookTitle}" returned by ${r.name}`);
  toast(`"${r.bookTitle}" has been returned. Thank you!`, 'success');

  renderMyBorrows();
  renderBooks();
}

// Called from modal — pre-fills the book title and navigates to borrow page
function goToBorrowPage() {
  const title = document.getElementById('m-title').textContent;
  closeModal();
  switchPage('borrow');
  setTimeout(() => {
    const input = document.getElementById('br-book');
    if (input) { input.value = title; }
  }, 100);
}

// Override openModal to add Borrow button behavior
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

  const borrowBtn = document.getElementById('m-borrow-btn');
  const borrowerEl = document.getElementById('m-borrower');

  if (b.status === 'Available') {
    borrowBtn.style.display = 'block';
    borrowBtn.textContent = '📖 Borrow This Book';
    borrowBtn.disabled = false;
    borrowerEl.style.display = 'none';
  } else {
    borrowBtn.style.display = 'block';
    borrowBtn.textContent = '✕ Currently Borrowed';
    borrowBtn.disabled = true;
    borrowBtn.style.background = 'rgba(255,255,255,.08)';
    borrowBtn.style.color = 'rgba(240,236,228,.3)';
    borrowBtn.style.cursor = 'default';
    borrowBtn.style.transform = 'none';
    if (b.borrowerName) {
      borrowerEl.style.display = 'block';
      borrowerEl.innerHTML = `<strong style="color:var(--gold-light)">Borrower:</strong> ${b.borrowerName}`;
    } else {
      borrowerEl.style.display = 'none';
    }
  }

  document.getElementById('modal-overlay').classList.add('open');
}

// ============================================================
// INIT
// ============================================================
currentUser = localStorage.getItem('currentUser');
isAdmin = localStorage.getItem('isAdmin') === 'true';

if (!currentUser || isAdmin) {
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

  // Set min date for borrow form
  const brDate = document.getElementById('br-date');
  if (brDate) brDate.min = new Date().toISOString().split('T')[0];

  // Set min date for booking form
  const bDate = document.getElementById('b-date');
  if (bDate) bDate.min = new Date().toISOString().split('T')[0];
}
