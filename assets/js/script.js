const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');
const adminLink = siteNav?.querySelector('a[href="/admin"]');
const year = document.getElementById('year');
const isGitHubPages = window.location.hostname.endsWith('.github.io');
const isNetlifyFormsSite = fetch('/netlify-registration.json', { cache: 'no-store' })
  .then((response) => response.ok)
  .catch(() => false);

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

if (isGitHubPages) {
  adminLink?.remove();
}

isNetlifyFormsSite.then((enabled) => {
  if (!enabled || !adminLink) return;

  adminLink.href = 'https://app.netlify.com/projects/nimble-semolina-b9d0e4/forms';
  adminLink.textContent = 'Admin: Registrations';
  adminLink.target = '_blank';
  adminLink.rel = 'noopener noreferrer';
});

if (year) {
  year.textContent = new Date().getFullYear();
}

const registrationStatus = document.getElementById('registration-status');
const registrationNotice = document.querySelector('.admin-closed-note');
const adminEmailLink = document.getElementById('admin-email-link');
if (registrationStatus && new URLSearchParams(window.location.search).get('registration') === 'success') {
  registrationStatus.hidden = false;
}

const ageGroupSelect = document.getElementById('age-group');
const ageGroupAvailability = document.getElementById('age-group-availability');
const registrationButton = document.querySelector('.join-form button[type="submit"]');
const joinForm = document.querySelector('.join-form');
const paymentMethodSelect = document.getElementById('payment-method');
const paymentInstructions = document.getElementById('payment-instructions');

const formatMoney = (value) => new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const loadAdminEmail = async () => {
  if (!adminEmailLink || isGitHubPages || await isNetlifyFormsSite) return;

  try {
    const response = await fetch('/api/site-status');
    if (!response.ok) return;

    const status = await response.json();
    const email = status.admin_email || 'khalito90@gmail.com';
    adminEmailLink.href = `mailto:${email}`;
    adminEmailLink.textContent = email;
  } catch (error) {
    adminEmailLink.href = 'mailto:khalito90@gmail.com';
    adminEmailLink.textContent = 'khalito90@gmail.com';
  }
};

const setRegistrationClosed = (message) => {
  if (joinForm) {
    joinForm.inert = true;
  }

  if (registrationNotice) {
    registrationNotice.textContent = message || 'Registration is currently closed. Please contact the admin for updates or reopening.';
    registrationNotice.hidden = false;
  }

  if (ageGroupSelect && ageGroupAvailability) {
    ageGroupAvailability.textContent = message || 'All age groups are currently closed for registration. Please contact the admin for updates.';
  }

  if (joinForm) {
    joinForm.querySelectorAll('input, select, textarea, button').forEach((field) => {
      if (field.type !== 'hidden' && field.name !== 'bot-field') {
        field.disabled = true;
      }
    });
  }

  if (registrationButton) {
    registrationButton.disabled = true;
  }

  if (paymentMethodSelect && paymentInstructions) {
    paymentMethodSelect.disabled = true;
    paymentInstructions.textContent = 'Registration is currently closed. The admin controls all fees, reopening and payment updates.';
  }
};

const setRegistrationOpen = (fee, monthly) => {
  if (joinForm) {
    joinForm.inert = false;
  }

  if (registrationNotice) {
    registrationNotice.hidden = true;
  }

  if (joinForm) {
    joinForm.querySelectorAll('input, select, textarea, button').forEach((field) => {
      if (field.type !== 'hidden' && field.name !== 'bot-field') {
        field.disabled = false;
      }
    });
  }

  if (paymentMethodSelect && paymentInstructions) {
    paymentMethodSelect.disabled = false;
    paymentInstructions.textContent = `Registration fee: ${formatMoney(fee)}. Monthly subscription: ${formatMoney(monthly)}. Select a payment method to see payment instructions. Pay before submitting your registration.`;
  }

  if (registrationButton) {
    registrationButton.disabled = false;
  }
};

const loadSiteStatus = async () => {
  if (isGitHubPages) {
    setRegistrationClosed('Online registration is unavailable on this public preview. Please contact Nairobi Blaze by phone or WhatsApp.');
    return;
  }

  if (await isNetlifyFormsSite) {
    setRegistrationOpen(4500, 3500);
    if (ageGroupSelect && ageGroupAvailability) {
      ageGroupAvailability.textContent = 'Registration is open. Please complete the form below.';
    }
    return;
  }

  try {
    const response = await fetch('/api/site-status');
    if (!response.ok) {
      setRegistrationClosed('Could not verify registration status. Please contact Nairobi Blaze before submitting.');
      return;
    }

    const status = await response.json();
    const fee = Number(status.registration_fee || 4500);
    const monthly = Number(status.monthly_subscription || 3500);

    if (status.registration_open) {
      setRegistrationOpen(fee, monthly);
      if (ageGroupSelect && ageGroupAvailability) {
        ageGroupAvailability.textContent = 'Registration is open. Please complete the form below.';
      }
      return;
    }

    setRegistrationClosed();
  } catch (error) {
    setRegistrationClosed('Unable to connect to the registration service. Please try again later or contact Nairobi Blaze.');
  }
};

if (joinForm) {
  joinForm.addEventListener('submit', async (event) => {
    if (await isNetlifyFormsSite) return;

    event.preventDefault();

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(joinForm).entries())),
      });

      if (response.status === 404) {
        if (registrationStatus) {
          registrationStatus.textContent = 'Online registration is unavailable. Please contact Nairobi Blaze directly.';
          registrationStatus.hidden = false;
        }
        return;
      }

      const responseData = await response.json().catch(() => ({ message: 'Registration failed.' }));

      if (!response.ok) {
        alert(responseData.message || 'Registration failed.');
        return;
      }

      alert('Registration received successfully.');
      joinForm.reset();
      await loadSiteStatus();
    } catch (error) {
      if (registrationStatus) {
        registrationStatus.textContent = 'Unable to submit your registration. Please check your connection and try again.';
        registrationStatus.hidden = false;
      }
    }
  });
}

if (ageGroupSelect) {
  ageGroupSelect.addEventListener('change', () => {
    if (!ageGroupSelect.value) {
      ageGroupAvailability.textContent = 'Please select an age group.';
      return;
    }
    ageGroupAvailability.textContent = `${ageGroupSelect.value} registration is available.`;
  });
}

if (paymentMethodSelect && paymentInstructions) {
  paymentMethodSelect.addEventListener('change', () => {
    const paymentMethod = paymentMethodSelect.value;
    if (!paymentMethod) {
      paymentInstructions.textContent = 'Select a payment method to see payment instructions.';
      return;
    }

    paymentInstructions.textContent = paymentMethod === 'M-Pesa'
      ? 'Pay using M-Pesa Send Money to +254721313563, then enter the transaction code below.'
      : 'Pay by bank transfer. Contact the admin for official bank account details before making payment.';
  });
}

loadSiteStatus();
loadAdminEmail();

document.querySelectorAll('.contact-form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (!button) return;
    const originalText = button.textContent;
    button.textContent = 'Submitted';
    button.disabled = true;

    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
      form.reset();
    }, 1800);
  });
});
