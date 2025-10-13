// const { createProxyMiddleware } = require('http-proxy-middleware');
// module.exports = function (app) {
//   app.use(
//     ['/homecam'],
//     createProxyMiddleware({ target: 'http://localhost:8080', changeOrigin: true })
//   );
// };
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api', // ← 이 경로로 오는 요청만 백엔드로 보냄
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      pathRewrite: { '^/api': '' }, // /api를 떼고 백엔드에 전달
    })
  );
};
