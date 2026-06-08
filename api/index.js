const { createNestApp } = require('../dist/bootstrap');

module.exports = async (req, res) => {
  const app = await createNestApp();
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp(req, res);
};
