// Every tab's leader comparisons, in board order.
const { MEASURES, VERDICTS } = require('./shape.js');
const TABS = ['food'];
const LEADERS = TABS.flatMap(t => require('./' + t + '.js'));
module.exports = { LEADERS, MEASURES, VERDICTS };
