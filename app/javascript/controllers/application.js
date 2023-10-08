import { Application } from '@hotwired/stimulus'

const application = Application.start()

// Configure Stimulus development experience
application.debug = false
window.Stimulus   = application

export { application }

import { Common } from '../custom/common';

document.addEventListener('turbo:load', function(event) {
  // 通知ダイアログを表示（リダイレクト時）
  // const message = document.querySelector('#flash_message').value;
  // if (message) {
  //   Common.showNotification(message);
  // }

  // videoの再生
  // document.querySelectorAll('video').forEach(video => {
  //   video.play();
  // });
});
