$(function() {
  // Set default language for datepicker
  $.fn.datepicker.defaults.language = 'ru';

  // Initializing behaviours before listeners so that confirmed behaviour has
  // chance to cancel click handler
  attachBehaviours();
  attachListeners('change', 'click');
  //
  // Handle file uploads

  $('input[type=file]').on('change', e => {
    const el = $(e.target);
    const name = el.prop('name')
    const files = el.prop('files');
    const fd = new FormData();
    const path = window.location.pathname + '/upload/' + name;

    for (let i = 0; i < files.length; i++)
      fd.append('files', files[i]);

    fd.append('field', name);

    $.ajax({
        url: path,
        data: fd,
        processData: false,
        contentType: false,
        type: 'POST',
        success: function (data) {
          el.attr('uploaded', JSON.stringify(data));
          $('#' + name + '-label').html('Загружено файлов: ' + files.length);
        }
    });
  });

  animateAutocompletes();
  $('[data-grid]').each((i, el) => attachGrid(el));

  function attachGrid(gridDiv) {
    let datasource = gridDiv.dataset.gridSource;
    let rowModelType;

    if (typeof datasource === 'string') {
      datasource = datasourceFromCallback(datasource);
      rowModelType = 'infinite';
    }

    const gridDefinition = $(gridDiv).data('grid') ||  {};
    const gridOptions = {
      rowModelType,
      datasource,
      getRowNodeId: (row => row.id)
    };

    attachListeners(gridOptions, gridDiv);

    Object.keys(gridDefinition).forEach(key => {
      const val = gridDefinition[key];

      if (key === 'idField') gridOptions.getRowNodeId = (row => row[val]);
      else gridOptions[key] = val;
    });

    const columnDefs = gridDefinition.columnDefs;

    columnDefs.forEach(column => {
      if (column.cellRenderer)
        column.cellRenderer = eval(column.cellRenderer);
      if (column.rowSpan)
        column.rowSpan = eval(column.rowSpan);
      if (column.colSpan)
        column.colSpan = eval(column.colSpan);
    });

    const grid = new agGrid.Grid(gridDiv, gridOptions);
    $(gridDiv).data('grid', grid);

    function datasourceFromCallback(cbName) {
      const url = [window.location.pathname, 'callback', cbName].join('/');

      return {
        getRows(params) {
          fetch(url, {
            method: 'post',
            body: JSON.stringify({
              data: {
                start: params.startRow,
                end: params.endRow,
                sort: params.sortModel,
                inputs: serializeInputs()
              }
            }),
            headers: {"Content-Type": "application/json; charset=utf-8"}
          })
            .then(httpResponse => httpResponse.json())
            .then(response => {
              params.successCallback(response.rows, response.lastRow);
            })
            .catch(error => {
              console.error(error);
              params.failCallback();
            })
        }
      };
    }

    function attachListeners(gridConfig, container) {
      const gridEventNames = Object.values(agGrid.Events);
      const dataset = container.dataset;

      for (key in dataset) {
        if (!key.match(/on[A-Z]/)) continue;

        // transform 'onSelectionChanged' to 'selectionChanged'
        const eventName = key.slice(2, 3).toLowerCase() + key.slice(3);
        if (!gridEventNames.includes(eventName)) continue;

        gridConfig[key] = evt => processEvent.call(container, eventName, evt);
      }
    }
  }

  function attachListeners(...evts) {
    evts.forEach(evt => $(document).on(evt, `[data-on-${evt}]`, function(e) {
      return processEvent.call(this, evt, e);
    }));
  }

  function processEvent(kind, evt) {
    const $el = $(this);


    // FIXME: workaround for grid
    // Don't process rowClicked event if original event's target has
    // data-click callback registered
    if (kind === 'rowClicked' &&
        $(evt.event.target).closest('[data-click]').length) {
      return;
    }

    // FIXME: workaround for autocomplete
    if (kind === 'change' && $el.data('autoComplete')) {
      const autocomp = $el.data('autoComplete');

      // Prevent actions while selection list is shown
      if (autocomp._dd.shown) return;
    }

    const key = `on${capitalize(kind)}`;
    const handler = $el.data(key);
    flagWith(handler, handler.with);

    const data = handler.data || {};
    const origin = $el.attr('id');
    const gridEvent = evt.api && serializeGridEventData(evt);
    const context = handler.withContext ? $('body').data('context') : {}
    const inputs = handler.withInputs ? serializeInputs() : {};
    const grids = handler.withGrids ? serializeGrids() : {};

    return processCallback(handler.callback, {
      data, grids, inputs, context, origin, gridEvent
    });

    function flagWith(obj, extra) {
      // With is a reserved word
      if (!extra) return;
      if (typeof extra === 'string') extra = extra.split(/,\s*/);

      extra.forEach(flag => (obj[`with${capitalize(flag)}`] = true));

      return obj;
    }
  }

  function capitalize(str) {
    if (!str) return str;

    return str.slice(0, 1).toUpperCase() + str.slice(1);
  }

  function attachBehaviours() {
    $(document)
      .on('click', '[data-behaviour=confirmed]', requestConfirmation)
      .on('click', '[data-behaviour=input-clear]', clearInput);

    function clearInput(evt) {
      const $this = $(this);
      const related = $this.data('related');

      if (!related) {
        /**
         * FIXME: perhaps implement a fallback based on default markup
         * produced by builder?
         */
        return;
      }

      const clearTarget = $(`#${related}`);

      if (clearTarget.is(':disabled')) return;

      if (clearTarget.is('[data-behaviour=autocomplete]')) {
        clearTarget.autoComplete('set', { value: '', text: '' });
      } else {
        clearTarget.val('');
      }
      clearTarget.change();
    }

    function requestConfirmation(evt) {
      // TODO: replace with custom confirmation that replaces the original
      // button with 'Please confirm: [Button] [Cancel]' template
      if (!confirm('Вы уверены?')) {
        evt.stopImmediatePropagation();
        return false;
      }
    }
  }
});

function serializeGridEventData(evt) {
  return {
    id: evt.node && evt.node.id
  }
}

function gridApi(selector) {
  return $(selector).data('grid').gridOptions.api;
}

function trustHtml(params) {
  return params.value ? params.value.toString() : '';
}

function multirowText(params) {
  const value = params.value ? params.value.toString() : '';
  return value.split('\n').join('<br/>');
}

function animateAutocompletes() {
  const selector = '[data-behaviour="autocomplete"]';
  activateForChildren(document);

  let observer = new MutationObserver(mutations => {
    for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;

        if (node.matches(selector)) activateAutocomplete(node);
        else activateForChildren(node);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  function activateForChildren(node) {
    for (let child of node.querySelectorAll(selector))
      activateAutocomplete(child);
  }

  function activateAutocomplete(node) {
    let $node = $(node);
    if ($node.data('autoComplete')) return; // Already initialized

    const callback  = (node.dataset || {}).callback;
    const url = [window.location.pathname, 'callback', callback].join('/');


    $node.autoComplete({
      resolverSettings: {
        method: 'post',
        url: url,
        queryKey: 'data'
      },
      minLength: 0,
      swallowKeys: true,
      events: {
        searchPre: collectExtraData,
      }
    });

    if (!node.parentElement) {
      // This is a select replaced by search field
      // Update $node to reflect the actual element
      if (node.id) $node = $('#' + node.id);
      else $node = $('[name="' + node.name + '"]:hidden').prev();
    }

    $node.on('focus', () => $node.autoComplete('show'));
  }

  function collectExtraData(text, input) {
    const autocomplete = input.data('autoComplete');
    if (!autocomplete) return text;

    const settings = autocomplete.resolver._settings;
    settings.extraData = { inputs: serializeInputs() };

    return text;
  }
}

function serializeGrids() {
  const grids = {};

  $('[data-grid]').each((i, el) => {
    const id = el.id;

    grids[id] = {
      selectedIds: gridApi(el).getSelectedRows().map(r => r.id)
    };
  });

  return grids;
}

function serializeInputs() {
  const inputs = {};

  $('input, select, textarea').each((index, el) => {
    const type = el.getAttribute('type');
    const name = el.getAttribute('name');

    if (!name) return;
    if (el.disabled) return;
    if (['checkbox', 'radio'].includes(type) && !el.checked) return;

    const parts = name.split('.');
    const field = parts.pop();
    let pos = inputs;
    parts.forEach((key, index) => {
      pos = pos[key] = pos[key] || {};
    });

    pos[field] = type === 'file' ? el.getAttribute('uploaded') : el.value;
  });

  return inputs;
}

const Modal = (function() {
  const $ = jQuery;

  const template = document.querySelector('#modalWindow').outerHTML;

  return {
    show: showModal,
    hide: hideModal,
    initialize,
    stack: {}
  };

  function initialize(id) {
    const el = $(template.replace('modalWindow', id));
    const modal = {
      root: el,
      close: el.find('.close'),
      title: el.find('.modal-title'),
      body: el.find('.modal-body'),
      footer: el.find('.modal-footer')
    };

    modal.close.on('click', () => hideModal(id));

    // Handle Enter button modal form
    // TODO: add support for multiple modal forms
    // TODO: add support outside of modal form
    el
      .on('keypress', e => {
        if (e.which == 13) {
          $('[default]').trigger('click');
          e.stopPropagation();
        }
      })
      .on('hidden.bs.modal', function () {
        modal.title.html('');
        modal.body.html('');
        modal.footer.html('');
        modal.root.remove();

        delete Modal.stack[id];
      })
      .appendTo($('#modals'));

    return (Modal.stack[id] = modal);
  }

  function showModal(attributes) {
    const { id, title, body, footer } = attributes;
    const isNew = !(id in Modal.stack);

    const modal = isNew ? Modal.initialize(id) : Modal.stack[id] ;

    modal.title.html(title);
    modal.body.html(body);
    modal.footer.html(footer);

    if (isNew) modal.root.modal({ backdrop: 'static', show: true });
  }

  function hideModal(id) {
    const modal = Modal.stack[id];

    if (!modal) return;

    modal.root.modal('hide');
  }
}());

function processCallback(name, data) {
  const path = window.location.pathname + '/callback/' + name;


  const commands = {
    dom: domAction,
    exec: ({ code }) => eval(code),
    file: downloadFile,
    refresh: () => location.reload(),
    showModal: Modal.show,
    hideModal: Modal.hide,
  }

  $.ajax({
      type: "POST",
      url: path,
      data: JSON.stringify(data),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: processAnswer,
      failure: function(errMsg) {
        alert(errMsg);
      }
  });

  function processAnswer(actions) {
    if (typeof actions !== 'object') return;

    // TODO: also keep a selectionRange to restore cursor position
    var focusedId = $(document.activeElement).attr('id');

    actions.forEach(({ command, attributes }) => {
      if (command in commands) commands[command](attributes);
    });

    if (focusedId) $('#' + focusedId).focus();
  };

  function downloadFile(attributes) {
    var blob = b64toBlob(attributes.data, attributes.contentType);
    var link = document.createElement('a');

    link.href = window.URL.createObjectURL(blob);
    link.download = attributes.name;
    link.click();
  }
}

function domAction({ method, selector, body }) {
  $(selector)[method](body);
}

// used from: https://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
function b64toBlob(b64Data, contentType='', sliceSize=512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, {type: contentType});
  return blob;
}
