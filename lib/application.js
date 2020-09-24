const path = require('path');
const Page = require('./page');
const State = require('./state');
const express = require('express');
const { forEachKey } = require('@snooty/utils');

class Application {
  constructor(name, mountPoint, { pages, layout }) {
    this.name = name;
    this.pages = {};
    this.layout = layout;
    this.mountPoint = mountPoint;

    for (const name in pages) {
      this.pages[name] = new Page(pages[name]);
    }
  }

  attach(expressApp) {
    const publicPath = path.join(__dirname, '..', 'client');
    expressApp.use('/client', express.static(publicPath));

    forEachKey(this.pages, (name, page) => {
      // init main page renders
      const pageRoute = path.join(this.mountPoint, page.route);

      const callbacksRoute = path.join(pageRoute, 'callback/:cbName');
      expressApp.use(callbacksRoute, async (req, res, next) => {
        const state = new State(req, res);
        const callback = page.callbacks[req.params.cbName];

        if (!callback) { res.status(404); res.send(); return; }

        await callback(state);

        res.send(state.commands);
      });

      expressApp.use(pageRoute, async (req, res, next) => {
        const state = new State(req, res);

        const content = page.content(await page.context(state));
        res.send(this.layout({ content }));
      });
    });
  }

}

module.exports = Application;
