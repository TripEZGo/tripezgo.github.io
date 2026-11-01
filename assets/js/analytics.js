/* Production website analytics. Embedded App pages and demos do not count as visits. */
(() => {
  if (!['tripezgo.com', 'www.tripezgo.com'].includes(location.hostname)) return;
  if (window.top !== window.self || new URLSearchParams(location.search).get('mode') === 'embed') return;
  const id = 'G-MMDNPN68XK';
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', id);
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
  document.head.appendChild(tag);
})();
