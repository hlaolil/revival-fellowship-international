// Updated controllers/joinController.js
exports.index = (req, res) => {
  res.render('join', {
    title: 'RFI Join Page',
    currentYear: new Date().getFullYear(),
    lastModified: document.lastModified || new Date().toLocaleString(),
    activePage: 'join'
  });
};

exports.submit = (req, res) => {
  // In a real app, save to DB; here, redirect with query params
  const { 'first-name': firstName, 'last-name': lastName, email, phone, membership, message } = req.body;
  const timestamp = new Date().toLocaleString();
  res.redirect(`/thankyou?first-name=${encodeURIComponent(firstName || '')}&last-name=${encodeURIComponent(lastName || '')}&email=${encodeURIComponent(email || '')}&phone=${encodeURIComponent(phone || '')}&membership=${encodeURIComponent(membership || '')}&message=${encodeURIComponent(message || '')}&timestamp=${encodeURIComponent(timestamp)}`);
};

exports.thankyou = (req, res) => {
  const params = new URLSearchParams(req.query);
  const data = {
    firstName: params.get('first-name') || 'Not provided',
    lastName: params.get('last-name') || 'Not provided',
    email: params.get('email') || 'Not provided',
    phone: params.get('phone') || 'Not provided',
    membership: params.get('membership') || 'Not provided',
    description: params.get('message') || 'Not provided',
    timestamp: params.get('timestamp') || 'Not available'
  };
  res.render('thankyou', { ...data, title: 'Thank You - RFI Membership' });
};
