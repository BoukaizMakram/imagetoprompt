export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="text-sm text-ink/70 hover:text-ink px-3 py-1.5 rounded-full border border-black/10 hover:border-black/30"
      >
        Sign out
      </button>
    </form>
  );
}
