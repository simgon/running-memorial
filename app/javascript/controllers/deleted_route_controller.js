import { Controller } from '@hotwired/stimulus'
import { RouteManager } from '../custom/route';

// Connects to data-controller="deleted_route"
export default class extends Controller {
  connect() {
    // 削除ルートをマップに反映する
    const routeId = this.element.getAttribute('data-route-id');
    if (!routeId) return;

    const routeMng = RouteManager.getInstance();
    routeMng.routes[routeId].clearMarkers();
    routeMng.selectedRoute = null;
    delete routeMng.routes[routeId];
  }
}
