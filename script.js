const STORAGE_KEY = 'chezSidneyCateringDemo.v2';
const TAX_RATE = 0.0825;
const SERVICE_RATE = 0.18;
const RUSH_FEE_RATE = 0.12;
const STAFF_RATE = 165;
const DELIVERY_BASE = 55;
const DELIVERY_PER_MILE = 2.25;
const MINIMUM_NOTICE_DAYS = 10;

const defaultState = {
  packages: [
    {
      id: 'garden-brunch',
      name: 'Garden Brunch',
      price: 38,
      minimum: 20,
      description: 'Herbed frittatas, citrus salad, smoked salmon board, mini croissants, and sparkling mocktails.',
      inclusions: ['Brunch buffet', 'Compostable serviceware', 'Coffee and tea setup']
    },
    {
      id: 'coastal-cocktail',
      name: 'Coastal Cocktail Party',
      price: 56,
      minimum: 35,
      description: 'Shrimp toasts, crab cakes, charred vegetables, artisan cheeses, and passed petite desserts.',
      inclusions: ['Passed bites', 'Grazing board', 'Two event staff included']
    },
    {
      id: 'heritage-dinner',
      name: 'Heritage Dinner',
      price: 72,
      minimum: 40,
      description: 'Slow-braised mains, seasonal sides, bright salads, fresh bread service, and family-style dessert.',
      inclusions: ['Custom menu planning', 'Family-style setup', 'Event captain included']
    }
  ],
  gallery: [
    { id: 'grazing-table', title: 'Garden grazing table', url: 'linear-gradient(135deg, #7d8f60, #f4d6a1)' },
    { id: 'plated-supper', title: 'Plated supper course', url: 'linear-gradient(135deg, #203525, #d8845f)' },
    { id: 'dessert-bar', title: 'Petite dessert bar', url: 'linear-gradient(135deg, #b85f3b, #fff1d8)' }
  ],
  blackoutDates: [],
  leads: []
};

const addonCatalog = {
  dessert: { label: 'Dessert display', perGuest: 9 },
  beverage: { label: 'Beverage station', perGuest: 7 },
  lateNight: { label: 'Late-night bites', perGuest: 12 },
  rentals: { label: 'Rentals coordination', flat: 275 }
};

const serviceStyles = {
  dropoff: { label: 'Drop-off buffet', multiplier: 1, staffRatio: 0, setup: 85 },
  buffet: { label: 'Staffed buffet', multiplier: 1.08, staffRatio: 35, setup: 180 },
  family: { label: 'Family-style service', multiplier: 1.14, staffRatio: 28, setup: 250 },
  plated: { label: 'Plated dinner', multiplier: 1.24, staffRatio: 18, setup: 425 }
};

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const packageGrid = document.querySelector('#package-grid');
const packageSelect = document.querySelector('#package-select');
const quoteForm = document.querySelector('#quote-form');
const quoteTotal = document.querySelector('#quote-total');
const quoteStatus = document.querySelector('#quote-status');
const quoteLines = document.querySelector('#quote-lines');
const availabilityMessage = document.querySelector('#availability-message');
const inquiryForm = document.querySelector('#inquiry-form');
const formNote = document.querySelector('#form-note');
const packageForm = document.querySelector('#package-form');
const blackoutForm = document.querySelector('#blackout-form');
const blackoutList = document.querySelector('#blackout-list');
const galleryForm = document.querySelector('#gallery-form');
const galleryGrid = document.querySelector('#gallery-grid');
const leadList = document.querySelector('#lead-list');
const exportLeadsButton = document.querySelector('#export-leads');
const printQuoteButton = document.querySelector('#print-quote');
const downloadQuoteButton = document.querySelector('#download-quote');
const leadCount = document.querySelector('#lead-count');
const packageCount = document.querySelector('#package-count');
const featuredPackageName = document.querySelector('#featured-package-name');
const featuredPackagePrice = document.querySelector('#featured-package-price');
const mathLabel = document.querySelector('#math-label');
const mathAnswer = document.querySelector('#math-answer');

let state = loadState();
let currentQuote = null;
let mathChallenge = createMathChallenge();

function loadState() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return structuredClone(defaultState);
  }
  const parsed = JSON.parse(saved);
  return {
    ...structuredClone(defaultState),
    ...parsed,
    packages: parsed.packages?.length ? parsed.packages : defaultState.packages,
    gallery: parsed.gallery?.length ? parsed.gallery : defaultState.gallery,
    blackoutDates: parsed.blackoutDates || [],
    leads: parsed.leads || []
  };
}

function saveState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `item-${Date.now()}`;
}

function safeText(value) {
  return String(value || '').replace(/[<>]/g, '').trim();
}

function createMathChallenge() {
  const first = 2 + Math.floor(Math.random() * 7);
  const second = 2 + Math.floor(Math.random() * 7);
  mathLabel.firstChild.textContent = `Anti-spam: what is ${first} + ${second}?`;
  mathAnswer.value = '';
  return { first, second, answer: first + second };
}

function daysUntil(dateValue) {
  const today = new Date();
  const eventDate = new Date(`${dateValue}T12:00:00`);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((eventDate - today) / 86400000);
}

function checkAvailability(dateValue) {
  if (!dateValue) {
    return { ok: false, level: 'neutral', message: 'Choose a date to check availability.' };
  }
  if (state.blackoutDates.includes(dateValue)) {
    return { ok: false, level: 'blocked', message: 'This date is currently blocked. Pick another date or request a waitlist follow-up.' };
  }
  const noticeDays = daysUntil(dateValue);
  if (noticeDays < 0) {
    return { ok: false, level: 'blocked', message: 'This date is in the past. Please choose an upcoming event date.' };
  }
  if (noticeDays < MINIMUM_NOTICE_DAYS) {
    return { ok: true, level: 'rush', message: `Rush timing: fewer than ${MINIMUM_NOTICE_DAYS} days away, so a rush planning fee applies.` };
  }
  return { ok: true, level: 'open', message: 'Date looks open in the demo calendar.' };
}

function calculateQuote() {
  const form = new FormData(quoteForm);
  const selectedPackage = state.packages.find((item) => item.id === form.get('packageId')) || state.packages[0];
  const serviceStyle = serviceStyles[form.get('serviceStyle')] || serviceStyles.dropoff;
  const guestCount = Math.max(Number(form.get('guestCount')) || 0, Number(selectedPackage.minimum) || 0);
  const miles = Math.max(Number(form.get('miles')) || 0, 0);
  const selectedAddons = form.getAll('addons');
  const eventDate = form.get('eventDate');
  const availability = checkAvailability(eventDate);

  const foodSubtotal = guestCount * Number(selectedPackage.price) * serviceStyle.multiplier;
  const staffCount = serviceStyle.staffRatio ? Math.max(1, Math.ceil(guestCount / serviceStyle.staffRatio)) : 0;
  const staffing = staffCount * STAFF_RATE;
  const addOns = selectedAddons.reduce((total, key) => {
    const addon = addonCatalog[key];
    return total + (addon.flat || 0) + ((addon.perGuest || 0) * guestCount);
  }, 0);
  const delivery = DELIVERY_BASE + (miles * DELIVERY_PER_MILE);
  const service = (foodSubtotal + addOns + staffing + serviceStyle.setup) * SERVICE_RATE;
  const rushFee = availability.level === 'rush' ? (foodSubtotal + addOns) * RUSH_FEE_RATE : 0;
  const taxable = foodSubtotal + addOns + staffing + delivery + serviceStyle.setup + service + rushFee;
  const tax = taxable * TAX_RATE;
  const total = taxable + tax;

  currentQuote = {
    id: `Q-${Date.now()}`,
    package: selectedPackage.name,
    serviceStyle: serviceStyle.label,
    guestCount,
    eventDate,
    miles,
    selectedAddons,
    notes: safeText(form.get('notes')),
    availability,
    lineItems: [
      ['Food and menu package', foodSubtotal],
      ['Staffing', staffing],
      ['Setup and service style', serviceStyle.setup],
      ['Add-ons', addOns],
      ['Delivery / travel', delivery],
      ['Service charge', service],
      ['Rush planning fee', rushFee],
      ['Estimated tax', tax]
    ],
    total
  };

  renderQuote();
}

function renderPackages() {
  packageGrid.replaceChildren();
  packageSelect.replaceChildren();

  state.packages.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'package-card';
    card.innerHTML = `
      <div class="package-price"></div>
      <h3></h3>
      <p></p>
      <ul></ul>
      <button class="button button-secondary" type="button">Choose package</button>
    `;
    card.querySelector('.package-price').textContent = `${money(item.price)} / guest • ${item.minimum}+ guests`;
    card.querySelector('h3').textContent = item.name;
    card.querySelector('p').textContent = item.description;
    const list = card.querySelector('ul');
    (item.inclusions || ['Custom menu planning', 'Event prep support']).forEach((inclusion) => {
      const li = document.createElement('li');
      li.textContent = inclusion;
      list.append(li);
    });
    card.querySelector('button').addEventListener('click', () => {
      packageSelect.value = item.id;
      calculateQuote();
      document.querySelector('#quote').scrollIntoView({ behavior: 'smooth' });
    });
    packageGrid.append(card);

    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `${item.name} (${money(item.price)} pp)`;
    packageSelect.append(option);
  });

  packageCount.textContent = state.packages.length;
  const featured = state.packages[state.packages.length - 1] || state.packages[0];
  featuredPackageName.textContent = featured.name;
  featuredPackagePrice.textContent = `From ${money(featured.price)} per guest`;
}

function renderQuote() {
  quoteTotal.textContent = money(currentQuote.total);
  quoteStatus.textContent = currentQuote.availability.message;
  quoteStatus.className = `status-${currentQuote.availability.level}`;
  availabilityMessage.textContent = currentQuote.availability.message;
  availabilityMessage.className = `availability-message ${currentQuote.availability.level}`;
  quoteLines.replaceChildren();

  currentQuote.lineItems.forEach(([label, value]) => {
    if (value === 0) return;
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = money(value);
    quoteLines.append(dt, dd);
  });
}

function renderGallery() {
  galleryGrid.replaceChildren();
  state.gallery.forEach((item) => {
    const figure = document.createElement('figure');
    figure.className = 'gallery-item';
    const media = document.createElement('div');
    media.className = 'gallery-media';
    if (item.url.startsWith('linear-gradient')) {
      media.style.background = item.url;
    } else {
      media.style.backgroundImage = `linear-gradient(rgba(32, 53, 37, 0.12), rgba(32, 53, 37, 0.28)), url("${item.url}")`;
    }
    const caption = document.createElement('figcaption');
    caption.textContent = item.title;
    figure.append(media, caption);
    galleryGrid.append(figure);
  });
}

function renderBlackouts() {
  blackoutList.replaceChildren();
  if (!state.blackoutDates.length) {
    const empty = document.createElement('p');
    empty.className = 'muted-small';
    empty.textContent = 'No blackout dates yet.';
    blackoutList.append(empty);
    return;
  }
  state.blackoutDates.sort().forEach((date) => {
    const pill = document.createElement('button');
    pill.className = 'pill';
    pill.type = 'button';
    pill.textContent = `${date} ×`;
    pill.addEventListener('click', () => {
      state.blackoutDates = state.blackoutDates.filter((item) => item !== date);
      saveState();
      renderBlackouts();
      calculateQuote();
    });
    blackoutList.append(pill);
  });
}

function followUpPlan(lead) {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const threeDays = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);
  return [
    `Day 0: send quote ${lead.quote.id} and ask for a 15-minute planning call.`,
    `${tomorrow}: follow up with two menu upgrades and availability reminder.`,
    `${threeDays}: send final hold-date reminder and invite deposit conversation.`
  ];
}

function buildEmailHref(lead) {
  const subject = encodeURIComponent(`Chez Sidney Catering quote ${lead.quote.id}`);
  const body = encodeURIComponent(`Hi ${lead.name},\n\nThank you for asking Chez Sidney Catering about your ${lead.eventType.toLowerCase()}. Your estimated quote is ${money(lead.quote.total)} for ${lead.quote.guestCount} guests on ${lead.quote.eventDate}.\n\nNext step: reply with a good time for a quick planning call.\n\nWarmly,\nChez Sidney Catering`);
  return `mailto:${lead.email}?subject=${subject}&body=${body}`;
}

function downloadFile(filename, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function calendarContent(lead) {
  const date = lead.quote.eventDate.replaceAll('-', '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Chez Sidney Catering//Lead Hold//EN',
    'BEGIN:VEVENT',
    `UID:${lead.id}@chezsidneycatering.local`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART;VALUE=DATE:${date}`,
    `SUMMARY:Hold for ${lead.name} - ${lead.eventType}`,
    `DESCRIPTION:${lead.quote.package} quote ${lead.quote.id} for ${lead.quote.guestCount} guests`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

function renderLeads() {
  leadCount.textContent = state.leads.length;
  leadList.replaceChildren();
  if (!state.leads.length) {
    const empty = document.createElement('p');
    empty.className = 'muted-small';
    empty.textContent = 'No leads saved yet. Submit the inquiry form to create one.';
    leadList.append(empty);
    return;
  }

  state.leads.slice().reverse().forEach((lead) => {
    const article = document.createElement('article');
    article.className = 'lead-item';
    const followUps = followUpPlan(lead).map((item) => `<li>${item}</li>`).join('');
    article.innerHTML = `
      <div>
        <strong></strong>
        <span></span>
      </div>
      <p></p>
      <ul>${followUps}</ul>
      <div class="lead-actions">
        <a class="button button-secondary email-action">Email lead</a>
        <button class="button button-secondary calendar-action" type="button">Calendar hold</button>
      </div>
    `;
    article.querySelector('strong').textContent = `${lead.name} • ${money(lead.quote.total)}`;
    article.querySelector('span').textContent = `${lead.status} • ${lead.createdAt}`;
    article.querySelector('p').textContent = `${lead.eventType} for ${lead.quote.guestCount} guests on ${lead.quote.eventDate}. ${lead.message}`;
    article.querySelector('.email-action').href = buildEmailHref(lead);
    article.querySelector('.calendar-action').addEventListener('click', () => {
      downloadFile(`chez-sidney-${lead.id}.ics`, 'text/calendar', calendarContent(lead));
    });
    leadList.append(article);
  });
}

function quoteAsText() {
  const lines = currentQuote.lineItems.map(([label, value]) => `${label}: ${money(value)}`).join('\n');
  return `Chez Sidney Catering Quote\nQuote: ${currentQuote.id}\nPackage: ${currentQuote.package}\nService: ${currentQuote.serviceStyle}\nGuests: ${currentQuote.guestCount}\nDate: ${currentQuote.eventDate}\n\n${lines}\n\nEstimated total: ${money(currentQuote.total)}\nStatus: ${currentQuote.availability.message}`;
}

function exportCsv() {
  const header = ['id', 'createdAt', 'name', 'email', 'phone', 'eventType', 'eventDate', 'guestCount', 'package', 'total', 'status'];
  const rows = state.leads.map((lead) => [
    lead.id,
    lead.createdAt,
    lead.name,
    lead.email,
    lead.phone,
    lead.eventType,
    lead.quote.eventDate,
    lead.quote.guestCount,
    lead.quote.package,
    Math.round(lead.quote.total),
    lead.status
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell || '').replaceAll('"', '""')}"`).join(','))
    .join('\n');
  downloadFile('chez-sidney-leads.csv', 'text/csv', csv);
}

function syncInquiryDefaults() {
  const eventDate = inquiryForm.querySelector('[name="eventDate"]');
  if (eventDate) eventDate.value = currentQuote.eventDate;
}

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

quoteForm.addEventListener('input', calculateQuote);
quoteForm.addEventListener('change', calculateQuote);

printQuoteButton.addEventListener('click', () => {
  document.body.dataset.printQuote = quoteAsText();
  window.print();
});

downloadQuoteButton.addEventListener('click', () => {
  downloadFile(`${currentQuote.id}.json`, 'application/json', JSON.stringify(currentQuote, null, 2));
});

inquiryForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(inquiryForm);
  if (form.get('companyWebsite')) {
    formNote.textContent = 'Spam check failed.';
    return;
  }
  if (Number(form.get('mathAnswer')) !== mathChallenge.answer) {
    formNote.textContent = 'Please answer the anti-spam math question correctly.';
    return;
  }
  if (!currentQuote.availability.ok) {
    formNote.textContent = 'Please choose an available future date before submitting.';
    return;
  }

  const lead = {
    id: `lead-${Date.now()}`,
    createdAt: new Date().toLocaleString(),
    status: currentQuote.availability.level === 'rush' ? 'Rush follow-up' : 'New quote lead',
    name: safeText(form.get('name')),
    email: safeText(form.get('email')),
    phone: safeText(form.get('phone')),
    eventType: safeText(form.get('eventType')),
    message: safeText(form.get('message')),
    quote: currentQuote
  };
  state.leads.push(lead);
  saveState();
  renderLeads();
  formNote.textContent = `Saved ${lead.name}'s inquiry. Use the admin lead center to email, export, or create a calendar hold.`;
  inquiryForm.reset();
  mathChallenge = createMathChallenge();
});

packageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(packageForm);
  const name = safeText(form.get('name'));
  const newPackage = {
    id: slugify(name),
    name,
    price: Number(form.get('price')),
    minimum: Number(form.get('minimum')),
    description: safeText(form.get('description')) || 'Custom chef-designed catering package.',
    inclusions: ['Admin-managed package', 'Custom quote eligible', 'Seasonal menu planning']
  };
  const existingIndex = state.packages.findIndex((item) => item.id === newPackage.id);
  if (existingIndex >= 0) {
    state.packages[existingIndex] = newPackage;
  } else {
    state.packages.push(newPackage);
  }
  saveState();
  renderPackages();
  calculateQuote();
  packageForm.reset();
});

blackoutForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const date = new FormData(blackoutForm).get('blackoutDate');
  if (date && !state.blackoutDates.includes(date)) {
    state.blackoutDates.push(date);
    saveState();
    renderBlackouts();
    calculateQuote();
  }
  blackoutForm.reset();
});

galleryForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(galleryForm);
  state.gallery.push({
    id: slugify(form.get('title')),
    title: safeText(form.get('title')),
    url: safeText(form.get('url'))
  });
  saveState();
  renderGallery();
  galleryForm.reset();
});

exportLeadsButton.addEventListener('click', exportCsv);

const defaultEventDate = new Date(Date.now() + 86400000 * 21).toISOString().slice(0, 10);
document.querySelector('#event-date').value = defaultEventDate;
renderPackages();
renderGallery();
renderBlackouts();
renderLeads();
calculateQuote();
syncInquiryDefaults();
