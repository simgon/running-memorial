// map.js

/**
 * ロード時
 */
document.addEventListener('turbo:load', function() {
  // 初期化処理
  initMap();

  // 通知ダイアログを表示
  showNotification(3000);

  // SortableJS
  const routesContainer = document.getElementById('routes-container');

  // Sortableオブジェクトを作成してリストの並び替えを有効にする
  const sortable = new Sortable(routesContainer, {
    animation: 150,
    handle: '.drag-handle',   // ドラッグ可能な領域（ドラッグハンドル）を指定
    onEnd: function(event) {  // ドラッグ終了後の処理
      if (event.oldIndex === event.newIndex) return;

      const listContainer = document.getElementById('routes-container');
      const listItems = [...listContainer.getElementsByTagName('li')];
      postRouteOrder(listItems.map(item => item.getAttribute('data-route-id'))); 
    }
  });
});

// 選択ルートを保持
let selectedRoute;

/**
 * 初期化処理
 */
function initMap() {
  let currentLoc = new google.maps.LatLng('34.724789', '135.496594');

  let mapOptions = {
    zoom: 16,
    center: currentLoc,
    clickableIcons: false,      // マップ上アイコン無効化
    keyboardShortcuts: false,   // キーボードショートカット無効化
    draggableCursor: 'pointer', // ドラッグ時カーソル
    mapTypeControl: true,       // マップタイプ コントロール
    fullscreenControl: false,   // 全画面表示 コントロール
    streetViewControl: true,    // ストリートビュー コントロール
    zoomControl: true,          // ズーム コントロール
    gestureHandling: 'greedy',  // マップ操作ジェスチャー
  };
  const map = new RouteMap(document.getElementById('map'), mapOptions);

  // ルート一覧を保持
  let routes = {};

  // -------------------
  // イベント
  // -------------------
  // **************
  // マップ
  // **************
  // マップ上ボタン
  document.addEventListener('click', (event) => {
    // ルート未選択の場合
    if (!selectedRoute) return;

    const targetId = event.target.id;

    switch (targetId) {
      // マーカー追加
      case 'add-marker':
        // マーカー追加ボタンがクリックされた場合の処理
        selectedRoute.addMarker(map.getCenter());
        break;
      // １つ戻す
      case 'del-marker':
        // １つ戻すボタンがクリックされた場合の処理
        selectedRoute.delMarker();
        break;
      // クリア
      case 'eraser-marker':
        // クリアボタンがクリックされた場合の処理
        selectedRoute.clearMarkers();
        break;
      // 保存
      case 'save-marker':
        // 保存ボタンがクリックされた場合の処理
        postRoute();
        break;
    }
  });

  // マップ上クリック時
  map.addListener('click', (event) => {
    // ルート未選択の場合
    if (!selectedRoute) return;

    // マップ上にマーカー追加
    selectedRoute.addMarker(event.latLng);
  });

  let zoomChanged = false;

  // マップズーム時
  map.addListener('zoom_changed', () => {
    // ルート一覧を取得
    const listItems = document.getElementById('routes-container').getElementsByTagName('li');

    // ルート再描画
    for (let i = 0; i < listItems.length; i++) {
      let routeId = listItems[i].getAttribute('data-route-id');
      let visible = listItems[i].getAttribute('data-visible');

      routes[routeId].displayMarkers(visible);
    }

    zoomChanged = true;
  });

  // マップ変更時
  map.addListener('bounds_changed', () => {
    if (zoomChanged) {
      // 選択／未選択ルート
      Object.values(routes).forEach(r => {
        // ルート活性／非活性
        r.disableRoute(r.routeId === selectedRoute?.routeId ? false : true);
      });
      zoomChanged = false;
    }
  });

  // **************
  // サイドメニュー
  // **************
  // 新しいルートボタン
  document.getElementById('new-route-button').addEventListener('click', (event) => {
    document.getElementById('new-route-button').classList.add('hidden');
    document.getElementById('new-route-input').classList.remove('hidden');
    document.getElementById('new-route-input').querySelector('.form-control').focus();
  });

  // 新しいルート（キャンセル）
  document.getElementById('new-route-cancel').addEventListener('click', (event) => {
    document.getElementById('new-route-button').classList.remove('hidden');
    document.getElementById('new-route-input').classList.add('hidden');
  });

  // ルート一覧を取得
  const listItems = document.getElementById('routes-container').getElementsByTagName('li');

  for (let i = 0; i < listItems.length; i++) {
    // ルート項目
    const routeItem = document.getElementById('route-item' + i);

    // ルート選択時
    routeItem.addEventListener('click', function(event) {
      let routeId = this.getAttribute('data-route-id');
      
      // 全ルート一覧の背景色を通常色に戻す
      for (let j = 0; j < listItems.length; j++) {
        listItems[j].style.backgroundColor = '';
      }

      // 選択ルートの一覧項目の背景色を変更
      this.style.backgroundColor = '#343641';
      
      // マップボタン一覧を活性化
      document.getElementById('save-marker').removeAttribute('disabled');
      document.getElementById('add-marker').removeAttribute('disabled');
      document.getElementById('del-marker').removeAttribute('disabled');
      document.getElementById('eraser-marker').removeAttribute('disabled');

      // 選択ルートを保持
      selectedRoute = routes[routeId];

      // 選択／未選択ルート
      Object.values(routes).forEach(route => {
        if (route.routeId === routeId) {
          // ルート活性
          route.disableRoute(false);
          // ドラッグ可能
          route.dotMarkers.forEach(dotMarker => dotMarker.setDraggable(true));
        } else {
          // ルート非活性
          route.disableRoute(true);
          // ドラッグ不可
          route.dotMarkers.forEach(dotMarker => dotMarker.setDraggable(false));
        }
      });
    });

    // 表示／非表示
    const eyeToggle = routeItem.querySelector('.eye-toggle');
    const eyeIcon = routeItem.querySelector('.eye-icon');
    const eyeFillIcon = routeItem.querySelector('.eye-fill-icon');
    const eyeSlashIcon = routeItem.querySelector('.eye-slash-icon');
  
    eyeToggle.addEventListener('click', function(event) {
      let routeId = this.closest('[data-route-id]').getAttribute('data-route-id');
      let visible = this.closest('[data-visible]');
      
      if (!eyeIcon.classList.contains('hidden')) {
        // 表示 → 表示(ルートのみ)
        eyeIcon.classList.add('hidden');
        eyeFillIcon.classList.remove('hidden');
        visible.setAttribute('data-visible', Route.VISIBLE_ROUTE);
        // ルートを表示(ルートのみ)
        routes[routeId].displayMarkers(Route.VISIBLE_ROUTE);
        postRouteVisible(routeId, Route.VISIBLE_ROUTE);
      } else if (!eyeFillIcon.classList.contains('hidden')) {
        // 表示(ルートのみ) → 非表示
        eyeFillIcon.classList.add('hidden');
        eyeSlashIcon.classList.remove('hidden');
        visible.setAttribute('data-visible', Route.INVISIBLE);
        // ルートを非表示
        routes[routeId].displayMarkers(Route.INVISIBLE);
        postRouteVisible(routeId, Route.INVISIBLE);
      } else {
        // 非表示 → 表示
        eyeSlashIcon.classList.add('hidden');
        eyeIcon.classList.remove('hidden');
        visible.setAttribute('data-visible', Route.VISIBLE_ALL);
        // ルートを表示
        routes[routeId].displayMarkers(Route.VISIBLE_ALL);
        postRouteVisible(routeId, Route.VISIBLE_ALL);
      }
    });

    // 編集
    routeItem.querySelector('.edit-icon').addEventListener('click', () => {
      routeItem.querySelector('.route-detail').classList.add('hidden');
      routeItem.querySelector('.route-edit').classList.remove('hidden');

      // テキストボックスをフォーカス
      const edit = routeItem.querySelector('.text-edit');
      edit.focus();
      edit.setSelectionRange(edit.value.length, edit.value.length);
    });

    // 編集 - キャンセル
    routeItem.querySelector('.cancel').addEventListener('click', (event) => {
      routeItem.querySelector('.route-detail').classList.remove('hidden');
      routeItem.querySelector('.route-edit').classList.add('hidden');
    });
  }

  // -------------------
  // 表示
  // -------------------
  // 各ルートのロケーション情報を取得して、マップ上にルート表示
  for (let i = 0; i < listItems.length; i++) {
    let routeId = listItems[i].getAttribute('data-route-id');
    let visible = listItems[i].getAttribute('data-visible');

    // ロケーション情報を取得
    fetchLocations(routeId)
      .then((data) => {
        let route = new Route(routeId, map);
        // マップ上にマーカーを表示
        data.forEach(loc => route.addMarker(new google.maps.LatLng(loc.lat_loc, loc.lon_loc)));
        routes[routeId] = route;

        const eyeToggle = listItems[i].querySelector('.eye-toggle');
        const eyeIcon = listItems[i].querySelector('.eye-icon');
        const eyeFillIcon = listItems[i].querySelector('.eye-fill-icon');
        const eyeSlashIcon = listItems[i].querySelector('.eye-slash-icon');

        switch (visible){
          // 非表示
          case Route.INVISIBLE:
            eyeIcon.classList.add('hidden');
            eyeFillIcon.classList.add('hidden');
            eyeSlashIcon.classList.remove('hidden');
            // ルートを非表示
            routes[routeId].displayMarkers(Route.INVISIBLE);
            break;
          // 表示
          case Route.VISIBLE_ALL:
            eyeIcon.classList.remove('hidden');
            eyeFillIcon.classList.add('hidden');
            eyeSlashIcon.classList.add('hidden');
            // ルートを表示
            routes[routeId].displayMarkers(Route.VISIBLE_ALL);
            break;
          // 表示(ルートのみ)
          case Route.VISIBLE_ROUTE:
            eyeIcon.classList.add('hidden');
            eyeFillIcon.classList.remove('hidden');
            eyeSlashIcon.classList.add('hidden');
            // ルートを表示
            routes[routeId].displayMarkers(Route.VISIBLE_ROUTE);
            break;
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }
}

/**
 * ロケーション情報を取得
 * @param {String} route_id - ルートID
 */
function fetchLocations(route_id) {
  return fetch(`/locations/${route_id}`, {
      headers: {
        'Accept': 'application/json'
      }
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      return data;
    });
}

/**
 * ルート情報を登録
 */
function postRoute() {
  // ルート情報を登録
  postRequest(
    '/locations',
    {
      route_param: {
        routeId: selectedRoute.routeId,
        locations: selectedRoute.dotMarkers.map((x) => ({ lat_loc: x.position.lat(), lon_loc: x.position.lng() }))
      }
    },
    '保存しました'
  );
}

/**
 * ルートの表示情報を更新
 * @param {String} routeId - ルートID
 * @param {String} visible - ルート表示区分
 */
function postRouteVisible(routeId, visible) {
  // ルートの表示情報を更新
  postRequest(
    '/routes/visible',
    {
      route_param: {
        routeId: routeId,
        visible: visible
      }
    },
  );
}

/**
 * ルートの並び順を更新
 * @param {Array.<String>} routeIds - ルートID配列
 */
function postRouteOrder(routeIds) {
  // ルートの並び順を更新
  postRequest(
    '/routes/order',
    {
      route_param: {
        routeIds: routeIds
      }
    }
  );
}

/**
 * POSTリクエスト
 * @param {String} action  - アクション名
 * @param {Object} param   - リクエストパラメータ
 * @param {String} message - メッセージ
 */
function postRequest(action, param, message = '') {
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

      if (message) showNotification(3000, message);
    })
    .catch(error => console.error(error));
}

/**
 * 通知ダイアログを表示
 * @param {Integer} duration - 表示時間
 * @param {String} message   - メッセージ
 */
function showNotification(duration, message = null) {
  let notificationPopup = document.getElementById('notification-popup');
  let notificationMessage = document.getElementById('notification-message');

  if (message || notificationMessage?.textContent.trim()) {
    notificationPopup.style.display = 'block';
    if (message) {
      notificationMessage.textContent = message;
    }

    setTimeout(function() {
      notificationPopup.style.display = 'none';
    }, duration);
  }
}

/**
 * RouteMapクラス
 */
class RouteMap extends google.maps.Map {
  constructor(element, mapOptions) {
    super(element, mapOptions);
  
    // 現在位置へ移動カスタムコントロールを作成
    const customControlDiv = document.createElement('div');
    const controlUI = document.createElement('div');
    customControlDiv.className = 'my-location';
    customControlDiv.appendChild(controlUI);
  
    google.maps.event.addDomListener(customControlDiv, 'click', () => {
      this.getMyLocation()
        .then((position) => {
          // 位置情報を取得できた場合の処理
          // 地図の中心をユーザーの現在位置に移動
          this.setCenter(position);
        })
        .catch((error) => {
          // 位置情報の取得に失敗した場合の処理
          console.error('Error:', error);
        });
    });
  
    // 地図の右下にカスタムコントロールを配置
    this.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(customControlDiv);
  
    // 十字の要素を取得
    const crosshairElement = document.querySelector('.crosshair');
  
    // 地図の移動が完了したときに十字の位置を更新する
    google.maps.event.addListener(this, 'idle', function() {
      const center = this.getCenter();
      const bounds = this.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
  
      const projection = this.getProjection();
      const centerPoint = projection.fromLatLngToPoint(center);
      const nePoint = projection.fromLatLngToPoint(ne);
      const swPoint = projection.fromLatLngToPoint(sw);
      const mapWidth = nePoint.x - swPoint.x;
      const mapHeight = swPoint.y - nePoint.y;
  
      const left = (centerPoint.x - swPoint.x) / mapWidth * 100;
      const top = (centerPoint.y - nePoint.y) / mapHeight * 100;
  
      crosshairElement.style.left = left + '%';
      crosshairElement.style.top = top + '%';
    });
  }

  /**
   * 現在位置を取得
   */
  getMyLocation() {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function (position) {
            resolve(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
          },
          function (error) {
            reject(error);
          }
        );
      } else {
        reject(new Error('Geolocation is not supported in this browser.'));
      }
    });
  }
}

/**
 * Routeクラス
 * Map上に表示するルートを管理
 */
class Route {
  static INVISIBLE = '0';
  static VISIBLE_ALL = '1';
  static VISIBLE_ROUTE = '2';

  constructor(routeId, map) {
    this.routeId = routeId;
    this.map = map;
    this.dotMarkers = [];
    this.distanceLabels = [];
    this.routeLines = [];
  }

  /**
   * 全てのマーカーを削除
   */
  clearMarkers() {
    this.dotMarkers.forEach((marker) => {
      marker.setMap(null);
    });

    this.distanceLabels.forEach((label) => {
      label.setMap(null);
    });

    this.routeLines.forEach((line) => {
      line.setMap(null);
    });

    this.dotMarkers = [];
    this.distanceLabels = [];
    this.routeLines = [];
  }

  /**
   * 直前に追加したマーカーを削除
   */
  delMarker() {
    for (const array of [this.dotMarkers, this.distanceLabels, this.routeLines]) {
      if (array.length) {
        array.pop().setMap(null);
      }
    }
  }

  /**
   * マーカーを追加
   */
  addMarker(location) {
    // ドットマーカーを作成
    const dotMarker = new google.maps.Marker({
      position: {lat: location.lat(), lng: location.lng()},
      map: this.map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillOpacity: 1,
        fillColor: '#3CB371', // ドットの色を指定
        strokeOpacity: 0,
        scale: 2, // ドットのサイズを指定
      },
      draggable: false,
    });

    // ドラッグ可能にする（イベント追加後にドラッグ不可にする）
    dotMarker.setDraggable(true);

    // ドラッグ後のクリック動作を制御
    let delayFlg = false;

    // ドットマーカーをクリック時
    dotMarker.addListener('click', (event) => {

      if (delayFlg) return;

      // マップ上のクリックされた場所にマーカーを追加
      selectedRoute.addMarker(event.latLng);
    });

    dotMarker.customId = this.routeId + '-' + this.dotMarkers.length;
  
    // ドットマーカードラッグ完了時、マーカーを移動
    dotMarker.addListener('dragend', (event) => {

      delayFlg = true;
      setTimeout(() => delayFlg = false, 1000);

      const idx = dotMarker.customId.split('-')[1];

      // ドットマーカー
      this.dotMarkers[idx].position = event.latLng;

      // ルート線
      if (idx == 0) {
        // 先頭
        this.routeLines[idx].setPath([event.latLng, this.routeLines[idx].getPath().getAt(1)]);
      } else if (idx == this.dotMarkers.length - 1) {
        // 末尾
        this.routeLines[idx - 1].setPath([this.routeLines[idx - 1].getPath().getAt(0), event.latLng]);
      } else {
        // 上記以外
        this.routeLines[idx - 1].setPath([this.routeLines[idx - 1].getPath().getAt(0), event.latLng]);
        this.routeLines[idx].setPath([event.latLng, this.routeLines[idx].getPath().getAt(1)]);
      }

      // 距離ラベル
      this.distanceLabels[idx].position = event.latLng;

      for (let i = 1; i < this.distanceLabels.length; i++) {
        this.distanceLabels[i].distanceValue = 0;
      }
      for (let i = 1; i < this.distanceLabels.length; i++) {
        let distance = this.getDistanceBetweenMarkers(this.dotMarkers[i - 1], this.dotMarkers[i]);
        this.distanceLabels[i].distanceValue = distance;
        this.distanceLabels[i].labelContent = `${Math.round(this.getTotalDistance() * 1000)}m`;
        this.distanceLabels[i].setMap(this.map);
      }
    });

    // ドラッグ不可
    dotMarker.setDraggable(false);

    // 配列にマーカーを追加
    this.dotMarkers.push(dotMarker);
  
    // 2つ以上のマーカーがある場合は、新しく追加されたマーカーと前のマーカー間に直線を引く
    if (this.dotMarkers.length > 1) {
      const prevMarker = this.dotMarkers[this.dotMarkers.length - 2];

      // ルート線を作成
      const routeLine = new google.maps.Polyline({
        path: [prevMarker.position, dotMarker.position],
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 4,
        map: this.map,
        // editable: true, // ライン上の点をドラッグ可能にする
      });
    
      routeLine.customId = this.routeId + '-' + this.routeLines.length;

      // ルート線上をクリック時
      routeLine.addListener('click', (event) => {
        // マップ上のクリックされた場所にマーカーを追加
        selectedRoute.addMarker(event.latLng);
      });
  
      // ルート線上を右クリック時、ルート線上にマーカーを追加
      routeLine.addListener('rightclick', (event) => {
  
        const routeId = routeLine.customId.split('-')[0];
        const routeLineIdx = routeLine.customId.split('-')[1];

        if (selectedRoute?.routeId != routeId) return;

        // TODO: 追加マーカーのドラッグ移動ができない
        //       追加マーカーのルート線上にマーカー追加できない

        for (let i = 0; i < this.dotMarkers.length; i++) {
          const dotMarkerIdx = this.dotMarkers[i].customId?.split('-')[1];

          if (dotMarkerIdx == routeLineIdx) {
            // ドットマーカーを作成
            const dotMarker = new google.maps.Marker({
              position: event.latLng,
              map: this.map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillOpacity: 1,
                fillColor: '#3CB371', // ドットの色を指定
                strokeOpacity: 0,
                scale: 2, // ドットのサイズを指定
              },
              draggable: false,
            });
            this.dotMarkers.splice(i + 1, 0, dotMarker);

            // ルート線を作成
            const routeLine = new google.maps.Polyline({
              path: [this.dotMarkers[dotMarkerIdx].position, dotMarker.position],
              strokeColor: '#FF0000',
              strokeOpacity: 1.0,
              strokeWeight: 4,
              map: this.map,
              // editable: true, // ライン上の点をドラッグ可能にする
            });
            this.routeLines.splice(i + 1, 0, routeLine);

            for (let i = 0; i < this.dotMarkers.length; i++) {
              this.dotMarkers[i].customId = this.routeId + '-' + i;
            }
            for (let i = 0; i < this.routeLines.length; i++) {
              this.routeLines[i].customId = this.routeId + '-' + i;
            }
            // ルート線パスを再設定
            for (let i = 1; i < this.dotMarkers.length; i++) {
              this.routeLines[i - 1].setPath([this.dotMarkers[i - 1].position, this.dotMarkers[i].position]);
            }

            // 距離ラベルを作成
            let distance = this.getDistanceBetweenMarkers(this.dotMarkers[dotMarkerIdx], dotMarker);
            const customLabel = new DistanceLabelOverlay(this.map, event.latLng, '0m', distance);
            this.distanceLabels.splice(i + 1, 0, customLabel);
            customLabel.labelContent = `${Math.round((distance + (this.distanceLabels[dotMarkerIdx].labelContent.slice(0, -1) / 1000)) * 1000)}m`;

            break;
          }
        }
      });
  
      // ルート線を配列に追加
      this.routeLines.push(routeLine);

      // 距離ラベルを作成
      let distance = this.getDistanceBetweenMarkers(prevMarker, dotMarker);
      const customLabel = new DistanceLabelOverlay(this.map, location, '0m', distance);
      this.distanceLabels.push(customLabel);
      customLabel.labelContent = `${Math.round(this.getTotalDistance() * 1000)}m`;
    } else {
      const customLabel = new DistanceLabelOverlay(this.map, location, '0m', 0);
      this.distanceLabels.push(customLabel);
    }
  }
  
  /**
   * 2つのマーカー間の距離（km）を返す
   */
  getDistanceBetweenMarkers(marker1, marker2) {
    const R = 6371; // 地球の半径（km）

    function toRadians(degrees) {
      return degrees * Math.PI / 180;
    }
    
    const lat1 = toRadians(marker1.position.lat());
    const lng1 = toRadians(marker1.position.lng());
    const lat2 = toRadians(marker2.position.lat());
    const lng2 = toRadians(marker2.position.lng());
  
    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    const distance = R * c;
    return distance;
  }

  /**
   * 合計距離を返す
   */
  getTotalDistance() {
    return this.distanceLabels.reduce((sum, label) => sum + label.distanceValue, 0);
  }

  /**
   * マーカーを表示／非表示
   */
  displayMarkers(visible) {
    switch (visible){
      // 非表示
      case Route.INVISIBLE:
        // ドットマーカー
        this.dotMarkers.forEach((marker) => {
          marker.setMap(null);
        });
        // 距離ラベル
        this.distanceLabels.forEach((label) => {
          label.setMap(null);
        });
        // ルート線
        this.routeLines.forEach((line) => {
          line.setMap(null);
        });
        break;
      // 表示
      case Route.VISIBLE_ALL:
        // ドットマーカー
        this.dotMarkers.forEach((marker) => {
          marker.setMap(this.map);
        });
        // 距離ラベル
        if (this.map.getZoom() <= 13) {
          // **************
          // ズームアウト時
          // **************
          this.distanceLabels.forEach(label => label.setMap(null));
          // 先頭の距離ラベルを表示
          this.distanceLabels[0].setMap(this.map);
          // 末尾の距離ラベルを表示
          this.distanceLabels[this.distanceLabels.length - 1].setMap(this.map);

          // 1000m単位で距離ラベルを表示
          let dispDistance = [];
          for (let i = 1; i <= 40; i++) {
            dispDistance.push({flg: false, distance: i * 1000});
          }

          this.distanceLabels.forEach(label => {
            dispDistance.forEach(d => {
              if (!d.flg) {
                if (label.labelContent.slice(0, -1) / d.distance >= 1) {
                  label.setMap(this.map);
                  d.flg = true;
                }
                return;
              }
            });
          });
        } else {
          // **************
          // ズームイン時
          // **************
          this.distanceLabels.forEach((label) => {
            label.setMap(this.map);
          });
        }
        // ルート線
        this.routeLines.forEach((line) => {
          line.setMap(this.map);
        });
        break;
      // 表示(ルートのみ)
      case Route.VISIBLE_ROUTE:
        // ドットマーカー
        this.dotMarkers.forEach((marker) => {
          marker.setMap(this.map);
        });
        // 距離ラベル
        this.distanceLabels.forEach((label) => {
          label.setMap(null);
        });
        // ルート線
        this.routeLines.forEach((line) => {
          line.setMap(this.map);
        });
        break;
    }
  }

  /**
   * ルート活性／非活性
   */
  disableRoute(disable) {
    // ルート線色
    let routeColor;
    // 距離ラベル
    let distanceClass;
    // ドットマーカー
    let dotColor;

    // 選択ルート
    if (!disable) {
      routeColor = '#FF0000';
      distanceClass = 'distance-tag';
      dotColor = '#3CB371';
    // 未選択ルート
    } else {
      routeColor = '#FF000055';
      distanceClass = 'distance-tag distance-tag-disable';
      dotColor = '#3CB37155';
    }

    // ルート線色
    this.routeLines.forEach(x => x.setOptions({strokeColor: routeColor}));
    // 距離ラベル
    this.distanceLabels.forEach(x => {
      if (!x.div) return;
      x.div.className = distanceClass;
    });
    // ドットマーカー
    this.dotMarkers.forEach(marker => {
      const newIcon = {
        ...marker.getIcon(),
        fillColor: dotColor
      };
      marker.setIcon(newIcon);
    });
  }
}


/**
 * 距離ラベルのオーバーレイ
 */
class DistanceLabelOverlay extends google.maps.OverlayView {
  constructor(map, position, labelContent, distanceValue) {
    super();
    this.map = map;
    this.position = position;
    this.labelContent = labelContent;
    this.distanceValue = distanceValue;
    this.setMap(map);
  }

  draw() {
    if (!this.div) {
      this.div = document.createElement('div');
      this.div.className = 'distance-tag';
      this.div.textContent = this.labelContent;
      this.getPanes().overlayLayer.appendChild(this.div);

      // 親要素のzIndexを削除
      this.div.parentNode.style.zIndex = null;
    }
    const point = this.getProjection().fromLatLngToDivPixel(this.position);
    if (point) {
      this.div.style.left = (point.x - 30) + 'px';
      this.div.style.top = (point.y - 28) + 'px';
    }
  }

  onRemove() {
    this.div.parentNode.removeChild(this.div);
    this.div = null;
  }
}
