class State {
  constructor(req, res) {
    this.req = req;
    this.res = res;
    this.context = {};
    this.params = req.params;
    this.inputs = normalizeArrays(req.body.inputs);
    this.data = req.body.data;
    this.commands = [];
  }

  addClass(selector, className) {
    this.pushAction('addClass', { selector, class: className });
  }

  pushAction(command, attributes) {
    this.commands.push({ command, attributes });
  }
}

// add jquery manipulators

['append', 'prepend', 'after', 'before', 'replaceWith'].forEach((method) => {
  State.prototype[method] = function (selector, body) {
    this.pushAction('dom', {
      method,
      selector,
      body: typeof body === 'function' ? body(this.context) : body
    });
  };
});

function normalizeArrays(inputs) {
  if (typeof inputs !== 'object') return inputs;

  const keys = Object.keys(inputs);
  if (!keys.length) return inputs;

  const isArray = keys[0].match(/^\d+$/);

  const result = isArray ? [] : {};

  keys.forEach(key => {
    const value = normalizeArrays(inputs[key]);

    if (isArray) result.push(value); else result[key] = value;
  });

  return result;
}

module.exports = State;
