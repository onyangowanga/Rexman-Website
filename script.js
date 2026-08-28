const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const projects = window.REXMAN_PROJECTS || [];
const placeholderByGroup = { "Completed Projects": "assets/project-residential.svg", "Commercial & Corporate Projects": "assets/project-commercial.svg", "Renovation & Refurbishment Projects": "assets/project-renovation.svg", "Ongoing Projects": "assets/project-residential.svg", "Upcoming Projects": "assets/project-fitout.svg" };
const categoryKey = (project) => project.category.includes('Commercial') || project.category.includes('Office') ? 'Commercial' : project.category.includes('Fit-Out') ? 'Fit-Outs' : project.category.includes('Renovation') || project.category.includes('Exterior') ? 'Renovations' : 'Residential';
const projectImages = (project) => (project.photos?.length ? project.photos : [placeholderByGroup[project.group] || 'assets/project-residential.svg']);
const watermarkedImage = (source, name) => `<div class="project-image"><img src="${source}" alt="${name}"><img class="image-watermark" src="Rexman_Logo.png" alt="" aria-hidden="true"></div>`;
const projectCard = (project, index) => {
  const images = projectImages(project).slice(0, 2);
  return `<article class="project-card reveal project-data-card ${index === 0 ? 'project-large' : ''}" data-category="${categoryKey(project)}" data-status="${project.status}" data-project-index="${projects.indexOf(project)}"><button class="project-card-button" aria-label="View ${project.name} details"><div class="project-photo project-photo-pair">${images.map((image) => watermarkedImage(image, project.name)).join('')}</div><div class="project-meta"><div><span><i class="category-badge">${project.category}</i><i class="status-badge status-${project.status.toLowerCase()}">${project.status}</i></span><h3>${project.name}</h3><small>${project.location || 'Kenya'}${project.year ? ` · ${project.year}` : ''}</small></div><b>View details ↗</b></div></button></article>`;
};
document.querySelectorAll('[data-projects]').forEach((grid) => {
  const mode = grid.dataset.projects;
  const filtered = mode === 'featured' ? projects.filter((p) => p.group === 'Completed Projects').slice(0, 4) : mode === 'ongoing' ? projects.filter((p) => p.status === 'Ongoing').slice(0, 4) : mode === 'upcoming' ? projects.filter((p) => p.status === 'Upcoming') : projects;
  grid.innerHTML = filtered.map(projectCard).join('');
});
const modal = document.querySelector('.project-modal');
const openModal = (project) => {
  document.querySelector('#modal-gallery').innerHTML = projectImages(project).map((photo) => watermarkedImage(photo, project.name)).join('');
  document.querySelector('#modal-category').textContent = project.category;
  document.querySelector('#modal-status').textContent = project.status;
  document.querySelector('#modal-title').textContent = project.name;
  document.querySelector('#modal-meta').textContent = [project.client, project.location, project.year].filter(Boolean).join(' · ');
  document.querySelector('#modal-description').textContent = project.description || '';
  modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open');
};
document.addEventListener('click', (event) => { const card = event.target.closest('[data-project-index]'); if (card) openModal(projects[Number(card.dataset.projectIndex)]); if (event.target.closest('[data-close-modal]')) { modal?.classList.remove('open'); modal?.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); } });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { modal?.classList.remove('open'); modal?.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); } });

menuButton?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

document.querySelectorAll('.counter').forEach((counter) => {
  const target = Number(counter.dataset.target);
  const animate = () => {
    const value = Number(counter.textContent);
    const next = Math.min(target, value + Math.max(1, Math.ceil(target / 35)));
    counter.textContent = String(next);
    if (next < target) requestAnimationFrame(animate);
  };
  const statsObserver = new IntersectionObserver(([entry], currentObserver) => {
    if (entry.isIntersecting) { animate(); currentObserver.disconnect(); }
  }, { threshold: 0.1 });
  statsObserver.observe(counter.closest('.stats') || counter);
});

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    const filter = button.dataset.filter;
    document.querySelectorAll('.portfolio-grid [data-category]').forEach((card) => {
      card.hidden = filter !== 'all' && filter !== card.dataset.category && filter !== card.dataset.status;
    });
  });
});

const emailConfig = window.REXMAN_EMAILJS || {
  publicKey: 'REPLACE_WITH_EMAILJS_PUBLIC_KEY',
  serviceId: 'REPLACE_WITH_EMAILJS_SERVICE_ID',
  templateId: 'REPLACE_WITH_EMAILJS_TEMPLATE_ID'
};
if (window.emailjs && !emailConfig.publicKey.startsWith('REPLACE_')) emailjs.init({ publicKey: emailConfig.publicKey });

document.querySelector('#quote-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector('.form-status');
  if (emailConfig.publicKey.startsWith('REPLACE_')) {
    status.textContent = 'Email enquiry is not configured yet. Please use the WhatsApp quote button.';
    return;
  }
  status.textContent = 'Sending your enquiry…';
  try {
    await emailjs.sendForm(emailConfig.serviceId, emailConfig.templateId, form);
    status.textContent = 'Thank you — your enquiry has been sent. We will be in touch shortly.';
    form.reset();
  } catch (error) {
    console.error('EmailJS enquiry failed', error);
    status.textContent = 'We could not send the enquiry. Please call or use WhatsApp instead.';
  }
});
