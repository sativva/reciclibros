document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.querySelector('.mobile-toolbar__item--filters');
  const drawer = document.querySelector('.mobile-facets__wrapper');

  if (toggleBtn && drawer) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();

      // Toggle drawer ouvert/fermé
      drawer.classList.toggle('is-open');

      // Mettre à jour l'aria pour l'accessibilité
      toggleBtn.setAttribute('ap-expanded-aria', drawer.classList.contains('is-open') ? 'true' : 'false');

      // Initialiser/re-initialiser les facets JS après ouverture
      // (dans ton thème, remplace `initFacets()` par la fonction que ton thème utilise)
      if (typeof initFacets === 'function') {
        initFacets(drawer);
      }
    });
  }
});
