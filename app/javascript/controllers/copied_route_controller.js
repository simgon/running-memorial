import { Controller } from "@hotwired/stimulus"
import { RouteManager, Route } from '../custom/route';

// Connects to data-controller="copied_route"
export default class extends Controller {
  connect() {
    // コピールートをマップに反映する
    const orgRouteId = document.getElementById("copied_route").querySelector('input[name="org_route_id"]')?.value;
    const newRouteId = document.getElementById("copied_route").querySelector('input[name="new_route_id"]').value;

    if (!orgRouteId || !newRouteId) return;

    const routeMng = RouteManager.getInstance();
    const orgRoute = routeMng.routes[orgRouteId];
    const newRoute = new Route(newRouteId, routeMng.map, routeMng);

    // マップ上にコピールートのマーカーを反映
    orgRoute.dotMarkers.forEach(marker => {
      newRoute.addMarker(marker.position, {init: false, visibleNotYetSaveLabel: false, pushUndo: false});
    });
    routeMng.routes[newRouteId] = newRoute;

    // コピールートを選択状態にする
    const routeItemElement = document.getElementById(`route_item_${newRouteId}`);
    routeItemElement.click();
  }
}
