const h = require('@snooty/html');
const { G } = require('@snooty/utils');

const modalWindow = h('div#modalWindow.modal.fade',
  {
    'tabindex': '-1',
    'role': 'dialog',
    'aria-labelledby': 'modalEditorLabel',
    'aria-hidden': 'true'
  },
  h('div.modal-dialog', { role: 'document' },
    h('div#modalContent.modal-content',
      h('div#modalHeader.modal-header'),
      h('div#modalBody.modal-body')
    )
  )
);

module.exports = h('html',
  h('head',
    h('meta', { charset: 'utf-8' }),
    h('meta', {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, shrink-to-fit=no' }),
    h('link', {
      rel: 'stylesheet',
      href:'https://stackpath.bootstrapcdn.com/bootstrap/4.5.1/css/bootstrap.min.css',
      integrity: 'sha384-VCmXjywReHh4PwowAiWNagnWcLhlEJLA5buUprzK8rxFgeH0kww/aWY76TfkUoSX',
      crossorigin: 'anonymous' }),
    h('title', 'Smart Cube')
  ),
  h('body.bg-light',
    modalWindow,
    h.safe(G('content')),
    h('script', {
      src: 'https://code.jquery.com/jquery-3.5.1.min.js',
      integrity: 'sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=',
      crossorigin: 'anonymous' }),
    h('script', {
      src: 'https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js',
      integrity: 'sha384-9/reFTGAW83EW2RDu2S0VKaIzap3H66lZH81PoYlFhbGU+6BZp6G7niu735Sk7lN',
      crossorigin: 'anonymous' }),
    h('script', {
      src: 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.1/js/bootstrap.min.js',
      integrity: 'sha384-XEerZL0cuoUbHE4nZReLT7nx9gQrQreJekYhJD9WNWhH8nEW+0c5qq7aIo2Wl30J',
      crossorigin: 'anonymous' }),
    h('script', {
      src: 'https://cdn.jsdelivr.net/gh/xcash/bootstrap-autocomplete@v2.3.5/dist/latest/bootstrap-autocomplete.min.js' }),
    h('script', { src: '/client/app.js' })
  )
);
