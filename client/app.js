$(function() {
  $(document).click(function(e) {
    var el = e.target;

    while (el && !el.getAttribute('action')) el = el.parentElement;

    if (el) {
      processAction(el);
      e.stopPropagation();
      return;
    }
  });

  // Set default language for datepicker
  $.fn.datepicker.defaults.language = 'ru';

  $(document).on('change', '[data-change]', processOnChange);

  $('#modalClose').on('click', () => $('#modalWindow').modal('hide'));

  // Handle Enter button modal form
  $('#modalWindow').on('keypress', e => {
    if (e.which == 13) {
      $('[default]').trigger('click');
      e.stopPropagation();
    }
  });

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
  initGrid();

  /// FIXME: !!!!!!!

  function initGrid() {
    const gridDiv = document.querySelector('#grid');

    if (!gridDiv) return;

    const datasource = {
      getRows(params) {
        fetch(window.location.pathname + '/callback/gridData', {
          method: 'post',
          body: JSON.stringify({
            data: {
              start: params.startRow,
              end: params.endRow,
              sort: params.sortModel
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

    const gridDefinition = JSON.parse($(gridDiv).attr('grid-definition') || '{}');

    const gridOptions = {
      rowModelType: 'infinite',
      datasource: datasource,
      getRowHeight: getRowHeight,
      rowSelection: 'multiple',
      getRowStyle: getRowStyle,
      defaultColDef: {
          sortable: true
      }
    };

    Object.keys(gridDefinition).forEach(key => {
      gridOptions[key] = gridDefinition[key];
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

    new agGrid.Grid(gridDiv, gridOptions);
  }

  function processOnChange(evt) {
    const $el = $(evt.target);
    const handler = $el.data('change');

    const data = handler.data || {};
    const inputs = handler.withInputs ? serializeInputs() : {};

    processCallback(handler.callback, { inputs, data });
  }
});

function spanTo5(params) {
  return (params.data || {}).isReason ? 7 : 1;
}

function getRowHeight(params) {
  return 50;
}

function trustHtml(params) {
  return params.value ? params.value : '';
}

function multirowText(params) {
  const value = params.value ? params.value : '';
  return value.split('\n').join('<br/>');
}

function getRowStyle(params) {
  if (!params.data) return;
  if (!params.data.isLast) return;
  return { 'border-bottom': 'solid #cccccc 2px' };
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

function processAction(el) {
  const element = $(el);
  const callback = element.attr('action');
  const data = element.attr('action-data');

  const inputs = element.attr('action-simple') ? {} : serializeInputs();

  processCallback(callback, { inputs, data });
}

function serializeInputs() {
  const inputs = {};

  $('input, select, textarea').each((index, el) => {
    const type = el.getAttribute('type');
    const name = el.getAttribute('name');

    if (!name) return;
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

function processCallback(name, data) {
  const path = window.location.pathname + '/callback/' + name;

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

    actions.forEach(({ command, attributes }) => {
      switch (command) {
        case 'dom': domAction(attributes); break;
        case 'exec': eval(attributes.code); break;
        case 'refresh': location.reload(); break;
        case 'showModal':
          $('#modalTitle').html(attributes.title);
          $('#modalBody').html(attributes.body);
          $('#modalFooter').html(attributes.footer);
          $('#modalWindow').modal('show');
          break;
        case 'hideModal': $('#modalWindow').modal('hide');
      }
    });
  };
}

function domAction({ method, selector, body }) {
  $(selector)[method](body);
}
