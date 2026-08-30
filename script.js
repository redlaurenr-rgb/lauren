/* ==========================================================================
   STUDENT PORTFOLIO — SCRIPT.JS
   --------------------------------------------------------------------------
   HOW THIS FILE IS ORGANIZED
   1. CATEGORY CONFIG      -> one object per section (Quizzes, Labs, etc.)
                               describing the form fields for that section.
                               Want a new field? Add it here — the form and
                               the card display update automatically.
   2. STORAGE HELPERS      -> read/write arrays of entries to localStorage.
   3. RENDERING            -> turn stored data into HTML on the page.
   4. MODAL (ADD/EDIT)     -> the pop-up form shared by every category.
   5. ABOUT ME             -> its own small modal (fixed set of fields).
   6. DELETE CONFIRMATION  -> shared "are you sure?" pop-up.
   7. THEME TOGGLE         -> light / dark mode, remembered in localStorage.
   8. NAVBAR ACTIVE STATE  -> highlights the current section while scrolling.
   9. INIT                 -> runs everything when the page loads.
   ========================================================================== */

/* ---------- 1. CATEGORY CONFIG ---------- */
const CATEGORIES = [
  {
    id: 'quizzes',
    storageKey: 'sp_quizzes',
    singular: 'Quiz',
    scoreField: 'score', // which field's value shows in the little "stamp" badge
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Quiz Title', type: 'text', required: true },
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'score', label: 'Score / Grade', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'image', label: 'Upload Picture', type: 'file' }
    ]
  },
  {
    id: 'labs',
    storageKey: 'sp_labs',
    singular: 'Laboratory Activity',
    scoreField: null,
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Activity Title', type: 'text', required: true },
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'objective', label: 'Objective', type: 'textarea' },
      { key: 'procedure', label: 'Procedure / Description', type: 'textarea' },
      { key: 'observation', label: 'Observation / Result', type: 'textarea' },
      { key: 'image', label: 'Upload Picture', type: 'file' }
    ]
  },
  {
    id: 'midterm',
    storageKey: 'sp_midterm',
    singular: 'Midterm Exam',
    scoreField: 'score',
    titleField: 'subject',
    fields: [
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'date', label: 'Exam Date', type: 'date', required: true },
      { key: 'score', label: 'Score / Grade', type: 'text', required: true },
      { key: 'description', label: 'Description / Reflection', type: 'textarea' },
      { key: 'image', label: 'Upload Picture', type: 'file' }
    ]
  },
  {
    id: 'final',
    storageKey: 'sp_final',
    singular: 'Final Exam',
    scoreField: 'score',
    titleField: 'subject',
    fields: [
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'date', label: 'Exam Date', type: 'date', required: true },
      { key: 'score', label: 'Score / Grade', type: 'text', required: true },
      { key: 'description', label: 'Description / Reflection', type: 'textarea' },
      { key: 'image', label: 'Upload Picture', type: 'file' }
    ]
  },
  {
    id: 'projects',
    storageKey: 'sp_projects',
    singular: 'Project',
    scoreField: null,
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Project Title', type: 'text', required: true },
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'tools', label: 'Tools / Technologies Used', type: 'text' },
      { key: 'image', label: 'Upload Picture', type: 'file' }
    ]
  }
];

const ABOUT_KEY = 'sp_about';

// Placeholder "About Me" data — edit through the "Edit Info" button,
// or just change these defaults directly.
const DEFAULT_ABOUT = {
  fullName: 'Red Lauren Reyes',
  age: '20',
  course: 'BS Computer Science',
  school: 'Cavite State University-Silang Campus',
  yearLevel: 'BSCS-3D',
  hobbies: 'Online games, Basketball',
  shortDesc: 'A curious student who loves learning new things and building small projects on the side.',
  welcome: "Hi! This is my personal portfolio, where I keep track of my quizzes, laboratory activities, exams, and projects — all in one place.",
  photo: 'profile.jpg' // default profile picture — replace this file to change it later
};

/* ---------- 2. STORAGE HELPERS ---------- */

// Get the saved list of entries for a category (or an empty array).
function getEntries(storageKey) {
  const raw = localStorage.getItem(storageKey);
  return raw ? JSON.parse(raw) : [];
}

// Save a category's full list of entries back to localStorage.
function saveEntries(storageKey, entries) {
  localStorage.setItem(storageKey, JSON.stringify(entries));
}

function getAbout() {
  const raw = localStorage.getItem(ABOUT_KEY);
  return raw ? { ...DEFAULT_ABOUT, ...JSON.parse(raw) } : { ...DEFAULT_ABOUT };
}

function saveAbout(data) {
  localStorage.setItem(ABOUT_KEY, JSON.stringify(data));
}

// Simple unique ID generator for new entries.
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ---------- 3. RENDERING ---------- */

function renderCategory(cat) {
  const grid = document.getElementById(`grid-${cat.id}`);
  const entries = getEntries(cat.storageKey);

  if (entries.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>No activities added yet. Click the "Add" button to create your first ${cat.singular.toLowerCase()}.</p>
      </div>`;
    return;
  }

  // Newest entries first.
  const sorted = [...entries].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  grid.innerHTML = sorted.map(entry => renderCard(cat, entry)).join('');
}

function renderCard(cat, entry) {
  const title = entry[cat.titleField] || cat.singular;
  const stamp = cat.scoreField && entry[cat.scoreField]
    ? `<span class="grade-stamp">${escapeHtml(entry[cat.scoreField])}</span>`
    : '';

  const photo = entry.image
    ? `<img class="entry-photo" src="${entry.image}" alt="${escapeHtml(title)} picture">`
    : `<div class="entry-photo-empty">No picture uploaded</div>`;

  // Every field except title/image/subject/date gets shown as a description line.
  const skip = new Set(['image', cat.titleField, 'subject', 'date']);
  const descLines = cat.fields
    .filter(f => !skip.has(f.key) && entry[f.key])
    .map(f => `<div><strong>${escapeHtml(f.label)}:</strong> ${escapeHtml(entry[f.key])}</div>`)
    .join('');

  const metaParts = [];
  if (entry.subject) metaParts.push(escapeHtml(entry.subject));
  if (entry.date) metaParts.push(formatDate(entry.date));

  return `
    <article class="entry-card">
      <div class="entry-photo-wrap">${photo}</div>
      ${stamp}
      <div class="entry-body">
        <h3 class="entry-title">${escapeHtml(title)}</h3>
        <div class="entry-meta">${metaParts.join(' &middot; ')}</div>
        <div class="entry-desc">${descLines}</div>
        <div class="entry-actions">
          <button class="btn btn-outline btn-sm" data-edit="${cat.id}" data-id="${entry.id}">✎ Edit</button>
          <button class="btn btn-danger btn-sm" data-delete="${cat.id}" data-id="${entry.id}">🗑 Delete</button>
        </div>
      </div>
    </article>`;
}

function renderAbout() {
  const data = getAbout();

  document.getElementById('aboutProfilePic').src = data.photo || placeholderAvatar();
  document.getElementById('homeProfilePic').src = data.photo || placeholderAvatar();
  document.getElementById('homeName').textContent = data.fullName || 'Your Name Here';
  document.getElementById('homeWelcome').textContent = data.welcome || DEFAULT_ABOUT.welcome;

  const rows = [
    ['Full Name', data.fullName],
    ['Age', data.age],
    ['Course / Program', data.course],
    ['School', data.school],
    ['Year & Section', data.yearLevel],
    ['Hobbies', data.hobbies],
  ];

  const details = document.getElementById('aboutDetails');
  details.innerHTML = rows.map(([label, value]) => `
      <div>
        <dt>${label}</dt>
        <dd>${escapeHtml(value) || '—'}</dd>
      </div>`).join('') + `
      <div class="full-width">
        <dt>Short Description</dt>
        <dd>${escapeHtml(data.shortDesc) || '—'}</dd>
      </div>`;
}

function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  const items = [];

  CATEGORIES.forEach(cat => {
    getEntries(cat.storageKey).forEach(entry => {
      if (entry.image) {
        items.push({
          image: entry.image,
          tag: `${cat.singular}: ${entry[cat.titleField] || ''}`
        });
      }
    });
  });

  if (items.length === 0) {
    grid.innerHTML = `<div class="empty-state">No pictures uploaded yet. Pictures you add inside any section will appear here automatically.</div>`;
    return;
  }

  grid.innerHTML = items.map(item => `
    <div class="gallery-item">
      <img src="${item.image}" alt="${escapeHtml(item.tag)}">
      <div class="gallery-item-tag">${escapeHtml(item.tag)}</div>
    </div>`).join('');
}

function renderAll() {
  CATEGORIES.forEach(renderCategory);
  renderAbout();
  renderGallery();
}

/* ---------- Small helpers ---------- */

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  if (isNaN(d)) return isoDate;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// A simple inline SVG avatar used until the user uploads a real photo.
function placeholderAvatar() {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#dbe1f0"/>
      <circle cx="50" cy="38" r="18" fill="#9aa5cc"/>
      <ellipse cx="50" cy="88" rx="32" ry="26" fill="#9aa5cc"/>
    </svg>`);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ---------- 4. ADD / EDIT MODAL (shared by every category) ---------- */

const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalFields = document.getElementById('modalFields');
const entryForm = document.getElementById('entryForm');
const imagePreviewWrap = document.getElementById('imagePreviewWrap');
const imagePreview = document.getElementById('imagePreview');

let currentCategory = null;   // the category config currently open in the modal
let currentEditId = null;     // entry id being edited, or null when adding
let currentImageData = '';    // base64 image string for the entry being edited/added

function openEntryModal(catId, editId = null) {
  currentCategory = CATEGORIES.find(c => c.id === catId);
  currentEditId = editId;
  currentImageData = '';

  const existing = editId ? getEntries(currentCategory.storageKey).find(e => e.id === editId) : null;
  currentImageData = existing?.image || '';

  modalTitle.textContent = editId ? `Edit ${currentCategory.singular}` : `Add ${currentCategory.singular}`;

  // Build the form fields dynamically from the category config.
  modalFields.innerHTML = currentCategory.fields.map(field => {
    if (field.type === 'file') return ''; // handled separately below
    const value = existing ? escapeHtml(existing[field.key]) : '';
    if (field.type === 'textarea') {
      return `<label class="field-label">${field.label}
                <textarea id="f-${field.key}" rows="3" ${field.required ? 'required' : ''}>${value}</textarea>
              </label>`;
    }
    return `<label class="field-label">${field.label}
              <input type="${field.type}" id="f-${field.key}" value="${value}" ${field.required ? 'required' : ''}>
            </label>`;
  }).join('') + `
    <label class="field-label">Upload Picture
      <input type="file" id="f-image" accept="image/*">
    </label>`;

  // Show existing / preview image if there is one.
  if (currentImageData) {
    imagePreview.src = currentImageData;
    imagePreviewWrap.hidden = false;
  } else {
    imagePreviewWrap.hidden = true;
  }

  document.getElementById('f-image').addEventListener('change', handleImageSelect);

  modalOverlay.classList.add('open');
}

// Clears the picture for the entry currently open in the modal.
// This only removes the image — all other fields (title, date, etc.) stay put.
function handleImageRemove() {
  currentImageData = '';
  imagePreview.src = '';
  imagePreviewWrap.hidden = true;
  const fileInput = document.getElementById('f-image');
  if (fileInput) fileInput.value = ''; // also clear the chosen file, if any
}

function handleImageSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    currentImageData = reader.result; // base64 data URL — safe to store in localStorage
    imagePreview.src = currentImageData;
    imagePreviewWrap.hidden = false;
  };
  reader.readAsDataURL(file);
}

function closeEntryModal() {
  modalOverlay.classList.remove('open');
  entryForm.reset();
  currentCategory = null;
  currentEditId = null;
  currentImageData = '';
}

entryForm.addEventListener('submit', e => {
  e.preventDefault();
  const cat = currentCategory;
  const entries = getEntries(cat.storageKey);

  const data = { id: currentEditId || makeId(), image: currentImageData };
  cat.fields.forEach(field => {
    if (field.type === 'file') return;
    data[field.key] = document.getElementById(`f-${field.key}`).value.trim();
  });

  if (currentEditId) {
    const idx = entries.findIndex(en => en.id === currentEditId);
    entries[idx] = data;
    showToast(`${cat.singular} updated!`);
  } else {
    entries.push(data);
    showToast(`${cat.singular} saved!`);
  }

  saveEntries(cat.storageKey, entries);
  renderCategory(cat);
  renderGallery();
  closeEntryModal();
});

document.getElementById('modalClose').addEventListener('click', closeEntryModal);
document.getElementById('modalCancel').addEventListener('click', closeEntryModal);
document.getElementById('removeImageBtn').addEventListener('click', handleImageRemove);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeEntryModal(); });

// "+ Add ..." buttons
document.querySelectorAll('[data-add]').forEach(btn => {
  btn.addEventListener('click', () => openEntryModal(btn.dataset.add));
});

// Edit / Delete buttons are added dynamically, so listen on the page body instead.
document.addEventListener('click', e => {
  const editBtn = e.target.closest('[data-edit]');
  if (editBtn) openEntryModal(editBtn.dataset.edit, editBtn.dataset.id);

  const deleteBtn = e.target.closest('[data-delete]');
  if (deleteBtn) openDeleteConfirm(deleteBtn.dataset.delete, deleteBtn.dataset.id);
});

/* ---------- 5. ABOUT ME MODAL ---------- */

const aboutModalOverlay = document.getElementById('aboutModalOverlay');
const aboutForm = document.getElementById('aboutForm');
let aboutPhotoData = '';

document.getElementById('editAboutBtn').addEventListener('click', () => {
  const data = getAbout();
  aboutPhotoData = data.photo || '';
  document.getElementById('field-fullName').value = data.fullName || '';
  document.getElementById('field-age').value = data.age || '';
  document.getElementById('field-course').value = data.course || '';
  document.getElementById('field-school').value = data.school || '';
  document.getElementById('field-yearLevel').value = data.yearLevel || '';
  document.getElementById('field-hobbies').value = data.hobbies || '';
  document.getElementById('field-shortDesc').value = data.shortDesc || '';
  document.getElementById('field-welcome').value = data.welcome || '';
  aboutModalOverlay.classList.add('open');
});

function closeAboutModal() { aboutModalOverlay.classList.remove('open'); }
document.getElementById('aboutModalClose').addEventListener('click', closeAboutModal);
document.getElementById('aboutModalCancel').addEventListener('click', closeAboutModal);
aboutModalOverlay.addEventListener('click', e => { if (e.target === aboutModalOverlay) closeAboutModal(); });

aboutForm.addEventListener('submit', e => {
  e.preventDefault();
  const data = {
    fullName: document.getElementById('field-fullName').value.trim(),
    age: document.getElementById('field-age').value.trim(),
    course: document.getElementById('field-course').value.trim(),
    school: document.getElementById('field-school').value.trim(),
    yearLevel: document.getElementById('field-yearLevel').value.trim(),
    hobbies: document.getElementById('field-hobbies').value.trim(),
    shortDesc: document.getElementById('field-shortDesc').value.trim(),
    welcome: document.getElementById('field-welcome').value.trim(),
    photo: aboutPhotoData
  };
  saveAbout(data);
  renderAbout();
  closeAboutModal();
  showToast('Info updated!');
});

// Clicking "Change photo" on the About page uploads straight away (no separate save step needed).
document.getElementById('aboutPhotoInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const data = getAbout();
    data.photo = reader.result;
    saveAbout(data);
    renderAbout();
    showToast('Profile picture updated!');
  };
  reader.readAsDataURL(file);
});

// Removes the profile photo (used on both Home and About Me) and falls
// back to the default placeholder avatar.
document.getElementById('removeAboutPhotoBtn').addEventListener('click', () => {
  const data = getAbout();
  data.photo = '';
  saveAbout(data);
  renderAbout();
  showToast('Profile picture removed.');
});

/* ---------- 6. DELETE CONFIRMATION ---------- */

const confirmOverlay = document.getElementById('confirmOverlay');
let pendingDelete = null; // { catId, id }

function openDeleteConfirm(catId, id) {
  pendingDelete = { catId, id };
  confirmOverlay.classList.add('open');
}

function closeDeleteConfirm() {
  confirmOverlay.classList.remove('open');
  pendingDelete = null;
}

document.getElementById('confirmCancel').addEventListener('click', closeDeleteConfirm);
confirmOverlay.addEventListener('click', e => { if (e.target === confirmOverlay) closeDeleteConfirm(); });

document.getElementById('confirmDelete').addEventListener('click', () => {
  if (!pendingDelete) return;
  const cat = CATEGORIES.find(c => c.id === pendingDelete.catId);
  const remaining = getEntries(cat.storageKey).filter(e => e.id !== pendingDelete.id);
  saveEntries(cat.storageKey, remaining);
  renderCategory(cat);
  renderGallery();
  showToast(`${cat.singular} deleted.`);
  closeDeleteConfirm();
});

/* ---------- 7. THEME TOGGLE ---------- */

const themeToggle = document.getElementById('themeToggle');

function applyTheme(theme) {
  document.body.classList.toggle('dark', theme === 'dark');
  themeToggle.querySelector('.theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('sp_theme', theme);
}

themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.contains('dark');
  applyTheme(isDark ? 'light' : 'dark');
});

/* ---------- 8. NAVBAR ACTIVE STATE (scroll-spy) ---------- */

const navLinks = document.querySelectorAll('.nav-link');

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === id));
    }
  });
}, { rootMargin: '-45% 0px -45% 0px' });

document.querySelectorAll('.section').forEach(sec => sectionObserver.observe(sec));

/* ---------- 9. INIT ---------- */

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('homeYear').textContent = new Date().getFullYear();

  const savedTheme = localStorage.getItem('sp_theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(savedTheme);

  renderAll();
});
