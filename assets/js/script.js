const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');
const year = document.getElementById('year');

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

if (year) {
  year.textContent = new Date().getFullYear();
}

const registrationStatus = document.getElementById('registration-status');
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
  if (!adminEmailLink) return;

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
  try {
    const response = await fetch('/api/site-status');
    if (!response.ok) {
      setRegistrationOpen(4500, 3500);
      if (ageGroupSelect && ageGroupAvailability) {
        ageGroupAvailability.textContent = 'Registration is open. Please complete the form below.';
      }
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
    setRegistrationOpen(4500, 3500);
    if (ageGroupSelect && ageGroupAvailability) {
      ageGroupAvailability.textContent = 'Registration is open. Please complete the form below.';
    }
  }
};

if (joinForm) {
  joinForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(joinForm).entries())),
      });

      if (response.status === 404) {
        joinForm.submit();
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
      joinForm.submit();
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
