const wrappedMethods = [
  'remove',
  'append',
  'prepend',
  'after',
  'before',
  'html',
  'replaceWith',
  'val'
];

class State {
  constructor(req, res) {
    this.req = req;
    this.res = res;
    this.user = req.user,
    this.context = { };
    this.params = req.params;
    this.inputs = normalizeArrays(req.body?.inputs);
    this.data = req.body?.data;
    this.grid = req.body?.grid;

    // try to parse complex data object
    try {
      this.data = JSON.parse(this.data);
    } catch {}

    this.commands = [];
  }

  addClass(selector, className) {
    this.pushAction('addClass', { selector, class: className });
  }

  exec(code) {
    this.pushAction('exec', { code });
  }

  refresh() {
    this.pushAction('refresh');
  }

  showModal({ title, body, footer }) {
    this.pushAction(
      'showModal',
      {
        body: this.render(body),
        title: this.render(title),
        footer: this.render(footer)
      }
    );
  }

  hideModal() {
    this.pushAction('hideModal');
  }

  pushAction(command, attributes) {
    this.commands.push({ command, attributes });
  }

  redirect(location, opts = {}) {
    return { redirectTo: { location, ...opts } };
  }

  render(content) {
    return typeof content === 'function' ? content(this.context) : content;
  }

  send(data) {
    this.result = data;
  }

}

// add jquery manipulators

wrappedMethods.forEach((method) => {
  State.prototype[method] = function (selector, body) {
    this.pushAction('dom', {
      method,
      selector,
      body: this.render(body)
    });
  };
});

function normalizeArrays(inputs) {
  if (!inputs || typeof inputs !== 'object') return inputs;

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
