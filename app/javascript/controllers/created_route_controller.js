import { Controller } from "@hotwired/stimulus"
import { RouteManager, Route } from '../custom/route';

// Connects to data-controller="created_route"
export default class extends Controller {
  connect() {
    // 登録ルートをマップに反映する
    const routeId = document.getElementById("created_route").querySelector('input[name="route_id"]').value;
    const routeMng = RouteManager.getInstance();
    routeMng.routes[routeId] = new Route(routeId, routeMng.map, routeMng);

    // 登録ルートを選択状態にする
    const routeItemElement = document.getElementById(`route_item_${routeId}`);
    routeItemElement.click();

    // 入力テキストを非表示にして、新しいルートボタンを表示
    document.getElementById("text-new-route").classList.add("hidden");
    document.getElementById("route_name").value="";
    document.getElementById("btn-new-route").classList.remove("hidden");
  }
}
