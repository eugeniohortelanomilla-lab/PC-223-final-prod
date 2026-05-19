function getApiBase() {
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
    if (!response.ok) {
      const text = await response.text();
      let message = text;
      try {
        const json = JSON.parse(text);
        if (json.error) message = json.error;
      } catch (_) { /* not JSON */ }
      return { success: false, error: `Server error ${response.status}: ${message}` };
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
