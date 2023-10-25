import { Controller } from '@hotwired/stimulus'
import { Common } from '../custom/common';
import { RouteMap, RouteManager, Route, initSortable } from '../custom/route';

export default class extends Controller {
  static targets = ['optionsMenu', 'optionsBtn'];

  initialize() {
    // iOSにおけるリンクをロングタップ時の新規タブ表示（コールアウト表示）を無効
    document.documentElement.style.webkitTouchCallout='none';
  }
  
  connect() {
    // マップ初期化処理
    this.initMap();

    // ルート一覧の並び替えを有効にする
    initSortable();

    // スマホ画面のステータスバー対応。カスタムプロパティとして画面高さを保持。
    let height = window.innerHeight;
    document.documentElement.style.setProperty('--vh', height / 100 + 'px');

    // モバイルアプリからの場合、「ホーム」ボタンを削除（モバイルアプリの場合、ホーム画面は表示しない）
    if (Common.getCookie("mobile_device")) {
      document.querySelector('#home').remove();
    }

    // メッセージ表示（リダイレクト時）
    const flash_messages = document.querySelectorAll('.flash_messages');

    if (flash_messages) {
      let autohide = true;

      flash_messages.forEach(flash_message => {
        let message_type = flash_message.querySelector('.message_type').value;
        let message = flash_message.querySelector('.message').value;

        if (message_type == 'autohide') {
          // 自動非表示
          autohide = JSON.parse(message);
        } else {
          // メッセージ内容をセット
          document.querySelector('.toast-body').textContent = message;
          // メッセージ表示
          const toast = document.getElementById('toast_message');
          const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toast, {
            autohide: autohide
          });
          toastBootstrap.show();
        }
      });
    }

    // Turbo Frameのロード後
    document.addEventListener('turbo:frame-load', function(event) {
      // テキストボックスにフォーカスする
      const element = event.target.querySelector('#route_name');
      element?.focus();
      element?.setSelectionRange(element?.value.length, element?.value.length);
    });
  }

  disconnect() {}

  // -------------------
  // イベント処理
  // -------------------
  // #region イベント処理
  // **************
  // 各種メニューの開閉
  // **************
  // ルート機能メニューの開閉
  openRouteMenu(event) {
    const routeMenuBtn = event.currentTarget;
    const routeMenu = routeMenuBtn.nextElementSibling;

    // クリックした要素の座標情報を取得
    const rect = routeMenuBtn.getBoundingClientRect();

    // クリックした要素の底辺の位置を計算
    const bottom = rect.top + rect.height + 5;

    // routeMenu の位置を設定
    routeMenu.style.top = `${bottom}px`;

    routeMenu.classList.toggle('d-none');
  }

  // ドキュメント全体クリック時
  clickDocument(event) {
    // オプションメニューを閉じる
    if (!this.optionsBtnTarget.contains(event.target) && !event.target.closest('#options-container')) {
      this.optionsMenuTarget.classList.remove('show');
    }

    // ルート機能メニューを閉じる
    if (!this.prevRouteMenu?.contains(event.target)) {
      this.prevRouteMenu?.closest('[data-routes-target="routeMenuBtn"]').nextElementSibling?.classList.add('d-none');

      if (event.target.id.includes('route-item-action-menu-btn')) {
        this.prevRouteMenu = event.target;
      }
    }
  }
  
  // **************
  // 新しいルートボタン、ルート名編集ボタン
  // **************
  // 新しいルートボタン押下時
  clickNewRoute() {
    // ルート一覧を取得
    const listItems = document.getElementById('routes').getElementsByClassName('route-item');
    // admin有無
    const admin = document.querySelector("#admin")?.value == 'true';
    // ルート上限数チェック
    if (listItems.length >= RouteManager.MAX_ROUTE && !admin) {
      Common.showNotification(`ルート数が上限(${RouteManager.MAX_ROUTE}ルート)に達しました。`);
      return;
    }

    document.getElementById('btn-new-route').classList.add('d-none');
    document.getElementById('text-new-route').classList.remove('d-none');
    document.getElementById('route_name').focus();
  }

  // キャンセル押下時
  clickNewRouteCancel() {
    document.getElementById('btn-new-route').classList.remove('d-none');
    document.getElementById('text-new-route').classList.add('d-none');
  }

  // ルート名編集ボタン押下時
  clickEditRoute(event) {
    const routeItemAction = event.target.closest('.route-item-action');
    const routeItemEdit = routeItemAction.nextElementSibling;

    routeItemAction.classList.add('d-none');
    routeItemEdit.classList.remove('d-none');
    const text = routeItemEdit.querySelector('.route-name-edit');
    text.focus();
    text.setSelectionRange(text.value.length, text.value.length);
  }

  // キャンセル押下時
  clickEditRouteCancel(event) {
    const routeItemEdit = event.target.closest('.route-item-edit');
    const routeItemAction = routeItemEdit.previousElementSibling;

    routeItemEdit.classList.add('d-none');
    routeItemAction.classList.remove('d-none');
  }

  // **************
  // マップ上ボタン
  // **************
  // マーカー追加ボタン
  addMarker() {
    // マーカー追加
    this.routeMng.addMarker(this.routeMng.map.getCenter());
  }

  // ルート上追加ボタン
  addLineMarker() {
    // ルート上にマーカー追加
    this.routeMng.addMarkerOnLine(this.routeMng.map.getCenter());
  }

  // マーカー削除ボタン
  removeMarker() {
    // マーカー削除
    this.routeMng.removeMarker();
  }

  // 切替ボタン
  switchMarker() {
    // ボタン切替
    this.routeMng.switchMode();
  }
  
  // １つ戻すボタン
  undoMarker() {
    // １つ戻す
    this.routeMng.undo();
  }

  // クリアボタン
  clearMarker() {
    // クリア
    this.routeMng.clearMarkers();
  }
  
  // 保存ボタン
  saveMarker() {
    // 保存
    this.routeMng.save();
  }

  // **************
  // サイドメニュー
  // **************
  // ルート選択時
  clickRouteItem(event) {    
    let targetItem = event.currentTarget;
    let routeId = targetItem.getAttribute('data-route-id');
    let visible = targetItem.getAttribute('data-visible');
    
    // 再度ルート選択された場合 かつ クリックされた範囲がルート名の場合
    if (this.routeMng.selectedRoute?.routeId == routeId && event.target.classList.contains('route-item-action_nm')) {
      // 選択ルート位置へマップを移動
      this.routeMng.map.setCenter(this.routeMng.selectedRoute.dotMarkers[0]?.position);
      return;
    }

    // ルート一覧を取得
    const listItems = document.getElementById('routes').getElementsByClassName('route-item');

    // 全ルート一覧の背景色を通常色に戻す
    for (let j = 0; j < listItems.length; j++) {
      listItems[j].style.backgroundColor = '';
    }

    // 選択ルートの一覧項目の背景色を変更
    targetItem.style.backgroundColor = '#343641';

    if (visible == Route.VISIBLE_ALL) {
      // 選択ルートを保持
      this.routeMng.selectedRoute = this.routeMng.routes[routeId];

      // マップボタン一覧を活性化
      document.getElementById('map-board').classList.remove('map-board-disabled');
      document.getElementById('save-marker').removeAttribute('disabled');
      document.getElementById('switch-marker').removeAttribute('disabled');
      document.getElementById('add-marker').removeAttribute('disabled');
      document.getElementById('add-line-marker').setAttribute('disabled', '');
      document.getElementById('remove-marker').setAttribute('disabled', '');
      document.getElementById('undo-marker').removeAttribute('disabled');
      document.getElementById('clear-marker').removeAttribute('disabled');
    } else {
      // 選択ルートを未選択
      this.routeMng.selectedRoute = null;

      // マップボタン一覧を非活性化
      document.getElementById('map-board').classList.add('map-board-disabled');
      document.getElementById('save-marker').setAttribute('disabled', '');
      document.getElementById('switch-marker').setAttribute('disabled', '');
      document.getElementById('add-marker').setAttribute('disabled', '');
      document.getElementById('add-line-marker').setAttribute('disabled', '');
      document.getElementById('remove-marker').setAttribute('disabled', '');
      document.getElementById('undo-marker').setAttribute('disabled', '');
      document.getElementById('clear-marker').setAttribute('disabled', '');
    }
    
    // 選択／未選択ルート
    Object.values(this.routeMng.routes).forEach(route => {
      if (route.routeId === routeId) {
        // ルート活性
        route.disableRoute(false);
        // ドラッグ可能
        route.dotMarkers.forEach(dotMarker => dotMarker.setDraggable(visible == Route.VISIBLE_ALL ? true : false));
      } else {
        // ルート非活性
        route.disableRoute(true);
        // ドラッグ不可
        route.dotMarkers.forEach(dotMarker => dotMarker.setDraggable(false));
      }
    });

    // 同一地点で重なったルート線と距離ラベルの重複を排除
    this.routeMng.displayMostRelevantRoute();

    this.routeMng.selectedDotMarker = null;
    this.routeMng.selectedRouteLine = null;
  }

  // ルート表示／非表示
  clickEye(event) {
    const targetEye = event.currentTarget

    // 表示／非表示
    const eyeVisibleAll = targetEye.querySelector('.eye-icon');
    const eyeVisibleRoute = targetEye.querySelector('.eye-fill-icon');
    const eyeInvisible = targetEye.querySelector('.eye-slash-icon');

    let routeId = targetEye.closest('[data-route-id]').getAttribute('data-route-id');
    let visible = targetEye.closest('[data-visible]');
    
    if (!eyeVisibleAll.classList.contains('d-none')) {
      // 表示 → 表示(ルートのみ)
      eyeVisibleAll.classList.add('d-none');
      eyeVisibleRoute.classList.remove('d-none');
      visible.setAttribute('data-visible', Route.VISIBLE_ROUTE);
      // ルートを表示(ルートのみ)
      this.routeMng.routes[routeId].displayMarkers(Route.VISIBLE_ROUTE, {selected: true});
      this.postRouteVisible(routeId, Route.VISIBLE_ROUTE);
    } else if (!eyeVisibleRoute.classList.contains('d-none')) {
      // 表示(ルートのみ) → 非表示
      eyeVisibleRoute.classList.add('d-none');
      eyeInvisible.classList.remove('d-none');
      visible.setAttribute('data-visible', Route.INVISIBLE);
      // ルートを非表示
      this.routeMng.routes[routeId].displayMarkers(Route.INVISIBLE, {selected: true});
      this.postRouteVisible(routeId, Route.INVISIBLE);
    } else {
      // 非表示 → 表示
      eyeInvisible.classList.add('d-none');
      eyeVisibleAll.classList.remove('d-none');
      visible.setAttribute('data-visible', Route.VISIBLE_ALL);
      // ルートを表示
      this.routeMng.routes[routeId].displayMarkers(Route.VISIBLE_ALL, {selected: true});
      this.postRouteVisible(routeId, Route.VISIBLE_ALL);
    }
  }

  // ユーザートークン
  clickCopyUserToken(event) {
    // ユーザートークンをクリップボードにコピー
    navigator.clipboard.writeText(event.currentTarget.getAttribute('data-user-token'))
      .then(() => {
        Common.showNotification('コピー')
      })
      .catch(function(error) {
        console.error('クリップボードへのコピーが失敗しました:', error);
      });
  }
  // #endregion

  /**
   * マップ初期化処理
   */
  // #region マップ初期化処理
  initMap() {
    // マップ作成
    let mapOptions = {
      zoom: 16,
      center: new google.maps.LatLng('34.724789', '135.496594'),
      clickableIcons: false,        // マップ上アイコン無効化
      keyboardShortcuts: false,     // キーボードショートカット無効化
      draggableCursor: 'default',   // ドラッグ時カーソル
      mapTypeControl: true,         // マップタイプ コントロール
      fullscreenControl: false,     // 全画面表示 コントロール
      streetViewControl: true,      // ストリートビュー コントロール
      streetViewControlOptions: {
        position: (Common.isMobileScreen ? google.maps.ControlPosition.RIGHT_TOP : google.maps.ControlPosition.RIGHT_BOTTOM),
      },
      zoomControl: !Common.isMobileScreen, // ズーム コントロール
      gestureHandling: 'greedy',    // マップ操作ジェスチャー
    };
    const map = new RouteMap(document.getElementById('map'), mapOptions);

    // マップ位置をユーザーの現在位置に設定
    const userLat = Common.getCookie('user_lat');
    const userLng = Common.getCookie('user_lng');

    if (!userLat || !userLng) {
      map.setMapMyLocation();
    } else {
      map.setCenter(new google.maps.LatLng(userLat, userLng));
    }

    // ルート管理
    this.routeMng = new RouteManager(map);

    // -------------------
    // イベント処理
    // -------------------
    // #region イベント処理
    // **************
    // マップ上操作
    // **************
    // マップ上クリック時
    map.addListener('click', (event) => {
      // マーカー追加
      this.routeMng.addMarker(event.latLng);
    });

    let zoomChanged = false;

    // マップズーム時
    map.addListener('zoom_changed', () => {
      // ルート一覧を取得
      const listItems = document.getElementById('routes').getElementsByClassName('route-item');

      // ルート再描画
      for (let i = 0; i < listItems.length; i++) {
        let routeId = listItems[i].getAttribute('data-route-id');
        let visible = listItems[i].getAttribute('data-visible');

        this.routeMng.routes[routeId]?.displayMarkers(visible, {selected: this.routeMng.selectedRoute?.routeId == routeId});
      }

      zoomChanged = true;
    });

    // マップ変更時
    map.addListener('bounds_changed', () => {
      if (zoomChanged) {
        // 描画完了前？だと距離ラベルのdivに参照できない時があるので、遅延させる
        setTimeout(() => {
          // 選択／未選択ルート
          Object.values(this.routeMng.routes).forEach(route => {
            // ルート活性／非活性
            route.disableRoute(route.routeId === this.routeMng.selectedRoute?.routeId ? false : true);
          });

          // 同一地点で重なったルート線と距離ラベルの重複を排除
          this.routeMng.displayMostRelevantRoute();
        }, 100);
        zoomChanged = false;
      }
    });

    // アイドル状態時（マップ移動後等）
    map.addListener('idle', () => {
      // マップ読込後にマップカーソルとマップ操作ボタン一覧を表示
      document.getElementById('map-cursor').classList.remove('d-none');
      document.getElementById('map-board').classList.remove('d-none');

      if (!this.routeMng.selectedRoute) return;

      const addLineMarker = document.getElementById('add-line-marker');
      const removeMarker = document.getElementById('remove-marker');

      // ルート上追加／削除ボタンを非活性
      addLineMarker.setAttribute('disabled', '');
      removeMarker.setAttribute('disabled', '');
      this.routeMng.selectedDotMarker = null;
      this.routeMng.selectedRouteLine = null;

      // ルート線接触判定
      this.routeMng.selectedRoute.routeLines.forEach(line => {
        if (this.collisionLine(line, map.getCenter())) {
          // ルート上追加ボタンを活性化
          addLineMarker.removeAttribute('disabled');
          this.routeMng.selectedRouteLine = line;
        }
      });

      // ドットマーカー接触判定
      this.routeMng.selectedRoute.dotMarkers.forEach(marker => {
        if (this.collisionMarker(marker.position, map.getCenter())) {
          // 削除ボタンを活性化
          removeMarker.removeAttribute('disabled');
          this.routeMng.selectedDotMarker = marker;
        }
      });
    });
    // #endregion

    // -------------------
    // 表示処理
    // -------------------
    // #region 表示処理
    const fetchPromises = [];
    // ルート一覧を取得
    const listItems = document.getElementById('routes').getElementsByClassName('route-item');

    // 各ルートのロケーション情報を取得して、マップ上にルート表示
    for (let i = 0; i < listItems.length; i++) {
      let routeId = listItems[i].getAttribute('data-route-id');
      let visible = listItems[i].getAttribute('data-visible');

      // ロケーション情報を取得
      fetchPromises.push(
        RouteManager.fetchLocations(routeId)
          .then((data) => {
            let route = new Route(routeId, map, this.routeMng);
            // マップ上にマーカーを表示
            data.forEach(loc => {
              const position = new google.maps.LatLng(loc.lat_loc, loc.lon_loc);
              route.addMarker(position, {init: true, visibleUnsavedLabel: false, pushUndo: false});
            });
            this.routeMng.routes[routeId] = route;

            // ルート非活性
            this.routeMng.routes[routeId].disableRoute(true);

            // 表示／非表示
            const eyeToggle = listItems[i].querySelector('.eye-toggle');
            const eyeVisibleAll = listItems[i].querySelector('.eye-icon');
            const eyeVisibleRoute = listItems[i].querySelector('.eye-fill-icon');
            const eyeInvisible = listItems[i].querySelector('.eye-slash-icon');

            switch (visible){
              // 非表示
              case Route.INVISIBLE:
                eyeVisibleAll.classList.add('d-none');
                eyeVisibleRoute.classList.add('d-none');
                eyeInvisible.classList.remove('d-none');
                // ルートを非表示
                this.routeMng.routes[routeId].displayMarkers(Route.INVISIBLE);
                break;
              // 表示
              case Route.VISIBLE_ALL:
                eyeVisibleAll.classList.remove('d-none');
                eyeVisibleRoute.classList.add('d-none');
                eyeInvisible.classList.add('d-none');
                // ルートを表示
                this.routeMng.routes[routeId].displayMarkers(Route.VISIBLE_ALL);
                break;
              // 表示(ルートのみ)
              case Route.VISIBLE_ROUTE:
                eyeVisibleAll.classList.add('d-none');
                eyeVisibleRoute.classList.remove('d-none');
                eyeInvisible.classList.add('d-none');
                // ルートを表示
                this.routeMng.routes[routeId].displayMarkers(Route.VISIBLE_ROUTE);
                break;
            }
          })
          .catch((error) => {
            console.error(error);
          })
      );
    }

    // ロケーション情報を取得後
    Promise.all(fetchPromises)
      .then(() => {
        // 描画完了前？だと距離ラベルのdivに参照できない時があるので、遅延させる
        setTimeout(() => {
          // 全ルート非活性
          Object.values(this.routeMng.routes).forEach(route => {
            route.disableRoute(true);
          });

          // 同一地点で重なったルート線と距離ラベルの重複を排除
          this.routeMng.displayMostRelevantRoute();
        }, 100);
      })
      .catch((error) => {
        console.error(error);
      });
    // #endregion
  }
  // #endregion

  // -------------------
  // 諸々の処理
  // -------------------
  // #region 諸々の処理
  // ドットマーカー接触判定
  collisionMarker(position1, position2, collisionThreshold = 5) {
    const distanceToCenter = google.maps.geometry.spherical.computeDistanceBetween(position1, position2);
    return distanceToCenter <= collisionThreshold;
  }

  // ルート線接触判定
  collisionLine(line, position, collisionThreshold = 0.00005) {
    const path = line.getPath();
    let shortestDistance = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < path.getLength() - 1; i++) {
      const lineStart = path.getAt(i);
      const lineEnd = path.getAt(i + 1);

      const distance = this.calculateShortestDistance(position, lineStart, lineEnd);
      shortestDistance = Math.min(shortestDistance, distance);
    }

    return shortestDistance <= collisionThreshold;
  }

  calculateShortestDistance(point, lineStart, lineEnd) {
    const A = point.lat() - lineStart.lat();
    const B = point.lng() - lineStart.lng();
    const C = lineEnd.lat() - lineStart.lat();
    const D = lineEnd.lng() - lineStart.lng();

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;

    if (len_sq !== 0)
      param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
      xx = lineStart.lat();
      yy = lineStart.lng();
    } else if (param > 1) {
      xx = lineEnd.lat();
      yy = lineEnd.lng();
    } else {
      xx = lineStart.lat() + param * C;
      yy = lineStart.lng() + param * D;
    }

    const dx = point.lat() - xx;
    const dy = point.lng() - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
  // #endregion

  // -------------------
  // データの更新
  // -------------------
  // #region データの更新
  /**
   * ルートの表示情報を更新
   * @param {String} routeId - ルートID
   * @param {String} visible - ルート表示区分
   */
  postRouteVisible(routeId, visible) {
    // ルートの表示情報を更新
    Common.postRequest(
      '/routes/visible',
      {
        route_param: {
          routeId: routeId,
          visible: visible
        }
      },
    );
  }
  // #endregion
}
