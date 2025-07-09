document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const applyStored = () => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      document.body.classList.add('dark-mode');
    }
  };

  applyStored();

  btn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const mode = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', mode);
  });
});
