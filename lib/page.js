class Page {
  constructor(pageDSL) {
    this.callbacks = {};

    pageDSL({
      route: route => this.route = route,
      content: template => this.content = template,
      context: context => this.context = context,
      callback: fn => this.callbacks[fn.name] = fn
    });
  }
}

module.exports = Page;
