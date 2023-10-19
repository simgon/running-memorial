import { Controller } from "@hotwired/stimulus"
// 下記をimportするとcollapseによる表示はできるが、閉じれなくなる。理由不明。
// import { Modal } from "bootstrap"

export default class extends Controller {
  // `connect()`はStimulusのライフサイクルコールバックの1つ
  // コントローラーがHTML要素にアタッチされた時（=HTML要素が画面に表示された時）に実行される
  connect() { 
    // モーダル生成
    this.modal = new bootstrap.Modal(this.element)

    // モーダルを表示する
    this.modal.show()
  }

  disconnect() {
    // モーダルを閉じる
    this.modal.hide()
  }

  // アクション定義
  // 保存成功時にモーダルを閉じる
  close(event) {
    // event.detail.successは、レスポンスが成功ならtrueを返す
    // バリデーションエラー時はモーダルを閉じたくないので、成功時のみ閉じる
    if (event.detail.success) {
      // モーダルを閉じる
      this.modal.hide()
    }
  }
}