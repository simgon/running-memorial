import { Controller } from '@hotwired/stimulus'
import { RouteManager, Route } from '../custom/route';

// Connects to data-controller="created_route"
export default class extends Controller {
  connect(event) {
    // 登録ルートをマップに反映する
    const routeId = this.element.getAttribute('data-route-id');
    const routeMng = RouteManager.getInstance();
    routeMng.routes[routeId] = new Route(routeId, routeMng.map, routeMng);

    // 登録ルートを選択状態にする
    const routeItemElement = document.getElementById(`route_item_${routeId}`);
    routeItemElement.click();
  }
}
