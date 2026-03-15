<template>
  <div class="symphony-view">
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-icon"></span>
        <span class="logo-text">Symphony</span>
      </div>
      <nav class="nav-group">
        <el-button class="nav-item nav-item--active" text @click="goKanban">
          <span class="nav-icon"></span>
          Board
        </el-button>
        <el-button class="nav-item" text @click="goReview">
          <span class="nav-icon nav-icon--check"></span>
          Review Center
        </el-button>
        <el-button class="nav-item" text>
          <span class="nav-icon nav-icon--archive"></span>
          Archive
        </el-button>
      </nav>
      <div class="nav-spacer"></div>
      <el-button class="nav-item" text @click="goSettings">
        <span class="nav-icon nav-icon--settings"></span>
        Settings
      </el-button>
    </aside>

    <main class="main-content">
      <header class="main-header">
        <div class="header-left">
          <div class="header-title">Active Workspace</div>
          <span class="header-badge">Sprint 42</span>
        </div>
        <div class="header-actions">
          <el-button class="header-button header-button--ghost" text @click="goCreateTask">
            <span class="button-icon"></span>
            New Issue
          </el-button>
          <el-button class="header-button header-button--primary" @click="goSession">
            <span class="button-icon button-icon--play"></span>
            Run Agent
          </el-button>
        </div>
      </header>

      <section class="board">
        <div class="board-col">
          <div class="col-header">
            <div class="col-title">Backlog</div>
            <div class="col-count">3</div>
          </div>
          <div class="card">
            <div class="card-header">
              <span class="card-id">SYS-42</span>
              <span class="card-tag">feature</span>
            </div>
            <div class="card-title">Implement drag and drop for Kanban cards</div>
          </div>
        </div>

        <div class="board-col board-col--warning">
          <div class="col-subtitle">
            <span class="dot dot--warning"></span>
            定时任务
          </div>
          <div class="col-header">
            <div class="col-title">
              <span class="dot dot--warning"></span>
              In Progress
            </div>
            <div class="col-count">1</div>
          </div>
          <div class="card">
            <div class="card-header">
              <span class="card-id">SYS-45</span>
              <span class="card-tag card-tag--primary">ci-required</span>
            </div>
            <div class="card-title">Add Workspace API endpoints</div>
            <div class="card-footer card-footer--warning">
              <span class="dot dot--warning"></span>
              Running tests...
            </div>
          </div>
        </div>

        <div class="board-col">
          <div class="col-header">
            <div class="col-title">
              <span class="dot dot--primary"></span>
              Review
            </div>
          </div>
          <div class="card">
            <div class="card-header">
              <span class="card-id">SYS-40</span>
              <span class="card-tag">bugfix</span>
            </div>
            <div class="card-title">Fix issue state synchronization loop</div>
            <div class="card-footer">
              <div class="footer-row">
                <span class="footer-item">
                  <span class="dot dot--muted"></span>
                  4 files
                </span>
                <span class="footer-item footer-item--success">
                  <span class="dot dot--success"></span>
                  CI Pass
                </span>
              </div>
              <el-button class="footer-button" @click="goReview">
                Review PR
              </el-button>
            </div>
          </div>
        </div>

        <div class="board-col">
          <div class="col-header">
            <div class="col-title">
              <span class="dot dot--success"></span>
              Done
            </div>
          </div>
          <div class="card card--muted">
            <div class="card-header">
              <span class="card-id">SYS-31</span>
              <span class="card-tag">chore</span>
            </div>
            <div class="card-title card-title--muted">
              Update dependencies to latest versions
            </div>
          </div>
        </div>

        <div class="board-col">
          <div class="col-header">
            <div class="col-title">
              <span class="dot dot--danger"></span>
              Blocked
            </div>
          </div>
          <div class="card card--danger">
            <div class="card-header">
              <span class="card-id card-id--danger">SYS-39</span>
              <span class="card-tag card-tag--danger">blocked</span>
            </div>
            <div class="card-title">Docker build failing on arm64 architectures</div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

const goKanban = () => router.push("/board/kanban-board-view");
const goReview = () => router.push("/review/review-view");
const goSettings = () => router.push("/settings/global-settings-view");
const goCreateTask = () => router.push("/tasks/create-task-modal");
const goSession = () => router.push("/sessions/web-session-run");
</script>

<style scoped>
.symphony-view {
  display: flex;
  min-height: 900px;
  width: 100%;
  background: #000000;
  color: #f0f6fc;
  font-family: "DM Sans", "Space Grotesk", system-ui, -apple-system, sans-serif;
}

.sidebar {
  width: 240px;
  padding: 24px 16px;
  background: #000000;
  border-right: 1px solid #000000;
  display: flex;
  flex-direction: column;
  gap: 32px;
  box-sizing: border-box;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px;
  color: #000000;
}

.logo-icon {
  width: 24px;
  height: 24px;
  background: #000000;
  border-radius: 6px;
}

.logo-text {
  font-family: "Space Grotesk", "DM Sans", sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #000000;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: #000000;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  justify-content: flex-start;
}

.nav-item--active {
  background: #000000;
}

.nav-icon {
  width: 18px;
  height: 18px;
  background: #000000;
  border-radius: 4px;
}

.nav-icon--check,
.nav-icon--archive,
.nav-icon--settings {
  background: #000000;
}

.nav-spacer {
  flex: 1;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  box-sizing: border-box;
}

.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-title {
  font-family: "Space Grotesk", "DM Sans", sans-serif;
  font-size: 24px;
  font-weight: 600;
}

.header-badge {
  padding: 4px 8px;
  border-radius: 4px;
  background: #161b22;
  border: 1px solid #30363d;
  font-size: 12px;
  color: #8b949e;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #30363d;
  background: #161b22;
  color: #f0f6fc;
}

.header-button--primary {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
}

.button-icon {
  width: 16px;
  height: 16px;
  background: #f0f6fc;
  border-radius: 4px;
}

.button-icon--play {
  background: #ffffff;
}

.board {
  display: flex;
  gap: 24px;
  flex: 1;
}

.board-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  background: #161b22;
  border: 1px solid #30363d;
}

.board-col--warning {
  border: 2px solid #f57c00;
}

.col-subtitle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 600;
  color: #f57c00;
}

.col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.col-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: "Space Grotesk", "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #f0f6fc;
}

.col-count {
  font-size: 14px;
  color: #8b949e;
}

.card {
  padding: 12px;
  border-radius: 6px;
  background: #0b0c10;
  border: 1px solid #30363d;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card--muted {
  opacity: 0.7;
}

.card--danger {
  border-color: #f85149;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-id {
  font-family: "Fira Code", monospace;
  font-size: 12px;
  color: #8b949e;
}

.card-id--danger {
  color: #f85149;
}

.card-tag {
  padding: 2px 6px;
  border-radius: 4px;
  background: #161b22;
  border: 1px solid #30363d;
  font-size: 11px;
  color: #8b949e;
}

.card-tag--primary {
  border-color: #3b82f6;
  color: #3b82f6;
}

.card-tag--danger {
  background: rgba(248, 81, 73, 0.1);
  color: #f85149;
  border: none;
}

.card-title {
  font-size: 13px;
  color: #f0f6fc;
}

.card-title--muted {
  color: #8b949e;
}

.card-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid #30363d;
  padding-top: 8px;
}

.card-footer--warning {
  color: #d29922;
  font-size: 11px;
}

.footer-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #8b949e;
}

.footer-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.footer-item--success {
  color: #238636;
}

.footer-button {
  width: 100%;
  padding: 6px 0;
  border-radius: 4px;
  background: #3b82f6;
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  border: none;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: #8b949e;
}

.dot--warning {
  background: #d29922;
}

.dot--primary {
  background: #3b82f6;
}

.dot--success {
  background: #238636;
}

.dot--danger {
  background: #f85149;
}
</style>
