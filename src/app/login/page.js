export default function LoginPage() {
  return (
    <main style={{ maxWidth: 320, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Login</h1>
      <form action="/api/auth/login" method="post">
        <div style={{ marginBottom: "0.75rem" }}>
          <label htmlFor="username">Username</label>
          <br />
          <input id="username" name="username" type="text" autoComplete="username" required />
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label htmlFor="password">Password</label>
          <br />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <button type="submit">Sign in</button>
      </form>
    </main>
  );
}
