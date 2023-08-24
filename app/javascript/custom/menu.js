// メニュー操作
// クリックをリッスンするトグルリスナーを追加する
document.addEventListener("turbo:load", function() {
  let selected_element = document.querySelector("#hamburger");
  selected_element.addEventListener("click", function(event) {
    event.preventDefault();
    let menu = document.querySelector("#navbar-menu");
    menu.classList.toggle("collapse");
  });
});
