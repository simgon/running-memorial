// map.js

// ロード時
document.addEventListener("turbo:load", function() {
  // 初期化処理
  initMap();

  // 通知ダイアログを表示
  showNotification(3000);

  // SortableJS
  const routesContainer = document.getElementById("routes-container");

  // Sortableオブジェクトを作成してリストの並び替えを有効にする
  const sortable = new Sortable(routesContainer, {
    animation: 150,
    handle: ".drag-handle",   // ドラッグ可能な領域（ドラッグハンドル）を指定
    onEnd: function(event) {  // ドラッグ終了後の処理
      if (event.oldIndex === event.newIndex) return;

      const listContainer = document.getElementById('routes-container');
      const listItems = [...listContainer.getElementsByTagName('li')];
      postRouteOrder(listItems.map(item => item.getAttribute('data-route-id'))); 
    }
  });
});

// 選択ルートを保持
let route;

/**
 * 初期化処理
 */
function initMap() {
  let currentLoc = new google.maps.LatLng("34.724789", "135.496594");

  var mapOptions = {
    zoom: 16,
    center: currentLoc,
    clickableIcons: false,
    keyboardShortcuts:false,
    draggableCursor: "pointer",
    mapTypeControl: true,       //マップタイプ コントロール
    fullscreenControl: false,   //全画面表示コントロール
    streetViewControl: true,    //ストリートビュー コントロール
    zoomControl: true,          //ズーム コントロール
    gestureHandling: "greedy",
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
  // マーカー追加（クリック）
  map.addListener("click", (event) => {
    if (!route) return;
    // マップ上にマーカーを追加
    route.addMarker(event.latLng);
  });

  // マーカー追加（ボタン）
  document.getElementById('add_marker').addEventListener("click", (event) => {
    if (!route) return;
    // マップ上にマーカーを追加
    route.addMarker(map.getCenter());
  });

  // １つ戻す
  document.getElementById('del_marker').addEventListener("click", (event) => {
    if (!route) return;
    // 直前に追加したマーカーを削除
    route.delMarker();
  });

  // クリア
  document.getElementById('eraser_marker').addEventListener("click", (event) => {
    if (route === undefined) return;
    // 全てのマーカーを削除
    route.clearMarkers()
  });

  // 保存
  document.getElementById('save_marker').addEventListener("click", (event) => {
    if (route === undefined) return;
    // ルート情報を登録
    postRoute();
  });

  // **************
  // サイドメニュー
  // **************
  // 新しいルートボタン
  document.getElementById('new_route').addEventListener("click", (event) => {
    document.getElementById('new_route').style = "display:none;";
    document.getElementById('new_route_text').style = "";
    document.getElementById('new_route_text').querySelector('.form-control').focus();
  });

  // 新しいルート（キャンセル）
  document.getElementById('x').addEventListener("click", (event) => {
    document.getElementById('new_route').style = "";
    document.getElementById('new_route_text').style = "display:none;";
  });

  // ルート一覧を取得
  const listContainer = document.getElementById('routes-container');
  const listItems = listContainer.getElementsByTagName('li');

  for (let i = 0; i < listItems.length; i++) {
    // ルート選択時
    listItems[i].addEventListener('click', function(event) {
      let routeId = this.getAttribute('data-route-id');
      
      // 全てのルート一覧の背景色を元に戻す
      for (let j = 0; j < listItems.length; j++) {
        listItems[j].style.backgroundColor = '';
      }

      // 選択ルート一覧の背景色を変更
      this.style.backgroundColor = '#343641';
      
      // マップボタン一覧を活性化
      document.getElementById("save_marker").removeAttribute("disabled");
      document.getElementById("add_marker").removeAttribute("disabled");
      document.getElementById("del_marker").removeAttribute("disabled");
      document.getElementById("eraser_marker").removeAttribute("disabled");

      // 選択ルートを保持
      route = routes[routeId];

      // マップ上ルートを変更
      for (let key in routes) {
        // 選択ルート
        if (key === routeId) {
          routes[key].disableRoute(false);
        // 未選択ルート
        } else {
          routes[key].disableRoute(true);
        }
      }
    });

    // 表示／非表示
    const eyeToggle = listItems[i].querySelector('.eye-toggle');
    const eyeIcon = listItems[i].querySelector('.eye-icon');
    const eyeFillIcon = listItems[i].querySelector('.eye-fill-icon');
    const eyeSlashIcon = listItems[i].querySelector('.eye-slash-icon');
  
    eyeToggle.addEventListener('click', function(event) {
      let routeId = this.closest('[data-route-id]').getAttribute('data-route-id');
      
      if (eyeIcon.style.display === 'initial') {
        // 表示 → 表示(ルートのみ)
        eyeIcon.style.display = 'none';
        eyeFillIcon.style.display = 'initial';
        // ルートを表示(ルートのみ)
        routes[routeId].displayMarkers(Route.VISIBLE_ROUTE);
        postRouteVisible(routeId, Route.VISIBLE_ROUTE);
      } else if (eyeFillIcon.style.display === 'initial') {
        // 表示(ルートのみ) → 非表示
        eyeFillIcon.style.display = 'none';
        eyeSlashIcon.style.display = 'initial';
        // ルートを非表示
        routes[routeId].displayMarkers(Route.INVISIBLE);
        postRouteVisible(routeId, Route.INVISIBLE);
      } else {
        // 非表示 → 表示
        eyeSlashIcon.style.display = 'none';
        eyeIcon.style.display = 'initial';
        // ルートを表示
        routes[routeId].displayMarkers(Route.VISIBLE_ALL);
        postRouteVisible(routeId, Route.VISIBLE_ALL);
      }
    });

    // 編集
    listItems[i].querySelector('.edit-icon').addEventListener('click', () => {
      listItems[i].querySelector('.route-detail').style = "display:none;";
      listItems[i].querySelector('.route-edit').style = "";

      // テキストボックスをフォーカス
      const edit = listItems[i].querySelector('.text-edit');
      edit.focus();
      edit.setSelectionRange(edit.value.length, edit.value.length);
    });

    // 編集 - キャンセル
    listItems[i].querySelector('.cancel').addEventListener("click", (event) => {
      listItems[i].querySelector('.route-detail').style = "";
      listItems[i].querySelector('.route-edit').style = "display:none;";
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
            eyeIcon.style.display = 'none';
            eyeFillIcon.style.display = 'none';
            eyeSlashIcon.style.display = 'initial';
            // ルートを非表示
            routes[routeId].displayMarkers(Route.INVISIBLE);
            break;
          // 表示
          case Route.VISIBLE_ALL:
            eyeIcon.style.display = 'initial';
            eyeFillIcon.style.display = 'none';
            eyeSlashIcon.style.display = 'none';
            // ルートを表示
            routes[routeId].displayMarkers(Route.VISIBLE_ALL);
            break;
          // 表示(ルートのみ)
          case Route.VISIBLE_ROUTE:
            eyeIcon.style.display = 'none';
            eyeFillIcon.style.display = 'initial';
            eyeSlashIcon.style.display = 'none';
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
        throw new Error("Network response was not ok");
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
  // CSRFトークンを取得してリクエストに含める
  const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

  fetch('/locations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({
      route_param: {
        routeId: route.routeId,
        locations: route.markers.map((x) => ({ lat_loc: x.position.lat(), lon_loc: x.position.lng() }))
      }
    })
  })
    .then(response => response.json())
    .then(data => {
      console.log(data);

      showNotification(3000, "保存しました");
    })
    .catch(error => console.error(error));
}

/**
 * ルートの表示情報を更新
 * @param {String} routeId - ルートID
 * @param {String} visible - ルート表示区分
 */
function postRouteVisible(routeId, visible) {
  // CSRFトークンを取得してリクエストに含める
  const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

  fetch('/routes/visible', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({
      route_param: {
        routeId: routeId,
        visible: visible
      }
    })
  })
    .then(response => response.json())
    .then(data => {
      console.log(data);

      //showNotification(3000, "変更しました");
    })
    .catch(error => console.error(error));
}

/**
 * ルートの並び順を更新
 * @param {Array.<String>} routeIds - ルートID配列
 */
function postRouteOrder(routeIds) {
  // CSRFトークンを取得してリクエストに含める
  const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

  fetch('/routes/order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({
      route_param: {
        routeIds: routeIds
      }
    })
  })
    .then(response => response.json())
    .then(data => {
      console.log(data);

      //showNotification(3000, "変更しました");
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

// RouteMapクラス
class RouteMap extends google.maps.Map {
  constructor(element, mapOptions) {
    super(element, mapOptions);
  
    // 現在位置へ移動カスタムコントロールを作成
    const customControlDiv = document.createElement("div");
    const controlUI = document.createElement("div");
    customControlDiv.className = "my-location";
    customControlDiv.appendChild(controlUI);
  
    google.maps.event.addDomListener(customControlDiv, "click", () => {
      this.getMyLocation()
        .then((position) => {
          // 位置情報を取得できた場合の処理
          // 地図の中心をユーザーの現在位置に移動
          this.setCenter(position);
        })
        .catch((error) => {
          // 位置情報の取得に失敗した場合の処理
          console.error("Error:", error);
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
        reject(new Error("Geolocation is not supported in this browser."));
      }
    });
  }
}

// Routeクラス
// Map上に表示するルートを管理
class Route {
  static INVISIBLE = "0";
  static VISIBLE_ALL = "1";
  static VISIBLE_ROUTE = "2";

  constructor(routeId, map) {
    this.routeId = routeId;
    this.map = map;
    this.markers = [];
    this.distanceLabels = [];
    this.polylines = [];
  }

  getTotalDistance() {
    return this.distanceLabels.reduce((sum, label) => sum + label.distanceValue, 0);
  }

  // 全てのマーカーを削除
  clearMarkers() {
    this.markers.forEach((marker) => {
      marker.setMap(null);
    });

    this.distanceLabels.forEach((label) => {
      label.setMap(null);
    });

    this.polylines.forEach((line) => {
      line.setMap(null);
    });

    this.markers = [];
    this.distanceLabels = [];
    this.polylines = [];
  }

  // 直前に追加したマーカーを削除
  delMarker() {
    for (const array of [this.markers, this.distanceLabels, this.polylines]) {
      if (array.length) {
        array.pop().setMap(null);
      }
    }
  }

  // マップ上にマーカーを追加
  addMarker(location) {
    const dotSymbol = {
      path: google.maps.SymbolPath.CIRCLE,
      fillOpacity: 1,
      fillColor: "#3cb371", // ドットの色を指定
      strokeOpacity: 0,
      scale: 2, // ドットのサイズを指定
    };

    // マーカーを作成
    const dotMarker = new google.maps.Marker({
      position: {lat: location.lat(), lng: location.lng()},
      map: this.map,
      icon: dotSymbol
    });
  
    dotMarker.addListener('click', (event) => {
      // マップ上のクリックされた場所にマーカーを追加
      route.addMarker(event.latLng);
    });

    // 配列にマーカーを追加
    this.markers.push(dotMarker);
  
    // 2つ以上のマーカーがある場合は、新しく追加されたマーカーと前のマーカー間に直線を引く
    if (this.markers.length > 1) {
      const prevMarker = this.markers[this.markers.length - 2];
      this.drawLine(prevMarker, dotMarker);
  
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
  
  // 2点間を直線で描画
  drawLine(startMarker, endMarker) {
    const line = new google.maps.Polyline({
      path: [startMarker.position, endMarker.position],
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 4,
      map: this.map,
    });
  
    // Polylineのクリックイベントリスナーを設定
    line.addListener('click', (event) => {
      // マップ上のクリックされた場所にマーカーを追加
      route.addMarker(event.latLng);
    });

    // 直線を配列に追加
    this.polylines.push(line);
  }
  
  // 2つのマーカー間の距離（km）を返す
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

  // マーカーを表示／非表示
  displayMarkers(visible) {
    switch (visible){
      // 非表示
      case '0':
        // ドットマーカー
        this.markers.forEach((marker) => {
          marker.setMap(null);
        });
        // 距離ラベル
        this.distanceLabels.forEach((label) => {
          label.setMap(null);
        });
        // ルート線
        this.polylines.forEach((line) => {
          line.setMap(null);
        });
        break;
      // 表示
      case '1':
        // ドットマーカー
        this.markers.forEach((marker) => {
          marker.setMap(this.map);
        });
        // 距離ラベル
        this.distanceLabels.forEach((label) => {
          label.setMap(this.map);
        });
        // ルート線
        this.polylines.forEach((line) => {
          line.setMap(this.map);
        });
        break;
      // 表示(ルートのみ)
      case '2':
        // ドットマーカー
        this.markers.forEach((marker) => {
          marker.setMap(this.map);
        });
        // 距離ラベル
        this.distanceLabels.forEach((label) => {
          label.setMap(null);
        });
        // ルート線
        this.polylines.forEach((line) => {
          line.setMap(this.map);
        });
        break;
    }
  }

  // ルートを活性／非活性
  disableRoute(disable) {
    // ルート線色
    let routeColor;
    // 距離ラベル
    let distanceClass;
    // ドットマーカー
    let dotColor;

    // 選択ルート
    if (!disable) {
      routeColor = "#ff0000";
      distanceClass = "distance-tag";
      dotColor = "#3cb371";
    // 未選択ルート
    } else {
      routeColor = "#ff000055";
      distanceClass = "distance-tag distance-tag-disable";
      dotColor = "#3cb37155";
    }

    // ルート線色
    this.polylines.forEach(x => x.setOptions({strokeColor: routeColor}));
    // 距離ラベル
    this.distanceLabels.forEach(x => {
      if (!x.div) return;
      x.div.className = distanceClass;
    });
    // ドットマーカー
    this.markers.forEach(marker => {
      const newIcon = {
        ...marker.getIcon(),
        fillColor: dotColor
      };
      marker.setIcon(newIcon);
    });
  }
}

// 距離ラベルのオーバーレイ
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
      this.div = document.createElement("div");
      this.div.className = "distance-tag";
      this.div.textContent = this.labelContent;
      this.getPanes().overlayLayer.appendChild(this.div);

      // 親要素のzIndexを削除
      this.div.parentNode.style.zIndex = null;
    }
    const point = this.getProjection().fromLatLngToDivPixel(this.position);
    if (point) {
      this.div.style.left = (point.x - 30) + "px";
      this.div.style.top = (point.y - 30) + "px";
    }
  }

  onRemove() {
    this.div.parentNode.removeChild(this.div);
    this.div = null;
  }
}
