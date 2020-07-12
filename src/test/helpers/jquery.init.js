import jsdom from "jsdom";

const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

var $, jQuery;
$ = jQuery = require('jquery')(window, true);
global.$ = $;
global.jQuery = jQuery;

export { $, jQuery };