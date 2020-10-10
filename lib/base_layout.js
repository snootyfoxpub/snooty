const h = require('@snooty/html');
const path = require('path');
const { G } = require('@snooty/utils');

const publicPath = filename =>
  ({ root }) => path.join(root, 'client', filename);

const modalWindow = h('div#modalWindow.modal.fade',
  {
    'tabindex': '-1',
    'role': 'dialog',
    'aria-labelledby': 'modalEditorLabel',
    'aria-hidden': 'true'
  },
  h('div.modal-dialog', { role: 'document' },
    h('div#modalContent.modal-content',
      h('div#modalHeader.modal-header',
        h('h5#modalTitle.modal-title'),
        h('button#modalClose.close', h('span', h.safe('&times;')))
      ),
      h('div#modalBody.modal-body'),
      h('div#modalFooter.modal-footer')
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
    h('link', {
      rel: 'stylesheet',
      href:publicPath('bootstrap-datepicker.min.css')
    }),
    h.if('features.grid', h.group(
      h('link', { rel: 'stylesheet', href: publicPath('ag-grid.css') }),
      h('link', { rel: 'stylesheet', href: publicPath('ag-theme-alpine.css') })
    )),
    h('title', G('title')),
    h.safe(G('header'))
  ),
  h('body.bg-light', { 'data-context': G('context') },
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
    h('script', { src: publicPath('bootstrap-datepicker.min.js')}),
    h('script', { src: publicPath('bootstrap-datepicker.ru.min.js')}),
    h('script', { src: publicPath('bootstrap-autocomplete.min.js') }),
    h.if('features.grid', h('script', { src: publicPath('ag-grid-community.min.js') })),
    h('script', { src: publicPath('app.js') })
  )
);
