import { Controller } from '@hotwired/stimulus'
import { RouteManager, Route } from '../custom/route';

// Connects to data-controller='copied_route'
export default class extends Controller {
  connect() {
    // コピールートをマップに反映する
    const orgRouteId = this.element.getAttribute('data-org-route-id');
    const newRouteId = this.element.getAttribute('data-new-route-id');

    if (!orgRouteId || !newRouteId) return;

    const routeMng = RouteManager.getInstance();
    const orgRoute = routeMng.routes[orgRouteId];
    const newRoute = new Route(newRouteId, routeMng.map, routeMng);

    // マップ上にコピールートのマーカーを反映
    orgRoute.dotMarkers.forEach(marker => {
      newRoute.addMarker(marker.position, {init: false, visibleUnsavedLabel: false, pushUndo: false});
    });
    routeMng.routes[newRouteId] = newRoute;

    // コピールートを選択状態にする
    const routeItemElement = document.getElementById(`route_item_${newRouteId}`);
    routeItemElement.click();
  }
}
