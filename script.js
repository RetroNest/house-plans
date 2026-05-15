const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const inquiryForm = document.querySelector('.contact-form');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.addEventListener('click', (event) => {
  if (event.target.matches('a')) {
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});

inquiryForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const button = inquiryForm.querySelector('button');
  button.textContent = 'Thanks — we will be in touch!';
  button.disabled = true;
});
