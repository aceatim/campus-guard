<template>
  <header class="navbar">
    <div class="logo">CAMPUSGUARD</div>
    <nav>
      <router-link to="/" active-class="active-link"
        >🎥 Camera Feed</router-link
      >
      <router-link to="/dashboard" active-class="active-link"
        >📊 Alert Dashboard</router-link
      >
    </nav>
  </header>
  <main class="content-wrapper">
    <router-view />
  </main>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background-color: var(--color-bg-secondary);
  border-bottom: 3px solid var(--color-accent-blue);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.logo {
  font-size: 1.5em;
  font-weight: 700;
  color: var(--color-accent-blue);
  letter-spacing: 1px;
}

nav a {
  margin-left: 25px;
  padding: 5px 10px;
  color: var(--color-text-secondary);
  transition: all 0.3s;
  border-radius: 4px;
}

nav a:hover {
  color: var(--color-text-primary);
  background-color: #3b4557;
}

.active-link {
  color: white !important;
  background-color: var(--color-accent-blue) !important;
  font-weight: bold;
}

.content-wrapper {
  padding: 20px;
}
</style>
