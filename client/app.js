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

    fd.append('file', files[0]);
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
});


function processAction(el) {
  const element = $(el);
  const callback = element.attr('action');
  const data = element.attr('action-data');

  const inputs = {};

  if (!element.attr('action-simple')) {
    $('input').each((index, el) => {
      const type = el.getAttribute('type');
      const name = el.getAttribute('name');

      if (!name) return;

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
      data: JSON.stringify({ data }),
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
