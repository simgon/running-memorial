import { Controller } from '@hotwired/stimulus'
import { RouteManager, Route } from '../custom/route';

// Connects to data-controller="updated_route"
export default class extends Controller {
  connect(event) {
    // 登録ルートをマップに反映する
    const routeId = this.element.getAttribute('data-route-id');
    const routeVisible = this.element.getAttribute('data-route-visible');
    const routeMng = RouteManager.getInstance();
    // 表示／非表示
    const routeItem = document.getElementById(`route_item_${routeId}`);
    const eyeVisibleAll = routeItem.querySelector('.eye-icon');
    const eyeVisibleRoute = routeItem.querySelector('.eye-fill-icon');
    const eyeInvisible = routeItem.querySelector('.eye-slash-icon');

    switch (routeVisible){
      // 非表示
      case Route.INVISIBLE:
        eyeVisibleAll.classList.add('d-none');
        eyeVisibleRoute.classList.add('d-none');
        eyeInvisible.classList.remove('d-none');
        break;
      // 表示
      case Route.VISIBLE_ALL:
        eyeVisibleAll.classList.remove('d-none');
        eyeVisibleRoute.classList.add('d-none');
        eyeInvisible.classList.add('d-none');
        break;
      // 表示(ルートのみ)
      case Route.VISIBLE_ROUTE:
        eyeVisibleAll.classList.add('d-none');
        eyeVisibleRoute.classList.remove('d-none');
        eyeInvisible.classList.add('d-none');
        break;
    }

    // 未保存ラベル
    routeMng.selectedRoute.visibleUnsavedLabel(routeMng.selectedRoute.unsaved);
  }
}
