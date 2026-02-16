<template>
  <div class="setup-page">
    <div class="container">
      <header class="page-header">
        <h1>How to Setup Chrono</h1>
        <p class="subtitle">Install Chrono, import your 9C account, and configure networks.</p>
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
            <h3>Edit Odin</h3>
            <ol class="list">
              <li>Click the pencil icon next to <strong>Odin</strong>.</li>
              <li>Change the <strong>GQL Endpoint</strong> to:<br /><code>https://odin-rpc-2.nine-chronicles.com/graphql</code></li>
              <li>Press <strong>Save</strong>.</li>
            </ol>
          </div>

          <div class="subcard">
            <h3>Add Thor</h3>
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

        <section class="card step">
          <div class="step-head">
            <span class="step-num">4</span>
            <h2>All Set</h2>
          </div>
          <p class="text">Return to the marketplace and click <strong>Login with Chrono</strong> to connect.</p>
        </section>
      </div>

      <div class="actions">
        <router-link to="/" class="btn btn-primary">Back to Marketplace</router-link>
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
  background: #0a0e27;
  color: #e2e8f0;
  padding: 2rem 0;
}
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1.25rem;
}
.page-header h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 800;
}
.page-header .subtitle {
  color: #a0aec0;
  margin: 0.5rem 0 1.25rem 0;
}
.steps {
  display: grid;
  gap: 1rem;
}
.card.step {
  background: #1a1f3a;
  border: 1px solid #2d3748;
  border-radius: 8px;
  padding: 1.25rem 1.25rem;
}
.step-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}
.step-head h2 {
  margin: 0;
  font-size: 1.15rem;
}
.step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  font-size: 0.9rem;
}
.text {
  color: #cbd5e0;
}
.subcard {
  margin-top: 0.75rem;
  padding: 0.9rem 1rem;
  border: 1px solid #2d3748;
  border-radius: 8px;
  background: #171c34;
}
.subcard h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #e2e8f0;
}
.illustration {
  margin: 0.75rem 0 1rem 0;
  text-align: center;
}
.illustration img {
  width: 30%;
  max-width: 360px;
  border-radius: 8px;
  border: 1px solid #2d3748;
  background: #0a0e27;
}
.img-caption {
  margin-top: 0.5rem;
  color: #94a3b8;
  font-size: 0.9rem;
}
.illustration.placeholder .img-missing {
  padding: 0.85rem 1rem;
  border: 1px dashed #374151;
  border-radius: 8px;
  color: #a0aec0;
  background: #0f1430;
  display: inline-block;
}
.list {
  margin: 0.25rem 0 0.75rem 1.25rem;
}
code {
  background: #111827;
  border: 1px solid #374151;
  border-radius: 4px;
  padding: 0.1rem 0.3rem;
  color: #93c5fd;
  word-break: break-all;
}
.kv {
  list-style: none;
  padding: 0;
  margin: 0.25rem 0 0.75rem 0;
  display: grid;
  gap: 0.35rem;
}
.kv li {
  display: grid;
  grid-template-columns: 140px 1fr;
  align-items: center;
  gap: 0.5rem;
  color: #cbd5e0;
}
.kv li span {
  color: #94a3b8;
}
.note {
  color: #94a3b8;
  font-size: 0.95rem;
  margin: 0.5rem 0 0 0;
}
.btn {
  display: inline-block;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
}
.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}
.btn-primary:hover {
  filter: brightness(1.05);
}
.actions {
  margin-top: 1.25rem;
}
</style>

