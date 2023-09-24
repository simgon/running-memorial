import { Controller } from "@hotwired/stimulus"
import { Common } from '../custom/common';

// Connects to data-controller="toast"
export default class extends Controller {
  connect() {
    // メッセージを表示
    Common.showNotification();
  }
}
