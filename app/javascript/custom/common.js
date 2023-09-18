/**
 * Commonクラス
 */
export class Common {
  // モバイル画面判定
  static isMobileScreen = window.innerWidth <= 768;

  /**
   * Cookieを設定
   */
  static setCookie(name, value) {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }

  /**
   * Cookieを取得
   */
  static getCookie(name) {
    const cookieArr = document.cookie.split(';');
    for (let i = 0; i < cookieArr.length; i++) {
      const cookiePair = cookieArr[i].split('=');
      const cookieKey = cookiePair[0].trim();
      if (cookieKey === name) {
        return decodeURIComponent(cookiePair[1]);
      }
    }
    return null;
  }

  /**
   * 通知ダイアログを表示
   * @param {String} message   - メッセージ
   * @param {Integer} duration - 表示時間
   */
  static showNotification(message = null, duration = 3000,) {
    let notificationPopup = document.getElementById('notification-popup');
    let notificationMessage = document.getElementById('notification-message');

    if (message || notificationMessage?.textContent.trim()) {
      // メッセージ表示
      notificationPopup.classList.remove('hidden');
      if (message) notificationMessage.textContent = message;

      // 表示時間経過後、メッセージ非表示
      setTimeout(() => notificationPopup.classList.add('hidden'), duration);
    }
  }

  /**
   * POSTリクエスト
   * @param {String} action  - アクション名
   * @param {Object} param   - リクエストパラメータ
   * @param {String} message - メッセージ
   */
  static postRequest(action, param, message = '') {
    // CSRFトークン
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

    fetch(action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify(param)
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);

        if (message) Common.showNotification(message);
      })
      .catch(error => console.error(error));
  }
}
