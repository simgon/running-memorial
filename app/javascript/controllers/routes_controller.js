import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ['menu', 'optionsMenu', 'optionsBtn'];
  
  initialize() {
    this.closeOptionsClick = this.closeOptionsClick.bind(this);
  }
  
  connect() {
    document.addEventListener("click", this.closeOptionsClick);
  }

  disconnect() {
    document.removeEventListener("click", this.closeOptionsClick);
  }

  // オプションを閉じる
  closeOptionsClick(event) {
    if (!this.optionsBtnTarget.contains(event.target)) {
      this.optionsMenuTarget.classList.add("hidden");
    }
  }

  // ハンバーガーメニューボタン
  openMenu() {
    this.menuTarget.classList.toggle("collapse");
  }

  // オプションボタン
  openOptions() {
    this.optionsMenuTarget.classList.toggle("hidden");
  }
}
