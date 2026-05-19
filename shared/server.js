async function apiPost(endpoint, payload) {
  const base = window.location.pathname.includes('/admin/') || window.location.pathname.includes('/reader/') ? '../api/' : 'api/';
  try {
    const response = await fetch(base + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Server error ${response.status}: ${text}` };
    }
    return await response.json();
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
