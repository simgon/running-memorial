// Import and register all your controllers from the importmap under controllers/*

import { application } from 'controllers/application'

// Eager load all controllers defined in the import map under controllers/**/*_controller
import { eagerLoadControllersFrom } from '@hotwired/stimulus-loading'
eagerLoadControllersFrom('controllers', application)

// Lazy load controllers as they appear in the DOM (remember not to preload controllers in import map!)
// import { lazyLoadControllersFrom } from '@hotwired/stimulus-loading'
// lazyLoadControllersFrom('controllers', application)

import CreatedRouteController from './created_route_controller'
application.register('created_route', CreatedRouteController)

import UpdatedRouteController from './updated_route_controller'
application.register('updated_route', UpdatedRouteController)

import DeletedRouteController from './deleted_route_controller'
application.register('deleted_route', DeletedRouteController)

import CopiedRouteController from './copied_route_controller'
application.register('copied_route', CopiedRouteController)

import CreatedSessionController from './created_session_controller'
application.register('created_session', CreatedSessionController)

import CreatedPasswordResetController from './created_password_reset_controller'
application.register('created_password_reset', CreatedPasswordResetController)

import CreatedUserController from './created_user_controller'
application.register('created_user', CreatedUserController)
