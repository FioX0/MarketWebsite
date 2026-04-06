<template>
  <div class="setup-page">
    <div class="bg-glow"></div>
    <div class="container">
      <header class="page-header">
        <div class="header-badge">Setup Guide</div>
        <h1>How to Setup <span class="brand">Chrono</span></h1>
        <p class="subtitle">Install Chrono, import your 9C account, and configure networks in a few steps.</p>
      </header>

      <div class="steps">
        <section class="card step">
          <div class="step-head">
            <span class="step-num">1</span>
            <h2>Install Chrono Wallet</h2>
          </div>
          <p class="text">
            Download and install the Chrono browser extension from
            <a href="https://chrono.nine-chronicles.dev" target="_blank" rel="noopener">chrono.nine-chronicles.dev</a>.
          </p>
        </section>

        <section class="card step">
          <div class="step-head">
            <span class="step-num">2</span>
            <h2>Create a Chrono Address and Import Your 9C Key</h2>
          </div>
          <p class="text">Create a normal Chrono address first. Then:</p>
          <ol class="list">
            <li>Click <strong>Account 1</strong> (top of the wallet).</li>
            <li>Select <strong>Import</strong>.</li>
            <li>Choose type <strong>RAW</strong>.</li>
            <li>Paste your 9C <strong>private key</strong>.</li>
          </ol>
          <p class="note">This creates a new entry (e.g., <strong>Account 2</strong>) which is your 9C address.</p>
        </section>

        <section class="card step">
          <div class="step-head">
            <span class="step-num">3</span>
            <h2>Configure Networks</h2>
          </div>
          <p class="text">
            In Chrono, click the network name at the top-left (e.g., <strong>Odin</strong>) to open the network list and edit.
          </p>

          <div class="illustration" v-if="!imgLoadError">
            <img
              src="/images/chrono-network-list.png"
              alt="Chrono network list and edit buttons"
              @error="imgLoadError = true"
              draggable="false"
            />
            <div class="img-caption">Open the network list and click the pencil next to Odin to edit.</div>
          </div>
          <div class="illustration placeholder" v-else>
            <div class="img-missing">
              Image not found. Place your screenshot at:
              <code>/public/images/chrono-network-list.png</code>
            </div>
          </div>

          <div class="subcard">
            <div class="subcard-label">Edit Odin</div>
            <ol class="list">
              <li>Click the pencil icon next to <strong>Odin</strong>.</li>
              <li>Change the <strong>GQL Endpoint</strong> to:<br /><code>https://odin-rpc-2.nine-chronicles.com/graphql</code></li>
              <li>Press <strong>Save</strong>.</li>
            </ol>
          </div>

          <div class="subcard">
            <div class="subcard-label">Add Thor</div>
            <ol class="list">
              <li>Close Odin, click <strong>Add New</strong>.</li>
              <li>Add the following values:</li>
            </ol>
            <ul class="kv">
              <li><span>Planet ID</span><code>0x000000000002</code></li>
              <li><span>Name</span><code>Thor</code></li>
              <li><span>Genesis hash</span><code>7eacf897e54eb4ba5e1b99050e77aaa74d514b98b0eaab2eee25189e8c801228</code></li>
              <li><span>GQL Endpoint</span><code>https://thor-rpc-1.nine-chronicles.com/graphql</code></li>
            </ul>
            <ol class="list">
              <li>Press <strong>Save</strong>.</li>
            </ol>
          </div>
        </section>

        <section class="card step step-final">
          <div class="step-head">
            <span class="step-num step-num-done">✓</span>
            <h2>All Set</h2>
          </div>
          <p class="text">Return to the marketplace and click <strong>Login with Chrono</strong> to connect.</p>
        </section>
      </div>

      <div class="actions">
        <router-link to="/" class="btn btn-primary">
          <span>←</span> Back to Marketplace
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const imgLoadError = ref(false)
</script>

<style scoped>
.setup-page {
  min-height: 100vh;
  background: #080b20;
  color: #e2e8f0;
  padding: 2.5rem 0 4rem;
  position: relative;
  overflow: hidden;
  background-image:
    radial-gradient(ellipse 80% 40% at 50% -10%, rgba(99, 102, 241, 0.1) 0%, transparent 60%),
    url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.012'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.bg-glow {
  position: fixed;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 200px;
  background: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.08) 0%, transparent 65%);
  pointer-events: none;
  z-index: 0;
}

.container {
  max-width: 780px;
  margin: 0 auto;
  padding: 0 1.5rem;
  position: relative;
  z-index: 1;
}

/* Header */
.page-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.header-badge {
  display: inline-block;
  padding: 0.25rem 0.875rem;
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #a5b4fc;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.page-header h1 {
  margin: 0 0 0.75rem;
  font-size: 2rem;
  font-weight: 800;
  color: #e2e8f0;
  letter-spacing: -0.5px;
}

.brand {
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-header .subtitle {
  color: #64748b;
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  max-width: 500px;
  margin: 0 auto;
}

/* Steps */
.steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
}

.steps::before {
  content: '';
  position: absolute;
  left: 22px;
  top: 28px;
  bottom: 28px;
  width: 1px;
  background: linear-gradient(to bottom, rgba(99, 102, 241, 0.3), rgba(99, 102, 241, 0.05));
  pointer-events: none;
}

.card.step {
  background: linear-gradient(160deg, rgba(19, 24, 48, 0.95) 0%, rgba(14, 18, 36, 0.95) 100%);
  border: 1px solid rgba(30, 37, 69, 0.9);
  border-radius: 14px;
  padding: 1.5rem;
  backdrop-filter: blur(8px);
  transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}

.card.step:hover {
  border-color: rgba(99, 102, 241, 0.2);
  box-shadow: 0 8px 28px rgba(0,0,0,0.35), 0 0 0 1px rgba(99, 102, 241, 0.05);
}

.step-final {
  border-color: rgba(16, 185, 129, 0.25) !important;
  background: linear-gradient(160deg, rgba(6, 28, 24, 0.9) 0%, rgba(4, 18, 16, 0.9) 100%) !important;
}

.step-final:hover {
  border-color: rgba(16, 185, 129, 0.4) !important;
  box-shadow: 0 8px 28px rgba(16, 185, 129, 0.08) !important;
}

.step-head {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.step-head h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #e2e8f0;
}

.step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-weight: 800;
  background: linear-gradient(135deg, #5f63f0 0%, #8b5cf6 100%);
  color: #fff;
  font-size: 0.95rem;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
}

.step-num-done {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35) !important;
}

.text {
  color: #94a3b8;
  line-height: 1.65;
  margin: 0 0 0.75rem;
  font-size: 0.93rem;
}

.text:last-child {
  margin-bottom: 0;
}

a {
  color: #818cf8;
  text-decoration: none;
  border-bottom: 1px solid rgba(129, 140, 248, 0.3);
  transition: color 0.15s, border-color 0.15s;
}

a:hover {
  color: #a5b4fc;
  border-bottom-color: rgba(165, 180, 252, 0.5);
}

.subcard {
  margin-top: 1rem;
  padding: 1rem 1.125rem;
  border: 1px solid rgba(30, 37, 69, 0.9);
  border-radius: 10px;
  background: rgba(8, 10, 22, 0.5);
}

.subcard-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: #6366f1;
  margin-bottom: 0.625rem;
}

.illustration {
  margin: 1rem 0;
  text-align: center;
}

.illustration img {
  width: 32%;
  max-width: 320px;
  border-radius: 10px;
  border: 1px solid rgba(30, 37, 69, 0.9);
  background: #0a0e27;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}

.img-caption {
  margin-top: 0.6rem;
  color: #4b5563;
  font-size: 0.83rem;
  font-style: italic;
}

.illustration.placeholder .img-missing {
  padding: 0.875rem 1.125rem;
  border: 1px dashed rgba(55, 65, 81, 0.6);
  border-radius: 8px;
  color: #4b5563;
  background: rgba(10, 12, 28, 0.4);
  display: inline-block;
  font-size: 0.875rem;
}

.list {
  margin: 0.35rem 0 0.875rem 1.25rem;
  color: #94a3b8;
  line-height: 1.7;
  font-size: 0.9rem;
}

.list:last-child {
  margin-bottom: 0;
}

.list strong {
  color: #cbd5e0;
  font-weight: 600;
}

code {
  background: rgba(17, 24, 39, 0.9);
  border: 1px solid rgba(55, 65, 81, 0.7);
  border-radius: 5px;
  padding: 0.12rem 0.4rem;
  color: #93c5fd;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.82em;
  word-break: break-all;
}

.kv {
  list-style: none;
  padding: 0;
  margin: 0.35rem 0 0.875rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.kv li {
  display: grid;
  grid-template-columns: 140px 1fr;
  align-items: start;
  gap: 0.5rem;
  font-size: 0.875rem;
  padding: 0.35rem 0;
  border-bottom: 1px solid rgba(20, 25, 50, 0.7);
}

.kv li:last-child {
  border-bottom: none;
}

.kv li span {
  color: #6b7280;
  font-size: 0.82rem;
  font-weight: 500;
  padding-top: 0.1rem;
}

.note {
  color: #4b5563;
  font-size: 0.875rem;
  margin: 0.625rem 0 0;
  padding: 0.625rem 0.875rem;
  background: rgba(10, 12, 28, 0.4);
  border-radius: 7px;
  border-left: 3px solid rgba(99, 102, 241, 0.3);
}

.note strong {
  color: #6b7280;
  font-weight: 600;
}

/* Actions */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.375rem;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  transition: all 0.18s ease;
  letter-spacing: 0.2px;
}

.btn-primary {
  background: linear-gradient(135deg, #5f63f0 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.btn-primary:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
  box-shadow: 0 6px 22px rgba(99, 102, 241, 0.4);
  border-bottom-color: rgba(165, 180, 252, 0) !important;
  color: white;
}

.actions {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

@media (max-width: 600px) {
  .setup-page { padding: 1.5rem 0 3rem; }
  .page-header h1 { font-size: 1.5rem; }
  .container { padding: 0 1rem; }
  .card.step { padding: 1.125rem; }
  .steps::before { display: none; }
  .kv li { grid-template-columns: 110px 1fr; }
}
</style>
