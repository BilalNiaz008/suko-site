const assert = require('node:assert');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const appScript = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .find(script => script.includes("mount('#app')"));

assert(appScript, 'Vue app script was not found');

const ref = value => ({ value });
const Vue = {
  ref,
  reactive: value => value,
  computed: getter => ({ get value() { return getter(); } }),
  onMounted() {},
  onUnmounted() {},
  watch() {},
  nextTick() {},
  createApp: component => ({ mount: () => component.setup() }),
};

vm.runInNewContext(appScript, {
  Vue, console, Date, Math,
  setTimeout, clearTimeout, setInterval, clearInterval,
});

console.log('Homepage Vue setup check passed.');
