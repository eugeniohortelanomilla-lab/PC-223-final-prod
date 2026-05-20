// Set this if the frontend is hosted on a different domain (e.g. GitHub Pages):
// window.CTU_API_BASE = 'https://YOUR-APP.up.railway.app/api/';

function getApiBase() {
  if (window.CTU_API_BASE) {
    const base = String(window.CTU_API_BASE);
    return base.endsWith('/') ? base : base + '/';
  }
  const path = window.location.pathname;
  if (path.includes('/admin/') || path.includes('/reader/')) {
    return new URL('../api/', window.location.href).href;
  }
  return new URL('api/', window.location.href).href;
}

async function apiPost(endpoint, payload) {
  const url = new URL(endpoint, getApiBase()).href;
  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    if (!response.ok) {
      let message = text;
      try {
        const json = JSON.parse(text);
        if (json.error) message = json.error;
      } catch (_) { /* not JSON */ }
      if (response.status === 405 && message.toLowerCase().includes('not allowed')) {
        message += ' — PHP may not be running. On Railway, deploy with the Dockerfile (not Static Site).';
      }
      return { success: false, error: `Server error ${response.status}: ${message}` };
    }
    try {
      return JSON.parse(text);
    } catch (_) {
      return { success: false, error: 'Invalid JSON from server: ' + text.slice(0, 120) };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function createDbUser(username, password, name, role = 'Student') {
  return apiPost('register.php', { username, password, name, role });
}

function loginDbUser(username, password) {
  return apiPost('login.php', { username, password });
}

function createDbBorrowRequest(data) {
  return apiPost('borrow.php', data);
}

function createDbBooking(data) {
  return apiPost('booking.php', data);
}

async function apiGet(endpoint, params = {}) {
  const url = new URL(endpoint, getApiBase());
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  try {
    const response = await fetch(url.href, { method: 'GET', mode: 'cors' });
    const text = await response.text();
    if (!response.ok) {
      return { success: false, error: `Server error ${response.status}: ${text}` };
    }
    try {
      return JSON.parse(text);
    } catch (_) {
      return { success: false, error: 'Invalid JSON from server: ' + text.slice(0, 120) };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function fetchDbBorrowRequests() {
  return apiGet('admin.php', { type: 'borrow_requests' });
}

function fetchDbBookings() {
  return apiGet('admin.php', { type: 'bookings' });
}

function updateDbBorrowStatus(id, status, rejectionReason = '') {
  return apiPost('admin.php', {
    action: 'borrow_status',
    id,
    status,
    rejection_reason: rejectionReason
  });
}

function updateDbBookingStatus(id, status) {
  return apiPost('admin.php', { action: 'booking_status', id, status });
}

function deleteDbBooking(id) {
  return apiPost('admin.php', { action: 'booking_delete', id });
}
