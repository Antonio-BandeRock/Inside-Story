// What Low Stimulation does, in one place, 1.0.63.18. Read by Profile's Low
// Stimulation card and by the edge button's sheet
// (components/LowStimulationSheet.tsx), so the two never describe it
// differently.

export const LOW_STIMULATION_INTRO =
  'One switch for a quieter app on the days a busy screen is too much, instead of hunting down the settings that add up to the same thing. Nothing is hidden, nothing is deleted, and every choice you have made is kept exactly as it is.';

export const LOW_STIMULATION_PARTS: { title: string; text: string }[] = [
  {
    title: 'Backgrounds',
    text: 'Every tab shows the same flat color as the header and footer, with no photo and no gradient behind anything you are reading. Your picks are untouched and come back the moment you turn this off.',
  },
  {
    title: 'Movement',
    text: 'The greeting stops zooming in and out, cards turn over without the flip, menus and pop-ups open without fading, and a swiped tab changes without flying off the edge. Dragging still follows your finger, since that is the screen answering you rather than moving on its own.',
  },
  {
    title: 'Sections',
    text: 'Whatever is open on Home, and in every expandable band elsewhere, folds shut when you turn this on, so a screen opens as a short list rather than a wall. Open any of them again whenever you want. Turning this back off leaves your folds alone rather than reopening them for you.',
  },
];
