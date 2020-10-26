const { forEachKey } = require('@snooty/utils');
const SUPPORTED_FEATURES = ['grid', 'modal-large'];

class Page {
  constructor(pageDSL) {
    const page = this;

    page.callbacks = {};
    page.context = () => ({});
    page.features = [];

    pageDSL({
      route: route => page.route = route,
      title: title => page.title = title,
      header: header => page.header = header,
      content: template => page.content = template,
      context: context => page.context = context,
      feature: setFeatures,
      hasCallback: name => (name in page.callbacks),
      callback: (...args) => args.forEach(arg => assignCallbacks(page, arg))
    });

    function setFeatures(...features) {
      features.forEach(f => {
        if (!SUPPORTED_FEATURES.includes(f))
          throw new Error(`Unsupported page feature: ${f}`);
      });

      page.features = page.features.concat(features);
    }
  }
}

module.exports = Page;

function assignCallbacks(page, cb) {
  if (Array.isArray(cb)) return cb.forEach(fn => assignCallbacks(page, fn));

  if (cb.constructor === Object)
    return forEachKey(cb, (name, fn) => (page.callbacks[name] = fn));

  page.callbacks[cb.name] = cb;
}
