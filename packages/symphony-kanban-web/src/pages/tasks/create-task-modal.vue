<template>
  <div class="overlay">
    <div class="dialog">
      <header class="header">
        <h1>Create Task Modal</h1>
        <p>Modal dialog generated from UX frame.</p>
      </header>
      <section class="section">
        <h2>Form Fields</h2>
        <p>Task title, description, and schedule inputs appear here.</p>
      </section>
      <section class="actions">
        <button class="btn secondary" type="button">Cancel</button>
        <button class="btn primary" type="button">Create Task</button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: rgba(7, 10, 14, 0.85);
  color: #e6edf3;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial,
    "Noto Sans", "Liberation Sans", sans-serif;
  padding: 24px;
}
.dialog {
  width: min(640px, 100%);
  background: #0f141b;
  border: 1px solid #202836;
  border-radius: 12px;
  padding: 24px;
  display: grid;
  gap: 16px;
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
}
.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
.btn {
  border-radius: 8px;
  padding: 8px 16px;
  border: 1px solid transparent;
  cursor: pointer;
}
.btn.primary {
  background: #2563eb;
  color: #ffffff;
}
.btn.secondary {
  background: #111a25;
  color: #e6edf3;
  border-color: #1f2a37;
}
</style>
