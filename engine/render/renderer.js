import { editorState } from '../editorState.js';
import { topDownProject } from './projections/topDown.js';
import { angularProject } from './projections/angular.js';

export function render(ctx, world) {
  const project = editorState.viewMode === 'angular'
    ? angularProject
    : topDownProject;

  project(ctx, world, editorState);
}
