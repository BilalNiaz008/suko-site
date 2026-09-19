const assert = require('node:assert');
const vm = require('node:vm');
const fs = require('node:fs');

let clickHandler;
const events = [];
const context = {
  document: { addEventListener: (name, handler) => { if (name === 'click') clickHandler = handler; } },
  window: { gtag: (...args) => events.push(args) },
};

vm.runInNewContext(fs.readFileSync('assets/analytics-events.js', 'utf8'), context);
assert(clickHandler, 'click handler was not registered');

const click = (href, selector) => clickHandler({
  target: { closest: () => ({ href, matches: candidate => candidate.includes(selector) }) },
});

click('https://github.com/example/suko-app-releases/file.exe', 'suko-app-releases');
click('https://buy.polar.sh/example', 'buy.polar.sh');
assert.deepStrictEqual(events.map(event => event[1]), ['download_click', 'begin_checkout']);
console.log('Analytics event checks passed.');
