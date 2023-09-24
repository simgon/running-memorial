import { Controller } from "@hotwired/stimulus"
import { RouteManager } from '../custom/route';

// Connects to data-controller="deleted_route"
export default class extends Controller {
  connect() {
    // 削除ルートをマップに反映する
    const routeId = document.getElementById("deleted_route").querySelector('input[name="route_id"]')?.value;
    if (!routeId) return;

    const routeMng = RouteManager.getInstance();
    routeMng.routes[routeId].clearMarkers();
    routeMng.selectedRoute = null;
    delete routeMng.routes[routeId];
  }
}
