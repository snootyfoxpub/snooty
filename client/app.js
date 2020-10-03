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

    fd.append('field', $(e.target).prop('name'));

    $.ajax({
        url: path,
        data: fd,
        processData: false,
        contentType: false,
        type: 'POST',
        success: function (data) {
          el.attr('uploaded', JSON.stringify(data));
        }
    });
  });

  animateAutocompletes();
});

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
      minLength: 0
    });
  }
}

function processAction(el) {
  const element = $(el);
  const callback = element.attr('action');
  const data = element.attr('action-data');

  const inputs = {};

  if (!element.attr('action-simple')) {
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
  }

  processCallback(callback, { inputs, data });
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
