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
      callback: (...fns) => fns.forEach(fn => this.callbacks[fn.name] = fn)
    });
  }
}

module.exports = Page;
