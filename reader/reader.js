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
  document.getElementById('tab-admin').style.display = 'none';
  switchPage('library');
  renderHours();
  renderLibrarians();
  renderChess();
  checkNotifications();
}