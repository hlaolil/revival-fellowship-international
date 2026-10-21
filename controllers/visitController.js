const render = (res, view, title, activePage, metaDescription) => res.render(view, {
  title,
  currentYear: new Date().getFullYear(),
  lastModified: new Date().toLocaleString(),
  activePage,
  metaDescription,
});

exports.visit = (req, res) =>
  render(res, 'visit', 'Plan Your Visit', 'visit', 'Service times, location and what to expect when you visit Revival Fellowship International in Butha-Buthe, Lesotho.');

exports.give = (req, res) =>
  render(res, 'give', 'Give', 'give', 'Support the ministry of Revival Fellowship International through your giving.');
