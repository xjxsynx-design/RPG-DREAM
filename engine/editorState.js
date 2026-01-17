// engine/editorState.js
import { TopDownProjection } from './render/projections/topDown.js';
import { AngularProjection } from './render/projections/angular.js';

export const editorState = {
  viewMode: 'top',
  camera: { x: 0, y: 0, zoom: 1 },
  grid: { size: 32 },
  activeTool: 'paint',
  projection: TopDownProjection,
};

export function setViewMode(mode) {
  editorState.viewMode = mode;
  editorState.projection =
    mode === 'angular' ? AngularProjection : TopDownProjection;
}
