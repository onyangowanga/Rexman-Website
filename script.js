const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const projects = window.REXMAN_PROJECTS || [];
const heroImage = document.querySelector('.hero-image');
const heroTitle = document.querySelector('#hero-title');
const heroCopy = document.querySelector('#hero-copy');
const heroFallback = { image: 'photos/hero photos/st-bakhita-kitengela-entry.jpeg', title: 'Building <em>excellence.</em><br>Delivering value.', copy: 'A trusted Kenyan construction and engineering partner delivering quality projects with professional expertise, integrated services and timely execution.' };
const heroMessages = [
  ['Building <em>with purpose.</em>', 'Reliable construction solutions shaped around your vision, budget and timeline.'],
  ['Spaces made <em>to last.</em>', 'From foundations to finishes, our team delivers quality at every stage.'],
  ['Engineering <em>confidence.</em>', 'Professional expertise and careful execution for residential, commercial and institutional work.']
];
const startHeroSlideshow = (heroSlides) => {
  if (!heroImage || !heroTitle || !heroCopy || heroSlides.length < 2) return;
  let heroIndex = 0;
  const showHeroSlide = () => {
    heroImage.classList.add('is-changing');
    heroTitle.classList.add('is-changing');
    heroCopy.classList.add('is-changing');
    window.setTimeout(() => {
      heroIndex = (heroIndex + 1) % heroSlides.length;
      const slide = heroSlides[heroIndex];
      const message = heroMessages[heroIndex % heroMessages.length];
      heroImage.style.backgroundImage = `url("${slide.image}")`;
      heroTitle.innerHTML = message[0];
      heroCopy.textContent = message[1];
      heroImage.classList.remove('is-changing');
      heroTitle.classList.remove('is-changing');
      heroCopy.classList.remove('is-changing');
    }, 350);
  };
  window.setInterval(showHeroSlide, 6000);
};
if (heroImage && heroTitle && heroCopy) {
  fetch('https://api.github.com/repos/onyangowanga/Rexman-Website/contents/photos/hero%20photos')
    .then((response) => {
      if (!response.ok) throw new Error(`Hero image listing failed: ${response.status}`);
      return response.json();
    })
    .then((files) => {
      const heroSlides = files
        .filter((file) => file.type === 'file' && /\.(jpe?g|png|webp)$/i.test(file.name))
        .sort((first, second) => first.name.localeCompare(second.name))
        .map((file) => ({ image: file.download_url }));
      startHeroSlideshow(heroSlides.length ? heroSlides : [heroFallback]);
    })
    .catch((error) => {
      console.error('Hero slideshow could not load folder images', error);
      startHeroSlideshow([heroFallback]);
    });
}
const placeholderByGroup = { "Completed Projects": "assets/project-residential.svg", "Commercial & Corporate Projects": "assets/project-commercial.svg", "Renovation & Refurbishment Projects": "assets/project-renovation.svg", "Ongoing Projects": "assets/project-residential.svg", "Upcoming Projects": "assets/project-fitout.svg" };
const categoryKey = (project) => project.category.includes('Commercial') || project.category.includes('Office') || project.category.includes('Institutional') ? 'Commercial' : project.category.includes('Fit-Out') ? 'Fit-Outs' : project.category.includes('Renovation') || project.category.includes('Exterior') ? 'Renovations' : 'Residential';
const projectImages = (project) => (project.photos?.length ? project.photos : [placeholderByGroup[project.group] || 'assets/project-residential.svg']);
const discoverProjectImages = async (project) => {
  const fallback = projectImages(project);
  const firstPhoto = project.photos?.[0];
  const prefix = project.photoPrefix || firstPhoto?.replace(/-\d+\.[^/]+$/, '');
  if (!prefix) return fallback;
  const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.jpg.png'];
  const discovered = [];
  let emptyNumbers = 0;
  for (let number = 1; number <= 20 && emptyNumbers < 2; number += 1) {
    let found = false;
    for (const extension of extensions) {
      const source = `${prefix}-${String(number).padStart(2, '0')}${extension}`;
      try {
        await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = resolve;
          image.onerror = reject;
          image.src = source;
        });
        discovered.push(source);
        found = true;
        break;
      } catch {
        // Try the next supported extension.
      }
    }
    emptyNumbers = found ? 0 : emptyNumbers + 1;
  }
  return discovered.length ? discovered : fallback;
};
const watermarkedImage = (source, name) => `<div class="project-image"><img src="${source}" alt="${name}"><img class="image-watermark" src="Rexman_Logo.png" alt="" aria-hidden="true"></div>`;
const projectCard = async (project) => {
  const image = (await discoverProjectImages(project))[0];
  return `<article class="project-card reveal project-data-card" data-category="${categoryKey(project)}" data-status="${project.status}" data-project-index="${projects.indexOf(project)}"><button class="project-card-button" aria-label="View ${project.name} details"><div class="project-photo">${watermarkedImage(image, project.name)}</div><div class="project-meta"><div><span><i class="category-badge">${project.category}</i><i class="status-badge status-${project.status.toLowerCase()}">${project.status}</i></span><h3>${project.name}</h3><small>${project.location || 'Kenya'}${project.year ? ` · ${project.year}` : ''}</small></div><b>View details ↗</b></div></button></article>`;
};
const portfolioGroups = document.querySelector('[data-project-groups]');
const renderProjectGrids = async () => {
  await Promise.all([...document.querySelectorAll('[data-projects]')].map(async (grid) => {
    const mode = grid.dataset.projects;
    const filtered = mode === 'featured' ? projects.filter((p) => p.group === 'Completed Projects').slice(0, 6) : mode === 'ongoing' ? projects.filter((p) => p.status === 'Ongoing').slice(0, 4) : mode === 'upcoming' ? projects.filter((p) => p.status === 'Upcoming') : projects;
    grid.innerHTML = (await Promise.all(filtered.map(projectCard))).join('');
    grid.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
  }));
};
const renderPortfolioGroups = async (filter = 'all') => {
  if (!portfolioGroups) return;
  const filtered = projects.filter((project) => filter === 'all' || filter === categoryKey(project) || filter === project.status);
  const groups = [...new Set(filtered.map((project) => project.group))];
  const groupMarkup = await Promise.all(groups.map(async (group, groupIndex) => {
    const groupProjects = filtered.filter((project) => project.group === group);
    const isOpen = filter !== 'all' || groupIndex === 0;
    return `<details class="project-group" ${isOpen ? 'open' : ''}><summary><span>${group}</span><b>${groupProjects.length} ${groupProjects.length === 1 ? 'project' : 'projects'} <i>+</i></b></summary><div class="project-grid">${(await Promise.all(groupProjects.map(projectCard))).join('')}</div></details>`;
  }));
  portfolioGroups.innerHTML = groupMarkup.join('');
  if (typeof observer !== 'undefined') portfolioGroups.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
};
const modal = document.querySelector('.project-modal');
const openModal = async (project) => {
  document.querySelector('#modal-gallery').innerHTML = (await discoverProjectImages(project)).map((photo) => watermarkedImage(photo, project.name)).join('');
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
renderProjectGrids();
renderPortfolioGroups();

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
    renderPortfolioGroups(filter);
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
