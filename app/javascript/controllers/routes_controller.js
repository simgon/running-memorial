import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ['menu', 'optionsMenu', 'optionsBtn', 'routeMenu', 'routeMenuBtn', 'routeInfo'];
  static prevRouteMenu;
  
  initialize() {
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleRouteInfoScroll = this.handleRouteInfoScroll.bind(this);
  }
  
  connect() {
    document.addEventListener("click", this.handleDocumentClick);
    this.routeInfoTarget.addEventListener("scroll", this.handleRouteInfoScroll);
  }

  disconnect() {
    document.removeEventListener("click", this.handleDocumentClick);
    this.routeInfoTarget.removeEventListener("scroll", this.handleRouteInfoScroll);
  }

  // ドキュメント全体クリック時
  handleDocumentClick(event) {
    // オプションメニューを閉じる
    if (!this.optionsBtnTarget.contains(event.target)) {
      this.optionsMenuTarget.classList.add("hidden");
    }

    // ルート一覧メニューを閉じる
    if (!this.prevRouteMenu?.contains(event.target)) {
      this.prevRouteMenu?.closest('[data-routes-target="routeMenuBtn"]').previousElementSibling?.classList.add("hidden");

      if (event.target.id.includes("route-menu-btn")) {
        this.prevRouteMenu = event.target;
      }
    }
  }

  // ルート一覧スクロール時
  handleRouteInfoScroll(event) {
    // ルート機能メニューを閉じる
    this.prevRouteMenu?.closest('[data-routes-target="routeMenuBtn"]')?.previousElementSibling?.classList.add("hidden");
  }

  // ハンバーガーメニューの開閉
  openMenu() {
    this.menuTarget.classList.toggle("collapse");
  }

  // オプションメニューの開閉
  openOptions() {
    this.optionsMenuTarget.classList.toggle("hidden");
  }

  // ルート機能メニューの開閉
  openRouteMenu(event) {
    const routeMenuBtn = event.currentTarget
    const routeMenu = routeMenuBtn.previousElementSibling

    // クリックした要素の座標情報を取得
    const rect = routeMenuBtn.getBoundingClientRect()

    // クリックした要素の底辺の位置を計算
    const bottom = rect.top + rect.height + 5

    // routeMenu の位置を設定
    routeMenu.style.position = "absolute"
    routeMenu.style.top = `${bottom}px`

    routeMenu.classList.toggle("hidden")
  }
}
