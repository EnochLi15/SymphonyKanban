<template>
  <div class="page">
    <aside class="sidebar">
      <div class="brand">Symphony Kanban</div>
      <div class="badge">Sidebar</div>
      <nav class="nav">
        <div class="nav-item">General</div>
        <div class="nav-item">Security</div>
        <div class="nav-item">Billing</div>
      </nav>
    </aside>
    <main class="content">
      <header class="header">
        <h1>Global Settings View</h1>
        <p>Global configuration form generated from UX frame.</p>
      </header>
      <section class="section">
        <h2>Settings Form</h2>
        <p>System-wide preferences and controls appear here.</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
  background: #0b0f14;
  color: #e6edf3;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial,
    "Noto Sans", "Liberation Sans", sans-serif;
}
.sidebar {
  background: #0f141b;
  border-right: 1px solid #202836;
  padding: 24px 16px;
}
.brand {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
}
.badge {
  display: inline-block;
  font-size: 12px;
  color: #9fb3c8;
}
.nav {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.nav-item {
  background: #111a25;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #1f2a37;
  color: #9fb3c8;
}
.content {
  padding: 32px;
}
.header h1 {
  margin: 0 0 8px;
  font-size: 24px;
}
.section {
  background: #101822;
  border: 1px solid #202836;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
}
</style>
