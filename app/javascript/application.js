// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@hotwired/turbo-rails"
import "controllers"
import { Common } from './custom/common';
import { initSortable } from './custom/route';

// Turbo Frameのロード後
document.addEventListener('turbo:frame-load', (event) => {
  // Turbo Streams を受信時、メッセージを表示
  const message = document.getElementById("update-message").value;
  Common.showNotification(message)

  // ルート一覧の並び替えを有効にする
  initSortable();
});
