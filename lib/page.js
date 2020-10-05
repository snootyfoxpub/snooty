const { forEachKey } = require('@snooty/utils');

class Page {
  constructor(pageDSL) {
    this.callbacks = {};
    this.context = () => ({});

    pageDSL({
      route: route => this.route = route,
      title: title => this.title = title,
      header: header => this.header = header,
      content: template => this.content = template,
      context: context => this.context = context,
      callback: (...args) => args.forEach(arg => assignCallbacks(this, arg))
    });
  }
}

module.exports = Page;

function assignCallbacks(page, cb) {
  if (Array.isArray(cb)) return cb.forEach(fn => assignCallbacks(page, fn));

  if (cb.constructor === Object)
    return forEachKey(cb, (name, fn) => (page.callbacks[name] = fn));

  page.callbacks[cb.name] = cb;
}
