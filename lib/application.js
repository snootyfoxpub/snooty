const path = require('path');
const Page = require('./page');
const State = require('./state');
const layout = require('./base_layout');
const express = require('express');
const multer  = require('multer')
const { forEachKey, env } = require('@snooty/utils');

const upload = multer({ dest: env('upload_dir', 'uploads/') })

class Application {
  constructor(name, mountPoint, pages) {
    this.name = name;
    this.pages = {};
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
      const fileUploadRoute = path.join(pageRoute, 'upload/:field');

      expressApp.use(callbacksRoute, async (req, res, next) => {
        const state = new State(req, res);
        const callback = page.callbacks[req.params.cbName];

        if (!callback) { res.status(404); res.send(); return; }

        await callback(state);

        res.send(state.commands);
      });

      expressApp.use(fileUploadRoute, upload.any(), async (req, res, next) => {
        res.send(req.files);
      });

      expressApp.use(pageRoute, async (req, res, next) => {
        const state = new State(req, res);
        const context = await page.context(state);

        const title = renderIn(page.title, context);
        const header = renderIn(page.header, context);
        const content = renderIn(page.content, context);

        res.send(layout({
          root: expressApp.mountpath,
          content,
          title,
          header
        }));
      });
    });
  }
}

function renderIn(content, context) {
  return typeof content === 'function' ? content(context) : content;
}

module.exports = Application;
