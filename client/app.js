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

  $('#modalEditor').on('show.bs.modal', function (event) {
    const target = $(event.relatedTarget);

    $('#modalEditorLabel').text(target.attr('modal-title'));
    $('#modalEditorValue').val(target.attr('modal-value'));
    $('#modalEditorSave').attr('data-target', target.attr('id'));
  });

  $('#modalEditorSave').click(function (e) {
    const target = $('#' + $(e.target).attr('data-target'));
    const value = $('#modalEditorValue').val().trim();

    if (value)
      target.addClass('font-weight-bold');
    else
      target.removeClass('font-weight-bold');

    target.attr({ 'modal-value': value });
  });

});


function processAction(el) {
  const element = $(el);
  const callback = element.attr('action');
  const data = element.attr('action-data');

  const inputs = {};

  if (!element.attr('action-simple'))
    $('input').each((index, el) => {
      const parts = el.getAttribute('name').split('.');
      const field = parts.pop();
      let pos = inputs;
      parts.forEach((key, index) => {
        pos = pos[key] = pos[key] || {};
      });

      pos[field] = el.value;
    });

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
      }
    });
  };
}

function domAction({ method, selector, body }) {
  $(selector)[method](body);
}
