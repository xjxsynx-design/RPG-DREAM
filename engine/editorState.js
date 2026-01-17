// engine/editorState.js
import { TopDownProjection } from './render/projections/topDown.js';
import { AngularProjection } from './render/projections/angular.js';

export const editorState = {
  viewMode: 'top', // 'top' | 'angular'
  camera: { x:0, y:0, zoom:1 },
  grid: { size:32 },
  projection: null,
};

export function setViewMode(mode){
  editorState.viewMode = mode;
  editorState.projection = mode === 'angular'
    ? AngularProjection
    : TopDownProjection;
}

setViewMode('top');
