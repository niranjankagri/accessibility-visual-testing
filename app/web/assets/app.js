// CityCare Clinic: the little behaviour the pages need. Plain browser JavaScript, no build step.

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Today's date in the header (the tests fix the browser clock, so screenshots stay the same). */
function showToday() {
  const today = document.getElementById('today');
  if (!today) return;
  const now = new Date();
  today.dateTime = now.toISOString().slice(0, 10);
  today.textContent = dateFormat.format(now);
}

/** Midnight at the start of a day, so dates compare without the time of day. */
function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Returns the error message for each invalid field of the booking form, in page order. */
function validateBooking(form) {
  const errors = [];
  const name = form.elements.namedItem('name').value.trim();
  const email = form.elements.namedItem('email').value.trim();
  const service = form.elements.namedItem('service').value;
  const date = form.elements.namedItem('date').value;
  const visit = form.querySelector('input[name="visit"]:checked');
  const consent = form.elements.namedItem('consent').checked;

  if (!name) errors.push({ field: 'name', message: 'Enter your full name' });
  if (!email) errors.push({ field: 'email', message: 'Enter your email address' });
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ field: 'email', message: 'Enter an email address like name@example.com' });
  }
  if (!service) errors.push({ field: 'service', message: 'Choose a service' });
  if (!date) errors.push({ field: 'date', message: 'Enter a preferred date' });
  else {
    const chosen = new Date(`${date}T00:00:00`);
    if (chosen < startOfDay(new Date()))
      errors.push({ field: 'date', message: 'Preferred date must be today or later' });
    else if (chosen.getDay() === 0 || chosen.getDay() === 6) {
      errors.push({ field: 'date', message: 'Preferred date must be a weekday' });
    }
  }
  if (!visit) errors.push({ field: 'visit', message: 'Choose the type of visit', target: 'visit-person' });
  if (!consent) errors.push({ field: 'consent', message: 'Agree to the storage of your details to book' });
  return errors;
}

/** Shows or clears the message under one field and links it to the input for screen readers. */
function setFieldError(fieldName, message) {
  const error = document.getElementById(`${fieldName}-error`);
  const inputs =
    fieldName === 'visit' ? document.querySelectorAll('input[name="visit"]') : [document.getElementById(fieldName)];
  error.hidden = !message;
  error.textContent = message ? `Error: ${message}` : '';
  for (const input of inputs) {
    const describedBy = (input.getAttribute('aria-describedby') || '').split(' ').filter((id) => id && id !== error.id);
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      describedBy.push(error.id);
    } else {
      input.removeAttribute('aria-invalid');
    }
    if (describedBy.length) input.setAttribute('aria-describedby', describedBy.join(' '));
    else input.removeAttribute('aria-describedby');
  }
}

function setUpBooking() {
  const form = document.getElementById('booking-form');
  if (!form) return;
  const summary = document.getElementById('error-summary');
  const list = document.getElementById('error-list');
  const confirmation = document.getElementById('confirmation');
  const fields = ['name', 'email', 'service', 'date', 'visit', 'consent'];

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const errors = validateBooking(form);
    for (const field of fields) {
      setFieldError(field, errors.find((error) => error.field === field)?.message);
    }
    confirmation.hidden = true;

    if (errors.length) {
      list.replaceChildren(
        ...errors.map((error) => {
          const item = document.createElement('li');
          const link = document.createElement('a');
          link.href = `#${error.target ?? error.field}`;
          link.textContent = error.message;
          item.append(link);
          return item;
        }),
      );
      summary.hidden = false;
      document.title = `Error: ${document.title.replace(/^Error: /, '')}`;
      summary.focus();
      return;
    }

    summary.hidden = true;
    document.title = document.title.replace(/^Error: /, '');
    document.getElementById('reference').textContent = `CC-${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}`;
    confirmation.hidden = false;
    form.reset();
    confirmation.focus();
  });

  // A link in the error summary moves focus to its field (the browser alone would only scroll).
  list.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    event.preventDefault();
    document.getElementById(link.hash.slice(1))?.focus();
  });
}

function setUpAppointments() {
  const dialog = document.getElementById('cancel-dialog');
  if (!dialog) return;
  const status = document.getElementById('status');
  let opener = null;

  for (const button of document.querySelectorAll('[data-cancel]')) {
    button.addEventListener('click', () => {
      opener = button;
      document.getElementById('cancel-date').textContent = button.closest('tr').dataset.date;
      dialog.showModal();
    });
  }

  document.getElementById('keep').addEventListener('click', () => dialog.close('keep'));
  document.getElementById('confirm-cancel').addEventListener('click', () => dialog.close('cancel'));

  // Escape also closes a modal dialog (returnValue is then empty, so nothing is cancelled).
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'cancel' && opener) {
      const row = opener.closest('tr');
      status.textContent = `Your appointment on ${row.dataset.date} is cancelled.`;
      row.remove();
      document.getElementById('page-title').focus();
    } else {
      opener?.focus();
    }
    dialog.returnValue = '';
    opener = null;
  });
}

showToday();
setUpBooking();
setUpAppointments();
