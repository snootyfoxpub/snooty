"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

$(function () {
  $(document).click(function (e) {
    var el = e.target;

    while (el && !el.getAttribute('action')) {
      el = el.parentElement;
    }

    if (el) {
      processAction(el);
      e.stopPropagation();
      return;
    }
  }); // Set default language for datepicker

  $.fn.datepicker.defaults.language = 'ru';
  $(document).on('change', '[data-change]', processOnChange);
  $('#modalClose').on('click', function () {
    return $('#modalWindow').modal('hide');
  }); // Handle Enter button modal form

  $('#modalWindow').on('keypress', function (e) {
    if (e.which == 13) {
      $('[default]').trigger('click');
      e.stopPropagation();
    }
  }); // Handle file uploads

  $('input[type=file]').on('change', function (e) {
    var el = $(e.target);
    var name = el.prop('name');
    var files = el.prop('files');
    var fd = new FormData();
    var path = window.location.pathname + '/upload/' + name;

    for (var i = 0; i < files.length; i++) {
      fd.append('files', files[i]);
    }

    fd.append('field', name);
    $.ajax({
      url: path,
      data: fd,
      processData: false,
      contentType: false,
      type: 'POST',
      success: function success(data) {
        el.attr('uploaded', JSON.stringify(data));
        $('#' + name + '-label').html('Загружено файлов: ' + files.length);
      }
    });
  });
  animateAutocompletes();
  $('[data-grid]').each(function (i, el) {
    return attachGrid(el);
  }); /// FIXME: !!!!!!!

  function attachGrid(gridDiv) {
    var datasource = gridDiv.dataset.gridSource;
    var rowModelType;

    if (typeof datasource === 'string') {
      datasource = datasourceFromCallback(datasource);
      rowModelType = 'infinite';
    }

    var gridDefinition = $(gridDiv).data('grid') || {};
    var gridOptions = {
      rowModelType: rowModelType,
      datasource: datasource,
      rowSelection: 'multiple',
      getRowStyle: getRowStyle,
      onSelectionChanged: onSelectionChanged,
      defaultColDef: {
        sortable: true
      }
    };
    Object.keys(gridDefinition).forEach(function (key) {
      gridOptions[key] = gridDefinition[key];
    });
    var columnDefs = gridDefinition.columnDefs;
    columnDefs.forEach(function (column) {
      if (column.cellRenderer) column.cellRenderer = eval(column.cellRenderer);
      if (column.rowSpan) column.rowSpan = eval(column.rowSpan);
      if (column.colSpan) column.colSpan = eval(column.colSpan);
    });
    var grid = new agGrid.Grid(gridDiv, gridOptions);
    $(gridDiv).data('grid', grid);

    function datasourceFromCallback(cbName) {
      var url = [window.location.pathname, 'callback', cbName].join('/');
      return {
        getRows: function getRows(params) {
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
            headers: {
              "Content-Type": "application/json; charset=utf-8"
            }
          }).then(function (httpResponse) {
            return httpResponse.json();
          }).then(function (response) {
            params.successCallback(response.rows, response.lastRow);
          }).catch(function (error) {
            console.error(error);
            params.failCallback();
          });
        }
      };
    }

    function onSelectionChanged(_ref) {
      var api = _ref.api;
      var callback = gridDiv.dataset['selectionChange'];
      if (!callback) return;
      var data = {
        inputs: serializeInputs(),
        grids: serializeGrids()
      };
      processCallback(callback, data);
    }
  }

  function processOnChange(evt) {
    var $el = $(evt.target);
    var handler = $el.data('change');
    var data = handler.data || {};
    var inputs = handler.withInputs ? serializeInputs() : {};
    processCallback(handler.callback, {
      inputs: inputs,
      data: data
    });
  }
});

function gridApi(selector) {
  return $(selector).data('grid').gridOptions.api;
}

function trustHtml(params) {
  return params.value ? params.value.toString() : '';
}

function multirowText(params) {
  var value = params.value ? params.value.toString() : '';
  return value.split('\n').join('<br/>');
}

function getRowStyle(params) {
  if (!params.data) return;
  if (!params.data.isLast) return;
  return {
    'border-bottom': 'solid #cccccc 2px'
  };
}

function animateAutocompletes() {
  var selector = '[data-behaviour="autocomplete"]';
  activateForChildren(document);
  var observer = new MutationObserver(function (mutations) {
    var _iterator = _createForOfIteratorHelper(mutations),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var mutation = _step.value;

        var _iterator2 = _createForOfIteratorHelper(mutation.addedNodes),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var node = _step2.value;
            if (!(node instanceof HTMLElement)) continue;
            if (node.matches(selector)) activateAutocomplete(node);else activateForChildren(node);
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  function activateForChildren(node) {
    var _iterator3 = _createForOfIteratorHelper(node.querySelectorAll(selector)),
        _step3;

    try {
      for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
        var child = _step3.value;
        activateAutocomplete(child);
      }
    } catch (err) {
      _iterator3.e(err);
    } finally {
      _iterator3.f();
    }
  }

  function activateAutocomplete(node) {
    var $node = $(node);
    if ($node.data('autoComplete')) return; // Already initialized

    var callback = (node.dataset || {}).callback;
    var url = [window.location.pathname, 'callback', callback].join('/');
    $node.autoComplete({
      resolverSettings: {
        method: 'post',
        url: url,
        queryKey: 'data'
      },
      minLength: 0,
      events: {
        searchPre: collectExtraData
      }
    });

    if (!node.parentElement) {
      // This is a select replaced by search field
      // Update $node to reflect the actual element
      if (node.id) $node = $('#' + node.id);else $node = $('[name="' + node.name + '"]:hidden').prev();
    }

    $node.on('focus', function () {
      return $node.autoComplete('show');
    });
  }

  function collectExtraData(text, input) {
    var autocomplete = input.data('autoComplete');
    if (!autocomplete) return text;
    var settings = autocomplete.resolver._settings;
    settings.extraData = {
      inputs: serializeInputs()
    };
    return text;
  }
}

function processAction(el) {
  var element = $(el);
  var callback = element.attr('action');
  var data = element.attr('action-data');
  var inputs = element.attr('action-simple') ? {} : serializeInputs();
  var grids = element.attr('action-simple') ? {} : serializeGrids();
  processCallback(callback, {
    inputs: inputs,
    data: data,
    grids: grids,
    context: $('body').data('context')
  });
}

function serializeGrids() {
  var grids = {};
  $('[data-grid]').each(function (i, el) {
    var id = $(el).attr('id');
    grids[id] = {
      selectedIds: gridApi('#' + id).getSelectedRows().map(function (r) {
        return r.id;
      })
    };
  });
  return grids;
}

function serializeInputs() {
  var inputs = {};
  $('input, select, textarea').each(function (index, el) {
    var type = el.getAttribute('type');
    var name = el.getAttribute('name');
    if (!name) return;
    if (['checkbox', 'radio'].includes(type) && !el.checked) return;
    var parts = name.split('.');
    var field = parts.pop();
    var pos = inputs;
    parts.forEach(function (key, index) {
      pos = pos[key] = pos[key] || {};
    });
    pos[field] = type === 'file' ? el.getAttribute('uploaded') : el.value;
  });
  return inputs;
}

function processCallback(name, data) {
  var path = window.location.pathname + '/callback/' + name;
  $.ajax({
    type: "POST",
    url: path,
    data: JSON.stringify(data),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: processAnswer,
    failure: function failure(errMsg) {
      alert(errMsg);
    }
  });

  function processAnswer(actions) {
    if (_typeof(actions) !== 'object') return;
    actions.forEach(function (_ref2) {
      var command = _ref2.command,
          attributes = _ref2.attributes;

      switch (command) {
        case 'dom':
          domAction(attributes);
          break;

        case 'exec':
          eval(attributes.code);
          break;

        case 'refresh':
          location.reload();
          break;

        case 'showModal':
          $('#modalTitle').html(attributes.title);
          $('#modalBody').html(attributes.body);
          $('#modalFooter').html(attributes.footer);
          $('#modalWindow').modal({
            backdrop: false,
            show: true
          });
          break;

        case 'hideModal':
          $('#modalWindow').modal('hide');
      }
    });
  }

  ;
}

function domAction(_ref3) {
  var method = _ref3.method,
      selector = _ref3.selector,
      body = _ref3.body;
  $(selector)[method](body);
}