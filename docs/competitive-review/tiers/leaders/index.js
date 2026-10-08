// Every tab's leader comparisons, in board order.
const { MEASURES, VERDICTS } = require('./shape.js');
const TABS = ['home', 'food', 'schedules', 'signals', 'insights', 'trends', 'reports', 'garden', 'life', 'across', 'interests', 'companions'];
const LEADERS = TABS.flatMap(t => require('./' + t + '.js'));
module.exports = { LEADERS, MEASURES, VERDICTS };
